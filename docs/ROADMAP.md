# Feuille de route — de la facturation à l'ERP

L'architecture en couches permet d'ajouter chaque module sans refonte. La
numérotation ci-dessous est alignée sur le [README](../README.md).

## Phase 0 — Fondations du contenu (livrée ✅)
- Factures : CRUD, numérotation atomique `FAC-2026-xxxx`, encaissement.
- **Lignes multiples** par facture : désignation, quantité, unité, remise (%), taux de TVA par ligne.
- TVA **ventilée par taux** et TTC calculés automatiquement, échéance auto.
- Clients : CRUD, recherche plein texte, **N° Contribuable (NCC)**, clé `ID_Client`.
- Paramètres d'entreprise, PDF détaillé + archivage Drive, envoi email.
- Tableau de bord (8 KPI) + trigger quotidien.

## Phase 1 — Conformité légale FNE/DGI (livrée ✅, POC non certifié)
- `FneService` : certification via un **mock intégré fidèle au contrat de l'API DGI** (endpoint `/sign`, auth Bearer, mêmes erreurs, mêmes formats).
- Numéro fiscal au format officiel `{NCC}{AA}{séquence}`, URL de vérification, ventilation TVA côté DGI.
- **Sticker de certification** en pied de PDF : visuel FNE neutre, numéro fiscal, **QR code de vérification** (`QrCode`, générateur en code pur, vérifié par décodage).
- **Pré-validation en français** des exigences DGI avant tout envoi.
- **Bascule simulation → réel** par simple configuration (URL + clé API), sans changement de code.
- ⚠️ Non opposable en l'état : voir *Statut de la conformité FNE* dans le README.

## Phase 2 — Pilotage & analyse (à venir)
- Tableau de bord **visuel** (graphiques interactifs).
- **Rapports** : mensuel, TVA, chiffre d'affaires par client (via `QUERY` / Sheets).
- **Relances automatiques** des factures en retard (email).
- Éventuelles intégrations Google (Agenda pour les échéances).

## Phase 3 — Portfolio & revente (à venir)
- Installation reproductible, packaging, déploiement « clé en main ».
- Documentation utilisateur finale.

## Phase 4 — Extensions ERP (à venir)
- **Produits / Catalogue** (modèle + repo + service + UI).
- **Devis** (avec conversion devis → facture).
- **Fournisseurs** et factures fournisseurs / dépenses.
- **Paiements partiels** (statut « Partiellement payée »).
- **Utilisateurs & rôles** (contrôle d'accès dans `guard()`) + **journal d'audit**.

## Dette technique à surveiller
- Tests : suite Node en place (`npm test`) ; à étendre au fil des modules.
- Migration éventuelle vers une base relationnelle si le volume dépasse les limites de Sheets.
- Documentation `docs/` à garder synchronisée avec le code à chaque phase.
