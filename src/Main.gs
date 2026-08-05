/**
 * @file Main.gs
 * @module Main
 * @description Point d'entrée / amorçage (bootstrap) de l'application.
 *              Contient l'initialisation idempotente : création des feuilles et
 *              en-têtes manquants, seed des paramètres, préparation du Drive.
 *              À lancer une fois après installation (menu > Administration).
 */

/**
 * Initialise l'application de façon idempotente (peut être relancée sans risque).
 * @returns {Object} Result
 */
function initialiserApplication() {
  return guard('initialiserApplication', () => {
    Log.setLevel(LOG_LEVEL.INFO);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1) Feuilles + en-têtes.
    _assurerFeuille(ss, SHEETS.FACTURES, SCHEMA.FACTURES);
    _assurerFeuille(ss, SHEETS.CLIENTS, SCHEMA.CLIENTS);
    _assurerFeuille(ss, SHEETS.PARAMETRES, SCHEMA.PARAMETRES);
    _assurerFeuille(ss, SHEETS.DASHBOARD, SCHEMA.DASHBOARD);

    // 2) Seed des paramètres si vide.
    const pRepo = new ParametresRepository();
    if (pRepo.count() === 0) {
      pRepo.save(new Parametres({ nomEntreprise: 'Mon Entreprise' }));
    }

    // 3) Dossier Drive.
    DriveService.getDossierRacine();

    // 4) Premier calcul du tableau de bord.
    new DashboardService().rafraichir();

    SpreadsheetApp.getActiveSpreadsheet().toast('Application initialisée ✅', APP.NAME, 4);
    return { version: APP.VERSION, feuilles: Object.values(SHEETS) };
  });
}

/**
 * S'assure qu'une feuille existe avec les bons en-têtes (sans écraser les données).
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 * @param {string} nom
 * @param {string[]} schema
 * @private
 */
function _assurerFeuille(ss, nom, schema) {
  let sheet = ss.getSheetByName(nom);
  if (!sheet) sheet = ss.insertSheet(nom);
  const lastCol = sheet.getLastColumn();
  const enteteActuelle = lastCol > 0
    ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String)
    : [];
  const nonVides = enteteActuelle.filter(String);
  if (nonVides.length === 0) {
    // Feuille neuve : on pose tout le schéma.
    sheet.getRange(1, 1, 1, schema.length).setValues([schema]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, schema.length).setFontWeight('bold');
    Log.info('En-têtes créés pour ' + nom);
  } else {
    // Feuille existante : migration douce, on ajoute les colonnes manquantes du schéma
    // sans toucher aux données ni à l'ordre des colonnes déjà présentes.
    const manquantes = schema.filter(function (col) { return enteteActuelle.indexOf(col) === -1; });
    if (manquantes.length) {
      sheet.getRange(1, nonVides.length + 1, 1, manquantes.length).setValues([manquantes]);
      sheet.getRange(1, 1, 1, nonVides.length + manquantes.length).setFontWeight('bold');
      Log.info('Colonnes ajoutées à ' + nom + ' : ' + manquantes.join(', '));
    }
  }
}
