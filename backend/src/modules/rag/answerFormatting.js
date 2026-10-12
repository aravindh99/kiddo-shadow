const SUPERSCRIPT_DIGITS = Object.freeze({
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
  "+": "⁺",
  "-": "⁻",
});

const toSuperscript = (value) =>
  String(value || "")
    .split("")
    .map((char) => SUPERSCRIPT_DIGITS[char] || char)
    .join("");

export const formatGeneratedAnswerText = (answer) => {
  if (answer === null || answer === undefined) return answer;

  let text = String(answer);

  text = text
    .replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, "$1")
    .replace(/\$\s*([^$\n]+?)\s*\$/g, "$1")
    .replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, "$1")
    .replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, "$1")
    .replace(/^\s*\${1,2}\s*$/gm, "");

  text = text
    .replace(/\\sqrt\s*\[\s*3\s*\]\s*\{\s*([^{}]+?)\s*\}/g, "∛$1")
    .replace(/\\sqrt\s*\[\s*4\s*\]\s*\{\s*([^{}]+?)\s*\}/g, "∜$1")
    .replace(/\\sqrt\s*\[\s*([^{}\]]+?)\s*\]\s*\{\s*([^{}]+?)\s*\}/g, "$1√$2")
    .replace(/\\sqrt\s*\{\s*([^{}]+?)\s*\}/g, "√$1")
    .replace(/\bsqrt\s*\(\s*([^)]+?)\s*\)/gi, "√$1")
    .replace(/√\(\s*([^)]+?)\s*\)/g, "√$1");

  text = text
    .replace(/(\b[\w.]+|\))\s*\^\s*\{\s*([+-]?\d+)\s*\}/g, (_match, base, exponent) => {
      return `${base}${toSuperscript(exponent)}`;
    })
    .replace(/(\b[\w.]+|\))\s*\^\s*([+-]?\d+)/g, (_match, base, exponent) => {
      return `${base}${toSuperscript(exponent)}`;
    });

  return text.replace(/\n{3,}/g, "\n\n").trim();
};
