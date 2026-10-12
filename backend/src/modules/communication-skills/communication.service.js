import { buildClass89ModuleResponse } from "../class-89-module-access/class89ModuleAccess.service.js";
import communicationSkillsModule from "./communication.model.js";

export async function getCommunicationSkillsService({ user, query }) {
  return buildClass89ModuleResponse({
    user,
    query,
    mode: query?.mode,
    moduleDefinition: communicationSkillsModule,
  });
}
