# Server entry points for modules

Module barrels (`index.ts`) are public APIs. They must not re-export ordinary
server-only implementation files: a client importing one symbol from the
barrel can otherwise pull server dependencies such as `next/headers` into its
module graph.

Use separate entry points for each boundary:

- `index.ts`: shared types, client-safe utilities, and Server Actions intended
  to be called from client components.
- `server.ts`: server-only helpers and implementation exports. Start this file
  with `import "server-only"` and import it only from server code. Re-export
  each server module with `export *` by default to avoid keeping a duplicate
  export list; use named exports only when intentionally exposing a subset.
- Server Actions use `"use server"` and may depend on server-only
  implementation modules. They are safe to re-export from the public barrel.

```text
modules/user/
  index.ts          # shared API and client-callable Server Actions
  server.ts         # server-only API
```

When moving an existing server-only export out of `index.ts`, update its
server consumers to import from `server.ts`. Keep Server Actions in the public
barrel; do not move them to `server.ts`. This is an incremental boundary rule
and does not require migrating every existing module at once.
