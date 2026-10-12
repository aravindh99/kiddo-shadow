import express from "express";
import { checkGrammar, explainMeaning } from "./mindscope.controller.js";

const router = express.Router();

router.post("/grammar/check", checkGrammar);
router.post("/meaning/explain", explainMeaning);

export default router;
