/**
 * @file ClientService.gs
 * @module services/ClientService
 * @description Logique métier des clients : validation, création, mise à jour,
 *              suppression, recherche. Orchestration entre repository et modèle.
 */
class ClientService {
  constructor() { this.repo = new ClientRepository(); }

  /** @returns {Client[]} */
  lister() { return this.repo.findAll(); }

  /** @param {string} id @returns {Client} */
  obtenir(id) {
    const c = this.repo.findById(id);
    if (!c) throw new NotFoundError('Client introuvable : ' + id, { id: id });
    return c;
  }

  /**
   * @param {Object} data  Données saisies.
   * @returns {Client}
   */
  creer(data) {
    const client = new Client(data);
    this._valider(client);
    if (this.repo.findByNom(client.nom)) {
      throw new ConflictError('Un client nommé "' + client.nom + '" existe déjà.');
    }
    client.idClient = NumerotationService.prochainNumeroClient();
    client.dateCreation = new Date();
    client.statut = client.statut || CLIENT_STATUT.ACTIF;
    return this.repo.insert(client);
  }

  /**
   * @param {string} id
   * @param {Object} data
   * @returns {Client}
   */
  modifier(id, data) {
    const existant = this.obtenir(id);
    const maj = new Client(Object.assign({}, existant, data, { idClient: id, dateCreation: existant.dateCreation }));
    this._valider(maj);
    return this.repo.update(id, maj);
  }

  /** @param {string} id @returns {boolean} */
  supprimer(id) {
    this.obtenir(id); // garantit l'existence (404 sinon)
    return this.repo.delete(id);
  }

  /**
   * Recherche plein texte simple (nom, ville, email, contact).
   * @param {string} terme
   * @returns {Client[]}
   */
  rechercher(terme) {
    const t = String(terme || '').toLowerCase().trim();
    if (!t) return this.lister();
    return this.repo.findAll().filter((c) =>
      [c.nom, c.ville, c.email, c.contact, c.idClient]
        .some((v) => String(v || '').toLowerCase().includes(t)));
  }

  /** @param {Client} c @private */
  _valider(c) {
    Validator.required(c.nom, 'Nom');
    Validator.email(c.email, 'Email');
    Validator.oneOf(c.statut, Object.values(CLIENT_STATUT), 'Statut');
  }
}
