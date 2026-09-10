import { n as hldConcepts } from "./hld-B7VMEoA2.mjs";
import { B as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as TopicCard } from "./TopicCard-Cr_VKa2L.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/hld-Y4lFl0LA.js
var import_jsx_runtime = require_jsx_runtime();
function HldIndex() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "px-5 py-10 sm:px-8 lg:px-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] font-medium uppercase tracking-[0.16em] text-accent",
				children: "Menu"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl",
				children: "HLD Concepts"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 max-w-2xl text-[15px] leading-7 text-muted",
				children: "High-level design is the language of boxes: how data, traffic, and failure move through a system. Start with scaling and estimation, then CAP, hashing, and queues. Source 6 adds availability, idempotency, consensus, and gossip. Each page ends at a related example or a lab."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3",
				children: hldConcepts.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopicCard, {
					to: "/hld/$slug",
					slug: c.slug,
					kicker: c.level,
					title: c.title,
					subtitle: c.subtitle,
					tags: c.tags,
					id: `hld:${c.slug}`
				}, c.slug))
			})
		]
	});
}
//#endregion
export { HldIndex as component };
