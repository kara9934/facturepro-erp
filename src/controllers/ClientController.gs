/**
 * @file ClientController.gs
 * @module controllers/ClientController
 * @description API clients exposée à l'UI.
 */

function api_listerClients() {
  return guard('listerClients', () => new ClientService().lister().map((c) => c.toDTO()));
}

function api_obtenirClient(id) {
  return guard('obtenirClient', () => new ClientService().obtenir(id).toDTO());
}

function api_creerClient(data) {
  return guard('creerClient', () => new ClientService().creer(data).toDTO());
}

function api_modifierClient(id, data) {
  return guard('modifierClient', () => new ClientService().modifier(id, data).toDTO());
}

function api_supprimerClient(id) {
  return guard('supprimerClient', () => new ClientService().supprimer(id));
}

function api_rechercherClients(terme) {
  return guard('rechercherClients', () =>
    new ClientService().rechercher(terme).map((c) => c.toDTO()));
}
