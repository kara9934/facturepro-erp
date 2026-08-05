/**
 * @file ClientRepository.gs
 * @module repositories/ClientRepository
 */
class ClientRepository extends BaseRepository {
  constructor() { super(SHEETS.CLIENTS, 'ID_Client', SCHEMA.CLIENTS); }

  /** @returns {Client[]} */
  findAll() { return this.findAllRaw().map(Client.fromRow); }

  /** @param {string} id @returns {Client|null} */
  findById(id) {
    const row = this.findByIdRaw(id);
    return row ? Client.fromRow(row) : null;
  }

  /** @param {string} nom @returns {Client|null} */
  findByNom(nom) {
    const row = this.findAllRaw().find((r) => r['Nom'] === nom);
    return row ? Client.fromRow(row) : null;
  }

  insert(client) { this.insertRaw(client.toRow()); return client; }
  update(id, client) { const r = this.updateRaw(id, client.toRow()); return Client.fromRow(r); }
  delete(id) { return this.deleteRaw(id); }
}
