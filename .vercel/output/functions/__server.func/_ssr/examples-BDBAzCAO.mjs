import { t as examples } from "./examples-BE68fLeU.mjs";
import { B as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as TopicCard } from "./TopicCard-Cr_VKa2L.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/examples-BDBAzCAO.js
var import_jsx_runtime = require_jsx_runtime();
function ExamplesIndex() {
	const vol1 = examples.filter((e) => e.source === "Volume 1");
	const vol2 = examples.filter((e) => e.source === "Volume 2");
	const awesome = examples.filter((e) => e.source === "Source 6");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "px-5 py-10 sm:px-8 lg:px-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] font-medium uppercase tracking-[0.16em] text-accent",
				children: "Menu"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl",
				children: "System Design Examples"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 max-w-2xl text-[15px] leading-7 text-muted",
				children: [
					"Worked interviews in three collections. Volume 1 and 2 follow Alex Xu. Source 6 is the public",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "https://github.com/ashishps1/awesome-system-design-resources",
						target: "_blank",
						rel: "noreferrer",
						className: "text-accent hover:underline",
						children: "awesome-system-design-resources"
					}),
					" ",
					"list — original Lattice notes for the problems those books do not cover. Every page uses the four-step framework: scope, sketch, deep dive, wrap. Every example now opens with a full architecture board and a numbered walkthrough of the data path."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-10 font-display text-2xl tracking-tight",
				children: "Volume 1"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: "Scale from zero through Google Drive."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3",
				children: vol1.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopicCard, {
					to: "/examples/$slug",
					slug: e.slug,
					kicker: `Ch. ${e.chapter ?? "—"}`,
					title: e.title,
					subtitle: e.summary,
					tags: e.tags,
					id: `ex:${e.slug}`
				}, e.slug))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-12 font-display text-2xl tracking-tight",
				children: "Volume 2"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: "Proximity service through the stock exchange."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3",
				children: vol2.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopicCard, {
					to: "/examples/$slug",
					slug: e.slug,
					kicker: `Ch. ${e.chapter ?? "—"}`,
					title: e.title,
					subtitle: e.summary,
					tags: e.tags,
					id: `ex:${e.slug}`
				}, e.slug))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-12 font-display text-2xl tracking-tight",
				children: "Source 6 — Awesome list"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 max-w-2xl text-sm text-muted",
				children: "Auth, Instagram, Spotify, Netflix, Uber, Docs, Zoom, locks — problems the GitHub list is famous for, written here as original teaching notes. The full Easy / Medium / Hard index lives on Sources."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3",
				children: awesome.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopicCard, {
					to: "/examples/$slug",
					slug: e.slug,
					kicker: e.difficulty === "foundational" ? "Easy" : e.difficulty === "intermediate" ? "Medium" : "Hard",
					title: e.title,
					subtitle: e.summary,
					tags: e.tags,
					id: `ex:${e.slug}`
				}, e.slug))
			})
		]
	});
}
//#endregion
export { ExamplesIndex as component };
