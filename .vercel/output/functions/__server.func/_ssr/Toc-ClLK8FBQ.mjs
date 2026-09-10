import { i as __toESM } from "../_runtime.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { B as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/Toc-ClLK8FBQ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var toneClass = {
	default: "bg-raised border-border text-fg",
	accent: "bg-accent/12 border-accent/40 text-accent",
	ok: "bg-ok/12 border-ok/40 text-ok",
	bad: "bg-bad/12 border-bad/40 text-bad",
	warn: "bg-warn/12 border-warn/40 text-warn"
};
var strokeTone = {
	default: "text-faint",
	accent: "text-accent",
	ok: "text-ok",
	bad: "text-bad",
	warn: "text-warn"
};
function Figure({ children, caption, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
		className: cn("my-5 rounded-lg border border-border bg-inset p-3 sm:p-4", className),
		children: [children, caption ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("figcaption", {
			className: "mt-3 text-center text-xs text-muted",
			children: caption
		}) : null]
	});
}
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Figure, {
		caption,
		className: "overflow-x-auto",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
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
		})
	});
}
function SequenceBoard({ diagram }) {
	const { actors, messages, caption } = diagram;
	const index = new Map(actors.map((a, i) => [a.id, i]));
	const cols = `repeat(${actors.length}, minmax(104px, 1fr))`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Figure, {
		caption,
		className: "overflow-x-auto",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-[560px]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-2",
				style: { gridTemplateColumns: cols },
				children: actors.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-md border border-accent/30 bg-accent/8 px-2 py-2 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[13px] font-medium leading-snug text-fg",
						children: a.label
					}), a.sub ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-0.5 text-[10px] text-muted",
						children: a.sub
					}) : null]
				}, a.id))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative mt-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "pointer-events-none absolute inset-0 grid",
					style: { gridTemplateColumns: cols },
					"aria-hidden": true,
					children: actors.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex justify-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-full w-px bg-border" })
					}, a.id))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "relative grid",
					style: { gridTemplateColumns: cols },
					children: messages.map((m, i) => {
						const from = index.get(m.from) ?? 0;
						const to = index.get(m.to) ?? from;
						const self = m.kind === "self" || from === to;
						const start = Math.min(from, to);
						const end = Math.max(from, to);
						const rightward = to >= from;
						const dashed = m.kind === "return" || m.kind === "async";
						const stroke = strokeTone[m.tone ?? (m.kind === "return" ? "default" : "accent")];
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "px-1 py-2",
							style: {
								gridRow: i + 1,
								gridColumn: `${start + 1} / ${end + 2}`
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-baseline gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mt-px font-mono text-[10px] tabular-nums text-faint",
										children: i + 1
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[12px] leading-snug text-fg",
										children: m.label
									})]
								}),
								self ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: cn("mt-1 flex items-center gap-1", stroke),
									"aria-hidden": true,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
										width: "34",
										height: "14",
										viewBox: "0 0 34 14",
										className: "shrink-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
											d: "M2 3h26a4 4 0 0 1 0 8H10",
											fill: "none",
											stroke: "currentColor",
											strokeWidth: "1.3",
											strokeDasharray: dashed ? "3 3" : void 0
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
											d: "M14 7l-4 4-0-8z",
											fill: "currentColor"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[10px] text-faint",
										children: "self"
									})]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: cn("mt-1 flex items-center", stroke),
									"aria-hidden": true,
									children: [
										!rightward ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "-mr-px text-[10px] leading-none",
											children: "◀"
										}) : null,
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: cn("h-px flex-1", dashed ? "bg-transparent" : "bg-current"),
											style: dashed ? {
												backgroundImage: "repeating-linear-gradient(to right, currentColor 0 4px, transparent 4px 8px)",
												height: "1px"
											} : void 0
										}),
										rightward ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "-ml-px text-[10px] leading-none",
											children: "▶"
										}) : null
									]
								}),
								m.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-1 text-[11px] leading-snug text-muted",
									children: m.note
								}) : null
							]
						}, `${i}-${m.label}`);
					})
				})]
			})]
		})
	});
}
var keyBadge = {
	pk: "border-accent/40 bg-accent/12 text-accent",
	fk: "border-warn/40 bg-warn/12 text-warn",
	idx: "border-border bg-raised text-muted"
};
function ErBoard({ diagram }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Figure, {
		caption: diagram.caption,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
			children: diagram.entities.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "overflow-hidden rounded-md border border-border bg-surface",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "border-b border-border bg-raised px-3 py-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-mono text-[13px] font-medium text-accent",
						children: e.name
					}), e.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-0.5 text-[11px] text-muted",
						children: e.note
					}) : null]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "divide-y divide-border",
					children: e.fields.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-baseline gap-2 px-3 py-1.5",
						children: [
							f.key ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("shrink-0 rounded border px-1 font-mono text-[9px] uppercase leading-4", keyBadge[f.key]),
								children: f.key
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "w-[26px] shrink-0",
								"aria-hidden": true
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-[12px] text-fg",
								children: f.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ml-auto shrink-0 font-mono text-[11px] text-faint",
								children: f.type
							})
						]
					}, f.name))
				})]
			}, e.name))
		}), diagram.relations?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-3 space-y-1.5 rounded-md border border-border bg-surface px-3 py-2",
			children: diagram.relations.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex flex-wrap items-baseline gap-x-2 text-[12px]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono text-fg",
						children: r.from
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-faint",
						"aria-hidden": true,
						children: "──▶"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono text-fg",
						children: r.to
					}),
					r.cardinality ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "rounded border border-border bg-raised px-1 font-mono text-[10px] text-muted",
						children: r.cardinality
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: r.label
					})
				]
			}, `${r.from}-${r.to}-${r.label}`))
		}) : null]
	});
}
function CompareBoard({ diagram }) {
	const n = diagram.options.length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Figure, {
		caption: diagram.caption,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: cn("grid gap-3", n >= 3 ? "md:grid-cols-3" : "md:grid-cols-2"),
			children: diagram.options.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: cn("flex flex-col rounded-md border bg-surface p-3", toneClass[o.tone ?? "default"]),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-sm font-medium text-fg",
						children: o.title
					}),
					o.sub ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-0.5 text-[11px] text-muted",
						children: o.sub
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "mt-2.5 space-y-1.5",
						children: [o.good.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex gap-2 text-[12.5px] leading-5 text-muted",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-px shrink-0 font-mono text-[11px] text-ok",
								"aria-hidden": true,
								children: "+"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: g })]
						}, g)), o.bad.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex gap-2 text-[12.5px] leading-5 text-muted",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-px shrink-0 font-mono text-[11px] text-bad",
								"aria-hidden": true,
								children: "−"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: b })]
						}, b))]
					}),
					o.verdict ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-auto border-t border-border pt-2 text-[11.5px] leading-5 text-fg",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-[10px] uppercase tracking-[0.14em] text-faint",
							children: ["Pick when", " "]
						}), o.verdict]
					}) : null
				]
			}, o.title))
		})
	});
}
var stereotypeLabel = {
	interface: "«interface»",
	abstract: "«abstract»",
	enum: "«enum»",
	record: "«record»",
	class: ""
};
var edgeGlyph = {
	implements: "┈┈▷",
	extends: "───▷",
	has: "───◆",
	uses: "───▶"
};
function UmlBoard({ diagram }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Figure, {
		caption: diagram.caption,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
			children: diagram.boxes.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: cn("overflow-hidden rounded-md border bg-surface", toneClass[b.tone ?? "default"]),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "border-b border-border bg-raised px-3 py-2 text-center",
					children: [b.stereotype && stereotypeLabel[b.stereotype] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-mono text-[10px] text-faint",
						children: stereotypeLabel[b.stereotype]
					}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-mono text-[13px] font-medium text-fg",
						children: b.name
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "px-3 py-2",
					children: b.members.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "py-0.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-[11px] text-accent",
								children: m.vis ?? "+"
							}),
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("font-mono text-[11.5px]", m.kind === "field" ? "text-muted" : "text-fg"),
								children: m.name
							}),
							m.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "ml-1 text-[10.5px] text-faint",
								children: ["— ", m.note]
							}) : null
						]
					}, m.name))
				})]
			}, b.name))
		}), diagram.edges?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-3 space-y-1.5 rounded-md border border-border bg-surface px-3 py-2",
			children: diagram.edges.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex flex-wrap items-baseline gap-x-2 text-[12px]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono text-fg",
						children: e.from
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono text-faint",
						"aria-hidden": true,
						children: edgeGlyph[e.kind ?? "uses"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono text-fg",
						children: e.to
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: e.label ?? e.kind ?? "uses"
					})
				]
			}, `${e.from}-${e.to}-${e.kind}`))
		}) : null]
	});
}
function ArchDiagram({ diagram }) {
	if (diagram.kind === "system") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SystemBoard, {
		columns: diagram.columns,
		caption: diagram.caption
	});
	if (diagram.kind === "sequence") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SequenceBoard, { diagram });
	if (diagram.kind === "er") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErBoard, { diagram });
	if (diagram.kind === "compare") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CompareBoard, { diagram });
	if (diagram.kind === "uml") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UmlBoard, { diagram });
	if (diagram.kind === "flow") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Figure, {
		caption: diagram.caption,
		className: "overflow-x-auto",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex min-w-min flex-col gap-3",
			children: diagram.rows.map((row, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-center",
				children: row.map((node, j) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-stretch gap-2 sm:flex-row sm:items-center",
					children: [j > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arrow, {}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NodeCard, { node })]
				}, node.id))
			}, i))
		})
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Figure, {
		caption: diagram.caption ?? `${total}-bit layout`,
		className: "overflow-x-auto",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
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
		})
	});
}
/** Stable, readable anchor for a section heading. */
function headingId(heading, index) {
	const slug = heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
	return slug ? `${slug}` : `s-${index}`;
}
function tocFromSections(sections, group, offset = 0) {
	return sections.map((s, i) => ({
		id: headingId(s.heading, i + offset),
		label: s.heading,
		group
	}));
}
var calloutTone = {
	note: "border-border bg-raised",
	insight: "border-accent/30 bg-accent/8",
	warn: "border-warn/30 bg-warn/8",
	interview: "border-ok/30 bg-ok/8"
};
var calloutLabel = {
	note: "Note",
	insight: "Insight",
	warn: "Watch out",
	interview: "In the interview"
};
function asArray(value) {
	if (!value) return [];
	return Array.isArray(value) ? value : [value];
}
function Code({ block }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
		className: "mt-4 overflow-hidden rounded-lg border border-border bg-inset",
		children: [block.title ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figcaption", {
			className: "flex items-center justify-between gap-3 border-b border-border px-4 py-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-mono text-[11px] text-faint",
				children: block.title
			}), block.lang ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "shrink-0 rounded border border-border bg-raised px-1.5 font-mono text-[10px] uppercase text-faint",
				children: block.lang
			}) : null]
		}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
			className: "overflow-x-auto p-4 font-mono text-[12.5px] leading-6 text-fg",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: block.source })
		})]
	});
}
function SectionBlock({ section, index }) {
	const codes = asArray(section.code);
	const diagrams = asArray(section.diagram);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "scroll-mt-24",
		id: headingId(section.heading, index),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-xl font-medium tracking-tight text-fg sm:text-2xl",
				children: section.heading
			}),
			section.lede ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1.5 max-w-prose text-[13.5px] leading-6 text-faint",
				children: section.lede
			}) : null,
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
			section.steps ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "mt-4 space-y-0 border-l border-border pl-0",
				children: section.steps.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "relative pb-5 pl-6 last:pb-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "absolute -left-[9px] top-0.5 flex size-[18px] items-center justify-center rounded-full border border-accent/40 bg-inset font-mono text-[10px] tabular-nums text-accent",
							children: i + 1
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[14.5px] font-medium leading-6 text-fg",
							children: s.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 max-w-prose text-[14px] leading-6 text-muted",
							children: s.text
						}),
						s.detail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1.5 max-w-prose rounded-md border border-border bg-inset px-3 py-2 font-mono text-[11.5px] leading-5 text-faint",
							children: s.detail
						}) : null
					]
				}, s.title))
			}) : null,
			section.math ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 overflow-x-auto rounded-lg border border-border",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("table", {
					className: "w-full min-w-[520px] text-left text-sm",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: section.math.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-t border-border first:border-t-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "w-[28%] px-3 py-2 align-top font-medium text-fg",
								children: m.label
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-3 py-2 align-top font-mono text-[12px] text-muted",
								children: [m.expr, m.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-0.5 font-sans text-[11.5px] text-faint",
									children: m.note
								}) : null]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "w-[22%] whitespace-nowrap px-3 py-2 text-right align-top font-mono text-[12.5px] font-medium text-accent",
								children: m.result
							})
						]
					}, m.label)) })
				})
			}) : null,
			section.table ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 overflow-x-auto rounded-lg border border-border",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[520px] text-left text-sm",
					children: [
						section.table.caption ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("caption", {
							className: "border-b border-border px-3 py-2 text-left text-[11.5px] text-faint",
							children: section.table.caption
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "bg-raised text-xs uppercase tracking-wider text-faint",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: section.table.headers.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 font-medium",
								children: h
							}, h)) })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: section.table.rows.map((row, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
							className: "border-t border-border",
							children: row.map((cell, j) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: cn("px-3 py-2 align-top text-muted", j === 0 && "font-medium text-fg"),
								children: cell
							}, j))
						}, i)) })
					]
				})
			}) : null,
			codes.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Code, { block: c }, (c.title ?? "") + c.source.slice(0, 32))),
			diagrams.map((d, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArchDiagram, { diagram: d }, `${d.kind}-${i}`)),
			section.followUps ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", {
				className: "mt-4 space-y-3",
				children: section.followUps.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-lg border border-border bg-surface px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dt", {
						className: "text-[14px] font-medium leading-6 text-fg",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mr-2 font-mono text-[11px] text-accent",
							children: "Q"
						}), f.q]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
						className: "mt-1.5 max-w-prose text-[14px] leading-6 text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mr-2 font-mono text-[11px] text-ok",
							children: "A"
						}), f.a]
					})]
				}, f.q))
			}) : null,
			section.callout ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: cn("mt-4 rounded-lg border px-4 py-3 text-sm leading-6", calloutTone[section.callout.kind]),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-[11px] font-medium uppercase tracking-[0.14em] text-accent",
					children: section.callout.title ?? calloutLabel[section.callout.kind]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 max-w-prose text-muted",
					children: section.callout.text
				})]
			}) : null,
			section.takeaways ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 rounded-lg border border-accent/25 bg-accent/6 px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-[11px] font-medium uppercase tracking-[0.14em] text-accent",
					children: "Takeaways"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-2 space-y-1.5",
					children: section.takeaways.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex gap-2 text-[14px] leading-6 text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mt-[9px] size-1 shrink-0 rounded-full bg-accent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t })]
					}, t))
				})]
			}) : null
		]
	});
}
/**
* Sticky "on this page" rail. Rendered beside the article on wide screens and
* as a collapsed strip above the content on narrow ones.
*/
function Toc({ entries }) {
	const [active, setActive] = (0, import_react.useState)(entries[0]?.id);
	(0, import_react.useEffect)(() => {
		const targets = entries.map((e) => document.getElementById(e.id)).filter((el) => Boolean(el));
		if (!targets.length) return;
		const observer = new IntersectionObserver((records) => {
			const visible = records.filter((r) => r.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
			if (visible?.target.id) setActive(visible.target.id);
		}, {
			rootMargin: "-96px 0px -70% 0px",
			threshold: 0
		});
		targets.forEach((t) => observer.observe(t));
		return () => observer.disconnect();
	}, [entries]);
	if (entries.length < 3) return null;
	let lastGroup;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
		"aria-label": "On this page",
		className: "text-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-[11px] font-medium uppercase tracking-[0.16em] text-faint",
			children: "On this page"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-3 space-y-1 border-l border-border",
			children: entries.map((e) => {
				const showGroup = e.group && e.group !== lastGroup;
				lastGroup = e.group;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [showGroup ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 pl-3 text-[10px] font-medium uppercase tracking-[0.14em] text-faint first:mt-0",
					children: e.group
				}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: `#${e.id}`,
					className: cn("-ml-px block border-l py-1 pl-3 text-[13px] leading-5 transition-colors", active === e.id ? "border-accent text-fg" : "border-transparent text-muted hover:border-border-strong hover:text-fg"),
					children: e.label
				})] }, e.id);
			})
		})]
	});
}
//#endregion
export { tocFromSections as a, headingId as i, SectionBlock as n, Toc as r, ArchDiagram as t };
