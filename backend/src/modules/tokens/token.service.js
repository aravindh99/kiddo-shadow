import TokenAccount from "./token-account.model.js";
import TokenTransaction from "./token-transaction.model.js";
import TokenPolicy from "./token-policy.model.js";
import AppError from "../../shared/appError.js";
import User from "../users/user.model.js";
import Subscription from "../subscriptions/subscription.model.js";
import { Op } from "sequelize";

export async function ensureTokenAccount(userId) {
  const user = await User.findByPk(userId);
  if (!user) return null;

  let account = await TokenAccount.findOne({ where: { user_id: userId } });
  if (account) return account;

  const policy = await TokenPolicy.findOne({ where: { role: user.role } });
  const initialBalance = policy?.monthly_tokens ?? 0;

  account = await TokenAccount.create({
    user_id: userId,
    balance: initialBalance,
    expires_at: null,
  });

  if (initialBalance > 0) {
    await TokenTransaction.create({
      user_id: userId,
      subscription_id: null,
      type: "admin_adjustment",
      change: initialBalance,
      balance_before: 0,
      balance_after: initialBalance,
    });
  }

  return account;
}

export async function deductTokens({ userId, amount, reason, refId }) {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Only students & teachers allowed
  if (!["student", "teacher"].includes(user.role)) {
    throw new AppError("AI access not allowed for this role", 403);
  }

  // Allow bypass via env flag
  const bypassSubscriptionGate =
    String(process.env.ALLOW_AI_WITHOUT_SUBSCRIPTION || "").toLowerCase() ===
    "true";

  // Check school subscription
  if (user.school_id && !bypassSubscriptionGate) {
    const subscription = await Subscription.findOne({
      where: {
        school_id: user.school_id,
        status: "active",
        end_date: {
          [Op.gt]: new Date(),
        },
      },
    });

    // Debug logs (temporary)
    console.log("School ID:", user.school_id);
    console.log("Subscription found:", subscription);

    if (!subscription) {
      throw new AppError(
        "School subscription is inactive. AI access disabled.",
        403
      );
    }
  }

  // If AI does not use tokens
  if (amount <= 0) {
    return;
  }

  const account = await ensureTokenAccount(userId);

  if (!account || account.balance < amount) {
    throw new AppError("Insufficient AI tokens", 402);
  }

  const before = account.balance;
  account.balance -= amount;
  await account.save();
  const after = account.balance;

  await TokenTransaction.create({
    user_id: userId,
    subscription_id: null,
    type: "usage",
    change: -amount,
    balance_before: before,
    balance_after: after,
  });
}

export async function setRoleMonthlyTokens({
  role,
  monthly_tokens,
  mode = "replace",
  school_id = null,
  updated_by = null,
}) {
  if (!["student", "teacher"].includes(role)) {
    throw new AppError("Invalid role", 400);
  }

  if (Number.isNaN(Number(monthly_tokens)) || monthly_tokens < 0) {
    throw new AppError("Invalid monthly_tokens", 400);
  }

  await TokenPolicy.upsert({
    role,
    monthly_tokens,
    updated_by,
  });

  const users = await User.findAll({
    where: {
      role,
      ...(school_id ? { school_id } : {}),
    },
    attributes: ["id"],
  });

  for (const u of users) {
    const account = await ensureTokenAccount(u.id);
    if (!account) continue;

    const before = account.balance;
    const after =
      mode === "add" ? before + Number(monthly_tokens) : Number(monthly_tokens);

    if (after !== before) {
      account.balance = after;
      await account.save();

      await TokenTransaction.create({
        user_id: u.id,
        subscription_id: null,
        type: "admin_adjustment",
        change: after - before,
        balance_before: before,
        balance_after: after,
      });
    }
  }
}

export async function adjustUserTokens({ user_id, amount, mode = "add" }) {
  const account = await ensureTokenAccount(user_id);
  if (!account) throw new AppError("User not found", 404);

  const before = account.balance;
  const after = mode === "set" ? Number(amount) : before + Number(amount);

  if (Number.isNaN(after) || after < 0) {
    throw new AppError("Invalid amount", 400);
  }

  account.balance = after;
  await account.save();

  await TokenTransaction.create({
    user_id,
    subscription_id: null,
    type: "admin_adjustment",
    change: after - before,
    balance_before: before,
    balance_after: after,
  });

  return account;
}
