/**
 * @file DateUtils.gs
 * @module utils/DateUtils
 * @description Fonctions utilitaires de dates (format homogène, calculs).
 */
const DateUtils = Object.freeze({
  /** @param {*} value @returns {Date|null} */
  parse(value) {
    if (!value) return null;
    if (value instanceof Date) return value;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  },

  /** ISO court "yyyy-MM-dd" ou null. @param {*} value @returns {string|null} */
  toISO(value) {
    const d = this.parse(value);
    return d ? Utilities.formatDate(d, APP.TIMEZONE, 'yyyy-MM-dd') : null;
  },

  /** Format lisible "dd/MM/yyyy". @param {*} value @returns {string} */
  toDisplay(value) {
    const d = this.parse(value);
    return d ? Utilities.formatDate(d, APP.TIMEZONE, 'dd/MM/yyyy') : '';
  },

  /** Ajoute des jours. @param {Date} date @param {number} jours @returns {Date} */
  addDays(date, jours) {
    const d = new Date(this.parse(date).getTime());
    d.setDate(d.getDate() + Number(jours || 0));
    return d;
  },

  /** Année courante. @returns {number} */
  currentYear() { return new Date().getFullYear(); },
});
