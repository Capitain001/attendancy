# lib/export — export de documents (XLSX / DOCX / print)

Module générique : `ExportConfig<T>` (colonnes + rows) → exporters XLSX/DOCX
(dynamic import — bundle léger) + template d'impression HTML.

État : **modularité en attente** — le module est livré tel quel en dossier
simple ; son découpage en sous-modules (par format, par cible) est un chantier
prévu mais pas encore réalisé. Ne pas restructurer au fil de l'eau : utiliser
tel quel, la modularisation se fera en une passe dédiée.

Dépendances (dynamic import) : `exceljs`, `docx`.
