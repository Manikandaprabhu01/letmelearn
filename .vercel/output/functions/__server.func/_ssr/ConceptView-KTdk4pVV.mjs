import { v as Link, z as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as FlaskConical } from "../_libs/lucide-react.mjs";
import { c as Button } from "./router-zoG0_dkm.mjs";
import { n as RelatedList, t as PageHeader } from "./RelatedList-BkBYel9_.mjs";
import { t as SectionBlock } from "./SectionBlock-Cziw7WPn.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ConceptView-KTdk4pVV.js
var import_jsx_runtime = require_jsx_runtime();
function ConceptView({ concept, kicker, id }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		kicker,
		title: concept.title,
		subtitle: concept.subtitle,
		minutes: concept.minutes,
		tags: [concept.level, ...concept.tags],
		id
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-10 px-5 py-8 sm:px-8 lg:px-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-prose text-[16px] leading-7 text-fg",
				children: concept.summary
			}),
			concept.playground ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				variant: "secondary",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/playgrounds/$slug",
					params: { slug: concept.playground },
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlaskConical, { className: "size-4" }), "Open the lab"]
				})
			}) : null,
			concept.sections.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBlock, {
				section: s,
				index: i
			}, s.heading)),
			concept.furtherReading.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-[11px] font-medium uppercase tracking-[0.16em] text-faint",
				children: "Sources"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 space-y-2",
				children: concept.furtherReading.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: l.href,
					target: "_blank",
					rel: "noreferrer",
					className: "text-sm text-accent hover:underline",
					children: l.label
				}) }, l.href))
			})] }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RelatedList, { paths: concept.related })
		]
	})] });
}
//#endregion
export { ConceptView as t };
