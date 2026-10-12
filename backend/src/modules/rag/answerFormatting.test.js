import assert from "node:assert/strict";
import test from "node:test";

import { formatGeneratedAnswerText } from "./answerFormatting.js";

test("removes latex delimiters without changing answer text", () => {
  assert.equal(formatGeneratedAnswerText("$\n\\sqrt{25}\n$"), "√25");
  assert.equal(formatGeneratedAnswerText("\\(2^2 + 3^2\\)"), "2² + 3²");
  assert.equal(formatGeneratedAnswerText("\\[x^3\\]"), "x³");
});

test("formats powers as superscripts", () => {
  assert.equal(formatGeneratedAnswerText("2^2 + x^3 + 10^5"), "2² + x³ + 10⁵");
  assert.equal(formatGeneratedAnswerText("a^{3} + b^{12}"), "a³ + b¹²");
});

test("formats square and indexed roots", () => {
  assert.equal(formatGeneratedAnswerText("sqrt(25)"), "√25");
  assert.equal(formatGeneratedAnswerText("\\sqrt{25}"), "√25");
  assert.equal(formatGeneratedAnswerText("\\sqrt[3]{27000}"), "∛27000");
  assert.equal(formatGeneratedAnswerText("\\sqrt[4]{16}"), "∜16");
});
