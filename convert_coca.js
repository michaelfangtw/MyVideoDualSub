const fs = require('fs');
const path = require('path');

// Read CSV file
const csvPath = path.join(__dirname, 'COCA_WordFrequency.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

const lines = csvContent.trim().split('\n');
const header = lines[0];

// Parse CSV and filter for ranks 3001-5000
const words = {};
let tier1Count = 0;
let tier2Count = 0;

for (let i = 1; i < lines.length; i++) {
  const parts = lines[i].split(',');
  const rank = parseInt(parts[0], 10);
  const lemma = parts[1].toLowerCase();

  // Only include ranks 3001-5000
  if (rank >= 3001 && rank <= 5000) {
    words[lemma] = rank;
    if (rank <= 5000) {
      tier1Count++;
    }
  }
  // Include ranks 5001-10000 for tier 2 (if needed later)
  else if (rank > 5000 && rank <= 10000) {
    words[lemma] = rank;
    tier2Count++;
  }
}

// Create metadata
const metadata = {
  description: 'COCA Word Frequency Database (3001-5000) - Official COCA Data',
  version: '5.0',
  totalWords: tier1Count,
  coverage: 'Official COCA word frequency database (3001-5000 range)',
  generatedAt: new Date().toISOString(),
  source: 'https://github.com/brucewlee/COCA-WordFrequency',
  rangeStart: 3001,
  rangeEnd: 5000,
  tiers: {
    tier1: {
      range: '3001-5000',
      mark: '**',
      color: 'yellow',
      level: 'Advanced (B2-C1)',
      count: tier1Count
    }
  }
};

// Create wordlist object
const wordlist = {
  metadata,
  words
};

// Write to file
const outputPath = path.join(__dirname, 'wordlist.json');
fs.writeFileSync(outputPath, JSON.stringify(wordlist, null, 2), 'utf-8');

console.log(`✓ Generated wordlist.json with ${tier1Count} words (COCA ranks 3001-5000)`);
console.log(`  File: ${outputPath}`);
console.log(`  Size: ${(JSON.stringify(wordlist).length / 1024).toFixed(2)} KB`);
