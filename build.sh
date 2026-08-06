#!/usr/bin/env bash
# Génère la "version facile" : un seul Code.gs (tous les .gs fusionnés dans
# l'ordre des dépendances) + les 5 HTML à plat. Les références src/ui/ sont
# aplaties pour correspondre aux fichiers HTML nommés simplement dans l'éditeur.
set -euo pipefail
OUT="${1:-build/Code.gs}"
mkdir -p "$(dirname "$OUT")"

FILES=(
  src/config/Constants.gs
  src/core/AppError.gs
  src/core/Logger.gs
  src/core/Result.gs
  src/utils/Validator.gs
  src/utils/DateUtils.gs
  src/utils/Formatter.gs
  src/utils/QrCode.gs
  src/models/Client.gs
  src/models/Facture.gs
  src/models/Parametres.gs
  src/repositories/BaseRepository.gs
  src/repositories/ClientRepository.gs
  src/repositories/FactureRepository.gs
  src/repositories/ParametresRepository.gs
  src/services/NumerotationService.gs
  src/services/ParametresService.gs
  src/services/ClientService.gs
  src/services/FactureService.gs
  src/services/DashboardService.gs
  src/services/DriveService.gs
  src/services/EmailService.gs
  src/services/PdfService.gs
  src/services/FneService.gs
  src/controllers/ClientController.gs
  src/controllers/DashboardController.gs
  src/controllers/FactureController.gs
  src/ui/Menu.gs
  src/triggers/Triggers.gs
  src/Main.gs
)

{
  echo "/**"
  echo " * FacturePro ERP — build fusionné (version facile)."
  echo " * Généré automatiquement par build.sh — ne pas éditer à la main."
  echo " * Source de vérité : dépôt modulaire (src/**)."
  echo " */"
  echo ""
  for f in "${FILES[@]}"; do
    echo "// ===================================================================="
    echo "// $f"
    echo "// ===================================================================="
    cat "$f"
    echo ""
  done
} | sed 's#src/ui/##g' > "$OUT"

echo "Écrit : $OUT ($(wc -l < "$OUT") lignes, $(wc -c < "$OUT") octets)"
