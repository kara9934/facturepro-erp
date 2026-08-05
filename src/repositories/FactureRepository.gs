/**
 * @file FactureRepository.gs
 * @module repositories/FactureRepository
 * @description Accès aux données des factures. Hydrate/déshydrate le modèle
 *              Facture au-dessus du BaseRepository générique.
 */
class FactureRepository extends BaseRepository {
  constructor() { super(SHEETS.FACTURES, 'ID_Facture', SCHEMA.FACTURES); }

  /** @returns {Facture[]} */
  findAll() { return this.findAllRaw().map(Facture.fromRow); }

  /** @param {string} id @returns {Facture|null} */
  findById(id) {
    const row = this.findByIdRaw(id);
    return row ? Facture.fromRow(row) : null;
  }

  /** @param {Facture} facture @returns {Facture} */
  insert(facture) { this.insertRaw(facture.toRow()); return facture; }

  /** @param {string} id @param {Facture} facture @returns {Facture} */
  update(id, facture) { const r = this.updateRaw(id, facture.toRow()); return Facture.fromRow(r); }

  /** @param {string} id @returns {boolean} */
  delete(id) { return this.deleteRaw(id); }

  /** Factures d'un client donné. @param {string} clientNom @returns {Facture[]} */
  findByClient(clientNom) {
    return this.findAll().filter((f) => f.client === clientNom);
  }
}
