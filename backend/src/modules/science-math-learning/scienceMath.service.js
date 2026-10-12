import { buildClass89ModuleResponse } from "../class-89-module-access/class89ModuleAccess.service.js";
import scienceMathLearningModule from "./scienceMath.model.js";

export async function getScienceMathLearningService({ user, query }) {
  return buildClass89ModuleResponse({
    user,
    query,
    mode: query?.mode,
    moduleDefinition: scienceMathLearningModule,
  });
}
