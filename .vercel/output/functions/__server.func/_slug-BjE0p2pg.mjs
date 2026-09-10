import { z as require_jsx_runtime } from "./_libs/@tanstack/react-router+[...].mjs";
import { a as Route$4 } from "./_ssr/router-zoG0_dkm.mjs";
import { t as ConceptView } from "./_ssr/ConceptView-KTdk4pVV.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_slug-BjE0p2pg.js
var import_jsx_runtime = require_jsx_runtime();
function HldPage() {
	const { concept } = Route$4.useLoaderData();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConceptView, {
		concept,
		kicker: "HLD",
		id: `hld:${concept.slug}`
	});
}
//#endregion
export { HldPage as component };
