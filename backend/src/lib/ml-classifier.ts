import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface ModelData {
  classes: string[];
  classCounts: Record<string, number>;
  wordCounts: Record<string, Record<string, number>>;
  vocabSizes: Record<string, number>;
  totalSamples: number;
}

const MODEL_PATH = path.join(__dirname, "../../src/training/model.json");

let cachedModel: ModelData | null = null;

function tokenize(text: string): string[] {
  const lower = text.toLowerCase();
  // Word tokens
  const words = lower.match(/[a-z0-9%_\.\-\/\\]+/g) ?? [];
  // Character bigrams and trigrams (catches obfuscated attacks like %3c, ../., etc.)
  const bigrams: string[] = [];
  const trigrams: string[] = [];
  for (let i = 0; i < lower.length - 1; i++) bigrams.push("__2g_" + lower.slice(i, i + 2));
  for (let i = 0; i < lower.length - 2; i++) trigrams.push("__3g_" + lower.slice(i, i + 3));
  return [...words, ...bigrams, ...trigrams];
}

export function trainModel(samples: { text: string; label: string }[]): ModelData {
  const classes = [...new Set(samples.map((s) => s.label))].sort();
  const classCounts: Record<string, number> = {};
  const wordCounts: Record<string, Record<string, number>> = {};
  const vocabSizes: Record<string, number> = {};

  for (const cls of classes) {
    classCounts[cls] = 0;
    wordCounts[cls] = {};
  }

  for (const { text, label } of samples) {
    classCounts[label]++;
    const tokens = tokenize(text);
    for (const token of tokens) {
      wordCounts[label]![token] = (wordCounts[label]![token] ?? 0) + 1;
    }
  }

  for (const cls of classes) {
    vocabSizes[cls] = Object.values(wordCounts[cls]!).reduce((a, b) => a + b, 0);
  }

  return { classes, classCounts, wordCounts, vocabSizes, totalSamples: samples.length };
}

export function saveModel(model: ModelData): void {
  const dir = path.dirname(MODEL_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(MODEL_PATH, JSON.stringify(model, null, 2), "utf-8");
}

export function loadModel(): ModelData | null {
  if (cachedModel) return cachedModel;
  if (!fs.existsSync(MODEL_PATH)) return null;
  try {
    cachedModel = JSON.parse(fs.readFileSync(MODEL_PATH, "utf-8")) as ModelData;
    return cachedModel;
  } catch { return null; }
}

export interface ClassifyResult {
  predictedClass: string;
  confidence: number;
  scores: Record<string, number>;
  isAttack: boolean;
}

export function classifyText(text: string, model: ModelData): ClassifyResult {
  const tokens = tokenize(text);
  const logProbs: Record<string, number> = {};
  const alpha = 1; // Laplace smoothing

  // Global vocab size for smoothing
  const allVocab = new Set<string>();
  for (const cls of model.classes) {
    for (const w of Object.keys(model.wordCounts[cls] ?? {})) allVocab.add(w);
  }
  const V = allVocab.size;

  for (const cls of model.classes) {
    // Prior: log P(class)
    const prior = Math.log((model.classCounts[cls] ?? 1) / model.totalSamples);
    // Likelihood: log P(word|class) with Laplace smoothing
    let likelihood = 0;
    const totalWords = model.vocabSizes[cls] ?? 1;
    for (const token of tokens) {
      const wordCount = (model.wordCounts[cls]?.[token] ?? 0) + alpha;
      const denom = totalWords + alpha * (V + 1);
      likelihood += Math.log(wordCount / denom);
    }
    logProbs[cls] = prior + likelihood;
  }

  // Convert log probs to probabilities via softmax
  const maxLogProb = Math.max(...Object.values(logProbs));
  const expProbs: Record<string, number> = {};
  let sumExp = 0;
  for (const cls of model.classes) {
    expProbs[cls] = Math.exp((logProbs[cls] ?? -Infinity) - maxLogProb);
    sumExp += expProbs[cls] ?? 0;
  }
  const probabilities: Record<string, number> = {};
  for (const cls of model.classes) {
    probabilities[cls] = Math.round(((expProbs[cls] ?? 0) / sumExp) * 1000) / 10;
  }

  const predictedClass = model.classes.reduce((best, cls) =>
    (probabilities[cls] ?? 0) > (probabilities[best] ?? 0) ? cls : best, model.classes[0] ?? "clean"
  );

  const confidence = probabilities[predictedClass] ?? 0;
  const isAttack = predictedClass !== "clean";

  return { predictedClass, confidence, scores: probabilities, isAttack };
}

export function mlScoreToRisk(result: ClassifyResult): number {
  if (!result.isAttack) return Math.round(result.confidence * 0.2); // clean: 0–20
  // Attack: scale confidence (50–100) by attack type severity
  const severity: Record<string, number> = { sqli: 1.0, cmd_injection: 1.0, xss: 0.85, path_traversal: 0.9 };
  const factor = severity[result.predictedClass] ?? 0.8;
  return Math.min(100, Math.round(50 + result.confidence * factor * 0.5));
}
