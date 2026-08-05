/**
 * @file Validator.gs
 * @module utils/Validator
 * @description Validation des données d'entrée. Lève ValidationError avec un
 *              message clair. Centraliser les règles ici garantit une
 *              validation cohérente entre l'UI, l'API et les triggers.
 */
const Validator = Object.freeze({
  EMAIL_RE: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  /** @param {*} v @param {string} champ */
  required(v, champ) {
    if (v === null || v === undefined || String(v).trim() === '') {
      throw new ValidationError('Le champ "' + champ + '" est obligatoire.', { champ: champ });
    }
    return v;
  },

  /** @param {*} v @param {string} champ */
  number(v, champ) {
    const n = Number(v);
    if (isNaN(n)) throw new ValidationError('"' + champ + '" doit être un nombre.', { champ: champ });
    return n;
  },

  /** @param {*} v @param {string} champ */
  positive(v, champ) {
    const n = this.number(v, champ);
    if (n < 0) throw new ValidationError('"' + champ + '" ne peut pas être négatif.', { champ: champ });
    return n;
  },

  /** @param {string} email @param {string} [champ] */
  email(email, champ) {
    if (email && !this.EMAIL_RE.test(String(email))) {
      throw new ValidationError('Email invalide.', { champ: champ || 'Email', valeur: email });
    }
    return email;
  },

  /** @param {*} v @param {Array} liste @param {string} champ */
  oneOf(v, liste, champ) {
    if (v && liste.indexOf(v) === -1) {
      throw new ValidationError('Valeur non autorisée pour "' + champ + '".', { champ: champ, autorise: liste });
    }
    return v;
  },
});
