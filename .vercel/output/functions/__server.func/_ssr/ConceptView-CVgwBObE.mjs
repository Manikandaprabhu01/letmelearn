import { B as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as FlaskConical } from "../_libs/lucide-react.mjs";
import { c as Button, l as lookupPath, s as AppLink } from "./router-BZm8xvrR.mjs";
import { a as tocFromSections, n as SectionBlock, r as Toc } from "./Toc-ClLK8FBQ.mjs";
import { n as RelatedList, t as PageHeader } from "./RelatedList-D_V4CKq5.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ConceptView-CVgwBObE.js
var import_jsx_runtime = require_jsx_runtime();
function Prerequisites({ paths }) {
	const items = paths.map(lookupPath).filter((x) => Boolean(x));
	if (!items.length) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "text-sm text-muted",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-[11px] uppercase tracking-[0.14em] text-faint",
			children: "Read first "
		}), items.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [i > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-faint",
			children: " · "
		}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppLink, {
			path: item.path,
			className: "text-accent hover:underline",
			children: item.title
		})] }, item.path))]
	});
}
function ConceptView({ concept, kicker, id }) {
	const toc = tocFromSections(concept.sections);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		kicker,
		title: concept.title,
		subtitle: concept.subtitle,
		minutes: concept.minutes,
		tags: [concept.level, ...concept.tags],
		id
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "px-5 py-8 sm:px-8 lg:px-12",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "lg:flex lg:gap-12",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1 space-y-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "max-w-prose text-[16px] leading-7 text-fg",
							children: concept.summary
						}), concept.prerequisites?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Prerequisites, { paths: concept.prerequisites }) : null]
					}),
					concept.keyPoints?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
						className: "rounded-lg border border-accent/25 bg-accent/6 px-4 py-4 sm:px-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[11px] font-medium uppercase tracking-[0.16em] text-accent",
							children: "The 60-second version"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-3 space-y-2",
							children: concept.keyPoints.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex gap-2.5 text-[14.5px] leading-6 text-muted",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mt-[9px] size-1 shrink-0 rounded-full bg-accent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: p })]
							}, p))
						})]
					}) : null,
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
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
				className: "order-first mb-8 hidden shrink-0 lg:sticky lg:top-24 lg:order-none lg:mb-0 lg:block lg:h-fit lg:w-56",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toc, { entries: toc })
			})]
		})
	})] });
}
//#endregion
export { ConceptView as t };
