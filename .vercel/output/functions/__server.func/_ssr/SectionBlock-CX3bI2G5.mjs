import { t as cn } from "./utils-C_uf36nf.mjs";
import { B as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/SectionBlock-CX3bI2G5.js
var import_jsx_runtime = require_jsx_runtime();
var toneClass = {
	default: "bg-raised border-border text-fg",
	accent: "bg-accent/12 border-accent/40 text-accent",
	ok: "bg-ok/12 border-ok/40 text-ok",
	bad: "bg-bad/12 border-bad/40 text-bad",
	warn: "bg-warn/12 border-warn/40 text-warn"
};
function NodeCard({ node }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("min-w-0 rounded-md border px-3 py-2 text-center", toneClass[node.tone ?? "default"]),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-sm font-medium leading-snug",
			children: node.label
		}), node.sub ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-0.5 text-xs text-muted",
			children: node.sub
		}) : null]
	});
}
function Arrow({ axis = "x" }) {
	if (axis === "y") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex items-center justify-center py-1 text-faint",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
			width: "10",
			height: "16",
			viewBox: "0 0 10 16",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M5 0v14M1 10l4 4 4-4",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.4"
			})
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-center text-faint",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
			width: "18",
			height: "10",
			viewBox: "0 0 18 10",
			className: "hidden sm:block",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M0 5h16M12 1l4 4-4 4",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.4"
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
			width: "10",
			height: "16",
			viewBox: "0 0 10 16",
			className: "sm:hidden",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M5 0v14M1 10l4 4 4-4",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.4"
			})
		})]
	});
}
var colCount = {
	2: "sm:grid-cols-2",
	3: "sm:grid-cols-3",
	4: "sm:grid-cols-4",
	5: "sm:grid-cols-5",
	6: "sm:grid-cols-6"
};
function SystemBoard({ columns, caption }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
		className: "my-5 overflow-x-auto rounded-lg border border-border bg-inset p-3 sm:p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: cn("grid grid-cols-1 gap-3", colCount[columns.length] ?? "sm:grid-cols-4"),
			children: columns.map((col, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col",
				children: [i > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex justify-center sm:hidden",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arrow, { axis: "y" })
				}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-h-full flex-col rounded-md border border-border bg-surface p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-2 flex items-center justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[11px] font-medium uppercase tracking-[0.14em] text-faint",
							children: col.title
						}), i < columns.length - 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden text-faint sm:inline",
							"aria-hidden": true,
							children: "→"
						}) : null]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-1 flex-col gap-2",
						children: col.nodes.map((node) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NodeCard, { node }, node.id))
					})]
				})]
			}, col.title))
		}), caption ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("figcaption", {
			className: "mt-3 text-center text-xs text-muted",
			children: caption
		}) : null]
	});
}
function ArchDiagram({ diagram }) {
	if (diagram.kind === "system") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SystemBoard, {
		columns: diagram.columns,
		caption: diagram.caption
	});
	if (diagram.kind === "flow") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
		className: "my-5 overflow-x-auto rounded-lg border border-border bg-inset p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex min-w-min flex-col gap-3",
			children: diagram.rows.map((row, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-center",
				children: row.map((node, j) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-stretch gap-2 sm:flex-row sm:items-center",
					children: [j > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arrow, {}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NodeCard, { node })]
				}, node.id))
			}, i))
		}), diagram.caption ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("figcaption", {
			className: "mt-3 text-center text-xs text-muted",
			children: diagram.caption
		}) : null]
	});
	if (diagram.kind === "layers") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
		className: "my-5 overflow-hidden rounded-lg border border-border bg-inset",
		children: [diagram.layers.map((layer, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: cn("px-4 py-3", i > 0 && "border-t border-border"),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-faint",
				children: layer.title
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-2",
				children: layer.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "rounded-md border border-border bg-raised px-2.5 py-1 text-xs text-fg",
					children: item
				}, item))
			})]
		}, layer.title)), diagram.caption ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("figcaption", {
			className: "border-t border-border px-4 py-2 text-xs text-muted",
			children: diagram.caption
		}) : null]
	});
	const total = diagram.fields.reduce((s, f) => s + f.bits, 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
		className: "my-5 overflow-x-auto rounded-lg border border-border bg-inset p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex min-w-[520px] overflow-hidden rounded-md border border-border",
			children: diagram.fields.map((field) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border-r border-border bg-raised px-2 py-3 text-center last:border-r-0",
				style: { flex: field.bits },
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "font-mono text-[11px] text-accent",
						children: [field.bits, "b"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1 text-xs font-medium",
						children: field.label
					}),
					field.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1 text-[10px] text-muted",
						children: field.note
					}) : null
				]
			}, field.label))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("figcaption", {
			className: "mt-3 text-center text-xs text-muted",
			children: diagram.caption ?? `${total}-bit layout`
		})]
	});
}
var calloutTone = {
	note: "border-border bg-raised text-muted",
	insight: "border-accent/30 bg-accent/8 text-fg",
	warn: "border-warn/30 bg-warn/8 text-fg"
};
function SectionBlock({ section, index }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "scroll-mt-24",
		id: `s-${index}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-xl font-medium tracking-tight text-fg sm:text-2xl",
				children: section.heading
			}),
			section.body?.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 max-w-prose text-[15px] leading-7 text-muted",
				children: p
			}, p.slice(0, 48))),
			section.bullets ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 max-w-prose space-y-2 text-[15px] leading-6 text-muted",
				children: section.bullets.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mt-[9px] size-1 shrink-0 rounded-full bg-accent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: b })]
				}, b))
			}) : null,
			section.numbered ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "mt-3 max-w-prose space-y-2 text-[15px] leading-6 text-muted",
				children: section.numbered.map((b, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono text-xs text-accent tabular-nums",
						children: String(i + 1).padStart(2, "0")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: b })]
				}, b))
			}) : null,
			section.table ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 overflow-x-auto rounded-lg border border-border",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[520px] text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "bg-raised text-xs uppercase tracking-wider text-faint",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: section.table.headers.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: h
						}, h)) })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: section.table.rows.map((row, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
						className: "border-t border-border",
						children: row.map((cell, j) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: cn("px-3 py-2 align-top text-muted", j === 0 && "font-medium text-fg"),
							children: cell
						}, j))
					}, i)) })]
				})
			}) : null,
			section.code ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
				className: "mt-4 overflow-hidden rounded-lg border border-border bg-inset",
				children: [section.code.title ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("figcaption", {
					className: "border-b border-border px-4 py-2 font-mono text-[11px] text-faint",
					children: section.code.title
				}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
					className: "overflow-x-auto p-4 font-mono text-[12.5px] leading-6 text-fg",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: section.code.source })
				})]
			}) : null,
			section.diagram ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArchDiagram, { diagram: section.diagram }) : null,
			section.callout ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: cn("mt-4 rounded-lg border px-4 py-3 text-sm leading-6", calloutTone[section.callout.kind]),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-[11px] font-medium uppercase tracking-[0.14em] text-accent",
					children: section.callout.title ?? section.callout.kind
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-muted",
					children: section.callout.text
				})]
			}) : null
		]
	});
}
//#endregion
export { SectionBlock as n, ArchDiagram as t };
