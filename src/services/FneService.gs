/**
 * @file FneService.gs
 * @module services/FneService
 * @description Intégration à la Facture Normalisée Électronique (FNE) de la DGI
 *              de Côte d'Ivoire — procédure d'interfaçage par API.
 *
 *              « SAVEUR A » : un seul point de bascule, l'URL configurée dans
 *              les Paramètres.
 *                • FNE_URL vide   -> mode SIMULATION : un mock intégré reproduit
 *                                    fidèlement le contrat de l'API DGI (mêmes
 *                                    champs, même format de réponse, mêmes
 *                                    codes d'erreur). Aucun appel réseau.
 *                • FNE_URL fournie -> mode RÉEL : appel HTTP (UrlFetchApp) vers
 *                                    le mock déployé OU la vraie plateforme DGI,
 *                                    sans changer une ligne de code.
 *
 *              ⚠️ AVERTISSEMENT : en mode simulation, les factures ne sont PAS
 *              certifiées par la DGI et ne sont PAS légalement opposables.
 *              C'est une démonstration technique.
 *
 *              Contrat de référence : « Procédure d'interfaçage des entreprises
 *              par API » (DGI, mai 2025).
 *              Endpoint : POST $url/external/invoices/sign
 *              Auth     : en-tête « Authorization: Bearer <clé> »
 *              Réponse  : { ncc, reference, token, warning, balance_sticker, invoice }
 */

/** Erreur remontée par la plateforme FNE (réelle ou simulée). */
class FneError extends AppError {
  /**
   * @param {string} message    Message renvoyé par la plateforme.
   * @param {string} erreur     Libellé machine DGI (ex: 'bad_request').
   * @param {number} statusCode Code HTTP (400, 401, 500...).
   */
  constructor(message, erreur, statusCode) {
    super(message, 'FNE_' + String(statusCode || 'ERROR'),
      { fneError: erreur || 'error', statusCode: statusCode || 500 });
  }
}

class FneService {
  constructor() {
    this.factureRepo = new FactureRepository();
    this.factureService = new FactureService();
    this.clientService = new ClientService();
    this.parametresService = new ParametresService();
  }

  /**
   * Certifie une facture auprès de la FNE (simulation ou réel selon l'URL).
   * Acte idempotent : une facture déjà certifiée n'est jamais re-soumise
   * (on ne « brûle » pas un sticker deux fois).
   * @param {string} idFacture
   * @returns {Object} résultat de certification (mode, numéro fiscal, token...)
   */
  certifier(idFacture) {
    const facture = this.factureService.obtenir(idFacture);

    if (facture.fneStatut === FNE_STATUT.CERTIFIEE && facture.numeroFiscal) {
      throw new ConflictError('Cette facture est déjà certifiée (' + facture.numeroFiscal + ').',
        { id: idFacture, numeroFiscal: facture.numeroFiscal });
    }

    const params = this.parametresService.obtenir();
    const client = this.clientService.rechercher(facture.client)[0] || null;

    // Pré-validation en français AVANT tout envoi : traduit les exigences DGI
    // en messages clairs, plutôt que de laisser remonter le message brut anglais.
    this._prevaliderFr(facture, client, params);

    const payload = this._construirePayload(facture, client, params);

    let resultat;
    try {
      resultat = this._envoyer(payload, params);
    } catch (e) {
      // Trace l'échec sur la facture sans écraser un éventuel numéro fiscal.
      facture.fneStatut = FNE_STATUT.ERREUR;
      this.factureRepo.update(idFacture, facture);
      Log.error('Échec certification FNE', { id: idFacture, erreur: e.message });
      throw e;
    }

    facture.numeroFiscal = resultat.reference;
    facture.fneToken = resultat.token;
    facture.fneInvoiceId = resultat.invoiceId;
    facture.fneStatut = FNE_STATUT.CERTIFIEE;
    this.factureRepo.update(idFacture, facture);

    Log.info('Facture certifiée FNE', {
      id: idFacture, numeroFiscal: resultat.reference, mode: resultat.mode,
    });
    return Object.assign({ idFacture: idFacture }, resultat);
  }

  /**
   * Pré-validation en français des exigences de certification DGI.
   * Regroupe tous les manques en un seul message lisible, pour éviter à
   * l'utilisateur de découvrir les contraintes une par une (et en anglais).
   * @param {Facture} facture
   * @param {Client|null} client
   * @param {Parametres} params
   * @private
   */
  _prevaliderFr(facture, client, params) {
    const manques = [];

    if (!client) {
      manques.push('la facture doit être reliée à une fiche client (champ Client introuvable)');
    } else {
      if (!String(client.telephone || '').trim()) manques.push('un téléphone client');
      if (!String(client.email || '').trim()) manques.push('un email client');
      if (!String(client.nom || '').trim() && !String(facture.client || '').trim()) {
        manques.push('un nom de client');
      }
      // Note : un client sans NCC relève du modèle B2C (particulier), autorisé.
      // Le NCC n'est obligatoire que pour le B2B, où il est présent par construction.
    }

    if (!String(params.fnePointVente || params.nomEntreprise || '').trim()) {
      manques.push('un point de vente (Paramètres FNE ou nom d\u2019entreprise)');
    }
    if (!String(params.fneEtablissement || params.nomEntreprise || '').trim()) {
      manques.push('un établissement (Paramètres FNE ou nom d\u2019entreprise)');
    }

    const lignes = facture.lignes || [];
    if (!Array.isArray(lignes) || lignes.length === 0) {
      manques.push('au moins une ligne de facture');
    } else {
      const sansDesignation = lignes.some(function (l) { return !String(l.designation || '').trim(); });
      if (sansDesignation) manques.push('une désignation sur chaque ligne');
      const quantiteInvalide = lignes.some(function (l) { return !(Number(l.quantite) > 0); });
      if (quantiteInvalide) manques.push('une quantité valide (> 0) sur chaque ligne');
    }

    if (manques.length) {
      throw new ValidationError(
        'Certification FNE impossible : il manque ' + manques.join(', ')
          + '. Ce sont des exigences de la DGI.',
        { champ: 'fne', manques: manques });
    }
  }

  /* ================================================================== */
  /* Adaptation FacturePro -> contrat DGI (logique PURE, testable)       */
  /* ================================================================== */

  /**
   * Traduit une facture FacturePro en corps de requête DGI /sign.
   * @param {Facture} facture
   * @param {Client|null} client
   * @param {Parametres} params
   * @returns {Object} payload conforme au contrat DGI
   * @private
   */
  _construirePayload(facture, client, params) {
    const ncc = (client && client.numeroContribuable)
      ? String(client.numeroContribuable).trim() : '';
    const template = ncc ? FNE_TEMPLATE.B2B : FNE_TEMPLATE.B2C;

    const items = (facture.lignes || []).map(function (l) {
      const item = {
        taxes: [FneService.codeTva(l.tauxTva)],
        reference: l.reference || '',
        description: l.designation || '',
        quantity: Number(l.quantite) || 0,
        amount: Number(l.prixUnitaire) || 0, // prix unitaire HT
      };
      if (Number(l.remise)) item.discount = Number(l.remise);
      if (l.unite) item.measurementUnit = l.unite;
      return item;
    });

    return {
      invoiceType: 'sale',
      paymentMethod: FneService.codePaiement(facture.modePaiement),
      template: template,
      isRne: false,
      rne: null,
      clientNcc: ncc,
      clientCompanyName: (client && client.nom) || facture.client || '',
      clientPhone: (client && client.telephone) || '',
      clientEmail: (client && client.email) || '',
      pointOfSale: params.fnePointVente || params.nomEntreprise || '',
      establishment: params.fneEtablissement || params.nomEntreprise || '',
      commercialMessage: '',
      footer: '',
      foreignCurrency: '',
      foreignCurrencyRate: 0,
      items: items,
      discount: 0,
    };
  }

  /**
   * Mappe un taux de TVA (%) vers le code DGI.
   *   18 -> TVA (normal), 9 -> TVAB (réduit), 0 -> TVAC (exo. conv.).
   * Un taux non standard retombe sur TVA normale par prudence.
   * @param {number|string} taux
   * @returns {string}
   */
  static codeTva(taux) {
    const t = Number(taux);
    if (t === 18) return 'TVA';
    if (t === 9) return 'TVAB';
    if (t === 0) return 'TVAC';
    return 'TVA';
  }

  /**
   * Mappe un mode de paiement FacturePro vers le code DGI.
   * Facture non encore encaissée (mode vide) -> 'deferred' (à terme).
   * @param {string} mode
   * @returns {string}
   */
  static codePaiement(mode) {
    return FNE_CODE_PAIEMENT[mode] || 'deferred';
  }

  /**
   * Formate un numéro fiscal au format officiel DGI :
   *   {NCC}{AA}{séquence sur 9 chiffres}  ex: 9606123E25000000019
   * @param {string} ncc
   * @param {number} annee  Année complète (ex: 2026).
   * @param {number} sequence
   * @returns {string}
   */
  static formaterReference(ncc, annee, sequence) {
    const aa = String(annee).slice(-2);
    let seq = String(sequence);
    while (seq.length < 9) seq = '0' + seq;
    return String(ncc) + aa + seq;
  }

  /* ================================================================== */
  /* Dispatch simulation / réel                                          */
  /* ================================================================== */

  /**
   * Route vers le mock intégré ou l'appel HTTP réel selon l'URL configurée.
   * @param {Object} payload
   * @param {Parametres} params
   * @returns {Object} résultat normalisé
   * @private
   */
  _envoyer(payload, params) {
    const url = String(params.fneUrl || '').trim();
    if (!url) return this._simuler(payload, params);
    return this._appelReel(payload, params, url);
  }

  /* ================================================================== */
  /* MODE SIMULATION — mock intégré fidèle au contrat DGI                */
  /* ================================================================== */

  /**
   * Simule la certification DGI : valide le payload comme la vraie plateforme
   * (mêmes erreurs 400), génère un numéro fiscal au format officiel, un token
   * de vérification et décrémente un solde de stickers. Aucun réseau.
   * @param {Object} payload
   * @param {Parametres} params
   * @returns {Object} résultat normalisé
   * @private
   */
  _simuler(payload, params) {
    this._validerPayloadDgi(payload);

    const ncc = (params.numeroContribuable && String(params.numeroContribuable).trim())
      || FNE_DEFAULTS.NCC_DEMO;
    const annee = DateUtils.currentYear();
    const seq = this._prochaineSequenceFne(annee);
    const reference = FneService.formaterReference(ncc, annee, seq);
    const uuid = this._genererUuid();
    const solde = this._consommerSticker();

    // Réponse au format EXACT du contrat DGI, puis normalisée comme le réel.
    const reponseDgi = {
      ncc: ncc,
      reference: reference,
      token: FNE_DEFAULTS.URL_VERIFICATION_SIMULEE + uuid,
      warning: solde <= FNE_DEFAULTS.STICKER_SEUIL_ALERTE,
      balance_sticker: solde,
      invoice: {
        id: uuid,
        reference: reference,
        token: uuid,
        type: 'invoice',
        subtype: 'normal',
        date: new Date().toISOString(),
        source: 'api',
      },
    };

    Log.warn('FNE SIMULATION — facture NON opposable', { reference: reference });
    return this._normaliser(reponseDgi, 'simulation');
  }

  /**
   * Valide le payload comme le ferait la plateforme DGI (erreurs 400).
   * @param {Object} p
   * @private
   */
  _validerPayloadDgi(p) {
    this._exiger(p.invoiceType, 'invoiceType');
    this._exiger(p.paymentMethod, 'paymentMethod');
    this._exiger(p.template, 'template');
    this._exiger(p.pointOfSale, 'pointOfSale');
    this._exiger(p.establishment, 'establishment');
    this._exiger(p.clientCompanyName, 'clientCompanyName');
    this._exiger(p.clientPhone, 'clientPhone');
    this._exiger(p.clientEmail, 'clientEmail');
    if (p.template === FNE_TEMPLATE.B2B) this._exiger(p.clientNcc, 'clientNcc');

    if (!Array.isArray(p.items) || p.items.length === 0) {
      throw new FneError('items is required', 'bad_request', 400);
    }
    for (let i = 0; i < p.items.length; i++) {
      const it = p.items[i];
      if (!it.description || String(it.description).trim() === '') {
        throw new FneError('items[' + i + '].description is required', 'bad_request', 400);
      }
      if (!(Number(it.quantity) > 0)) {
        throw new FneError('items[' + i + '].quantity is not valid', 'bad_request', 400);
      }
      if (!(Number(it.amount) >= 0)) {
        throw new FneError('items[' + i + '].amount is not valid', 'bad_request', 400);
      }
    }
  }

  /**
   * @param {*} v @param {string} champ
   * @private
   */
  _exiger(v, champ) {
    if (v === null || v === undefined || String(v).trim() === '') {
      throw new FneError(champ + ' is required', 'bad_request', 400);
    }
  }

  /* ================================================================== */
  /* MODE RÉEL — appel HTTP (mock déployé ou vraie DGI)                  */
  /* ================================================================== */

  /**
   * Appel HTTP réel vers la plateforme (mock déployé ou vraie DGI).
   * @param {Object} payload
   * @param {Parametres} params
   * @param {string} baseUrl
   * @returns {Object} résultat normalisé
   * @private
   */
  _appelReel(payload, params, baseUrl) {
    const url = String(baseUrl).replace(/\/+$/, '') + FNE_ENDPOINTS.SIGN;
    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer ' + (params.fneCleApi || ''),
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    };

    const reponse = UrlFetchApp.fetch(url, options);
    const code = reponse.getResponseCode();
    const corps = reponse.getContentText();

    let json;
    try { json = corps ? JSON.parse(corps) : {}; } catch (e) { json = {}; }

    if (code < 200 || code >= 300) {
      throw new FneError(json.message || ('Erreur HTTP ' + code),
        json.error || 'http_error', code);
    }
    return this._normaliser(json, 'reel');
  }

  /* ================================================================== */
  /* Normalisation commune des réponses (réel ET simulé)                */
  /* ================================================================== */

  /**
   * Normalise une réponse au contrat DGI /sign en résultat interne stable.
   * @param {Object} json  Réponse DGI brute.
   * @param {string} mode  'simulation' | 'reel'
   * @returns {{mode:string, ncc:string, reference:string, token:string,
   *            invoiceId:string, balanceSticker:(number|null), warning:boolean}}
   * @private
   */
  _normaliser(json, mode) {
    const invoice = json.invoice || {};
    return {
      mode: mode || 'reel',
      ncc: json.ncc || '',
      reference: json.reference || invoice.reference || '',
      token: json.token || '',                 // URL de vérification -> QR code
      invoiceId: invoice.id || '',             // id d'origine (pour les avoirs)
      balanceSticker: (json.balance_sticker != null) ? json.balance_sticker : null,
      warning: !!json.warning,
    };
  }

  /* ================================================================== */
  /* Persistance (séquence fiscale + stickers) — effets de bord GAS      */
  /* ================================================================== */

  /**
   * Séquence fiscale annuelle, atomique et persistante (la loi exige une
   * série ininterrompue annuelle des numéros de factures certifiées).
   * @param {number} annee
   * @returns {number}
   * @private
   */
  _prochaineSequenceFne(annee) {
    const key = PROP_KEYS.FNE_SEQUENCE_PREFIX + annee;
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      const props = PropertiesService.getDocumentProperties();
      const courant = parseInt(props.getProperty(key) || '0', 10);
      const suivant = courant + 1;
      props.setProperty(key, String(suivant));
      return suivant;
    } catch (e) {
      throw new AppError('Impossible de générer la séquence fiscale (verrou).',
        'FNE_SEQUENCE', { cause: e.message });
    } finally {
      try { lock.releaseLock(); } catch (ignore) { /* no-op */ }
    }
  }

  /**
   * Décrémente le solde de stickers simulé (initialisé à STICKER_INITIAL au
   * premier appel), pour reproduire l'épuisement du stock côté DGI.
   * @returns {number} solde restant
   * @private
   */
  _consommerSticker() {
    const props = PropertiesService.getDocumentProperties();
    const brut = props.getProperty(PROP_KEYS.FNE_STICKER_BALANCE);
    const courant = (brut === null || brut === undefined)
      ? FNE_DEFAULTS.STICKER_INITIAL : parseInt(brut, 10);
    const restant = Math.max(0, courant - 1);
    props.setProperty(PROP_KEYS.FNE_STICKER_BALANCE, String(restant));
    return restant;
  }

  /** @returns {string} UUID @private */
  _genererUuid() { return Utilities.getUuid(); }
}

/**
 * Diagnostic manuel — À LANCER DEPUIS L'ÉDITEUR Apps Script.
 * Exécute une certification SIMULÉE sur une facture synthétique et journalise
 * le payload envoyé et la réponse reçue. Ne touche à aucune donnée réelle :
 * sert à vérifier le mock (numéro fiscal, token, solde stickers) sans UI.
 * @returns {Object}
 */
function fneDiagnostic() {
  const svc = new FneService();

  const factureDemo = new Facture({
    client: 'Client Démo SARL',
    objet: 'Prestation de démonstration',
    modePaiement: MODE_PAIEMENT.MOBILE_MONEY,
    lignes: [
      { designation: 'Conseil', quantite: 2, prixUnitaire: 150000, unite: 'jour', remise: 0, tauxTva: 18 },
      { designation: 'Support', quantite: 1, prixUnitaire: 50000, unite: 'forfait', remise: 10, tauxTva: 9 },
    ],
  });
  const clientDemo = {
    nom: 'Client Démo SARL', numeroContribuable: '9502363N',
    telephone: '0700000000', email: 'demo@example.ci',
  };
  const paramsDemo = new Parametres({
    nomEntreprise: 'GLOBAL BUSINESS GROUP',
    numeroContribuable: '',            // vide -> NCC de démo
    fnePointVente: 'Siège', fneEtablissement: 'Abidjan',
    fneUrl: '',                        // vide -> simulation
  });

  const payload = svc._construirePayload(factureDemo, clientDemo, paramsDemo);
  const resultat = svc._simuler(payload, paramsDemo);

  Log.info('FNE diagnostic — payload envoyé', payload);
  Log.info('FNE diagnostic — résultat reçu', resultat);
  return { payload: payload, resultat: resultat };
}
