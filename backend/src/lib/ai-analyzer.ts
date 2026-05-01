import { loadModel, classifyText, mlScoreToRisk } from "./ml-classifier.js";

// ── Regex patterns (first defence line) ──────────────────────────────────────
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
  /('|"|;|--|\bOR\b|\bAND\b)\s*\d*\s*(=|LIKE)\s*\d*/i,
  /'\s*OR\s*'?\d+'?\s*=\s*'?\d+/i,
  /'\s*OR\s*1\s*=\s*1/i,
  /'\s*;\s*(DROP|DELETE|INSERT|UPDATE|SELECT)/i,
  /SLEEP\s*\(\s*\d+\s*\)/i,
  /BENCHMARK\s*\(/i,
  /LOAD_FILE\s*\(/i,
  /INTO\s+OUTFILE/i,
  /xp_cmdshell/i,
  /information_schema/i,
  /pg_tables/i,
  /sys\.tables/i,
  /waitfor\s+delay/i,
  /char\s*\(\s*\d+/i,
];

const XSS_PATTERNS = [
  /<script[\s\S]*?>[\s\S]*?<\/script>/i,
  /<[^>]*\s(on\w+)\s*=/i,
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /<\s*iframe/i,
  /<\s*img[^>]+src\s*=\s*[^>]*onerror/i,
  /document\.(cookie|write|location)/i,
  /window\.(location|open)/i,
  /eval\s*\(/i,
  /expression\s*\(/i,
  /&#x?[0-9a-f]+;/i,
  /%3Cscript/i,
  /<\s*svg[^>]*onload/i,
  /<\s*body[^>]*onload/i,
  /alert\s*\(/i,
];

const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//,
  /\.\.\\/,
  /%2e%2e%2f/i,
  /%2e%2e\//i,
  /\.\.%2f/i,
  /%252e%252e/i,
  /\/etc\/passwd/i,
  /\/etc\/shadow/i,
  /\/windows\/system32/i,
  /\/proc\/self/i,
  /c:\\windows/i,
  /boot\.ini/i,
];

const COMMAND_INJECTION_PATTERNS = [
  /;\s*(ls|dir|cat|rm|del|wget|curl|ping|nc|bash|sh|cmd|powershell)(\s|$|-)/i,
  /\|\s*(ls|dir|cat|rm|del|wget|curl|ping|nc|bash|sh|cmd|powershell)(\s|$|-)/i,
  /`[^`]+`/,
  /\$\([^)]+\)/,
  /&&\s*(ls|dir|cat|rm|del|wget|curl|ping|nc|bash|sh|cmd|powershell)/i,
  /\|\|\s*(ls|dir|cat|rm|del|wget|curl|ping)/i,
  /;\s*whoami/i,
  /;\s*id(\s|$)/i,
  /;\s*pwd(\s|$)/i,
  /;\s*ifconfig/i,
  /;\s*ipconfig/i,
];

// ── Feature extraction (statistical signals) ──────────────────────────────────
function shannonEntropy(str: string): number {
  const freq: Record<string, number> = {};
  for (const ch of str) freq[ch] = (freq[ch] ?? 0) + 1;
  let entropy = 0;
  for (const cnt of Object.values(freq)) {
    const p = cnt / str.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

function extractFeatureScore(input: string): number {
  let score = 0;
  const specialChars = (input.match(/['";<>|&`$%\\]/g) ?? []).length;
  const specialRatio = specialChars / Math.max(input.length, 1);
  if (specialRatio > 0.1) score += Math.min(30, Math.round(specialRatio * 200));
  const entropy = shannonEntropy(input);
  if (entropy > 4.5) score += Math.round((entropy - 4.5) * 10);
  if (input.includes("--") || input.includes("/*") || input.includes("*/")) score += 15;
  if (/%[0-9a-fA-F]{2}/.test(input)) score += 10;
  return Math.min(score, 40);
}

// ── Main export ───────────────────────────────────────────────────────────────
export interface AnalysisResult {
  aiScore: number;
  attackType: string;
  detectedPatterns: string[];
  mlPrediction?: string;
  mlConfidence?: number;
  detectionMethod: "regex" | "ml" | "hybrid" | "statistical";
}

export function analyzeInput(input: string): AnalysisResult {
  const detectedPatterns: string[] = [];
  let regexScore = 0;
  let attackType = "Clean";

  const normalizedInput = (() => { try { return decodeURIComponent(input).replace(/\+/g, " "); } catch { return input; } })();

  // 1. Regex detection
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(normalizedInput)) {
      detectedPatterns.push(`SQL: ${pattern.toString().slice(1, 30)}...`);
      if (regexScore < 85) { regexScore = 85; attackType = "SQL Injection"; }
    }
  }
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(normalizedInput)) {
      detectedPatterns.push(`XSS: ${pattern.toString().slice(1, 30)}...`);
      if (regexScore < 80) { regexScore = 80; attackType = "XSS"; }
    }
  }
  for (const pattern of PATH_TRAVERSAL_PATTERNS) {
    if (pattern.test(normalizedInput)) {
      detectedPatterns.push(`PATH: ${pattern.toString().slice(1, 25)}...`);
      if (regexScore < 75) { regexScore = 75; attackType = "Path Traversal"; }
    }
  }
  for (const pattern of COMMAND_INJECTION_PATTERNS) {
    if (pattern.test(normalizedInput)) {
      detectedPatterns.push(`CMD: ${pattern.toString().slice(1, 25)}...`);
      if (regexScore < 90) { regexScore = 90; attackType = "Command Injection"; }
    }
  }

  // 2. Statistical feature score
  const featureScore = extractFeatureScore(normalizedInput);

  // 3. ML model (if trained model exists)
  const model = loadModel();

  if (model) {
    const mlResult = classifyText(normalizedInput, model);
    const mlScore = mlScoreToRisk(mlResult);

    const ML_CLASS_MAP: Record<string, string> = {
      sqli: "SQL Injection", xss: "XSS",
      path_traversal: "Path Traversal", cmd_injection: "Command Injection", clean: "Clean",
    };

    if (mlResult.isAttack) {
      detectedPatterns.push(`ML: ${mlResult.predictedClass} (${mlResult.confidence.toFixed(1)}%)`);
    }

    // Hybrid scoring: take the higher of regex vs ML, then add feature signals
    const baseScore = Math.max(regexScore, mlScore);
    const hybridScore = Math.min(100, Math.round(baseScore * 0.8 + featureScore * 0.2));

    // If ML is more confident than regex on attack type, prefer ML label
    if (!regexScore && mlResult.isAttack && mlResult.confidence > 60) {
      attackType = ML_CLASS_MAP[mlResult.predictedClass] ?? mlResult.predictedClass;
    }

    return {
      aiScore: hybridScore,
      attackType,
      detectedPatterns: [...new Set(detectedPatterns)].slice(0, 6),
      mlPrediction: ML_CLASS_MAP[mlResult.predictedClass] ?? mlResult.predictedClass,
      mlConfidence: mlResult.confidence,
      detectionMethod: regexScore > 0 && mlResult.isAttack ? "hybrid" : mlResult.isAttack ? "ml" : regexScore > 0 ? "regex" : "statistical",
    };
  }

  // No model — regex + statistical only
  const finalScore = Math.min(100, Math.round(regexScore * 0.85 + featureScore * 0.15));
  return {
    aiScore: finalScore,
    attackType,
    detectedPatterns: [...new Set(detectedPatterns)].slice(0, 5),
    detectionMethod: regexScore > 0 ? "regex" : "statistical",
  };
}
