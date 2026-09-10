import { n as playgrounds } from "./playgrounds-BbpE6ZvK.mjs";
import { z as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as TopicCard } from "./TopicCard-Cr_VKa2L.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/playgrounds-CMTf2nwK.js
var import_jsx_runtime = require_jsx_runtime();
function LabsIndex() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "px-5 py-10 sm:px-8 lg:px-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] font-medium uppercase tracking-[0.16em] text-accent",
				children: "Labs"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl",
				children: "Interactive playgrounds"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 max-w-2xl text-[15px] leading-7 text-muted",
				children: "Algorithms you can poke. The rate-limiter lab mirrors five-algorithm visualizers used in LLD teaching — token bucket through sliding counter — then the rest of the map: hashing, IDs, CAP, LRU, quorum."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3",
				children: playgrounds.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopicCard, {
					to: "/playgrounds/$slug",
					slug: p.slug,
					kicker: p.tags.join(" · "),
					title: p.title,
					subtitle: p.subtitle,
					tags: p.tags,
					id: `lab:${p.slug}`
				}, p.slug))
			})
		]
	});
}
//#endregion
export { LabsIndex as component };
