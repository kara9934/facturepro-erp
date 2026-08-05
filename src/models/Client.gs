/**
 * @file Client.gs
 * @module models/Client
 * @description Modèle métier "Client".
 */
class Client {
  constructor(data) {
    data = data || {};
    this.idClient = data.idClient || '';
    this.nom = data.nom || '';
    this.telephone = data.telephone || '';
    this.email = data.email || '';
    this.adresse = data.adresse || '';
    this.ville = data.ville || '';
    this.pays = data.pays || '';
    this.contact = data.contact || '';
    this.numeroContribuable = data.numeroContribuable || '';
    this.statut = data.statut || CLIENT_STATUT.ACTIF;
    this.dateCreation = data.dateCreation || null;
  }

  static fromRow(row) {
    return new Client({
      idClient: row['ID_Client'],
      nom: row['Nom'],
      telephone: row['Téléphone'],
      email: row['Email'],
      adresse: row['Adresse'],
      ville: row['Ville'],
      pays: row['Pays'],
      contact: row['Contact'],
      numeroContribuable: row['Numéro_Contribuable'],
      statut: row['Statut'],
      dateCreation: row['Date_Création'],
    });
  }

  toRow() {
    return {
      'ID_Client': this.idClient,
      'Nom': this.nom,
      'Téléphone': this.telephone,
      'Email': this.email,
      'Adresse': this.adresse,
      'Ville': this.ville,
      'Pays': this.pays,
      'Contact': this.contact,
      'Numéro_Contribuable': this.numeroContribuable,
      'Statut': this.statut,
      'Date_Création': this.dateCreation,
    };
  }

  toDTO() {
    return {
      idClient: this.idClient, nom: this.nom, telephone: this.telephone,
      email: this.email, adresse: this.adresse, ville: this.ville, pays: this.pays,
      contact: this.contact, numeroContribuable: this.numeroContribuable, statut: this.statut,
      dateCreation: DateUtils.toISO(this.dateCreation),
    };
  }
}
