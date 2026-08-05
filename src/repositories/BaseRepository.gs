/**
 * @file BaseRepository.gs
 * @module repositories/BaseRepository
 * @description Couche d'accès aux données (DAO) générique au-dessus de Google
 *              Sheets. Chaque feuille est vue comme une "table". Cette classe
 *              masque totalement l'API SpreadsheetApp aux services : ceux-ci
 *              manipulent des objets, jamais des cellules ou des index.
 *
 * Points clés :
 *  - Résolution DYNAMIQUE des colonnes via la ligne d'en-tête (robuste au
 *    réordonnancement des colonnes dans le Sheet).
 *  - Verrou (LockService) sur les écritures pour éviter la corruption en
 *    accès concurrent (plusieurs utilisateurs / triggers simultanés).
 *  - Cache mémoire de l'en-tête pour limiter les appels.
 */
class BaseRepository {
  /**
   * @param {string} sheetName  Nom de la feuille.
   * @param {string} idField    Nom de la colonne identifiant.
   * @param {string[]} schema   Colonnes attendues (pour auto-création).
   */
  constructor(sheetName, idField, schema) {
    this.sheetName = sheetName;
    this.idField = idField;
    this.schema = schema || [];
    this._headers = null;
  }

  /** @returns {GoogleAppsScript.Spreadsheet.Sheet} */
  getSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(this.sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(this.sheetName);
      if (this.schema.length) {
        sheet.getRange(1, 1, 1, this.schema.length).setValues([this.schema]);
        sheet.setFrozenRows(1);
      }
      Log.warn('Feuille créée automatiquement : ' + this.sheetName);
    }
    return sheet;
  }

  /** En-têtes (mis en cache). @returns {string[]} */
  getHeaders() {
    if (this._headers) return this._headers;
    const sheet = this.getSheet();
    const lastCol = sheet.getLastColumn();
    if (lastCol === 0) { this._headers = this.schema.slice(); return this._headers; }
    this._headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map((h) => String(h).trim());
    return this._headers;
  }

  /** Index 0-based d'une colonne. @param {string} name @returns {number} */
  _colIndex(name) {
    const idx = this.getHeaders().indexOf(name);
    if (idx === -1) {
      throw new AppError('Colonne introuvable "' + name + '" dans ' + this.sheetName, 'SCHEMA');
    }
    return idx;
  }

  /** Transforme une ligne (array) en objet {header: valeur}. */
  _rowToObject(row) {
    const headers = this.getHeaders();
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  }

  /** Transforme un objet en ligne alignée sur l'ordre des en-têtes. */
  _objectToRow(obj) {
    return this.getHeaders().map((h) => (obj[h] === undefined ? '' : obj[h]));
  }

  /**
   * Retourne toutes les lignes de données sous forme d'objets bruts.
   * @returns {Object[]}
   */
  findAllRaw() {
    const sheet = this.getSheet();
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 2) return [];
    const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    return values.map((row) => this._rowToObject(row));
  }

  /**
   * Recherche brute par identifiant.
   * @param {string} id
   * @returns {{obj:Object, rowNumber:number}|null}
   */
  _findRawWithRow(id) {
    const sheet = this.getSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return null;
    const idCol = this._colIndex(this.idField);
    const ids = sheet.getRange(2, idCol + 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(id)) {
        const rowNumber = i + 2;
        const row = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
        return { obj: this._rowToObject(row), rowNumber: rowNumber };
      }
    }
    return null;
  }

  /** @param {string} id @returns {Object|null} */
  findByIdRaw(id) {
    const found = this._findRawWithRow(id);
    return found ? found.obj : null;
  }

  /**
   * Insère un enregistrement. Sous verrou.
   * @param {Object} obj
   * @returns {Object} l'objet inséré
   */
  insertRaw(obj) {
    return this._withLock(() => {
      const sheet = this.getSheet();
      sheet.appendRow(this._objectToRow(obj));
      Log.debug('Insertion dans ' + this.sheetName, { id: obj[this.idField] });
      return obj;
    });
  }

  /**
   * Met à jour un enregistrement existant. Sous verrou.
   * @param {string} id
   * @param {Object} patch  Champs à mettre à jour.
   * @returns {Object} l'objet mis à jour
   */
  updateRaw(id, patch) {
    return this._withLock(() => {
      const found = this._findRawWithRow(id);
      if (!found) throw new NotFoundError('Enregistrement introuvable : ' + id, { id: id });
      const merged = Object.assign({}, found.obj, patch);
      const sheet = this.getSheet();
      sheet.getRange(found.rowNumber, 1, 1, this.getHeaders().length)
        .setValues([this._objectToRow(merged)]);
      Log.debug('MàJ dans ' + this.sheetName, { id: id });
      return merged;
    });
  }

  /**
   * Supprime un enregistrement. Sous verrou.
   * @param {string} id
   * @returns {boolean}
   */
  deleteRaw(id) {
    return this._withLock(() => {
      const found = this._findRawWithRow(id);
      if (!found) throw new NotFoundError('Enregistrement introuvable : ' + id, { id: id });
      this.getSheet().deleteRow(found.rowNumber);
      Log.debug('Suppression dans ' + this.sheetName, { id: id });
      return true;
    });
  }

  /** Nombre de lignes de données. @returns {number} */
  count() {
    const sheet = this.getSheet();
    return Math.max(0, sheet.getLastRow() - 1);
  }

  /**
   * Exécute une opération d'écriture sous verrou document.
   * @param {Function} fn
   * @private
   */
  _withLock(fn) {
    const lock = LockService.getDocumentLock();
    try {
      lock.waitLock(15000);
      return fn();
    } catch (e) {
      if (e instanceof AppError) throw e;
      throw new AppError('Verrou indisponible (accès concurrent). Réessayez.', 'LOCK', { cause: e.message });
    } finally {
      try { lock.releaseLock(); } catch (ignore) { /* no-op */ }
    }
  }
}
