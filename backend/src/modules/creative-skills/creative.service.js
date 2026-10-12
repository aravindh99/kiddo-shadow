import { buildClass89ModuleResponse } from "../class-89-module-access/class89ModuleAccess.service.js";
import creativeSkillsModule from "./creative.model.js";

export async function getCreativeSkillsService({ user, query }) {
  return buildClass89ModuleResponse({
    user,
    query,
    mode: query?.mode,
    moduleDefinition: creativeSkillsModule,
  });
}
