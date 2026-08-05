/**
 * @file ParametresRepository.gs
 * @module repositories/ParametresRepository
 * @description Les paramètres tiennent sur une seule ligne de données (ligne 2).
 *              Lecture/écriture simplifiées, avec valeurs par défaut robustes.
 */
class ParametresRepository extends BaseRepository {
  constructor() { super(SHEETS.PARAMETRES, 'Nom_Entreprise', SCHEMA.PARAMETRES); }

  /** @returns {Parametres} */
  get() {
    const rows = this.findAllRaw();
    return rows.length ? Parametres.fromRow(rows[0]) : new Parametres({});
  }

  /**
   * Enregistre les paramètres (upsert sur la ligne 2).
   * @param {Parametres} params
   * @returns {Parametres}
   */
  save(params) {
    return this._withLock(() => {
      const sheet = this.getSheet();
      const row = this._objectToRow(params.toRow());
      if (sheet.getLastRow() < 2) {
        sheet.appendRow(row);
      } else {
        sheet.getRange(2, 1, 1, this.getHeaders().length).setValues([row]);
      }
      Log.info('Paramètres enregistrés.');
      return params;
    });
  }
}
