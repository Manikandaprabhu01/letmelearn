import { v as Link, z as require_jsx_runtime } from "./_libs/@tanstack/react-router+[...].mjs";
import { n as Route, r as PLAYGROUND_UI } from "./_ssr/router-zoG0_dkm.mjs";
import { n as RelatedList, t as PageHeader } from "./_ssr/RelatedList-BkBYel9_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_slug-tCOTKcQg.js
var import_jsx_runtime = require_jsx_runtime();
function LabPage() {
	const { meta } = Route.useLoaderData();
	const Ui = PLAYGROUND_UI[meta.slug];
	const related = [meta.relatedConcept, meta.relatedExample].filter((x) => Boolean(x));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		kicker: "Lab",
		title: meta.title,
		subtitle: meta.subtitle,
		tags: meta.tags,
		id: `lab:${meta.slug}`
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-5 py-8 sm:px-8 lg:px-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ui, {}),
			related.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RelatedList, { paths: related }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-10 text-sm text-muted",
				children: [
					"Prefer a static walkthrough?",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/examples",
						className: "text-accent hover:underline",
						children: "System Design Examples"
					}),
					"."
				]
			})
		]
	})] });
}
//#endregion
export { LabPage as component };
