/**
 * @file NumerotationService.gs
 * @module services/NumerotationService
 * @description Génération de numéros séquentiels et atomiques (factures,
 *              clients). Utilise PropertiesService + LockService pour garantir
 *              l'unicité même en accès concurrent. Format facture :
 *              FAC-{ANNÉE}-{SEQ sur 4 chiffres}, ex: FAC-2026-0007.
 */
const NumerotationService = Object.freeze({
  /**
   * Prochain numéro de facture pour l'année courante (atomique).
   * @returns {string}
   */
  prochainNumeroFacture() {
    const annee = DateUtils.currentYear();
    const key = PROP_KEYS.FACTURE_SEQUENCE_PREFIX + annee;
    const seq = this._incrementer(key);
    return 'FAC-' + annee + '-' + this._pad(seq, 4);
  },

  /** @returns {string} ex: CLI-0005 */
  prochainNumeroClient() {
    const seq = this._incrementer(PROP_KEYS.CLIENT_SEQUENCE);
    return 'CLI-' + this._pad(seq, 4);
  },

  /**
   * Incrément atomique d'un compteur persistant.
   * @param {string} key
   * @returns {number}
   * @private
   */
  _incrementer(key) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      const props = PropertiesService.getDocumentProperties();
      const courant = parseInt(props.getProperty(key) || '0', 10);
      const suivant = courant + 1;
      props.setProperty(key, String(suivant));
      return suivant;
    } catch (e) {
      throw new AppError('Impossible de générer le numéro (verrou).', 'NUMEROTATION', { cause: e.message });
    } finally {
      try { lock.releaseLock(); } catch (ignore) { /* no-op */ }
    }
  },

  /** @param {number} n @param {number} taille @returns {string} */
  _pad(n, taille) {
    let s = String(n);
    while (s.length < taille) s = '0' + s;
    return s;
  },
});
