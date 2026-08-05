/**
 * @file EmailService.gs
 * @module services/EmailService
 * @description Envoi des factures par email avec le PDF en pièce jointe.
 *              S'appuie sur PdfService (génération) et ne fait QUE l'envoi
 *              (responsabilité unique). Vérifie le quota Gmail restant.
 */
class EmailService {
  constructor() {
    this.pdfService = new PdfService();
    this.factureService = new FactureService();
    this.clientService = new ClientService();
    this.parametresService = new ParametresService();
  }

  /**
   * Envoie une facture par email au client.
   * @param {string} idFacture
   * @param {Object} [options] {destinataire, sujet, message, marquerEnvoyee}
   * @returns {{destinataire:string, fichierUrl:string}}
   */
  envoyerFacture(idFacture, options) {
    options = options || {};
    const facture = this.factureService.obtenir(idFacture);
    const params = this.parametresService.obtenir();
    const client = this.clientService.rechercher(facture.client)[0] || null;

    const destinataire = options.destinataire || (client && client.email);
    Validator.required(destinataire, 'Destinataire');
    Validator.email(destinataire, 'Destinataire');

    if (MailApp.getRemainingDailyQuota() < 1) {
      throw new AppError('Quota d\'envoi d\'emails épuisé pour aujourd\'hui.', 'QUOTA');
    }

    const { blob, fichier } = this.pdfService.genererEtArchiver(idFacture);
    const sujet = options.sujet
      || 'Facture ' + facture.idFacture + ' — ' + params.nomEntreprise;
    const corps = options.message || this._corpsParDefaut(facture, client, params);

    MailApp.sendEmail({
      to: destinataire,
      subject: sujet,
      htmlBody: corps,
      attachments: [blob],
      name: params.nomEntreprise,
      replyTo: params.email || undefined,
    });

    if (options.marquerEnvoyee !== false && facture.statut === FACTURE_STATUT.BROUILLON) {
      this.factureService.modifier(idFacture, { statut: FACTURE_STATUT.ENVOYEE });
    }

    Log.info('Facture envoyée par email', { id: idFacture, to: destinataire });
    return { destinataire: destinataire, fichierUrl: fichier.getUrl() };
  }

  /** @private */
  _corpsParDefaut(facture, client, params) {
    const nomClient = (client && client.nom) || facture.client;
    return [
      '<p>Bonjour ' + escapeHtml(nomClient) + ',</p>',
      '<p>Veuillez trouver ci-joint la facture <strong>' + escapeHtml(facture.idFacture) + '</strong> ',
      'd\'un montant de <strong>' + Formatter.money(facture.montantTTC, params.devise) + '</strong> TTC.</p>',
      '<p>Échéance de paiement : ' + DateUtils.toDisplay(facture.dateEcheance) + '.</p>',
      '<p>Cordialement,<br>' + escapeHtml(params.nomEntreprise) + '<br>',
      escapeHtml(params.telephone || '') + '</p>',
    ].join('');
  }
}
