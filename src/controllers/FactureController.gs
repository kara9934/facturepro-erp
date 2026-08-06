/**
 * @file FactureController.gs
 * @module controllers/FactureController
 * @description Points d'entrée appelés par l'UI via google.script.run.
 *              Rôle : (1) exposer une API stable, (2) convertir les modèles en
 *              DTO sérialisables, (3) envelopper la réponse dans un Result.
 *              AUCUNE logique métier ici (elle vit dans les services).
 *
 * Convention : chaque fonction publique est préfixée "api_" pour être
 * facilement repérable comme surface exposée au client.
 */

/** @returns {Object} Result<Facture[]> */
function api_listerFactures() {
  return guard('listerFactures', () =>
    new FactureService().lister().map((f) => f.toDTO()));
}

/** @param {string} id @returns {Object} Result<Facture> */
function api_obtenirFacture(id) {
  return guard('obtenirFacture', () => new FactureService().obtenir(id).toDTO());
}

/** @param {Object} data @returns {Object} Result<Facture> */
function api_creerFacture(data) {
  return guard('creerFacture', () => {
    const f = new FactureService().creer(data);
    new DashboardService().rafraichir();
    return f.toDTO();
  });
}

/** @param {string} id @param {Object} data @returns {Object} Result<Facture> */
function api_modifierFacture(id, data) {
  return guard('modifierFacture', () => {
    const f = new FactureService().modifier(id, data);
    new DashboardService().rafraichir();
    return f.toDTO();
  });
}

/** @param {string} id @returns {Object} Result<boolean> */
function api_supprimerFacture(id) {
  return guard('supprimerFacture', () => {
    const r = new FactureService().supprimer(id);
    new DashboardService().rafraichir();
    return r;
  });
}

/** @param {string} terme @returns {Object} Result<Facture[]> */
function api_rechercherFactures(terme) {
  return guard('rechercherFactures', () =>
    new FactureService().rechercher(terme).map((f) => f.toDTO()));
}

/** @param {string} id @param {Object} options @returns {Object} Result<Facture> */
function api_encaisserFacture(id, options) {
  return guard('encaisserFacture', () => {
    const f = new FactureService().encaisser(id, options);
    new DashboardService().rafraichir();
    return f.toDTO();
  });
}

/** @param {string} id @returns {Object} Result<{url}> */
function api_genererPdf(id) {
  return guard('genererPdf', () => {
    const { fichier } = new PdfService().genererEtArchiver(id);
    return { url: fichier.getUrl(), nom: fichier.getName() };
  });
}

/**
 * Certifie une facture auprès de la FNE (simulation ou réel selon l'URL des
 * Paramètres). Renvoie le numéro fiscal, le token de vérification et le mode.
 * @param {string} id
 * @returns {Object} Result<FNE>
 */
function api_certifierFacture(id) {
  return guard('certifierFacture', () => new FneService().certifier(id));
}

/** @param {string} id @param {Object} options @returns {Object} Result */
function api_envoyerFactureEmail(id, options) {
  return guard('envoyerFactureEmail', () =>
    new EmailService().envoyerFacture(id, options));
}
