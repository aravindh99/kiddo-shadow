import asyncHandler from "../../shared/asyncHandler.js";
import TokenPolicy from "./token-policy.model.js";
import TokenAccount from "./token-account.model.js";
import TokenTransaction from "./token-transaction.model.js";
import User from "../users/user.model.js";
import {
  setRoleMonthlyTokens,
  adjustUserTokens,
} from "./token.service.js";
import { getPagination } from "../../shared/utils/pagination.js";

export const getTokenPolicies = asyncHandler(async (req, res) => {
  const policies = await TokenPolicy.findAll({ order: [["role", "ASC"]] });
  res.json({ success: true, items: policies });
});

export const setTokenPolicies = asyncHandler(async (req, res) => {
  const {
    student_monthly,
    teacher_monthly,
    mode = "replace",
    school_id = null,
  } = req.body;

  if (student_monthly !== undefined) {
    await setRoleMonthlyTokens({
      role: "student",
      monthly_tokens: Number(student_monthly),
      mode,
      school_id,
      updated_by: req.user.id,
    });
  }

  if (teacher_monthly !== undefined) {
    await setRoleMonthlyTokens({
      role: "teacher",
      monthly_tokens: Number(teacher_monthly),
      mode,
      school_id,
      updated_by: req.user.id,
    });
  }

  res.json({ success: true, message: "Token policy updated" });
});

export const listTokenAccounts = asyncHandler(async (req, res) => {
  const { limit, offset } = getPagination(req.query);
  const { school_id, role } = req.query;

  const whereUser = {};
  if (school_id) whereUser.school_id = Number(school_id);
  if (role) whereUser.role = role;

  const result = await TokenAccount.findAndCountAll({
    include: [
      {
        model: User,
        attributes: ["id", "name", "username", "role", "school_id"],
        where: whereUser,
      },
    ],
    limit,
    offset,
    order: [["updated_at", "DESC"]],
  });

  res.json({
    success: true,
    total: result.count,
    items: result.rows,
  });
});

export const listTokenTransactions = asyncHandler(async (req, res) => {
  const { limit, offset } = getPagination(req.query);
  const { school_id, user_id } = req.query;

  const whereUser = {};
  if (school_id) whereUser.school_id = Number(school_id);
  if (user_id) whereUser.id = Number(user_id);

  const result = await TokenTransaction.findAndCountAll({
    include: [
      {
        model: User,
        attributes: ["id", "name", "username", "role", "school_id"],
        where: whereUser,
      },
    ],
    limit,
    offset,
    order: [["created_at", "DESC"]],
  });

  res.json({
    success: true,
    total: result.count,
    items: result.rows,
  });
});

export const adjustUserTokenBalance = asyncHandler(async (req, res) => {
  const { amount, mode = "add" } = req.body;
  const user_id = Number(req.params.userId);

  const account = await adjustUserTokens({ user_id, amount, mode });
  res.json({ success: true, data: account });
});
