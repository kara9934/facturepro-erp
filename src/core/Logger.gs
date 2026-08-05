/**
 * @file Logger.gs
 * @module core/Logger
 * @description Logger centralisé avec niveaux. Enrobe console.* pour offrir un
 *              format homogène, un préfixe applicatif et un seuil configurable.
 *              Point d'extension : brancher plus tard un log persistant (feuille
 *              "Logs", BigQuery, etc.) sans toucher au reste du code.
 */
const Log = (function () {
  let currentLevel = LOG_LEVEL.INFO;

  /** Définit le seuil minimal de log. @param {number} level */
  function setLevel(level) { currentLevel = level; }

  function write(level, label, message, context) {
    if (level < currentLevel) return;
    const ts = Utilities.formatDate(new Date(), APP.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
    const ctx = context ? ' | ' + safeStringify(context) : '';
    console.log('[' + ts + '] [' + label + '] ' + message + ctx);
  }

  function safeStringify(obj) {
    try { return JSON.stringify(obj); } catch (e) { return String(obj); }
  }

  return {
    setLevel: setLevel,
    debug: (m, c) => write(LOG_LEVEL.DEBUG, 'DEBUG', m, c),
    info: (m, c) => write(LOG_LEVEL.INFO, 'INFO', m, c),
    warn: (m, c) => write(LOG_LEVEL.WARN, 'WARN', m, c),
    error: (m, c) => write(LOG_LEVEL.ERROR, 'ERROR', m, c),
  };
})();
