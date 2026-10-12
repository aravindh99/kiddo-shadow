import { buildFoundationModuleResponse } from "../foundation-module-access/foundation-module-access.service.js";
import logicalThinkingModule from "./logical-thinking.model.js";

export async function getLogicalThinkingService({ user, query }) {
  return buildFoundationModuleResponse({
    user,
    query,
    mode: query?.mode,
    moduleDefinition: logicalThinkingModule,
  });
}
