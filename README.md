# 📄 FacturePro ERP

Application professionnelle de **gestion de factures** construite avec **Google Apps Script** et **Google Sheets**, conçue pour évoluer progressivement vers un **ERP complet** pour PME.

Le code suit une **architecture en couches** (modèles, repositories, services, contrôleurs, UI) avec séparation stricte des responsabilités, validation, gestion d'erreurs typée, et documentation.

---

## ✨ Fonctionnalités

| Domaine | Fonctionnalités |
|---|---|
| **Factures** | Créer, modifier, supprimer, rechercher, encaisser |
| **Lignes multiples** | Plusieurs prestations par facture : désignation, quantité, unité, prix unitaire, remise (%), taux de TVA par ligne |
| **Numérotation** | Numéros auto atomiques `FAC-2026-0001` |
| **Calculs** | TVA **ventilée par taux** et TTC calculés automatiquement, échéance auto |
| **Clients** | CRUD complet, recherche plein texte, **N° Contribuable (NCC)** |
| **Liaison** | Clé `ID_Client` reliant chaque facture à son client (référence stable) |
| **PDF** | Génération d'un PDF détaillé (tableau des lignes + TVA ventilée) + archivage Google Drive |
| **Email** | Envoi de la facture (PDF joint) au client |
| **Tableau de bord** | 8 KPI recalculés automatiquement |
| **Automatisation** | Trigger quotidien : retards + rafraîchissement KPI |
| **Robustesse** | Verrous (LockService), validation, erreurs typées, logs, migration douce de schéma |

---

## 🇨🇮 Contexte réglementaire (Côte d'Ivoire)

Le contenu des factures (mentions vendeur/client, NCC, désignation détaillée, TVA ventilée) est aligné sur les mentions exigées localement. **La certification électronique via la Facture Normalisée Électronique (FNE) de la DGI — obligatoire depuis décembre 2025 — est prévue en Phase 1** (intégration API). Tant qu'elle n'est pas branchée, l'outil convient à un usage interne / pilote ; l'émission de factures légalement opposables requiert la certification FNE.

---

## 🏗️ Architecture

```
Client (HTML/JS)  ->  Contrôleurs (api_*)  ->  Services (métier)  ->  Repositories (DAO)  ->  Google Sheets
                                                    |
                                                    +-> Modèles (domaine pur)
                                                    +-> Utils (validation, dates, format)
                                                    +-> Core (Logger, AppError, Result)
```

- **`config/`** — constantes, schémas de colonnes, valeurs par défaut.
- **`core/`** — Logger, hiérarchie d'erreurs (`AppError`), enveloppe `Result`, `guard()`.
- **`models/`** — `Facture`, `Client`, `Parametres` : logique de domaine pure, testable.
- **`repositories/`** — `BaseRepository` générique (résolution dynamique des colonnes, verrous) + repositories spécifiques.
- **`services/`** — logique métier : `FactureService`, `ClientService`, `DashboardService`, `NumerotationService`, `PdfService`, `EmailService`, `DriveService`, `ParametresService`.
- **`controllers/`** — surface API `api_*` exposée à l'UI, renvoie des `Result` sérialisables.
- **`ui/`** — menu + boîtes de dialogue HTML (factures, clients, paramètres).
- **`triggers/`** — installation et exécution des déclencheurs.

Détails complets dans [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## 🚀 Installation rapide

1. Ouvrir le Google Sheets **`Suivi_Factures`** → menu **Extensions → Apps Script**.
2. Copier les fichiers de `src/` dans l'éditeur (ou utiliser **clasp**, voir ci-dessous).
3. Coller le contenu de `appsscript.json` dans le manifeste (⚙️ afficher `appsscript.json`).
4. Recharger le Sheet : un menu **📄 FacturePro ERP** apparaît.
5. **Administration → Initialiser l'application** puis **Installer les déclencheurs**.

Guide complet : [`docs/INSTALLATION.md`](docs/INSTALLATION.md).

### Via clasp (recommandé pour Git)

```bash
npm install -g @google/clasp
clasp login
cp .clasp.json.example .clasp.json   # renseigner votre scriptId
clasp push
```

---

## 🗺️ Feuille de route

- **Phase 0 — Fondations du contenu** ✅ : lignes multiples, unité, remise %, TVA ventilée, NCC client, clé `ID_Client`.
- **Phase 1 — Conformité légale** : intégration FNE/DGI (numéro officiel, QR code, cachet fiscal).
- **Phase 2 — Pilotage & analyse** : tableau de bord visuel, rapports `QUERY`, relances automatiques.
- **Phase 3 — Portfolio & revente** : installation reproductible, packaging.
- **Phase 4 — Extensions ERP** : devis, produits/services, fournisseurs, paiements partiels, utilisateurs & rôles.

Voir [`docs/ROADMAP.md`](docs/ROADMAP.md) — l'architecture est déjà prête à les accueillir.

## 📄 Licence

MIT — voir [`LICENSE`](LICENSE).
