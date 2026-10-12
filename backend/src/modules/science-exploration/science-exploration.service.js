import { buildFoundationModuleResponse } from "../foundation-module-access/foundation-module-access.service.js";
import scienceExplorationModule from "./science-exploration.model.js";

export async function getScienceExplorationService({ user, query }) {
  return buildFoundationModuleResponse({
    user,
    query,
    mode: query?.mode,
    moduleDefinition: scienceExplorationModule,
  });
}
