/**
 * @file DriveService.gs
 * @module services/DriveService
 * @description Gestion du dossier Drive de l'application et sauvegarde des PDF.
 *              Le dossier racine est mémorisé dans PropertiesService pour éviter
 *              de le recréer et pour survivre aux renommages.
 */
const DriveService = Object.freeze({
  /**
   * Retourne (ou crée) le dossier racine de l'application.
   * @returns {GoogleAppsScript.Drive.Folder}
   */
  getDossierRacine() {
    const props = PropertiesService.getDocumentProperties();
    const id = props.getProperty(PROP_KEYS.DRIVE_FOLDER_ID);
    if (id) {
      try { return DriveApp.getFolderById(id); } catch (e) { /* recréé ci-dessous */ }
    }
    const dossier = DriveApp.createFolder(DEFAULTS.DRIVE_FOLDER_NAME);
    props.setProperty(PROP_KEYS.DRIVE_FOLDER_ID, dossier.getId());
    Log.info('Dossier Drive créé', { id: dossier.getId() });
    return dossier;
  },

  /**
   * Sous-dossier par année (organisation : /Racine/2026/).
   * @param {number|string} annee
   * @returns {GoogleAppsScript.Drive.Folder}
   */
  getDossierAnnee(annee) {
    const racine = this.getDossierRacine();
    const nom = String(annee);
    const it = racine.getFoldersByName(nom);
    return it.hasNext() ? it.next() : racine.createFolder(nom);
  },

  /**
   * Sauvegarde un blob PDF dans le dossier de l'année.
   * @param {GoogleAppsScript.Base.Blob} pdfBlob
   * @param {number|string} annee
   * @returns {GoogleAppsScript.Drive.File}
   */
  sauvegarderPdf(pdfBlob, annee) {
    const dossier = this.getDossierAnnee(annee);
    const fichier = dossier.createFile(pdfBlob);
    Log.info('PDF sauvegardé', { nom: fichier.getName(), url: fichier.getUrl() });
    return fichier;
  },
});
