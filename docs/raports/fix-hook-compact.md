❯ Help me fix the issues reported by /doctor below.

  For each issue: briefly explain what the fix will do, then ask me to confirm before running any shell command that deletes files, modifies global config, or changes my installation. Safe read-only checks are fine without asking. If a suggested fix looks wrong for my setup, say so instead of running it.

  - Settings (C:\PROJECTS\PROJECT\PRODUCTIONS\attendancy\.claude\settings.json › hooks.PostToolUse.0.hooks): Expected array, but received undefined
    Suggested fix: Hooks use a matcher + hooks array. The matcher is a string: a tool name ("Bash"), pipe-separated list ("Edit|Write"), or empty to match all. Example: {"PostToolUse": [{"matcher": "Edit|Write", "hooks": [{"type": "command", "command": "echo Done"}]}]}

  Read 1 file

Problème clair. L'entrée du hook manque la clé hooks (tableau) — command est directement au niveau de l'objet alors qu'il doit être dans hooks: [{ type: "command", command: "..." }].

Fix : restructurer l'entrée sans changer le comportement (même matcher "compact", même commande).

// Avant
{ "matcher": "compact", "command": "cat .clau

// Après
{ "matcher": "compact", "hooks": [{ "type": "command", "command": "cat .claude/context-essentials.md" }] }

● Update(.claude\settings.json)
Added 1 line, removed 1 line
    "PostToolUse": [
      {
        "matcher": "compact",
        "command": "cat .claude/conte
        "hooks": [{ "type": "command", "command": "cat .claude/context-essentials.md" }]
      }
    ]
  }

Corrigé. /doctor ne signalera plus cette erre
