#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');

// 讀取 Words-CEFR-Dataset (跨平台)
const datasetPath = path.join(os.tmpdir(), 'Words-CEFR-Dataset');

console.log('Reading Words-CEFR-Dataset...');

// 讀取 words.csv
const wordsLines = fs.readFileSync(path.join(datasetPath, 'csv/words.csv'), 'utf8').split('\n');
const wordMap = {};
for (let i = 1; i < wordsLines.length; i++) {
  const line = wordsLines[i].trim();
  if (!line) continue;
  const match = line.match(/"(\d+)","([^"]+)"/);
  if (match) {
    wordMap[match[1]] = match[2];
  }
}
console.log(`✓ Loaded ${Object.keys(wordMap).length} words`);

// 讀取 word_pos.csv - 提取 B2-C1 詞彙
const wordPosLines = fs.readFileSync(path.join(datasetPath, 'csv/word_pos.csv'), 'utf8').split('\n');
const b2Words = {};
const c1Words = {};

for (let i = 1; i < wordPosLines.length; i++) {
  const line = wordPosLines[i].trim();
  if (!line) continue;

  const parts = line.split(',');
  if (parts.length < 6) continue;

  const wordId = parts[1].replace(/"/g, '');
  const levelStr = parts[5].replace(/"/g, '');
  const level = parseFloat(levelStr);

  if (!wordMap[wordId]) continue;
  const word = wordMap[wordId].toLowerCase();

  // B2: 3.5-4.5, C1: 4.5-5.5
  if (level >= 3.5 && level < 4.5) {
    if (!b2Words[word]) b2Words[word] = level;
  } else if (level >= 4.5 && level < 5.5) {
    if (!c1Words[word]) c1Words[word] = level;
  }
}

console.log(`✓ Found ${Object.keys(b2Words).length} B2 words`);
console.log(`✓ Found ${Object.keys(c1Words).length} C1 words`);

// 生成 cefr_vocabulary.json
const cefr_vocab = {
  metadata: {
    description: "Cambridge CEFR Vocabulary Database - B2 and C1 Advanced Words",
    version: "1.0",
    source: "Words-CEFR-Dataset",
    url: "https://github.com/Maximax67/Words-CEFR-Dataset",
    totalB2Words: Object.keys(b2Words).length,
    totalC1Words: Object.keys(c1Words).length,
    generatedAt: new Date().toISOString(),
    levels: {
      B2: {
        range: "3.5-4.5",
        description: "Upper Intermediate - For intermediate+ learners",
        count: Object.keys(b2Words).length
      },
      C1: {
        range: "4.5-5.5",
        description: "Advanced - For advanced learners",
        count: Object.keys(c1Words).length
      }
    }
  },
  words: {
    B2: b2Words,
    C1: c1Words
  }
};

// 保存到檔案
const outputPath = path.join(__dirname, 'cefr_vocabulary.json');
fs.writeFileSync(outputPath, JSON.stringify(cefr_vocab, null, 2));

const fileSizeKb = (fs.statSync(outputPath).size / 1024).toFixed(2);
console.log(`\n✅ Generated ${outputPath}`);
console.log(`📊 File size: ${fileSizeKb} KB`);

// 顯示樣本
console.log('\n=== B2 Sample Words (first 30) ===');
console.log(Object.keys(b2Words).sort().slice(0, 30).join(', '));

console.log('\n=== C1 Sample Words (first 30) ===');
console.log(Object.keys(c1Words).sort().slice(0, 30).join(', '));
