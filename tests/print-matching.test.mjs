import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePrintOpportunity, rankPrintTalent } from '../print-matching.js';

const sample = [
  {
    id: 'alex-test', name: 'Alex Test', gender: 'men', heightInches: 70,
    attributes: { 'Ethnicity': 'African American', 'Hair Color': 'Brown', 'Eye Color': 'Brown', 'Suit Size': '40R' },
    photos: ['https://example.test/alex.jpg'], userTags: ['bald', 'beard', 'mature presentation'],
    sourceUrl: 'https://portfolio.buchwald.com/portfolios/1', verifiedAt: '2026-08-18', market: 'Commercial Print NY'
  },
  {
    id: 'jamie-test', name: 'Jamie Test', gender: 'women', heightInches: 66,
    attributes: { 'Ethnicity': 'Caucasian', 'Hair Color': 'Blonde', 'Eye Color': 'Blue' },
    photos: [], userTags: [], sourceUrl: 'https://portfolio.buchwald.com/portfolios/2',
    verifiedAt: '2026-08-18', market: 'Commercial Print NY'
  }
];

test('parsePrintOpportunity extracts agency-listed professional portfolio attributes', () => {
  const parsed = parsePrintOpportunity("Black man around 5'10 with brown hair, brown eyes, and a 40R suit");
  assert.equal(parsed.gender, 'men');
  assert.equal(parsed.heightInches, 70);
  assert.equal(parsed.ethnicity, 'African American');
  assert.equal(parsed.hairColor, 'Brown');
  assert.equal(parsed.eyeColor, 'Brown');
  assert.equal(parsed.suitSize, '40R');
});

test('rankPrintTalent puts the strongest evidenced public match first', () => {
  const results = rankPrintTalent(sample, "Black man around 5'10 with brown hair and brown eyes");
  assert.equal(results[0].talent.name, 'Alex Test');
  assert.ok(results[0].score > results[1].score);
  assert.ok(results[0].reasons.some(reason => reason.includes('Agency-listed ethnicity')));
  assert.ok(results[0].reasons.some(reason => reason.includes('Brown hair')));
});

test('human-reviewed appearance tags can support bald, beard, and mature-presentation queries', () => {
  const [result] = rankPrintTalent(sample, 'bald Black man with a beard, mature presentation');
  assert.equal(result.talent.name, 'Alex Test');
  assert.ok(result.reasons.some(reason => reason.includes('Human-reviewed tag: bald')));
  assert.ok(result.reasons.some(reason => reason.includes('Human-reviewed tag: beard')));
});

test('rankPrintTalent preserves market wording without claiming residence', () => {
  const [result] = rankPrintTalent(sample, 'commercial print talent in New York');
  assert.equal(result.talent.market, 'Commercial Print NY');
  assert.ok(result.unknownTerms.includes('current location or residence'));
  assert.equal(result.sourceUrl, sample[0].sourceUrl);
});


test('glasses is parsed and changes ranking only through a human-reviewed tag', () => {
  const tagged = [
    {...sample[0], id: 'with-glasses', name: 'With Glasses', userTags: ['glasses']},
    {...sample[0], id: 'without-glasses', name: 'Without Glasses', userTags: []}
  ];
  const parsed = parsePrintOpportunity('bald Black man with glasses');
  assert.ok(parsed.appearanceTerms.includes('glasses'));
  const results = rankPrintTalent(tagged, 'Black man with glasses');
  assert.equal(results[0].talent.name, 'With Glasses');
  assert.ok(results[0].reasons.includes('Human-reviewed tag: glasses'));
});
