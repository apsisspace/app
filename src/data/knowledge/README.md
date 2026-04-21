---
# Not a knowledge entry — the build script skips any file whose frontmatter
# lacks both `norad_id` and `topic`.
---

# Curated Knowledge Base

Each `.md` file in this directory (except this README) is an entry consumed by
the AI tool layer via `get_knowledge(...)`. Entries come in two flavours:

1. **Satellite entries** — frontmatter must include `norad_id` (integer). The
   file is served when the AI calls `get_knowledge({ norad_id })`.
2. **Topic entries** — frontmatter must include `topic` (kebab-case string).
   The file is served when the AI calls `get_knowledge({ topic })`.

Both kinds must also include `name` (display label), `aliases` (array of
strings — optional), and `sources` (array of `{ url, title }`).

After editing or adding a file, run `npm run knowledge` to regenerate
`src/data/knowledge.generated.ts`, which the edge function actually imports.
The `dev` and `build` npm scripts run this automatically.
