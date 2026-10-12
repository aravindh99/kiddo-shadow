import { buildClass10ModuleResponse } from "../class-10-module-access/class10ModuleAccess.service.js";
import competitiveExamModule from "./competitive.model.js";

export async function getCompetitiveExamService({ user, query }) {
  return buildClass10ModuleResponse({
    user,
    query,
    mode: query?.mode,
    moduleDefinition: competitiveExamModule,
  });
}
