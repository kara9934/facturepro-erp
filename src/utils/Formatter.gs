/**
 * @file Formatter.gs
 * @module utils/Formatter
 * @description Formatage d'affichage (montants, devises).
 */
const Formatter = Object.freeze({
  /**
   * Formate un montant avec séparateur de milliers et devise.
   * @param {number} montant
   * @param {string} [devise]
   * @returns {string}
   */
  money(montant, devise) {
    const n = Number(montant) || 0;
    const s = n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return s + (devise ? ' ' + devise : '');
  },

  /** Coupe une chaîne à une longueur max. @param {string} str @param {number} max */
  truncate(str, max) {
    str = String(str || '');
    return str.length > max ? str.slice(0, max - 1) + '…' : str;
  },
});
