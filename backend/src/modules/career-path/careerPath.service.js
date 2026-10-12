import { buildClass10ModuleResponse } from "../class-10-module-access/class10ModuleAccess.service.js";
import careerPathModule from "./careerPath.model.js";

export async function getCareerPathService({ user, query }) {
  return buildClass10ModuleResponse({
    user,
    query,
    mode: query?.mode,
    moduleDefinition: careerPathModule,
  });
}
