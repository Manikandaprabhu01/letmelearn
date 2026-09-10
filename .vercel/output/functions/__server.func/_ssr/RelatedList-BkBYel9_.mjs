import { t as cn } from "./utils-C_uf36nf.mjs";
import { z as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as Check } from "../_libs/lucide-react.mjs";
import { c as Button, l as lookupPath, s as AppLink } from "./router-zoG0_dkm.mjs";
import { t as Badge } from "./badge-af-ErNXo.mjs";
import { t as useProgress } from "./progress-DJvQt-f2.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/RelatedList-BkBYel9_.js
var import_jsx_runtime = require_jsx_runtime();
function MarkDone({ id }) {
	const done = useProgress((s) => Boolean(s.done[id]));
	const toggle = useProgress((s) => s.toggle);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
		variant: done ? "secondary" : "outline",
		size: "sm",
		onClick: () => toggle(id),
		className: cn(done && "text-ok"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5" }), done ? "Studied" : "Mark studied"]
	});
}
function PageHeader({ kicker, title, subtitle, minutes, tags, id }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "border-b border-border px-5 py-8 sm:px-8 lg:px-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.16em] text-accent",
					children: kicker
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MarkDone, { id })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-3 font-display text-3xl font-medium tracking-tight sm:text-4xl",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 max-w-2xl text-[15px] leading-7 text-muted",
				children: subtitle
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-wrap gap-2",
				children: [minutes ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, { children: [minutes, " min"] }) : null, tags?.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: t }, t))]
			})
		]
	});
}
function RelatedList({ paths }) {
	const items = paths.map(lookupPath).filter((x) => Boolean(x));
	if (!items.length) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-12 border-t border-border pt-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-[11px] font-medium uppercase tracking-[0.16em] text-faint",
			children: "Continue"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 grid gap-3 sm:grid-cols-2",
			children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppLink, {
				path: item.path,
				className: "rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[11px] uppercase tracking-[0.14em] text-accent",
						children: item.kind
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1 font-medium",
						children: item.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 line-clamp-2 text-sm text-muted",
						children: item.subtitle
					})
				]
			}, item.path))
		})]
	});
}
//#endregion
export { RelatedList as n, PageHeader as t };
