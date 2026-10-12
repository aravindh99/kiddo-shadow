import { buildClass89ModuleResponse } from "../class-89-module-access/class89ModuleAccess.service.js";
import codingAIModule from "./codingAI.model.js";

export async function getCodingAIService({ user, query }) {
  return buildClass89ModuleResponse({
    user,
    query,
    mode: query?.mode,
    moduleDefinition: codingAIModule,
  });
}
