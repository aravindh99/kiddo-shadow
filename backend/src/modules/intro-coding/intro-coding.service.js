import { buildFoundationModuleResponse } from "../foundation-module-access/foundation-module-access.service.js";
import introCodingModule from "./intro-coding.model.js";

export async function getIntroCodingService({ user, query }) {
  return buildFoundationModuleResponse({
    user,
    query,
    mode: query?.mode,
    moduleDefinition: introCodingModule,
  });
}
