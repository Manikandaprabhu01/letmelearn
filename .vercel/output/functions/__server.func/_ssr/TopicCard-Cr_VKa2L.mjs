import { t as cn } from "./utils-C_uf36nf.mjs";
import { v as Link, z as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as Check } from "../_libs/lucide-react.mjs";
import { t as Badge } from "./badge-af-ErNXo.mjs";
import { t as useProgress } from "./progress-DJvQt-f2.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/TopicCard-Cr_VKa2L.js
var import_jsx_runtime = require_jsx_runtime();
function TopicCard({ to, slug, kicker, title, subtitle, tags, id }) {
	const done = useProgress((s) => Boolean(s.done[id]));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		params: { slug },
		className: "group flex flex-col rounded-lg border border-border bg-surface p-4 transition-colors duration-150 hover:border-border-strong",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-2",
				children: [kicker ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[11px] uppercase tracking-[0.14em] text-accent",
					children: kicker
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: cn("flex size-5 items-center justify-center rounded-full border", done ? "border-ok bg-ok/20 text-ok" : "border-border text-transparent"),
					"aria-hidden": true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3" })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "mt-2 font-medium leading-snug text-fg group-hover:text-accent",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 line-clamp-2 flex-1 text-sm leading-6 text-muted",
				children: subtitle
			}),
			tags?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 flex flex-wrap gap-1.5",
				children: tags.slice(0, 3).map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: t }, t))
			}) : null
		]
	});
}
//#endregion
export { TopicCard as t };
