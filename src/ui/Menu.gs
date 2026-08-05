/**
 * @file Menu.gs
 * @module ui/Menu
 * @description Menu personnalisé et lanceurs de boîtes de dialogue / barre latérale.
 */

/**
 * Déclencheur simple : construit le menu à l'ouverture du classeur.
 * @param {Object} e
 */
function onOpen(e) {
  SpreadsheetApp.getUi()
    .createMenu('📄 ' + APP.NAME)
    .addItem('➕ Nouvelle facture', 'ui_ouvrirFormulaireFacture')
    .addItem('👥 Gérer les clients', 'ui_ouvrirGestionClients')
    .addSeparator()
    .addItem('🔄 Rafraîchir le tableau de bord', 'ui_rafraichirDashboard')
    .addItem('⚙️ Paramètres', 'ui_ouvrirParametres')
    .addSeparator()
    .addSubMenu(SpreadsheetApp.getUi().createMenu('🛠️ Administration')
      .addItem('Initialiser l\'application', 'initialiserApplication')
      .addItem('Installer les déclencheurs', 'installerTriggers'))
    .addToUi();
}

/** Ouvre le formulaire de création/édition de facture. */
function ui_ouvrirFormulaireFacture() {
  const html = HtmlService.createTemplateFromFile('src/ui/FactureForm')
    .evaluate().setWidth(720).setHeight(640).setTitle('Nouvelle facture');
  SpreadsheetApp.getUi().showModalDialog(html, 'Nouvelle facture');
}

/** Ouvre la gestion des clients. */
function ui_ouvrirGestionClients() {
  const html = HtmlService.createTemplateFromFile('src/ui/ClientForm')
    .evaluate().setWidth(720).setHeight(600).setTitle('Clients');
  SpreadsheetApp.getUi().showModalDialog(html, 'Gestion des clients');
}

/** Ouvre les paramètres. */
function ui_ouvrirParametres() {
  const html = HtmlService.createTemplateFromFile('src/ui/ParametresForm')
    .evaluate().setWidth(600).setHeight(560).setTitle('Paramètres');
  SpreadsheetApp.getUi().showModalDialog(html, 'Paramètres de l\'entreprise');
}

/** Rafraîchit le tableau de bord et notifie l'utilisateur. */
function ui_rafraichirDashboard() {
  new DashboardService().rafraichir();
  SpreadsheetApp.getActiveSpreadsheet().toast('Tableau de bord mis à jour.', APP.NAME, 3);
}

/**
 * Helper pour inclure un fichier HTML dans un autre (partials CSS/JS).
 * @param {string} filename
 * @returns {string}
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
