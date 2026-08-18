const CATEGORY_RULES = [
  ['Commercial', /\bcommercial\b|\bad\b|\badvertis(?:ing|ement)\b/i],
  ['Narration', /\bnarrat(?:ion|or|ive)\b|\bdocumentary\b/i],
  ['Audiobooks', /\baudio\s?books?\b/i],
  ['Promo', /\bpromo(?:tional)?\b/i],
  ['Trailers', /\btrailers?\b/i],
  ['Spanish Speakers', /\bspanish(?:-speaking)?\b|\bbilingual\b/i],
  ['International', /\binternational\b|\bbritish\b|\baustralian\b|\birish\b|\bfrench\b|\bgerman\b|\bitalian\b|\brussian\b/i],
  ['Political', /\bpolitic(?:al|s)\b|\bcampaign ad\b/i],
  ['Affiliate & Imaging', /\baffiliate\b|\bimaging\b/i],
  ['Character / Animation', /\bcharacters?\b|\banimat(?:ion|ed)\b|\bgaming\b|\bvideo game\b/i]
];

const STYLE_TERMS = [
  'conversational', 'warm', 'authoritative', 'comedic', 'dramatic',
  'friendly', 'luxury', 'energetic', 'calm', 'youthful', 'sophisticated',
  'announcer', 'character', 'corporate'
];

const UNSUPPORTED_SIGNALS = [
  ['los angeles', /\blos angeles\b|\bLA-based\b/i],
  ['new york', /\bnew york\b|\bNYC\b/i],
  ['automotive', /\bautomotive\b|\bcar(?:s)?\b/i],
  ['healthcare', /\bhealth\s?care\b|\bmedical\b/i],
  ['beauty', /\bbeauty\b|\bcosmetics?\b/i],
  ['technology', /\btechnology\b|\btech\b/i],
  ['availability', /\bavailable\b|\bavailability\b/i],
  ['budget', /\bbudget\b|\brate\b|\bfee\b/i]
];

function unique(items) { return [...new Set(items)]; }

export function parseOpportunity(query = '') {
  const requiredCategories = CATEGORY_RULES.filter(([, pattern]) => pattern.test(query)).map(([category]) => category);
  let gender = null;
  if (/\bwoman\b|\bwomen\b|\bfemale\b/i.test(query)) gender = 'women';
  if (/\bman\b|\bmen\b|\bmale\b/i.test(query)) gender = 'men';
  const styleTerms = STYLE_TERMS.filter(term => new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(query));
  const unsupportedSignals = UNSUPPORTED_SIGNALS.filter(([, pattern]) => pattern.test(query)).map(([label]) => label);
  return { query, requiredCategories, gender, styleTerms, unsupportedSignals };
}

export function rankTalent(talent, query) {
  const parsed = parseOpportunity(query);
  return talent.map(person => {
    let score = 0;
    const reasons = [];
    const matchingDemos = [];
    for (const category of parsed.requiredCategories) {
      if (person.categories.includes(category)) {
        score += 30;
        reasons.push(`Public portfolio includes ${category}`);
      }
    }
    if (parsed.gender) {
      if (person.gender === parsed.gender) {
        score += 8;
        reasons.push(`Matches the public ${parsed.gender === 'women' ? 'women' : 'men'} filter`);
      } else {
        score -= 100;
      }
    }
    for (const term of parsed.styleTerms) {
      const matching = person.demos.filter(demo => demo.label.toLowerCase().includes(term));
      if (matching.length) {
        score += 12;
        reasons.push(`Demo label explicitly includes “${term}”`);
        matchingDemos.push(...matching);
      }
    }
    for (const category of parsed.requiredCategories) {
      const words = category.toLowerCase().split(/\s+|\//).filter(word => word.length > 3);
      matchingDemos.push(...person.demos.filter(demo => words.some(word => demo.label.toLowerCase().includes(word))));
    }
    const categoryMatches = parsed.requiredCategories.filter(category => person.categories.includes(category)).length;
    const unknownTerms = unique(parsed.unsupportedSignals);
    const complete = parsed.requiredCategories.length > 0 && categoryMatches === parsed.requiredCategories.length;
    return {
      talent: person,
      score,
      reasons,
      matchingDemos: unique(matchingDemos.map(demo => JSON.stringify(demo))).map(item => JSON.parse(item)).slice(0, 4),
      unknownTerms,
      evidenceLevel: complete && unknownTerms.length === 0 ? 'strong' : 'partial',
      sourceUrl: person.sourceUrl,
      verifiedAt: person.verifiedAt
    };
  }).sort((a, b) => b.score - a.score || a.talent.name.localeCompare(b.talent.name));
}
