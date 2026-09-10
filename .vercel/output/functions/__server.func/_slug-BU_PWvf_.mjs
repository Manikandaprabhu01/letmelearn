import { z as require_jsx_runtime } from "./_libs/@tanstack/react-router+[...].mjs";
import { i as Route$2 } from "./_ssr/router-zoG0_dkm.mjs";
import { t as ConceptView } from "./_ssr/ConceptView-KTdk4pVV.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_slug-BU_PWvf_.js
var import_jsx_runtime = require_jsx_runtime();
function LldPage() {
	const { concept } = Route$2.useLoaderData();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConceptView, {
		concept,
		kicker: "LLD",
		id: `lld:${concept.slug}`
	});
}
//#endregion
export { LldPage as component };
