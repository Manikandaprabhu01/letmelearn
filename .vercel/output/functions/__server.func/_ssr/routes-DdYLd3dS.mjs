import { t as examples } from "./examples-D1W0JN4B.mjs";
import { n as hldConcepts } from "./hld-B7VMEoA2.mjs";
import { n as lldConcepts } from "./lld-IFDGZbz7.mjs";
import { n as playgrounds } from "./playgrounds-BbpE6ZvK.mjs";
import { v as Link, z as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as ArrowRight } from "../_libs/lucide-react.mjs";
import { t as useProgress } from "./progress-DJvQt-f2.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DdYLd3dS.js
var import_jsx_runtime = require_jsx_runtime();
var STEPS = [
	{
		n: "01",
		title: "Scope",
		body: "Users, features, QPS, SLAs. Write the numbers down. Ask what is out of scope."
	},
	{
		n: "02",
		title: "Sketch",
		body: "Boxes, APIs, stores. Get buy-in before you deep-dive the matching engine."
	},
	{
		n: "03",
		title: "Deep dive",
		body: "The two hard parts: fan-out, the hash ring, the ledger, the 429 path."
	},
	{
		n: "04",
		title: "Wrap",
		body: "Bottlenecks, failure modes, what another hour would buy."
	}
];
function Home() {
	const done = useProgress((s) => Object.keys(s.done).length);
	const total = hldConcepts.length + lldConcepts.length + examples.length + playgrounds.length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "relative overflow-hidden border-b border-border px-5 py-12 sm:px-8 sm:py-16 lg:px-12",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "lattice-grid pointer-events-none absolute inset-0" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "relative text-[11px] font-medium uppercase tracking-[0.18em] text-accent",
					children: "System design studio"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "relative mt-4 max-w-2xl font-display text-4xl font-medium tracking-tight sm:text-5xl lg:text-6xl",
					children: "Learn the map, then run the labs."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "relative mt-5 max-w-xl text-[16px] leading-7 text-muted",
					children: "HLD concepts, LLD object models, and every worked example from Alex Xu's System Design Interview Volume 1 and Volume 2 — plus source 6, the public awesome-system-design-resources list, and interactive playgrounds in the spirit of the rate-limiter visualizer."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative mt-8 flex flex-wrap gap-6 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							n: hldConcepts.length,
							label: "HLD concepts"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							n: lldConcepts.length,
							label: "LLD concepts"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							n: examples.length,
							label: "Worked examples"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							n: playgrounds.length,
							label: "Labs"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							n: done,
							label: `Studied of ${total}`
						})
					]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "grid gap-px border-b border-border bg-border sm:grid-cols-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Door, {
					to: "/hld",
					kicker: "Menu",
					title: "HLD Concepts",
					body: "Load balancers, caches, CAP, sharding, queues, quorum — the vocabulary of large systems."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Door, {
					to: "/lld",
					kicker: "Menu",
					title: "LLD Concepts",
					body: "SOLID, strategy, LRU, parking lot, thread-safety. Class design that survives a whiteboard."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Door, {
					to: "/examples",
					kicker: "Menu",
					title: "System Design Examples",
					body: "Rate limiter through stock exchange, then Instagram, Uber, Docs, Zoom — Volume 1, Volume 2, and the awesome list."
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "border-b border-border px-5 py-10 sm:px-8 lg:px-12",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] font-medium uppercase tracking-[0.16em] text-accent",
					children: "Source 6"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-2 max-w-2xl font-display text-2xl font-medium tracking-tight",
					children: "The public awesome list, in the atlas"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-2xl text-sm leading-6 text-muted",
					children: "ashishps1/awesome-system-design-resources — Easy / Medium / Hard prompts, the Dynamo-to-Chubby paper stack, and the channels people actually watch. Unique designs (Instagram, Uber, Docs, Zoom, locks) are original Lattice notes. The rest map onto Volume 1, Volume 2, or a lab."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap gap-3 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/examples",
						className: "inline-flex items-center gap-1 rounded-md border border-border bg-surface px-3 py-2 hover:border-border-strong",
						children: ["Worked problems ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/resources",
						className: "inline-flex items-center gap-1 rounded-md border border-border bg-surface px-3 py-2 hover:border-border-strong",
						children: ["Full list + papers ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
					})]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "px-5 py-12 sm:px-8 lg:px-12",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl font-medium tracking-tight",
					children: "The four-step interview"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 max-w-xl text-sm text-muted",
					children: "Alex Xu Volume 1, chapter 3. Every example page in Lattice is written in this order so the muscle memory transfers."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
					children: STEPS.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "rounded-lg border border-border bg-surface p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-mono text-xs text-accent",
								children: s.n
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-2 font-medium",
								children: s.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm leading-6 text-muted",
								children: s.body
							})
						]
					}, s.n))
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "border-t border-border px-5 py-12 sm:px-8 lg:px-12",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl font-medium tracking-tight",
					children: "Labs"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 max-w-xl text-sm text-muted",
					children: "Fire a burst at a token bucket. Split a CAP cluster. Mint a Snowflake. Modeled on interactive LLD playgrounds such as the five-algorithm rate limiter."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/playgrounds",
					className: "hidden items-center gap-1 text-sm text-accent hover:underline sm:flex",
					children: ["All labs ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
				children: playgrounds.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/playgrounds/$slug",
					params: { slug: p.slug },
					className: "rounded-lg border border-border bg-surface p-4 hover:border-border-strong",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[11px] uppercase tracking-[0.14em] text-accent",
							children: p.tags.join(" · ")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2 font-medium",
							children: p.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: p.subtitle
						})
					]
				}, p.slug))
			})]
		})
	] });
}
function Stat({ n, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "font-mono text-2xl tabular-nums",
		children: n
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "text-xs text-muted",
		children: label
	})] });
}
function Door({ to, kicker, title, body }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		className: "block bg-bg p-6 hover:bg-surface sm:p-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[11px] uppercase tracking-[0.14em] text-accent",
				children: kicker
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-3 font-display text-2xl tracking-tight",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-sm text-sm leading-6 text-muted",
				children: body
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "mt-4 inline-flex items-center gap-1 text-sm text-fg",
				children: ["Open ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
			})
		]
	});
}
//#endregion
export { Home as component };
