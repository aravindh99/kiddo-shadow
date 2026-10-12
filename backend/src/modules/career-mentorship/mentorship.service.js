import { buildClass1112ModuleResponse } from "../class-1112-module-access/class1112ModuleAccess.service.js";
import careerMentorshipModule from "./mentorship.model.js";

export async function getMentorshipService({ user, query }) {
  return buildClass1112ModuleResponse({
    user,
    query,
    mode: query?.mode,
    moduleDefinition: careerMentorshipModule,
  });
}
