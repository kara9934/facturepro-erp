/**
 * @file Facture.gs
 * @module models/Facture
 * @description Modèle métier "Facture". Encapsule la logique intrinsèque à
 *              l'entité (calcul TVA/TTC, détection de retard, sérialisation
 *              vers/depuis une ligne de feuille). Ne connaît NI le stockage
 *              NI l'UI : c'est un objet de domaine pur et testable.
 */
class Facture {
  constructor(data) {
    data = data || {};
    this.idFacture = data.idFacture || '';
    this.idClient = data.idClient || '';
    this.dateFacture = data.dateFacture || null;
    this.client = data.client || '';
    this.objet = data.objet || '';
    this.lignes = Facture._parseLignes(data.lignes);
    this.ventilationTVA = data.ventilationTVA || [];
    this.montantHT = Number(data.montantHT) || 0;
    this.tva = Number(data.tva) || 0;            // montant de TVA (devise)
    this.montantTTC = Number(data.montantTTC) || 0;
    this.statut = data.statut || FACTURE_STATUT.BROUILLON;
    this.dateEcheance = data.dateEcheance || null;
    this.datePaiement = data.datePaiement || null;
    this.modePaiement = data.modePaiement || '';
    this.reference = data.reference || '';
    this.observations = data.observations || '';
    // Certification FNE (DGI). Renseignés après appel à FneService.certifier().
    this.numeroFiscal = data.numeroFiscal || '';
    this.fneToken = data.fneToken || '';
    this.fneInvoiceId = data.fneInvoiceId || '';
    this.fneStatut = data.fneStatut || FNE_STATUT.NON_CERTIFIEE;
  }

  /**
   * Recalcule TVA et TTC à partir du HT et d'un taux (%).
   * Source unique de vérité pour le calcul monétaire.
   * @param {number} tauxTvaPourcent
   * @returns {Facture} this (chaînable)
   */
  calculerMontants(tauxTvaPourcent) {
    const taux = Number(tauxTvaPourcent) || 0;
    this.tva = Math.round(this.montantHT * (taux / 100) * 100) / 100;
    this.montantTTC = Math.round((this.montantHT + this.tva) * 100) / 100;
    return this;
  }

  /**
   * Recalcule les totaux à partir des lignes de la facture, avec TVA ventilée
   * par taux. Chaque ligne : quantité × prix unitaire, moins remise (%),
   * puis TVA au taux de la ligne. Source unique de vérité multi-lignes.
   * Garantit que la ventilation par taux somme exactement aux totaux.
   * @returns {Facture} this (chaînable)
   */
  calculerDepuisLignes() {
    const parTaux = {};
    (this.lignes || []).forEach(function (l) {
      const q = Number(l.quantite) || 0;
      const pu = Number(l.prixUnitaire) || 0;
      const remise = Number(l.remise) || 0;
      const taux = Number(l.tauxTva) || 0;
      const base = q * pu;
      const ligneHT = base - base * (remise / 100);
      parTaux[taux] = (parTaux[taux] || 0) + ligneHT;
    });
    const ventilation = Object.keys(parTaux).map(function (t) {
      const taux = Number(t);
      const base = Math.round(parTaux[t] * 100) / 100;
      const tva = Math.round(base * (taux / 100) * 100) / 100;
      return { taux: taux, base: base, tva: tva };
    }).sort(function (a, b) { return b.taux - a.taux; });

    this.ventilationTVA = ventilation;
    this.montantHT = Math.round(ventilation.reduce(function (s, v) { return s + v.base; }, 0) * 100) / 100;
    this.tva = Math.round(ventilation.reduce(function (s, v) { return s + v.tva; }, 0) * 100) / 100;
    this.montantTTC = Math.round((this.montantHT + this.tva) * 100) / 100;
    return this;
  }

  /**
   * Parse les lignes qu'elles arrivent en tableau (client) ou en JSON (feuille).
   * @param {Array|string} v @returns {Array} @private
   */
  static _parseLignes(v) {
    if (Array.isArray(v)) return v;
    if (typeof v === 'string' && v.trim()) {
      try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch (e) { return []; }
    }
    return [];
  }

  /** @returns {boolean} true si payée. */
  estPayee() { return this.statut === FACTURE_STATUT.PAYEE; }

  /**
   * @param {Date} [now]
   * @returns {boolean} true si non payée et échéance dépassée.
   */
  estEnRetard(now) {
    if (this.estPayee() || this.statut === FACTURE_STATUT.ANNULEE) return false;
    if (!this.dateEcheance) return false;
    const ref = now || new Date();
    return new Date(this.dateEcheance) < ref;
  }

  /** Reste à encaisser pour cette facture. @returns {number} */
  resteAEncaisser() { return this.estPayee() ? 0 : this.montantTTC; }

  /**
   * Construit une Facture depuis une ligne brute de la feuille (clés = en-têtes).
   * @param {Object} row
   * @returns {Facture}
   */
  static fromRow(row) {
    return new Facture({
      idFacture: row['ID_Facture'],
      idClient: row['ID_Client'],
      dateFacture: row['Date_Facture'],
      client: row['Client'],
      objet: row['Objet'],
      lignes: row['Lignes'],
      montantHT: row['Montant_HT'],
      tva: row['TVA'],
      montantTTC: row['Montant_TTC'],
      statut: row['Statut'],
      dateEcheance: row['Date_Echeance'],
      datePaiement: row['Date_Paiement'],
      modePaiement: row['Mode_Paiement'],
      reference: row['Référence'],
      observations: row['Observations'],
      numeroFiscal: row['Numero_Fiscal'],
      fneToken: row['FNE_Token'],
      fneInvoiceId: row['FNE_Invoice_Id'],
      fneStatut: row['FNE_Statut'],
    });
  }

  /** Convertit en ligne brute (clés = en-têtes de la feuille). @returns {Object} */
  toRow() {
    return {
      'ID_Facture': this.idFacture,
      'ID_Client': this.idClient,
      'Date_Facture': this.dateFacture,
      'Client': this.client,
      'Objet': this.objet,
      'Lignes': JSON.stringify(this.lignes || []),
      'Montant_HT': this.montantHT,
      'TVA': this.tva,
      'Montant_TTC': this.montantTTC,
      'Statut': this.statut,
      'Date_Echeance': this.dateEcheance,
      'Date_Paiement': this.datePaiement,
      'Mode_Paiement': this.modePaiement,
      'Référence': this.reference,
      'Observations': this.observations,
      'Numero_Fiscal': this.numeroFiscal,
      'FNE_Token': this.fneToken,
      'FNE_Invoice_Id': this.fneInvoiceId,
      'FNE_Statut': this.fneStatut,
    };
  }

  /** Objet simple sérialisable pour le client (dates en ISO). @returns {Object} */
  toDTO() {
    return {
      idFacture: this.idFacture,
      idClient: this.idClient,
      dateFacture: DateUtils.toISO(this.dateFacture),
      client: this.client,
      objet: this.objet,
      lignes: this.lignes || [],
      ventilationTVA: this.ventilationTVA || [],
      montantHT: this.montantHT,
      tva: this.tva,
      montantTTC: this.montantTTC,
      statut: this.statut,
      dateEcheance: DateUtils.toISO(this.dateEcheance),
      datePaiement: DateUtils.toISO(this.datePaiement),
      modePaiement: this.modePaiement,
      reference: this.reference,
      observations: this.observations,
      numeroFiscal: this.numeroFiscal,
      fneToken: this.fneToken,
      fneInvoiceId: this.fneInvoiceId,
      fneStatut: this.fneStatut,
    };
  }
}
