import { buildFoundationModuleResponse } from "../foundation-module-access/foundation-module-access.service.js";
import gkBuilderModule from "./gk-builder.model.js";

export async function getGkBuilderService({ user, query }) {
  return buildFoundationModuleResponse({
    user,
    query,
    mode: query?.mode,
    moduleDefinition: gkBuilderModule,
  });
}
