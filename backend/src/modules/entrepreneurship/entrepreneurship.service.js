import { buildClass1112ModuleResponse } from "../class-1112-module-access/class1112ModuleAccess.service.js";
import entrepreneurshipModule from "./entrepreneurship.model.js";

export async function getEntrepreneurshipService({ user, query }) {
  return buildClass1112ModuleResponse({
    user,
    query,
    mode: query?.mode,
    moduleDefinition: entrepreneurshipModule,
  });
}
