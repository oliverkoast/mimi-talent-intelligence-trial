import { TALENT } from './talent-data.js';
import { parseOpportunity, rankTalent } from './matching.js';

const $ = selector => document.querySelector(selector);
const state = {
  query: $('#opportunity').value,
  shortlist: JSON.parse(localStorage.getItem('ti-shortlist') || '[]'),
  results: []
};

const categoryNames = [...new Set(TALENT.flatMap(person => person.categories))].sort();
for (const category of categoryNames) {
  const option = document.createElement('option');
  option.value = category;
  option.textContent = category;
  $('#categoryFilter').append(option);
}
$('#talentCount').textContent = TALENT.length;

function escapeHTML(value = '') {
  return value.replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

function criteriaHTML(parsed) {
  const chips = [
    ...parsed.requiredCategories.map(value => `<span class="chip"><strong>Category</strong>${escapeHTML(value)}</span>`),
    ...(parsed.gender ? [`<span class="chip"><strong>Filter</strong>${parsed.gender === 'women' ? 'Women' : 'Men'}</span>`] : []),
    ...parsed.styleTerms.map(value => `<span class="chip"><strong>Descriptor</strong>${escapeHTML(value)}</span>`)
  ];
  return chips.length ? chips.join('') : '<span class="chip">No supported public criteria detected — showing alphabetical results</span>';
}

function evidenceScore(result, parsed) {
  const possible = Math.max(1, parsed.requiredCategories.length * 30 + parsed.styleTerms.length * 12 + (parsed.gender ? 8 : 0));
  return Math.min(100, Math.round((result.score / possible) * 100));
}

function filteredResults() {
  const name = $('#nameFilter').value.trim().toLowerCase();
  const gender = $('#genderFilter').value;
  const category = $('#categoryFilter').value;
  let list = state.results.filter(result => {
    const person = result.talent;
    return (!name || person.name.toLowerCase().includes(name)) &&
      (gender === 'all' || person.gender === gender) &&
      (category === 'all' || person.categories.includes(category));
  });
  if ($('#sortOrder').value === 'name') list.sort((a,b) => a.talent.name.localeCompare(b.talent.name));
  return list;
}

function resultCard(result, parsed) {
  const person = result.talent;
  const selected = state.shortlist.includes(person.id);
  const demos = (result.matchingDemos.length ? result.matchingDemos : person.demos.slice(0,2));
  const reasons = result.reasons.length ? result.reasons : ['No explicit public match — inspect source manually'];
  return `
    <article class="result-card" data-id="${escapeHTML(person.id)}">
      <div class="score"><div><strong>${evidenceScore(result, parsed)}</strong><span>evidence</span></div></div>
      <div>
        <h3 class="result-name">${escapeHTML(person.name)}</h3>
        <div class="meta">
          <span>Voice</span><span>${escapeHTML(person.gender === 'women' ? 'Women' : person.gender === 'men' ? 'Men' : 'Unspecified')}</span>
          <span>${person.demos.length} public demo${person.demos.length === 1 ? '' : 's'}</span>
        </div>
        <ul class="reason-list">${reasons.slice(0,3).map(reason => `<li>${escapeHTML(reason)}</li>`).join('')}</ul>
        <div class="demo-row">${demos.slice(0,3).map(demo => `<a class="demo-link" href="${escapeHTML(demo.url)}" target="_blank" rel="noreferrer">Listen: ${escapeHTML(demo.label)}</a>`).join('')}</div>
      </div>
      <div class="card-actions">
        <span class="evidence-tag ${result.evidenceLevel}">${escapeHTML(result.evidenceLevel)} evidence</span>
        <button class="add-button ${selected ? 'selected' : ''}" data-add="${escapeHTML(person.id)}">${selected ? 'Selected' : 'Add to shortlist'}</button>
        <a class="source-link" href="${escapeHTML(person.sourceUrl)}" target="_blank" rel="noreferrer">Public source ↗</a>
      </div>
    </article>`;
}

function renderResults() {
  const parsed = parseOpportunity(state.query);
  const visible = filteredResults();
  $('#criteria').innerHTML = criteriaHTML(parsed);
  $('#resultCount').textContent = `${visible.length} profiles`;
  const unknown = [...new Set(state.results.flatMap(result => result.unknownTerms))];
  $('#unknownNotice').hidden = unknown.length === 0;
  $('#unknownNotice').innerHTML = unknown.length
    ? `<strong>Not verifiable from this public dataset:</strong> ${unknown.map(escapeHTML).join(', ')}. Treat these as follow-up questions, not matching evidence.`
    : '';
  $('#results').innerHTML = visible.length
    ? visible.slice(0, 40).map(result => resultCard(result, parsed)).join('')
    : '<div class="empty-state"><strong>No profiles match these filters.</strong><br>Reset the filters or revise the opportunity.</div>';
}

function renderShortlist() {
  const people = state.shortlist.map(id => TALENT.find(person => person.id === id)).filter(Boolean);
  $('#shortlistCount').textContent = people.length;
  $('#shortlistEmpty').hidden = people.length > 0;
  $('#copyBrief').disabled = people.length === 0;
  $('#shortlist').innerHTML = people.map(person => {
    const result = state.results.find(item => item.talent.id === person.id);
    return `<div class="shortlist-item">
      <h3>${escapeHTML(person.name)}</h3>
      <p>${escapeHTML((result?.reasons || ['Requires manual review']).slice(0,2).join(' Â· '))}</p>
      <button data-remove="${escapeHTML(person.id)}">Remove</button>
    </div>`;
  }).join('');
}

function runAnalysis() {
  state.query = $('#opportunity').value.trim();
  state.results = rankTalent(TALENT, state.query);
  renderResults();
  renderShortlist();
}

function persistShortlist() {
  localStorage.setItem('ti-shortlist', JSON.stringify(state.shortlist));
}

$('#analyze').addEventListener('click', runAnalysis);
$('#opportunity').addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') runAnalysis();
});
document.querySelectorAll('.example').forEach(button => button.addEventListener('click', () => {
  $('#opportunity').value = button.dataset.query;
  runAnalysis();
}));
['#nameFilter','#genderFilter','#categoryFilter','#sortOrder'].forEach(selector => {
  $(selector).addEventListener(selector === '#nameFilter' ? 'input' : 'change', renderResults);
});
$('#clearFilters').addEventListener('click', () => {
  $('#nameFilter').value = '';
  $('#genderFilter').value = 'all';
  $('#categoryFilter').value = 'all';
  $('#sortOrder').value = 'fit';
  renderResults();
});
$('#results').addEventListener('click', event => {
  const button = event.target.closest('[data-add]');
  if (!button) return;
  const id = button.dataset.add;
  state.shortlist = state.shortlist.includes(id) ? state.shortlist.filter(item => item !== id) : [...state.shortlist, id].slice(-5);
  persistShortlist();
  renderResults();
  renderShortlist();
});
$('#shortlist').addEventListener('click', event => {
  const button = event.target.closest('[data-remove]');
  if (!button) return;
  state.shortlist = state.shortlist.filter(item => item !== button.dataset.remove);
  persistShortlist();
  renderResults();
  renderShortlist();
});
$('#copyBrief').addEventListener('click', async () => {
  const parsed = parseOpportunity(state.query);
  const selected = state.shortlist.map(id => state.results.find(result => result.talent.id === id)).filter(Boolean);
  const text = [
    'PUBLIC-DATA TALENT REVIEW — INDEPENDENT TRIAL',
    `Opportunity: ${state.query}`,
    `Interpreted categories: ${parsed.requiredCategories.join(', ') || 'None'}`,
    '',
    ...selected.flatMap((result, index) => [
      `${index + 1}. ${result.talent.name}`,
      `Evidence: ${result.reasons.join('; ') || 'Manual review required'}`,
      `Public demos: ${result.matchingDemos.map(demo => demo.label).join(', ') || result.talent.demos.slice(0,2).map(demo => demo.label).join(', ')}`,
      `Source: ${result.sourceUrl}`,
      ''
    ]),
    'Limitations: Public portfolio data may be incomplete or stale. Representation, preferences, availability, conflicts, rates, and eligibility require authorized confirmation.'
  ].join('\n');
  let copied = false;
  try {
    await navigator.clipboard.writeText(text);
    copied = true;
  } catch (_) {
    const fallback = document.createElement('textarea');
    fallback.value = text;
    fallback.setAttribute('readonly', '');
    fallback.style.position = 'fixed';
    fallback.style.opacity = '0';
    document.body.append(fallback);
    fallback.select();
    copied = document.execCommand('copy');
    fallback.remove();
  }
  $('#copyStatus').textContent = copied ? 'Review brief copied.' : 'Copy was blocked. Select and copy from your browser.';
  setTimeout(() => $('#copyStatus').textContent = '', 2600);
});

runAnalysis();
