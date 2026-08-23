#!/bin/bash
# replace-toast.sh
set -euo pipefail

if [[ "$OSTYPE" == "darwin"* ]]; then
  SED_INPLACE=(-i '')
else
  SED_INPLACE=(-i)
fi

COUNT=0

while IFS= read -r -d '' f; do
  if grep -q "customToast" "$f"; then
    # 1. Remplace l'import nommé (guillemets simples OU doubles)
    sed "${SED_INPLACE[@]}" \
      -E "s/import \{ *customToast *\} from (['\"])@\/lib\/toast\/custom-toast\1/import { toast } from \1@\/lib\/toast\/custom-toast\1/g" \
      "$f"

    # 2. Remplace tous les usages customToast.xxx( -> toast.xxx(
    sed "${SED_INPLACE[@]}" \
      -E "s/\bcustomToast\./toast./g" \
      "$f"

    echo "Modifié: $f"
    COUNT=$((COUNT+1))
  fi
done < <(find . \
  -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/dist/*" \
  -not -path "*/build/*" \
  -print0)

echo "Terminé. $COUNT fichier(s) modifié(s)."