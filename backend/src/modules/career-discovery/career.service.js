import { buildClass89ModuleResponse } from "../class-89-module-access/class89ModuleAccess.service.js";
import careerDiscoveryModule from "./career.model.js";

export async function getCareerDiscoveryService({ user, query }) {
  return buildClass89ModuleResponse({
    user,
    query,
    mode: query?.mode,
    moduleDefinition: careerDiscoveryModule,
  });
}
