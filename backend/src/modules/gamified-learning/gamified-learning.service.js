import { buildFoundationModuleResponse } from "../foundation-module-access/foundation-module-access.service.js";
import gamifiedLearningModule from "./gamified-learning.model.js";

export async function getGamifiedLearningService({ user, query }) {
  return buildFoundationModuleResponse({
    user,
    query,
    mode: query?.mode,
    moduleDefinition: gamifiedLearningModule,
  });
}
