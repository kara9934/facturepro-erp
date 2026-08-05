/**
 * @file DashboardController.gs
 * @module controllers/DashboardController
 * @description API tableau de bord et paramètres.
 */

function api_obtenirKPIs() {
  return guard('obtenirKPIs', () => new DashboardService().calculerKPIs());
}

function api_rafraichirDashboard() {
  return guard('rafraichirDashboard', () => new DashboardService().rafraichir());
}

function api_repartitionStatuts() {
  return guard('repartitionStatuts', () => new DashboardService().repartitionParStatut());
}

function api_obtenirParametres() {
  return guard('obtenirParametres', () => new ParametresService().obtenir().toDTO());
}

function api_enregistrerParametres(data) {
  return guard('enregistrerParametres', () => new ParametresService().enregistrer(data).toDTO());
}
