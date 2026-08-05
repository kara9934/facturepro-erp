/**
 * @file FactureService.gs
 * @module services/FactureService
 * @description Cœur métier de la facturation : création (avec numérotation et
 *              calculs automatiques), modification, suppression, recherche,
 *              encaissement, et recalcul des statuts (retard). Toute règle de
 *              gestion vit ici — les contrôleurs restent minces.
 */
class FactureService {
  constructor() {
    this.repo = new FactureRepository();
    this.parametresService = new ParametresService();
  }

  /** @returns {Facture[]} */
  lister() { return this.repo.findAll(); }

  /** @param {string} id @returns {Facture} */
  obtenir(id) {
    const f = this.repo.findById(id);
    if (!f) throw new NotFoundError('Facture introuvable : ' + id, { id: id });
    return f;
  }

  /**
   * Crée une facture : numéro auto, TVA/TTC auto, échéance auto.
   * @param {Object} data
   * @returns {Facture}
   */
  creer(data) {
    const params = this.parametresService.obtenir();
    const facture = new Facture(data);

    this._appliquerCalcul(facture, data, params);
    this._validerBase(facture);

    facture.idFacture = NumerotationService.prochainNumeroFacture();
    facture.dateFacture = DateUtils.parse(facture.dateFacture) || new Date();

    // Échéance : fournie sinon date facture + délai paramétré.
    facture.dateEcheance = DateUtils.parse(facture.dateEcheance)
      || DateUtils.addDays(facture.dateFacture, params.delaiPaiement);

    facture.statut = facture.statut || FACTURE_STATUT.EN_ATTENTE;
    this._validerStatut(facture);

    Log.info('Création facture', { id: facture.idFacture, client: facture.client });
    return this.repo.insert(facture);
  }

  /**
   * @param {string} id
   * @param {Object} data
   * @returns {Facture}
   */
  modifier(id, data) {
    const existant = this.obtenir(id);
    const params = this.parametresService.obtenir();

    // Fusion : on conserve l'ID et la date de facture d'origine par défaut.
    const fusion = new Facture(Object.assign({}, existant, data, { idFacture: id }));
    this._appliquerCalcul(fusion, data, params);
    this._validerBase(fusion);
    this._validerStatut(fusion);

    return this.repo.update(id, fusion);
  }

  /** @param {string} id @returns {boolean} */
  supprimer(id) {
    this.obtenir(id);
    Log.info('Suppression facture', { id: id });
    return this.repo.delete(id);
  }

  /**
   * Marque une facture comme payée.
   * @param {string} id
   * @param {Object} [options] {datePaiement, modePaiement}
   * @returns {Facture}
   */
  encaisser(id, options) {
    options = options || {};
    const f = this.obtenir(id);
    f.statut = FACTURE_STATUT.PAYEE;
    f.datePaiement = DateUtils.parse(options.datePaiement) || new Date();
    if (options.modePaiement) {
      Validator.oneOf(options.modePaiement, Object.values(MODE_PAIEMENT), 'Mode_Paiement');
      f.modePaiement = options.modePaiement;
    }
    return this.repo.update(id, f);
  }

  /**
   * Recherche multi-critères (id, client, objet, statut, référence).
   * @param {string} terme
   * @returns {Facture[]}
   */
  rechercher(terme) {
    const t = String(terme || '').toLowerCase().trim();
    if (!t) return this.lister();
    return this.repo.findAll().filter((f) =>
      [f.idFacture, f.client, f.objet, f.statut, f.reference]
        .some((v) => String(v || '').toLowerCase().includes(t)));
  }

  /**
   * Recalcule les statuts "En retard" pour toutes les factures échues non payées.
   * Idempotent : conçu pour être appelé par un trigger quotidien.
   * @returns {number} nombre de factures repassées en retard
   */
  actualiserRetards() {
    const now = new Date();
    let compteur = 0;
    this.repo.findAll().forEach((f) => {
      if (f.estEnRetard(now) && f.statut !== FACTURE_STATUT.EN_RETARD) {
        f.statut = FACTURE_STATUT.EN_RETARD;
        this.repo.update(f.idFacture, f);
        compteur++;
      }
    });
    Log.info('Actualisation des retards', { misAJour: compteur });
    return compteur;
  }

  /**
   * Applique le calcul des montants : depuis les lignes si présentes,
   * sinon repli sur l'ancien mode (montant HT + taux global) pour compatibilité.
   * @param {Facture} facture @param {Object} data @param {Parametres} params @private
   */
  _appliquerCalcul(facture, data, params) {
    if (Array.isArray(facture.lignes) && facture.lignes.length) {
      // Complète le taux TVA manquant de chaque ligne avec le taux paramétré.
      facture.lignes.forEach(function (l) {
        if (l.tauxTva == null || l.tauxTva === '') l.tauxTva = params.tauxTVA;
      });
      facture.calculerDepuisLignes();
    } else {
      const taux = data.tauxTVA != null ? Number(data.tauxTVA) : params.tauxTVA;
      facture.calculerMontants(taux);
    }
  }

  /** @param {Facture} f @private */
  _validerBase(f) {
    Validator.required(f.client, 'Client');
    Validator.required(f.objet, 'Objet');
    if (Array.isArray(f.lignes) && f.lignes.length) {
      const valides = f.lignes.filter(function (l) {
        return String(l.designation || '').trim() && (Number(l.quantite) * Number(l.prixUnitaire)) > 0;
      });
      if (!valides.length) {
        throw new ValidationError('Ajoutez au moins une ligne avec une désignation et un montant positif.',
          { champ: 'Lignes' });
      }
    }
    Validator.positive(f.montantHT, 'Montant_HT');
  }

  /** @param {Facture} f @private */
  _validerStatut(f) {
    Validator.oneOf(f.statut, Object.values(FACTURE_STATUT), 'Statut');
    if (f.modePaiement) Validator.oneOf(f.modePaiement, Object.values(MODE_PAIEMENT), 'Mode_Paiement');
  }
}
