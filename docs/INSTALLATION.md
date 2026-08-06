# Installation — FacturePro ERP

## Prérequis
- Un compte Google avec accès à Google Sheets, Drive et Gmail.
- Le classeur **`Suivi_Factures`** (feuilles : Factures, Clients, Paramètres, Tableau_de_bord).

## Méthode A — Manuelle (copier/coller)

1. Ouvrir `Suivi_Factures` → **Extensions → Apps Script**.
2. Dans l'éditeur, recréer les fichiers de `src/` en respectant les noms
   (Apps Script accepte les `/` dans les noms de fichiers ; ex. `src/config/Constants`).
   Les fichiers `.gs` deviennent des scripts, les `.html` des fichiers HTML.
3. Cliquer sur ⚙️ (Paramètres du projet) → cocher **Afficher `appsscript.json`**,
   puis coller le contenu du fichier `appsscript.json` fourni.
4. Enregistrer, revenir au Sheet et **recharger la page**.
5. Un menu **📄 FacturePro ERP** apparaît.

## Méthode B — clasp (recommandée pour GitHub)

```bash
npm install -g @google/clasp
clasp login
# Récupérez le Script ID : Apps Script -> Paramètres du projet -> ID
cp .clasp.json.example .clasp.json
# éditez .clasp.json pour renseigner scriptId
clasp push
```

## Première utilisation

1. Menu **📄 FacturePro ERP → 🛠️ Administration → Initialiser l'application**.
   (Crée les feuilles/en-têtes manquants, le dossier Drive, un paramétrage par défaut.)
2. Menu **🛠️ Administration → Installer les déclencheurs** (tâche quotidienne 7h).
3. Menu **⚙️ Paramètres** : renseignez entreprise, taux de TVA, devise, délai de paiement.
4. **Paramètres FNE** (certification DGI) — *optionnel* :
   - Laissez l'**URL de l'API vide** pour rester en **mode simulation** (aucun réseau ; les factures certifiées portent le marquage « SIMULATION FNE — DOCUMENT NON OPPOSABLE »).
   - Renseignez **URL + clé API** pour passer en **mode réel** (mock déployé ou plateforme DGI). Aucun changement de code n'est nécessaire.
   - Renseignez aussi le **point de vente** et l'**établissement** (exigés par la DGI ; à défaut, le nom de l'entreprise est utilisé).
5. **👥 Gérer les clients** : ajoutez vos clients (**téléphone et email obligatoires** pour la certification FNE).
6. **➕ Nouvelle facture** : créez votre première facture.

## Autorisations
Au premier lancement, Google demande d'autoriser les accès (Sheets, Drive, Gmail,
déclencheurs). Ces scopes sont déclarés dans `appsscript.json`.

## Dépannage
- **« Colonne introuvable »** : relancez *Initialiser l'application* (crée les en-têtes).
- **PDF vide / erreur** : vérifiez que la facture existe et que Drive est autorisé.
- **Email non envoyé** : le client doit avoir un email valide ; vérifiez le quota Gmail.
- **« Certification FNE impossible : il manque… »** : la pré-validation signale les champs requis par la DGI (téléphone/email du client, point de vente, établissement, lignes). Complétez-les puis relancez.
- **Facture certifiée marquée « NON OPPOSABLE »** : normal en mode simulation (URL de l'API vide). Renseignez l'URL + la clé API dans les Paramètres FNE pour le mode réel.
