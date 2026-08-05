/**
 * @file AppError.gs
 * @module core/AppError
 * @description Hiérarchie d'erreurs métier typées. Permet de distinguer une
 *              erreur de validation (à afficher à l'utilisateur) d'une erreur
 *              technique (à logger), et d'uniformiser le format renvoyé au client.
 */

/** Erreur applicative de base. */
class AppError extends Error {
  /**
   * @param {string} message  Message lisible.
   * @param {string} code     Code machine (ex: 'VALIDATION').
   * @param {Object} [details] Détails additionnels (champ fautif, etc.).
   */
  constructor(message, code, details) {
    super(message);
    this.name = this.constructor.name;
    this.code = code || 'APP_ERROR';
    this.details = details || null;
  }

  /** Sérialisation sûre pour transport vers le client. */
  toJSON() {
    return { name: this.name, message: this.message, code: this.code, details: this.details };
  }
}

/** Donnée invalide fournie par l'utilisateur. */
class ValidationError extends AppError {
  constructor(message, details) { super(message, 'VALIDATION', details); }
}

/** Entité introuvable. */
class NotFoundError extends AppError {
  constructor(message, details) { super(message, 'NOT_FOUND', details); }
}

/** Conflit (doublon, état incohérent). */
class ConflictError extends AppError {
  constructor(message, details) { super(message, 'CONFLICT', details); }
}
