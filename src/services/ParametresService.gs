/**
 * @file ParametresService.gs
 * @module services/ParametresService
 * @description Accès et mise à jour des paramètres d'entreprise.
 */
class ParametresService {
  constructor() { this.repo = new ParametresRepository(); }

  /** @returns {Parametres} */
  obtenir() { return this.repo.get(); }

  /** @param {Object} data @returns {Parametres} */
  enregistrer(data) {
    const p = new Parametres(data);
    Validator.required(p.nomEntreprise, 'Nom_Entreprise');
    Validator.email(p.email, 'Email');
    Validator.positive(p.tauxTVA, 'Taux_TVA');
    Validator.positive(p.delaiPaiement, 'Délai_Paiement');
    return this.repo.save(p);
  }
}
