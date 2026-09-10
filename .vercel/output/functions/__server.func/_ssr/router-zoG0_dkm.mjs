import { i as __toESM } from "../_runtime.mjs";
import { n as getExample, t as examples } from "./examples-D1W0JN4B.mjs";
import { n as hldConcepts, t as getHld } from "./hld-B7VMEoA2.mjs";
import { n as lldConcepts, t as getLld } from "./lld-IFDGZbz7.mjs";
import { n as playgrounds, t as getPlayground } from "./playgrounds-BbpE6ZvK.mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { R as notFound, _ as createRootRoute, d as useRouterState, g as createFileRoute, h as lazyRouteComponent, l as Scripts, m as Outlet, p as createRouter, u as HeadContent, v as Link, y as useRouter, z as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { i as Menu, n as TriangleAlert, r as Search, t as X } from "../_libs/lucide-react.mjs";
import { a as union, i as string, n as number, r as object, t as literal } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/button-DlYjJmry.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var catalog = [
	...hldConcepts.map((c) => ({
		path: `/hld/${c.slug}`,
		title: c.title,
		subtitle: c.subtitle,
		kind: "HLD",
		tags: c.tags
	})),
	...lldConcepts.map((c) => ({
		path: `/lld/${c.slug}`,
		title: c.title,
		subtitle: c.subtitle,
		kind: "LLD",
		tags: c.tags
	})),
	...examples.map((c) => ({
		path: `/examples/${c.slug}`,
		title: c.title,
		subtitle: c.summary,
		kind: c.source,
		tags: c.tags
	})),
	...playgrounds.map((c) => ({
		path: `/playgrounds/${c.slug}`,
		title: c.title,
		subtitle: c.subtitle,
		kind: "Lab",
		tags: c.tags
	})),
	{
		path: "/resources",
		title: "Awesome system design resources",
		subtitle: "Source 6 — interview problems, papers, and channels from ashishps1's list",
		kind: "Sources",
		tags: [
			"awesome",
			"papers",
			"github",
			"algomaster"
		]
	}
];
function lookupPath(path) {
	return catalog.find((c) => c.path === path);
}
function searchCatalog(q, limit = 12) {
	const s = q.trim().toLowerCase();
	if (!s) return catalog.slice(0, limit);
	return catalog.map((item) => {
		const hay = `${item.title} ${item.subtitle} ${item.kind} ${item.tags.join(" ")}`.toLowerCase();
		let score = 0;
		if (item.title.toLowerCase().includes(s)) score += 5;
		if (hay.includes(s)) score += 2;
		for (const word of s.split(/\s+/)) if (hay.includes(word)) score += 1;
		return {
			item,
			score
		};
	}).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, limit).map((x) => x.item);
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0", {
	variants: {
		variant: {
			primary: "bg-fg text-accent-fg hover:bg-accent active:scale-[0.98]",
			secondary: "bg-raised text-fg border border-border hover:border-border-strong hover:bg-surface",
			ghost: "text-muted hover:text-fg hover:bg-raised",
			outline: "border border-border text-fg hover:border-accent hover:text-accent",
			danger: "bg-bad/15 text-bad hover:bg-bad/25"
		},
		size: {
			sm: "h-8 rounded-md px-3 text-xs",
			md: "h-10 rounded-md px-4 text-sm",
			lg: "h-12 rounded-lg px-5 text-sm",
			icon: "size-10 rounded-md",
			"icon-sm": "size-8 rounded-md"
		}
	},
	defaultVariants: {
		variant: "primary",
		size: "md"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		ref,
		...props
	});
});
Button.displayName = "Button";
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/router-zoG0_dkm.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";
function errorMessage(error) {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return FALLBACK_MESSAGE;
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: errorMessage(error)
			})
		]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var CONNECTOR_TOKEN_READY_EVENT = "grok:connector-token-ready";
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
var ConnectorTokenReadySchema = EnvelopeSchema.extend({ type: literal("connector-token-ready") });
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Origin of the Grok embedder framing this page, or null when the page runs
* top-level (download/export, local `npm run dev`, deployed sites) or under a
* non-Grok parent. Client-only; null during SSR.
*/
function resolveCurrentEmbedderOrigin() {
	if (typeof window === "undefined") return null;
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	return resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	const parentOrigin = resolveCurrentEmbedderOrigin();
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onHello = (data) => {
		if (!HelloSchema.safeParse(data).success) return;
		announce();
	};
	const onNavigate = (data) => {
		const parsed = NavigateSchema.safeParse(data);
		if (!parsed.success) return;
		navigate(parsed.data.path);
		queueMicrotask(reportLocation);
	};
	const onHistory = (data) => {
		const parsed = HistorySchema.safeParse(data);
		if (!parsed.success) return;
		if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
		window.history.go(parsed.data.delta);
	};
	const onConnectorTokenReady = (data) => {
		if (!ConnectorTokenReadySchema.safeParse(data).success) return;
		window.dispatchEvent(new Event(CONNECTOR_TOKEN_READY_EVENT));
	};
	const hostMessageHandlers = /* @__PURE__ */ new Map([
		["hello", onHello],
		["navigate", onNavigate],
		["history", onHistory],
		["connector-token-ready", onConnectorTokenReady]
	]);
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		hostMessageHandlers.get(envelope.data.type)?.(event.data);
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
function LogoMark({ className = "size-7" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 32 32",
		className,
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "1",
				y: "1",
				width: "30",
				height: "30",
				rx: "7",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.4"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "10",
				cy: "10",
				r: "2.1",
				fill: "currentColor"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "22",
				cy: "10",
				r: "2.1",
				fill: "currentColor"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "16",
				cy: "22",
				r: "2.1",
				fill: "currentColor"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M10 10h12M10 10l6 12M22 10l-6 12",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.4",
				strokeLinecap: "round"
			})
		]
	});
}
function AppLink({ path, className, onClick, children }) {
	const m = path.match(/^\/(hld|lld|examples|playgrounds)\/([^/]+)$/);
	if (m) {
		const to = `/${m[1]}/$slug`;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to,
			params: { slug: m[2] },
			className,
			onClick,
			children
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to: path,
		className,
		onClick,
		children
	});
}
function CommandSearch({ onClose }) {
	const [q, setQ] = (0, import_react.useState)("");
	const [active, setActive] = (0, import_react.useState)(0);
	const input = (0, import_react.useRef)(null);
	const hits = (0, import_react.useMemo)(() => searchCatalog(q, 10), [q]);
	(0, import_react.useEffect)(() => {
		input.current?.focus();
	}, []);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if (e.key === "Escape") onClose();
			if (e.key === "ArrowDown") {
				e.preventDefault();
				setActive((i) => Math.min(i + 1, Math.max(hits.length - 1, 0)));
			}
			if (e.key === "ArrowUp") {
				e.preventDefault();
				setActive((i) => Math.max(i - 1, 0));
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [hits.length, onClose]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-50 flex items-start justify-center bg-bg/80 px-4 pt-[12vh] backdrop-blur-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "absolute inset-0 cursor-default",
			"aria-label": "Close search",
			onClick: onClose
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface shadow-panel",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 border-b border-border px-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "size-4 text-faint" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						ref: input,
						value: q,
						onChange: (e) => {
							setQ(e.target.value);
							setActive(0);
						},
						placeholder: "Search concepts, examples, labs",
						className: "h-12 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-faint"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onClose,
						className: "text-faint hover:text-fg",
						"aria-label": "Close",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "max-h-80 overflow-y-auto p-2",
				children: hits.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "px-3 py-6 text-center text-sm text-muted",
					children: "Nothing matches."
				}) : hits.map((hit, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppLink, {
					path: hit.path,
					onClick: onClose,
					className: `block rounded-md px-3 py-2 ${i === active ? "bg-raised" : "hover:bg-raised/60"}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-baseline justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm font-medium",
							children: hit.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[11px] uppercase tracking-wider text-accent",
							children: hit.kind
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-0.5 line-clamp-1 text-xs text-muted",
						children: hit.subtitle
					})]
				}) }, hit.path))
			})]
		})]
	});
}
var NAV = [
	{
		to: "/",
		label: "Studio",
		match: "exact"
	},
	{
		to: "/hld",
		label: "HLD Concepts",
		match: "prefix"
	},
	{
		to: "/lld",
		label: "LLD Concepts",
		match: "prefix"
	},
	{
		to: "/examples",
		label: "System Design Examples",
		match: "prefix"
	},
	{
		to: "/playgrounds",
		label: "Labs",
		match: "prefix"
	},
	{
		to: "/resources",
		label: "Sources",
		match: "prefix"
	}
];
var APP_NAME = "Lattice";
function isActive(pathname, to, match) {
	if (match === "exact") return pathname === to;
	return pathname === to || pathname.startsWith(`${to}/`);
}
function NavLinks({ pathname, onNavigate }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
		className: "flex flex-col gap-0.5",
		children: NAV.map((item) => {
			const active = isActive(pathname, item.to, item.match);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: item.to,
				onClick: onNavigate,
				className: cn("rounded-md px-3 py-2 text-sm transition-colors duration-150", active ? "bg-raised text-fg" : "text-muted hover:bg-raised/60 hover:text-fg"),
				children: item.label
			}, item.to);
		})
	});
}
function AppShell({ children }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const [open, setOpen] = (0, import_react.useState)(false);
	const [search, setSearch] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setOpen(false);
	}, [pathname]);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				setSearch((v) => !v);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-bg/90 px-4 backdrop-blur-sm lg:hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					className: "flex items-center gap-2 text-fg",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogoMark, { className: "size-6" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-display text-lg tracking-tight",
						children: APP_NAME
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon-sm",
						onClick: () => setSearch(true),
						"aria-label": "Search",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "size-4" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon-sm",
						onClick: () => setOpen((v) => !v),
						"aria-label": open ? "Close menu" : "Open menu",
						children: open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-4" })
					})]
				})]
			}),
			open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-20 bg-bg/95 px-4 pt-16 lg:hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavLinks, {
					pathname,
					onNavigate: () => setOpen(false)
				})
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "lg:grid lg:grid-cols-[240px_minmax(0,1fr)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "sticky top-0 hidden h-dvh border-r border-border lg:flex lg:flex-col",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/",
							className: "flex items-center gap-2.5 px-5 py-5 text-fg",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogoMark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-display text-xl leading-none tracking-tight",
								children: APP_NAME
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1 text-[11px] uppercase tracking-[0.16em] text-faint",
								children: "System design"
							})] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex-1 overflow-y-auto px-3 pb-6",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavLinks, { pathname })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "border-t border-border p-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setSearch(true),
								className: "flex h-10 w-full items-center justify-between rounded-md border border-border bg-raised px-3 text-xs text-muted hover:text-fg",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "size-3.5" }), "Search"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("kbd", {
									className: "font-mono text-[10px] text-faint",
									children: "⌘K"
								})]
							})
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "min-w-0",
					children
				})]
			}),
			search ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandSearch, { onClose: () => setSearch(false) }) : null
		]
	});
}
var styles_default = "/assets/styles-CDgLWf1E.css";
function NotFound() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "px-6 py-16",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-3xl",
			children: "Page not in the atlas"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 max-w-md text-muted",
			children: "That path is not a concept, example, or lab. Use search or the sidebar."
		})]
	});
}
var Route$10 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "theme-color",
				content: "#0b0c0e"
			},
			{
				name: "description",
				content: "Lattice — system design studio. HLD, LLD, Alex Xu examples, the awesome list, and interactive labs."
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap"
			}
		]
	}),
	component: RootComponent,
	errorComponent: AppErrorComponent,
	notFoundComponent: NotFound
});
function RootComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		className: "antialiased",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			className: "bg-bg text-fg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
			]
		})]
	});
}
var $$splitComponentImporter$9 = () => import("./routes-DdYLd3dS.mjs");
var Route$9 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$9, "component") });
var $$splitComponentImporter$8 = () => import("./resources-BHYL_w81.mjs");
var Route$8 = createFileRoute("/resources")({ component: lazyRouteComponent($$splitComponentImporter$8, "component") });
var $$splitComponentImporter$7 = () => import("./examples-Dm8auFTu.mjs");
var Route$7 = createFileRoute("/examples/")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
var $$splitComponentImporter$6 = () => import("../_slug-ifPKD3E3.mjs");
var Route$6 = createFileRoute("/examples/$slug")({
	loader: ({ params }) => {
		const example = getExample(params.slug);
		if (!example) throw notFound();
		return { example };
	},
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./hld-Y4lFl0LA.mjs");
var Route$5 = createFileRoute("/hld/")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
var $$splitComponentImporter$4 = () => import("../_slug-BjE0p2pg.mjs");
var Route$4 = createFileRoute("/hld/$slug")({
	loader: ({ params }) => {
		const concept = getHld(params.slug);
		if (!concept) throw notFound();
		return { concept };
	},
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./lld-BBuK2U6f.mjs");
var Route$3 = createFileRoute("/lld/")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("../_slug-BU_PWvf_.mjs");
var Route$2 = createFileRoute("/lld/$slug")({
	loader: ({ params }) => {
		const concept = getLld(params.slug);
		if (!concept) throw notFound();
		return { concept };
	},
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./playgrounds-CMTf2nwK.mjs");
var Route$1 = createFileRoute("/playgrounds/")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
function CapLab() {
	const [mode, setMode] = (0, import_react.useState)("CP");
	const [partition, setPartition] = (0, import_react.useState)(false);
	const [valueA, setValueA] = (0, import_react.useState)("0");
	const [valueB, setValueB] = (0, import_react.useState)("0");
	const [last, setLast] = (0, import_react.useState)("Write on A: 0");
	const writeA = () => {
		const next = String(Number(valueA) + 1);
		if (partition && mode === "CP") {
			setLast("CP + partition: A refuses the write to stay consistent with B.");
			return;
		}
		setValueA(next);
		if (!partition) setValueB(next);
		setLast(partition ? `AP: A accepted ${next}. B still ${valueB}.` : `Both nodes now ${next}.`);
	};
	const heal = () => {
		setPartition(false);
		if (mode === "AP") {
			const merged = String(Math.max(Number(valueA), Number(valueB)));
			setValueA(merged);
			setValueB(merged);
			setLast(`Partition healed. Last-write-wins merge → ${merged}.`);
		} else setLast("Partition healed. CP nodes resume taking writes.");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-prose text-sm leading-6 text-muted",
				children: "Two replicas, one network. During a partition CP refuses to lie; AP keeps serving and repairs later. Toggle the mode, split the network, then write."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: mode === "CP" ? "primary" : "secondary",
						onClick: () => setMode("CP"),
						children: "CP"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: mode === "AP" ? "primary" : "secondary",
						onClick: () => setMode("AP"),
						children: "AP"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: partition ? "danger" : "outline",
						onClick: () => partition ? heal() : setPartition(true),
						children: partition ? "Heal partition" : "Split network"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: writeA,
						children: "Write on A"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NodeCard, {
					name: "Node A",
					value: valueA,
					isolated: partition
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NodeCard, {
					name: "Node B",
					value: valueB,
					isolated: partition
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-md border border-border bg-raised px-3 py-2 text-sm text-muted",
				children: last
			})
		]
	});
}
function NodeCard({ name, value, isolated }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `rounded-lg border p-4 ${isolated ? "border-bad/50 bg-bad/5" : "border-border bg-surface"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[11px] uppercase tracking-[0.14em] text-faint",
				children: name
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 font-mono text-4xl tabular-nums",
				children: value
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 text-xs text-muted",
				children: isolated ? "Unreachable from peer" : "Replicating"
			})
		]
	});
}
function hash(s) {
	let h = 2166136261;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return (h >>> 0) % 360;
}
var KEYS$1 = [
	"user:42",
	"user:7",
	"post:9",
	"sess:aa",
	"cart:1",
	"img:88",
	"feed:3",
	"msg:12"
];
function HashRingLab() {
	const [nodes, setNodes] = (0, import_react.useState)(() => [
		{
			id: "A",
			vnodes: [
				hash("A:0"),
				hash("A:1"),
				hash("A:2")
			]
		},
		{
			id: "B",
			vnodes: [
				hash("B:0"),
				hash("B:1"),
				hash("B:2")
			]
		},
		{
			id: "C",
			vnodes: [
				hash("C:0"),
				hash("C:1"),
				hash("C:2")
			]
		}
	]);
	const [next, setNext] = (0, import_react.useState)("D");
	const ownerOf = (deg) => {
		const pts = nodes.flatMap((n) => n.vnodes.map((d) => ({
			d,
			id: n.id
		}))).sort((a, b) => a.d - b.d);
		if (!pts.length) return "?";
		return (pts.find((p) => p.d >= deg) ?? pts[0]).id;
	};
	const assignments = (0, import_react.useMemo)(() => KEYS$1.map((k) => ({
		key: k,
		deg: hash(k),
		owner: ownerOf(hash(k))
	})), [nodes]);
	const add = () => {
		const id = next;
		setNodes((n) => [...n, {
			id,
			vnodes: [
				hash(`${id}:0`),
				hash(`${id}:1`),
				hash(`${id}:2`)
			]
		}]);
		setNext(String.fromCharCode(id.charCodeAt(0) + 1));
	};
	const remove = (id) => {
		setNodes((n) => n.length <= 1 ? n : n.filter((x) => x.id !== id));
	};
	const colors = {
		A: "#9eb4c8",
		B: "#7d9b84",
		C: "#c4a574",
		D: "#c4847d",
		E: "#8b8d93",
		F: "#e8e6e1"
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "max-w-prose text-sm leading-6 text-muted",
			children: "Keys and virtual nodes sit on a 360° ring. A key belongs to the next vnode clockwise. Add a server and only the keys on its new arcs should move."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center gap-6 lg:flex-row lg:items-start",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
				viewBox: "0 0 260 260",
				className: "w-full max-w-sm text-fg",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "130",
						cy: "130",
						r: "96",
						fill: "none",
						stroke: "currentColor",
						strokeOpacity: "0.2",
						strokeWidth: "2"
					}),
					assignments.map((a) => {
						const r = 78;
						const x = 130 + r * Math.cos((a.deg - 90) * Math.PI / 180);
						const y = 130 + r * Math.sin((a.deg - 90) * Math.PI / 180);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
							cx: x,
							cy: y,
							r: "4",
							fill: colors[a.owner] ?? "#9eb4c8"
						}, a.key);
					}),
					nodes.flatMap((n) => n.vnodes.map((d, i) => {
						const r = 96;
						const x = 130 + r * Math.cos((d - 90) * Math.PI / 180);
						const y = 130 + r * Math.sin((d - 90) * Math.PI / 180);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
							cx: x,
							cy: y,
							r: "7",
							fill: colors[n.id] ?? "#9eb4c8"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
							x,
							y: y + 3,
							textAnchor: "middle",
							fontSize: "8",
							fill: "#0b0c0e",
							children: n.id
						})] }, `${n.id}-${i}`);
					}))
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "w-full flex-1 space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						onClick: add,
						disabled: nodes.length >= 6,
						children: ["Add node ", next]
					}), nodes.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "secondary",
						onClick: () => remove(n.id),
						children: ["Remove ", n.id]
					}, n.id))]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-hidden rounded-lg border border-border",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-left text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "bg-raised text-xs uppercase tracking-wider text-faint",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2",
									children: "Key"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2",
									children: "Angle"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2",
									children: "Owner"
								})
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: assignments.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-t border-border",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 font-mono text-xs",
									children: a.key
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "px-3 py-2 font-mono text-xs text-muted",
									children: [a.deg, "°"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 font-medium",
									style: { color: colors[a.owner] },
									children: a.owner
								})
							]
						}, a.key)) })]
					})
				})]
			})]
		})]
	});
}
var START = [
	{
		id: "s1",
		inflight: 0,
		hits: 0
	},
	{
		id: "s2",
		inflight: 0,
		hits: 0
	},
	{
		id: "s3",
		inflight: 0,
		hits: 0
	}
];
function LoadBalancerLab() {
	const [algo, setAlgo] = (0, import_react.useState)("rr");
	const [servers, setServers] = (0, import_react.useState)(START);
	const [rr, setRr] = (0, import_react.useState)(0);
	const [key, setKey] = (0, import_react.useState)("user:42");
	const [last, setLast] = (0, import_react.useState)(null);
	const pick = (list) => {
		if (algo === "rr") {
			const i = rr % list.length;
			setRr(i + 1);
			return list[i].id;
		}
		if (algo === "lc") return [...list].sort((a, b) => a.inflight - b.inflight || a.id.localeCompare(b.id))[0].id;
		let h = 0;
		for (const ch of key) h = (h + ch.charCodeAt(0) * 17) % list.length;
		return list[h].id;
	};
	const send = () => {
		const id = pick(servers);
		setLast(id);
		setServers((ss) => ss.map((s) => s.id === id ? {
			...s,
			inflight: s.inflight + 1,
			hits: s.hits + 1
		} : s));
		window.setTimeout(() => {
			setServers((ss) => ss.map((s) => s.id === id ? {
				...s,
				inflight: Math.max(0, s.inflight - 1)
			} : s));
		}, 900);
	};
	const reset = () => {
		setServers(START);
		setRr(0);
		setLast(null);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-prose text-sm leading-6 text-muted",
				children: "Three backends, one balancer. Round robin shares equally. Least-connections chases load. Hash sticks a key to a box — until the fleet size changes."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-2",
				children: [
					["rr", "Round robin"],
					["lc", "Least connections"],
					["hash", "Hash"]
				].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: algo === id ? "primary" : "secondary",
					onClick: () => setAlgo(id),
					children: label
				}, id))
			}),
			algo === "hash" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block text-xs text-muted",
				children: ["Routing key", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: key,
					onChange: (e) => setKey(e.target.value),
					className: "mt-1 h-10 w-full max-w-sm rounded-md border border-border bg-raised px-3 font-mono text-sm text-fg"
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: send,
					children: "Send request"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					onClick: reset,
					children: "Reset"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-3 sm:grid-cols-3",
				children: servers.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `rounded-lg border p-4 ${last === s.id ? "border-accent bg-accent/10" : "border-border bg-surface"}`,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-mono text-sm",
							children: s.id
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2 text-[11px] uppercase tracking-[0.14em] text-faint",
							children: "In flight"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-mono text-2xl tabular-nums",
							children: s.inflight
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 text-xs text-muted",
							children: [s.hits, " total hits"]
						})
					]
				}, s.id))
			})
		]
	});
}
var KEYS = [
	"a",
	"b",
	"c",
	"d",
	"e",
	"f"
];
function LruLab() {
	const [cap, setCap] = (0, import_react.useState)(4);
	const [list, setList] = (0, import_react.useState)([
		{
			key: "a",
			value: "1"
		},
		{
			key: "b",
			value: "2"
		},
		{
			key: "c",
			value: "3"
		}
	]);
	const [msg, setMsg] = (0, import_react.useState)("Head is hottest. Tail is the eviction victim.");
	const get = (key) => {
		const i = list.findIndex((n) => n.key === key);
		if (i < 0) {
			setMsg(`get(${key}) miss`);
			return;
		}
		const node = list[i];
		setList([node, ...list.filter((_, j) => j !== i)]);
		setMsg(`get(${key}) hit — moved to head`);
	};
	const put = (key) => {
		const value = String((Number(list.find((n) => n.key === key)?.value ?? "0") || 0) + 1);
		const rest = list.filter((n) => n.key !== key);
		let next = [{
			key,
			value
		}, ...rest];
		let note = `put(${key}=${value}) at head`;
		if (next.length > cap) {
			const evicted = next[next.length - 1];
			next = next.slice(0, cap);
			note += ` · evicted ${evicted.key}`;
		}
		setList(next);
		setMsg(note);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-prose text-sm leading-6 text-muted",
				children: "Map for O(1) lookup, doubly linked list for recency. This lab shows the list: left is MRU, right is LRU."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block max-w-xs text-xs text-muted",
				children: [
					"Capacity ",
					cap,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						min: 2,
						max: 6,
						value: cap,
						onChange: (e) => {
							const c = Number(e.target.value);
							setCap(c);
							setList((xs) => xs.slice(0, c));
						},
						className: "mt-2 w-full accent-accent"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap items-center gap-2",
				children: list.map((n, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `rounded-md border px-4 py-3 ${i === 0 ? "border-accent bg-accent/15" : "border-border bg-raised"}`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-mono text-lg",
								children: n.key
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-xs text-muted",
								children: ["val ", n.value]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[10px] uppercase tracking-wider text-faint",
								children: i === 0 ? "head / MRU" : i === list.length - 1 ? "tail / LRU" : " "
							})
						]
					}), i < list.length - 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-faint",
						children: "→"
					}) : null]
				}, n.key))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: msg
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[11px] uppercase tracking-[0.14em] text-faint",
				children: "Get"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 flex flex-wrap gap-2",
				children: KEYS.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					variant: "secondary",
					onClick: () => get(k),
					children: ["get ", k]
				}, k))
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[11px] uppercase tracking-[0.14em] text-faint",
				children: "Put"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 flex flex-wrap gap-2",
				children: KEYS.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					onClick: () => put(k),
					children: ["put ", k]
				}, k))
			})] })
		]
	});
}
function QuorumLab() {
	const [n, setN] = (0, import_react.useState)(3);
	const [w, setW] = (0, import_react.useState)(2);
	const [r, setR] = (0, import_react.useState)(2);
	const strong = r + w > n;
	const writeAvail = w <= n;
	const readAvail = r <= n;
	const replicas = (0, import_react.useMemo)(() => Array.from({ length: n }, (_, i) => `r${i + 1}`), [n]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-prose text-sm leading-6 text-muted",
				children: "N copies, write W of them, read R of them. If R + W exceeds N the sets must overlap, so a reader sees the latest write (ignoring sloppy quorums and concurrent writers)."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
						label: "N replicas",
						value: n,
						min: 1,
						max: 7,
						onChange: setN
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
						label: "W writes",
						value: w,
						min: 1,
						max: 7,
						onChange: setW
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
						label: "R reads",
						value: r,
						min: 1,
						max: 7,
						onChange: setR
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-2",
				children: replicas.map((id, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: `rounded-md border px-3 py-2 font-mono text-sm ${i < Math.max(w, r) ? "border-accent bg-accent/15" : "border-border bg-raised"}`,
					children: id
				}, id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 md:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, {
						ok: strong,
						yes: "Strong-enough reads (R+W exceeds N)",
						no: "R+W at most N — a read may miss the last write"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, {
						ok: writeAvail && w <= n,
						yes: `Writes need ${w} of ${n} up`,
						no: "W larger than N is impossible"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, {
						ok: readAvail,
						yes: `Reads need ${r} of ${n} up`,
						no: "R larger than N is impossible"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						onClick: () => {
							setN(3);
							setW(2);
							setR(2);
						},
						children: "Dynamo typical (3,2,2)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						onClick: () => {
							setN(3);
							setW(1);
							setR(1);
						},
						children: "Fast / weak (3,1,1)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						onClick: () => {
							setN(3);
							setW(3);
							setR(1);
						},
						children: "Fast reads (3,3,1)"
					})
				]
			})
		]
	});
}
function Knob({ label, value, min, max, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "text-xs text-muted",
		children: [
			label,
			" · ",
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-mono text-fg",
				children: value
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "range",
				min,
				max,
				value,
				onChange: (e) => onChange(Number(e.target.value)),
				className: "mt-2 w-full accent-accent"
			})
		]
	});
}
function Flag({ ok, yes, no }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: `rounded-lg border px-3 py-3 text-sm ${ok ? "border-ok/40 bg-ok/10 text-ok" : "border-bad/40 bg-bad/10 text-bad"}`,
		children: ok ? yes : no
	});
}
var ALGOS = [
	{
		id: "token",
		name: "Token bucket",
		blurb: "Burst up to capacity. Tokens refill at a steady rate. Empty bucket = drop."
	},
	{
		id: "leaky",
		name: "Leaky bucket",
		blurb: "Requests add water. A constant leak drains it. Overflow = drop. Smooth output."
	},
	{
		id: "fixed",
		name: "Fixed window",
		blurb: "Count requests in the current second. Resets on the boundary — 2× spike possible."
	},
	{
		id: "slog",
		name: "Sliding log",
		blurb: "Keep timestamps. Allow if fewer than limit in the last window. Precise, heavier."
	},
	{
		id: "scounter",
		name: "Sliding counter",
		blurb: "Weight the previous window + current. O(1) memory, almost as fair as the log."
	}
];
function clamp(n, a, b) {
	return Math.max(a, Math.min(b, n));
}
function RateLimiterLab() {
	const [algo, setAlgo] = (0, import_react.useState)("token");
	const [capacity, setCapacity] = (0, import_react.useState)(5);
	const [rate, setRate] = (0, import_react.useState)(2);
	const [auto, setAuto] = (0, import_react.useState)(false);
	const [autoRps, setAutoRps] = (0, import_react.useState)(4);
	const [accepted, setAccepted] = (0, import_react.useState)(0);
	const [dropped, setDropped] = (0, import_react.useState)(0);
	const [log, setLog] = (0, import_react.useState)([]);
	const [fill, setFill] = (0, import_react.useState)(5);
	const [nowMs, setNowMs] = (0, import_react.useState)(0);
	const state = (0, import_react.useRef)({
		tokens: 5,
		last: performance.now(),
		water: 0,
		windowStart: performance.now(),
		windowCount: 0,
		prevCount: 0,
		stamps: []
	});
	const reset = (cap = capacity) => {
		const t = performance.now();
		state.current = {
			tokens: cap,
			last: t,
			water: 0,
			windowStart: t,
			windowCount: 0,
			prevCount: 0,
			stamps: []
		};
		setFill(algo === "leaky" ? 0 : cap);
		setAccepted(0);
		setDropped(0);
		setLog([]);
		setNowMs(t);
	};
	(0, import_react.useEffect)(() => {
		reset(capacity);
	}, [
		algo,
		capacity,
		rate
	]);
	const windowMs = 1e3;
	const decide = (at) => {
		const s = state.current;
		const refill = rate;
		if (algo === "token") {
			const elapsed = (at - s.last) / 1e3;
			s.tokens = clamp(s.tokens + elapsed * refill, 0, capacity);
			s.last = at;
			if (s.tokens >= 1) {
				s.tokens -= 1;
				setFill(s.tokens);
				return true;
			}
			setFill(s.tokens);
			return false;
		}
		if (algo === "leaky") {
			const elapsed = (at - s.last) / 1e3;
			s.water = Math.max(0, s.water - elapsed * refill);
			s.last = at;
			if (s.water + 1 <= capacity) {
				s.water += 1;
				setFill(s.water);
				return true;
			}
			setFill(s.water);
			return false;
		}
		if (algo === "fixed") {
			if (at - s.windowStart >= windowMs) {
				s.windowStart = at;
				s.windowCount = 0;
			}
			if (s.windowCount < capacity) {
				s.windowCount += 1;
				setFill(s.windowCount);
				return true;
			}
			setFill(s.windowCount);
			return false;
		}
		if (algo === "slog") {
			const cut = at - windowMs;
			s.stamps = s.stamps.filter((x) => x > cut);
			if (s.stamps.length < capacity) {
				s.stamps.push(at);
				setFill(s.stamps.length);
				return true;
			}
			setFill(s.stamps.length);
			return false;
		}
		if (at - s.windowStart >= windowMs) {
			s.prevCount = s.windowCount;
			s.windowCount = 0;
			s.windowStart = at;
		}
		const weight = 1 - (at - s.windowStart) / windowMs;
		const approx = s.prevCount * weight + s.windowCount;
		if (approx < capacity) {
			s.windowCount += 1;
			setFill(approx + 1);
			return true;
		}
		setFill(approx);
		return false;
	};
	const fire = () => {
		const at = performance.now();
		setNowMs(at);
		const ok = decide(at);
		setAccepted((n) => n + (ok ? 1 : 0));
		setDropped((n) => n + (ok ? 0 : 1));
		setLog((L) => [{
			t: at,
			ok
		}, ...L].slice(0, 24));
	};
	(0, import_react.useEffect)(() => {
		if (!auto) return;
		const id = window.setInterval(fire, Math.max(40, 1e3 / autoRps));
		return () => window.clearInterval(id);
	}, [
		auto,
		autoRps,
		algo,
		capacity,
		rate
	]);
	(0, import_react.useEffect)(() => {
		const id = window.setInterval(() => {
			const at = performance.now();
			const s = state.current;
			if (algo === "token") {
				const elapsed = (at - s.last) / 1e3;
				s.tokens = clamp(s.tokens + elapsed * rate, 0, capacity);
				s.last = at;
				setFill(s.tokens);
			} else if (algo === "leaky") {
				const elapsed = (at - s.last) / 1e3;
				s.water = Math.max(0, s.water - elapsed * rate);
				s.last = at;
				setFill(s.water);
			}
			setNowMs(at);
		}, 80);
		return () => window.clearInterval(id);
	}, [
		algo,
		rate,
		capacity
	]);
	const pct = (0, import_react.useMemo)(() => {
		return clamp((algo === "leaky" || algo === "fixed" || algo === "slog" || algo === "scounter" ? fill : fill) / (capacity || 1) * 100, 0, 100);
	}, [
		fill,
		capacity,
		algo
	]);
	const current = ALGOS.find((a) => a.id === algo);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-2",
				children: ALGOS.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setAlgo(a.id),
					className: `rounded-md border px-3 py-2 text-sm ${algo === a.id ? "border-accent bg-accent/15 text-fg" : "border-border text-muted hover:text-fg"}`,
					children: a.name
				}, a.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-prose text-sm leading-6 text-muted",
				children: current.blurb
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-lg border border-border bg-inset p-5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col items-center gap-6 sm:flex-row sm:items-end sm:justify-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col items-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[11px] uppercase tracking-[0.14em] text-faint",
									children: algo === "token" ? "Tokens" : algo === "leaky" ? "Water" : "In window"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative mt-3 h-48 w-28 overflow-hidden rounded-b-md rounded-t-sm border-2 border-border-strong bg-raised",
									"aria-hidden": true,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: `absolute inset-x-0 bottom-0 transition-[height] duration-150 ${pct > 92 ? "bg-bad/70" : "bg-accent/50"}`,
										style: { height: `${pct}%` }
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "absolute inset-0 flex items-center justify-center font-mono text-2xl tabular-nums",
										children: fill.toFixed(1)
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2 font-mono text-xs text-muted",
									children: ["max ", capacity]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "w-full min-w-0 flex-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[11px] uppercase tracking-[0.14em] text-faint",
									children: "Last requests"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-3 flex min-h-6 flex-wrap gap-1",
									children: log.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm text-muted",
										children: "Fire a request to fill the tape."
									}) : log.map((d, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `size-3 rounded-sm ${d.ok ? "bg-ok" : "bg-bad"}`,
										title: d.ok ? "accepted" : "dropped"
									}, d.t + i))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-6 grid grid-cols-2 gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
										label: "Accepted",
										value: accepted,
										tone: "ok"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
										label: "Dropped",
										value: dropped,
										tone: "bad"
									})]
								})
							]
						})]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4 rounded-lg border border-border bg-surface p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block text-xs text-muted",
							children: [
								"Capacity / limit",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "range",
									min: 1,
									max: 12,
									value: capacity,
									onChange: (e) => setCapacity(Number(e.target.value)),
									className: "mt-2 w-full accent-accent"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-fg",
									children: capacity
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block text-xs text-muted",
							children: [
								algo === "fixed" || algo === "slog" || algo === "scounter" ? "Window is 1s. Limit above." : "Refill / leak per second",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "range",
									min: .5,
									max: 8,
									step: .5,
									value: rate,
									onChange: (e) => setRate(Number(e.target.value)),
									className: "mt-2 w-full accent-accent"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-mono text-fg",
									children: [rate, "/s"]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block text-xs text-muted",
							children: [
								"Auto fire (req/s)",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "range",
									min: 1,
									max: 12,
									value: autoRps,
									onChange: (e) => setAutoRps(Number(e.target.value)),
									className: "mt-2 w-full accent-accent"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-mono text-fg",
									children: [autoRps, "/s"]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-2 pt-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									onClick: fire,
									children: "Fire request"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "secondary",
									onClick: () => setAuto((v) => !v),
									children: auto ? "Stop auto" : "Auto fire"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									onClick: () => reset(),
									children: "Reset"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-[11px] text-faint",
							children: [
								"Sim clock ",
								nowMs.toFixed(0),
								" ms. Try a burst, then idle, then a burst again."
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto rounded-lg border border-border",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[560px] text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "bg-raised text-xs uppercase tracking-wider text-faint",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2",
								children: "Algorithm"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2",
								children: "Burst"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2",
								children: "Smoothness"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2",
								children: "Memory"
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
						className: "text-muted",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-t border-border",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2 text-fg",
										children: "Token bucket"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2",
										children: "Yes, up to capacity"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2",
										children: "Sustained rate after burst"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2",
										children: "O(1) / key"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-t border-border",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2 text-fg",
										children: "Leaky bucket"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2",
										children: "No (queued / dropped)"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2",
										children: "Constant drain"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2",
										children: "O(1)"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-t border-border",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2 text-fg",
										children: "Fixed window"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2",
										children: "2× at boundary"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2",
										children: "Choppy"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2",
										children: "O(1)"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-t border-border",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2 text-fg",
										children: "Sliding log"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2",
										children: "Accurate"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2",
										children: "Accurate"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2",
										children: "O(requests)"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-t border-border",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2 text-fg",
										children: "Sliding counter"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2",
										children: "Mostly accurate"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2",
										children: "Good"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2",
										children: "O(1)"
									})
								]
							})
						]
					})]
				})
			})
		]
	});
}
function Stat({ label, value, tone }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-md border border-border bg-raised px-3 py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-[11px] uppercase tracking-[0.14em] text-faint",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: `mt-1 font-mono text-2xl tabular-nums ${tone === "ok" ? "text-ok" : "text-bad"}`,
			children: value
		})]
	});
}
var EPOCH = 1288834974657;
var SEQ_MASK = 4095;
function SnowflakeLab() {
	const [dc, setDc] = (0, import_react.useState)(3);
	const [worker, setWorker] = (0, import_react.useState)(7);
	const [seq, setSeq] = (0, import_react.useState)(0);
	const [lastTs, setLastTs] = (0, import_react.useState)(-1);
	const [ids, setIds] = (0, import_react.useState)([]);
	const [decode, setDecode] = (0, import_react.useState)("");
	const mint = () => {
		let ts = Date.now();
		let s = seq;
		if (ts === lastTs) {
			s = s + 1 & SEQ_MASK;
			if (s === 0) while (ts <= lastTs) ts = Date.now();
		} else s = 0;
		setLastTs(ts);
		setSeq(s);
		const id = BigInt(ts - EPOCH) << 22n | BigInt(dc & 31) << 17n | BigInt(worker & 31) << 12n | BigInt(s);
		setIds((xs) => [id, ...xs].slice(0, 8));
	};
	const parsed = (0, import_react.useMemo)(() => {
		try {
			const id = BigInt(decode.trim());
			const sequence = Number(id & 4095n);
			const w = Number(id >> 12n & 31n);
			const d = Number(id >> 17n & 31n);
			const ts = Number(id >> 22n) + EPOCH;
			return {
				ok: true,
				sequence,
				w,
				d,
				ts,
				iso: new Date(ts).toISOString()
			};
		} catch {
			return null;
		}
	}, [decode]);
	const latest = ids[0];
	const bits = latest !== void 0 ? latest.toString(2).padStart(64, "0") : "0".repeat(64);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-prose text-sm leading-6 text-muted",
				children: "1 sign + 41 timestamp + 5 datacenter + 5 worker + 12 sequence. Custom epoch 2010-11-04. Fits in a signed 64-bit integer and sorts roughly by time."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-w-0 overflow-x-auto rounded-md border border-border font-mono text-[10px] sm:text-xs",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BitField, {
						label: "0",
						bits: bits.slice(0, 1),
						flex: 1
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BitField, {
						label: "timestamp",
						bits: bits.slice(1, 42),
						flex: 8
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BitField, {
						label: "dc",
						bits: bits.slice(42, 47),
						flex: 2
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BitField, {
						label: "worker",
						bits: bits.slice(47, 52),
						flex: 2
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BitField, {
						label: "seq",
						bits: bits.slice(52),
						flex: 3
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "text-xs text-muted",
						children: ["Datacenter (0–31)", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "number",
							min: 0,
							max: 31,
							value: dc,
							onChange: (e) => setDc(Number(e.target.value)),
							className: "mt-1 h-10 w-full rounded-md border border-border bg-raised px-3 font-mono text-sm text-fg"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "text-xs text-muted",
						children: ["Worker (0–31)", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "number",
							min: 0,
							max: 31,
							value: worker,
							onChange: (e) => setWorker(Number(e.target.value)),
							className: "mt-1 h-10 w-full rounded-md border border-border bg-raised px-3 font-mono text-sm text-fg"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-end",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "w-full",
							onClick: mint,
							children: "Mint ID"
						})
					})
				]
			}),
			ids.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-1 font-mono text-sm",
				children: ids.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "rounded-md border border-border bg-inset px-3 py-2",
					children: id.toString()
				}, id.toString()))
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block text-xs text-muted",
				children: ["Decode an ID", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: decode,
					onChange: (e) => setDecode(e.target.value),
					placeholder: "Paste a 64-bit snowflake",
					className: "mt-1 h-10 w-full rounded-md border border-border bg-raised px-3 font-mono text-sm text-fg placeholder:text-faint"
				})]
			}),
			parsed?.ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-2 text-sm sm:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "UTC",
						v: parsed.iso
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "Datacenter",
						v: String(parsed.d)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "Worker",
						v: String(parsed.w)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "Sequence",
						v: String(parsed.sequence)
					})
				]
			}) : null
		]
	});
}
function BitField({ label, bits, flex }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "border-r border-border px-1 py-2 last:border-r-0",
		style: { flex },
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-center text-[10px] uppercase tracking-wider text-accent",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-1 break-all text-center text-muted",
			children: bits
		})]
	});
}
function Row({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex justify-between gap-3 rounded-md border border-border bg-raised px-3 py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-muted",
			children: k
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-mono text-xs",
			children: v
		})]
	});
}
var ALPH = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function to62(n) {
	if (n === 0) return "0";
	let x = n;
	let out = "";
	while (x > 0) {
		out = ALPH[x % 62] + out;
		x = Math.floor(x / 62);
	}
	return out;
}
function from62(s) {
	let n = 0;
	for (const ch of s) {
		const i = ALPH.indexOf(ch);
		if (i < 0) return null;
		n = n * 62 + i;
	}
	return n;
}
function UrlShortenerLab() {
	const [counter, setCounter] = (0, import_react.useState)(1e9);
	const [custom, setCustom] = (0, import_react.useState)("");
	const code = (0, import_react.useMemo)(() => to62(counter).padStart(7, "0"), [counter]);
	const decoded = from62(custom);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-prose text-sm leading-6 text-muted",
				children: "A global counter (or Snowflake) converted to base62 is collision-free and compact. 62^7 ≈ 3.5 trillion codes — enough for 100 million new URLs a day for decades."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-lg border border-border bg-inset p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[11px] uppercase tracking-[0.14em] text-faint",
						children: "Counter"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1 font-mono text-2xl tabular-nums",
						children: counter.toLocaleString()
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 text-[11px] uppercase tracking-[0.14em] text-faint",
						children: "Base62 code"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1 font-mono text-3xl tracking-wide text-accent",
						children: code
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 text-sm text-muted",
						children: ["https://ltc.es/", code]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: () => setCounter((c) => c + 1),
							children: "Next ID"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: () => setCounter((c) => c + 1e3),
							children: "Skip 1k"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block text-xs text-muted",
				children: ["Decode a code", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: custom,
					onChange: (e) => setCustom(e.target.value.trim()),
					placeholder: "3j6U8n",
					className: "mt-1 h-10 w-full rounded-md border border-border bg-raised px-3 font-mono text-sm text-fg placeholder:text-faint"
				})]
			}),
			custom ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-sm",
				children: decoded === null ? "Invalid character (use 0-9 a-z A-Z)" : `counter = ${decoded.toLocaleString()}`
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto rounded-lg border border-border text-sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[480px] text-left",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "bg-raised text-xs uppercase tracking-wider text-faint",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2",
								children: "Length"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2",
								children: "Space"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2",
								children: "At 100M / day"
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
						className: "text-muted",
						children: [
							5,
							6,
							7,
							8
						].map((len) => {
							const space = 62 ** len;
							const days = space / 1e8;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-t border-border",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2 font-medium text-fg",
										children: len
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2 font-mono text-xs",
										children: space.toExponential(2)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2",
										children: days < 365 ? `${days.toFixed(0)} days` : `${(days / 365).toFixed(0)} years`
									})
								]
							}, len);
						})
					})]
				})
			})
		]
	});
}
var PLAYGROUND_UI = {
	"rate-limiter": RateLimiterLab,
	"consistent-hashing": HashRingLab,
	snowflake: SnowflakeLab,
	"url-shortener": UrlShortenerLab,
	"cap-theorem": CapLab,
	"load-balancer": LoadBalancerLab,
	"lru-cache": LruLab,
	quorum: QuorumLab
};
var $$splitComponentImporter = () => import("../_slug-tCOTKcQg.mjs");
var Route = createFileRoute("/playgrounds/$slug")({
	loader: ({ params }) => {
		const meta = getPlayground(params.slug);
		const Ui = PLAYGROUND_UI[params.slug];
		if (!meta || !Ui) throw notFound();
		return { meta };
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var IndexRoute = Route$9.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$10
});
var ResourcesRoute = Route$8.update({
	id: "/resources",
	path: "/resources",
	getParentRoute: () => Route$10
});
var ExamplesIndexRoute = Route$7.update({
	id: "/examples/",
	path: "/examples/",
	getParentRoute: () => Route$10
});
var ExamplesSlugRoute = Route$6.update({
	id: "/examples/$slug",
	path: "/examples/$slug",
	getParentRoute: () => Route$10
});
var HldIndexRoute = Route$5.update({
	id: "/hld/",
	path: "/hld/",
	getParentRoute: () => Route$10
});
var HldSlugRoute = Route$4.update({
	id: "/hld/$slug",
	path: "/hld/$slug",
	getParentRoute: () => Route$10
});
var LldIndexRoute = Route$3.update({
	id: "/lld/",
	path: "/lld/",
	getParentRoute: () => Route$10
});
var LldSlugRoute = Route$2.update({
	id: "/lld/$slug",
	path: "/lld/$slug",
	getParentRoute: () => Route$10
});
var PlaygroundsIndexRoute = Route$1.update({
	id: "/playgrounds/",
	path: "/playgrounds/",
	getParentRoute: () => Route$10
});
var rootRouteChildren = {
	IndexRoute,
	ResourcesRoute,
	ExamplesSlugRoute,
	HldSlugRoute,
	LldSlugRoute,
	PlaygroundsSlugRoute: Route.update({
		id: "/playgrounds/$slug",
		path: "/playgrounds/$slug",
		getParentRoute: () => Route$10
	}),
	ExamplesIndexRoute,
	HldIndexRoute,
	LldIndexRoute,
	PlaygroundsIndexRoute
};
var routeTree = Route$10._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { Route$4 as a, Button as c, Route$2 as i, lookupPath as l, Route as n, Route$6 as o, PLAYGROUND_UI as r, AppLink as s, router_exports as t };
