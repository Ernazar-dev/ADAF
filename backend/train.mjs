import { config } from "dotenv";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { createHash } from "crypto";
import path from "path";
import { fileURLToPath } from "url";

config({ path: ".env" });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATASET_PATH = path.join(__dirname, "src/training/dataset.json");
const MODEL_PATH = path.join(__dirname, "src/training/model.json");

console.log("\n=== ADAF ML Trainer v1.0 ===\n");

if (!existsSync(DATASET_PATH)) {
  console.error("XATO: dataset.json topilmadi:", DATASET_PATH);
  process.exit(1);
}

const dataset = JSON.parse(readFileSync(DATASET_PATH, "utf-8"));
const samples = dataset.samples;
console.log(`Dataset yuklandi: ${samples.length} ta namuna`);

// Class distribution
const classDist = {};
for (const s of samples) classDist[s.label] = (classDist[s.label] || 0) + 1;
console.log("\nClass taqsimoti:");
for (const [cls, cnt] of Object.entries(classDist)) {
  console.log(`  ${cls.padEnd(20)} ${cnt} ta`);
}

// Tokenize
function tokenize(text) {
  const lower = text.toLowerCase();
  const words = lower.match(/[a-z0-9%_\.\-\/\\]+/g) ?? [];
  const bigrams = [];
  const trigrams = [];
  for (let i = 0; i < lower.length - 1; i++) bigrams.push("__2g_" + lower.slice(i, i + 2));
  for (let i = 0; i < lower.length - 2; i++) trigrams.push("__3g_" + lower.slice(i, i + 3));
  return [...words, ...bigrams, ...trigrams];
}

// Train
const classes = [...new Set(samples.map(s => s.label))].sort();
const classCounts = {};
const wordCounts = {};
const vocabSizes = {};

for (const cls of classes) {
  classCounts[cls] = 0;
  wordCounts[cls] = {};
}

for (const { text, label } of samples) {
  classCounts[label]++;
  for (const token of tokenize(text)) {
    wordCounts[label][token] = (wordCounts[label][token] || 0) + 1;
  }
}

for (const cls of classes) {
  vocabSizes[cls] = Object.values(wordCounts[cls]).reduce((a, b) => a + b, 0);
}

const model = { classes, classCounts, wordCounts, vocabSizes, totalSamples: samples.length };

// Accuracy evaluation (on training data — for diploma demo)
function classify(text) {
  const tokens = tokenize(text);
  const logProbs = {};
  const alpha = 1;
  const allVocab = new Set();
  for (const cls of classes) for (const w of Object.keys(wordCounts[cls])) allVocab.add(w);
  const V = allVocab.size;

  for (const cls of classes) {
    const prior = Math.log(classCounts[cls] / samples.length);
    let likelihood = 0;
    const total = vocabSizes[cls] || 1;
    for (const t of tokens) {
      const cnt = (wordCounts[cls][t] || 0) + alpha;
      likelihood += Math.log(cnt / (total + alpha * (V + 1)));
    }
    logProbs[cls] = prior + likelihood;
  }

  return classes.reduce((best, cls) => logProbs[cls] > logProbs[best] ? cls : best, classes[0]);
}

let correct = 0;
for (const s of samples) {
  if (classify(s.text) === s.label) correct++;
}
const accuracy = ((correct / samples.length) * 100).toFixed(1);
console.log(`\nModel aniqligi: ${accuracy}% (${correct}/${samples.length})`);

// Save
const dir = path.dirname(MODEL_PATH);
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
writeFileSync(MODEL_PATH, JSON.stringify(model, null, 2), "utf-8");

console.log(`\nModel saqlandi: ${MODEL_PATH}`);
console.log(`Vocabulary hajmi: ${new Set(Object.values(wordCounts).flatMap(Object.keys)).size} ta token`);
console.log("\nO'qitish tugadi!");
