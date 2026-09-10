import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/progress-DJvQt-f2.js
var useProgress = create()(persist((set, get) => ({
	done: {},
	mark: (id) => set((s) => ({ done: {
		...s.done,
		[id]: true
	} })),
	unmark: (id) => set((s) => {
		const next = { ...s.done };
		delete next[id];
		return { done: next };
	}),
	toggle: (id) => {
		if (get().done[id]) get().unmark(id);
		else get().mark(id);
	},
	isDone: (id) => Boolean(get().done[id])
}), { name: "lattice-progress" }));
//#endregion
export { useProgress as t };
