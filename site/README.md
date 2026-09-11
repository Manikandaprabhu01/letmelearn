# Static reading build

Compiles the whole curriculum — HLD concepts, LLD concepts and worked examples —
into a single self-contained HTML file with no server, no build-time framework
and no runtime dependencies. Used to publish a shareable read-only copy of the
app; the interactive labs are not included, since they are React components.

```
npx vite build --config site/vite.config.mjs   # bundle the data modules to JSON
node site/build.mjs                            # -> site/letmelearn.html
```

| File | Role |
| --- | --- |
| `data-entry.ts` | Re-exports the content modules so Vite can bundle them for Node |
| `vite.config.mjs` | Resolves the `@/` alias and emits `site/.build/data-entry.js` |
| `head.html` | Page shell: design tokens (light + dark), layout, component CSS |
| `app.js` | Renderers for every section and diagram kind, hash router, search |
| `build.mjs` | Inlines the content JSON into the shell and writes `letmelearn.html` |

`letmelearn.html` and `.build/` are generated and stay out of version control.

The renderers here mirror `src/components/content/*`. When a new `Section` field
or `Diagram` kind is added to `src/data/types.ts`, add the matching branch in
`app.js` (`section()` and `diagram()`) or it will silently not render.
