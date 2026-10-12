import { buildClass1112ModuleResponse } from "../class-1112-module-access/class1112ModuleAccess.service.js";
import advancedCodingModule from "./advancedCoding.model.js";

export async function getAdvancedCodingService({ user, query }) {
  return buildClass1112ModuleResponse({
    user,
    query,
    mode: query?.mode,
    moduleDefinition: advancedCodingModule,
  });
}
