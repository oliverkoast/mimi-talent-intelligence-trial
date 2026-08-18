const COLOR_NAMES = ['Black', 'Brown', 'Blonde', 'Gray', 'White', 'Red', 'Blue', 'Green', 'Hazel'];
const ETHNICITY_RULES = [
  ['African American', /\bblack\b|\bafrican[ -]american\b/i],
  ['Caucasian', /\bwhite\b|\bcaucasian\b/i],
  ['Asian', /\basian\b/i],
  ['Latin', /\blatin[oa]?\b|\bhispanic\b/i],
  ['Indian', /\bindian\b|\bsouth asian\b/i],
  ['Ethnically Ambiguous', /\bethnically ambiguous\b|\bambiguous ethnicity\b/i]
];
const APPEARANCE_RULES = [
  ['bald', /\bbald\b|\bshaved head\b/i],
  ['beard', /\bbeard(?:ed)?\b|\bfacial hair\b/i],
  ['glasses', /\bglasses\b|\beyeglasses\b|\bspectacles\b/i],
  ['mature presentation', /\bolder\b|\bmature\b|\bsenior\b/i]
];

function title(value) { return value ? value[0].toUpperCase() + value.slice(1).toLowerCase() : null; }
function unique(items) { return [...new Set(items)]; }

export function parsePrintOpportunity(query = '') {
  let gender = null;
  if (/\bman\b|\bmen\b|\bmale\b/i.test(query)) gender = 'men';
  if (/\bwoman\b|\bwomen\b|\bfemale\b/i.test(query)) gender = 'women';

  const height = query.match(/\b(\d)\s*['′]\s*(\d{1,2})\s*(?:["″]|in(?:ches?)?)?/i);
  const heightInches = height ? Number(height[1]) * 12 + Number(height[2]) : null;
  const ethnicity = ETHNICITY_RULES.find(([, pattern]) => pattern.test(query))?.[0] || null;
  const hairMatch = query.match(new RegExp(`\\b(${COLOR_NAMES.join('|')})\\s+hair\\b`, 'i'));
  const eyeMatch = query.match(new RegExp(`\\b(${COLOR_NAMES.join('|')})\\s+eyes?\\b`, 'i'));
  const suitMatch = query.match(/\b(\d{2}\s*[RLS])\s+suit\b|\bsuit\s+(?:size\s+)?(\d{2}\s*[RLS])\b/i);
  const appearanceTerms = APPEARANCE_RULES.filter(([, pattern]) => pattern.test(query)).map(([term]) => term);
  const unsupportedTerms = [];
  if (/\bnew york\b|\bNYC\b|\blos angeles\b|\bLA-based\b/i.test(query)) unsupportedTerms.push('current location or residence');
  if (/\bavailable\b|\bavailability\b/i.test(query)) unsupportedTerms.push('availability');

  return {
    query,
    gender,
    heightInches,
    ethnicity,
    hairColor: hairMatch ? title(hairMatch[1]) : null,
    eyeColor: eyeMatch ? title(eyeMatch[1]) : null,
    suitSize: suitMatch ? (suitMatch[1] || suitMatch[2]).replace(/\s+/g, '').toUpperCase() : null,
    appearanceTerms,
    unsupportedTerms
  };
}

export function rankPrintTalent(talent, query, tagsById = {}) {
  const parsed = parsePrintOpportunity(query);
  return talent.map(person => {
    const attributes = person.attributes || {};
    const userTags = unique([...(person.userTags || []), ...(tagsById[person.id] || [])]);
    let score = 0;
    const reasons = [];

    if (parsed.gender) {
      if (person.gender === parsed.gender) { score += 20; reasons.push(`Matches the public ${parsed.gender === 'men' ? 'men' : 'women'} roster filter`); }
      else score -= 100;
    }
    if (parsed.ethnicity) {
      if ((attributes.Ethnicity || '').toLowerCase() === parsed.ethnicity.toLowerCase()) {
        score += 30;
        reasons.push(`Agency-listed ethnicity: ${attributes.Ethnicity}`);
      } else score -= 80;
    }
    if (parsed.heightInches && person.heightInches) {
      const delta = Math.abs(parsed.heightInches - person.heightInches);
      if (delta === 0) { score += 20; reasons.push(`Public height matches exactly: ${attributes.Height}`); }
      else if (delta <= 2) { score += 10; reasons.push(`Public height is within ${delta} inch${delta === 1 ? '' : 'es'}: ${attributes.Height}`); }
    }
    if (parsed.hairColor && (attributes['Hair Color'] || '').toLowerCase() === parsed.hairColor.toLowerCase()) {
      score += 15; reasons.push(`Public portfolio lists ${attributes['Hair Color']} hair`);
    }
    if (parsed.eyeColor && (attributes['Eye Color'] || '').toLowerCase() === parsed.eyeColor.toLowerCase()) {
      score += 15; reasons.push(`Public portfolio lists ${attributes['Eye Color']} eyes`);
    }
    if (parsed.suitSize && (attributes['Suit Size'] || '').replace(/\s+/g, '').toUpperCase() === parsed.suitSize) {
      score += 15; reasons.push(`Public suit size matches: ${attributes['Suit Size']}`);
    }
    for (const term of parsed.appearanceTerms) {
      if (userTags.includes(term)) { score += 15; reasons.push(`Human-reviewed tag: ${term}`); }
    }

    const requested = [parsed.gender, parsed.ethnicity, parsed.heightInches, parsed.hairColor, parsed.eyeColor, parsed.suitSize, ...parsed.appearanceTerms].filter(Boolean).length;
    const matched = reasons.length;
    return {
      talent: {...person, userTags},
      score,
      reasons,
      unknownTerms: unique(parsed.unsupportedTerms),
      evidenceLevel: requested > 0 && matched >= Math.max(1, Math.ceil(requested * .7)) ? 'strong' : 'partial',
      sourceUrl: person.sourceUrl,
      verifiedAt: person.verifiedAt
    };
  }).sort((a,b) => b.score - a.score || a.talent.name.localeCompare(b.talent.name));
}
