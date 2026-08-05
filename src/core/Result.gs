/**
 * @file Result.gs
 * @module core/Result
 * @description Enveloppe de réponse standardisée renvoyée par les contrôleurs
 *              vers le client (google.script.run). Format unique => le front
 *              traite succès et erreurs de façon homogène.
 *
 * Forme : { success: boolean, data?: *, error?: {message, code, details} }
 */
const Result = Object.freeze({
  /** @param {*} data @returns {{success:boolean,data:*}} */
  ok(data) { return { success: true, data: data === undefined ? null : data }; },

  /** @param {Error} error @returns {{success:boolean,error:Object}} */
  fail(error) {
    const isApp = error instanceof AppError;
    return {
      success: false,
      error: {
        message: error && error.message ? error.message : 'Erreur inconnue',
        code: isApp ? error.code : 'INTERNAL',
        details: isApp ? error.details : null,
      },
    };
  },
});

/**
 * Exécute une fonction contrôleur en capturant toute exception dans un Result.
 * Évite de répéter try/catch dans chaque point d'entrée exposé au client.
 * @param {string} action  Libellé pour les logs.
 * @param {Function} fn    Logique à exécuter.
 * @returns {Object} Result
 */
function guard(action, fn) {
  try {
    Log.info('Action: ' + action);
    return Result.ok(fn());
  } catch (err) {
    Log.error('Échec: ' + action + ' -> ' + err.message, { stack: err.stack });
    return Result.fail(err);
  }
}
