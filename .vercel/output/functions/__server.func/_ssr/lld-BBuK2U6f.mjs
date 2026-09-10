import { n as lldConcepts } from "./lld-IFDGZbz7.mjs";
import { z as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as TopicCard } from "./TopicCard-Cr_VKa2L.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/lld-BBuK2U6f.js
var import_jsx_runtime = require_jsx_runtime();
function LldIndex() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "px-5 py-10 sm:px-8 lg:px-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] font-medium uppercase tracking-[0.16em] text-accent",
				children: "Menu"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl",
				children: "LLD Concepts"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 max-w-2xl text-[15px] leading-7 text-muted",
				children: "Low-level design is types, invariants, and thread-safety. Patterns are named only when they earn a seam — a rate-limiter strategy, a parking-spot index, a logger sink."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3",
				children: lldConcepts.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopicCard, {
					to: "/lld/$slug",
					slug: c.slug,
					kicker: c.level,
					title: c.title,
					subtitle: c.subtitle,
					tags: c.tags,
					id: `lld:${c.slug}`
				}, c.slug))
			})
		]
	});
}
//#endregion
export { LldIndex as component };
