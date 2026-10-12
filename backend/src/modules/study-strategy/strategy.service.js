import { buildClass10ModuleResponse } from "../class-10-module-access/class10ModuleAccess.service.js";
import studyStrategyModule from "./strategy.model.js";

export async function getStudyStrategyService({ user, query }) {
  return buildClass10ModuleResponse({
    user,
    query,
    mode: query?.mode,
    moduleDefinition: studyStrategyModule,
  });
}
