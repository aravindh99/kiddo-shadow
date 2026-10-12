import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import {
  getTokenPolicies,
  setTokenPolicies,
  listTokenAccounts,
  listTokenTransactions,
  adjustUserTokenBalance,
} from "./token.controller.js";

const router = express.Router();

router.use(protect);

// Super admin: manage token policies and balances
router.get("/tokens/policies", allowRoles("super_admin"), getTokenPolicies);
router.post("/tokens/policies", allowRoles("super_admin"), setTokenPolicies);

router.get("/tokens/accounts", allowRoles("super_admin"), listTokenAccounts);
router.get("/tokens/transactions", allowRoles("super_admin"), listTokenTransactions);
router.post("/tokens/users/:userId/adjust", allowRoles("super_admin"), adjustUserTokenBalance);

export default router;
