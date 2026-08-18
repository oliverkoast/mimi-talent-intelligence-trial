import test from 'node:test';
import assert from 'node:assert/strict';
import { parseOpportunity, rankTalent } from '../matching.js';

const sample = [
  {
    id: 'allison-strong',
    name: 'Allison Strong',
    gender: 'women',
    categories: ['Commercial', 'Spanish Speakers', 'Narration'],
    demos: [
      { label: 'Commercial - Conversational', url: 'https://example.test/conversational.mp3' },
      { label: 'Spanish', url: 'https://example.test/spanish.mp3' }
    ],
    sourceUrl: 'https://portfolio.buchwald.com/departments/voice',
    verifiedAt: '2026-08-18'
  },
  {
    id: 'anna-graves',
    name: 'Anna Graves',
    gender: 'women',
    categories: ['Commercial', 'Promo', 'Trailers', 'Narration'],
    demos: [{ label: 'Trailers', url: 'https://example.test/trailer.mp3' }],
    sourceUrl: 'https://portfolio.buchwald.com/departments/voice',
    verifiedAt: '2026-08-18'
  }
];

test('parseOpportunity extracts public voice categories and descriptive signals', () => {
  const parsed = parseOpportunity('Need a Spanish-speaking woman with a warm conversational commercial read');
  assert.deepEqual(parsed.requiredCategories, ['Commercial', 'Spanish Speakers']);
  assert.equal(parsed.gender, 'women');
  assert.deepEqual(parsed.styleTerms, ['conversational', 'warm']);
});

test('rankTalent rewards multiple evidenced category matches and explains them', () => {
  const results = rankTalent(sample, 'Spanish-speaking woman for a conversational commercial');
  assert.equal(results[0].talent.name, 'Allison Strong');
  assert.ok(results[0].score > results[1].score);
  assert.ok(results[0].reasons.some(reason => reason.includes('Spanish Speakers')));
  assert.ok(results[0].reasons.some(reason => reason.includes('Commercial')));
  assert.ok(results[0].matchingDemos.some(demo => demo.label.includes('Conversational')));
});

test('rankTalent marks unsupported opportunity language as unknown rather than inventing evidence', () => {
  const [result] = rankTalent(sample, 'warm luxury automotive commercial based in Los Angeles');
  assert.ok(result.unknownTerms.includes('automotive'));
  assert.ok(result.unknownTerms.includes('los angeles'));
  assert.equal(result.evidenceLevel, 'partial');
});

test('rankTalent preserves source provenance for every result', () => {
  const [result] = rankTalent(sample, 'commercial narration');
  assert.equal(result.sourceUrl, sample[0].sourceUrl);
  assert.equal(result.verifiedAt, '2026-08-18');
});
