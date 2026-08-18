import { PRINT_TALENT } from './print-data.js';
import { parsePrintOpportunity, rankPrintTalent } from './print-matching.js';

const $ = selector => document.querySelector(selector);
const state = {
  query: $('#opportunity').value,
  shortlist: JSON.parse(localStorage.getItem('ti-print-shortlist') || '[]'),
  tags: JSON.parse(localStorage.getItem('ti-print-tags') || '{}'),
  results: []
};
const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const unique = items => [...new Set(items.filter(Boolean))];

function fillSelect(selector, values) {
  for (const value of unique(values).sort()) {
    const option = document.createElement('option'); option.value = value; option.textContent = value; $(selector).append(option);
  }
}
fillSelect('#ethnicityFilter', PRINT_TALENT.map(p => p.attributes.Ethnicity));
fillSelect('#hairFilter', PRINT_TALENT.map(p => p.attributes['Hair Color']));
$('#talentCount').textContent = PRINT_TALENT.length;

function formatHeight(inches) { return inches ? `${Math.floor(inches / 12)}'${inches % 12}\"` : 'Not listed'; }

function interpretedHTML(parsed) {
  const entries = [
    parsed.gender && ['Filter', parsed.gender === 'men' ? 'Men' : 'Women'],
    parsed.ethnicity && ['Agency field', parsed.ethnicity],
    parsed.heightInches && ['Height', formatHeight(parsed.heightInches)],
    parsed.hairColor && ['Hair', parsed.hairColor],
    parsed.eyeColor && ['Eyes', parsed.eyeColor],
    parsed.suitSize && ['Suit', parsed.suitSize],
    ...parsed.appearanceTerms.map(term => ['Human tag', term])
  ].filter(Boolean);
  return entries.length ? entries.map(([label,value]) => `<span class="chip"><strong>${escapeHTML(label)}</strong>${escapeHTML(value)}</span>`).join('') : '<span class="chip">No supported criteria detected</span>';
}

function filtered() {
  const name = $('#nameFilter').value.toLowerCase().trim();
  const gender = $('#genderFilter').value;
  const ethnicity = $('#ethnicityFilter').value;
  const hair = $('#hairFilter').value;
  const list = state.results.filter(({talent:p}) => (!name || p.name.toLowerCase().includes(name)) && (gender === 'all' || p.gender === gender) && (ethnicity === 'all' || p.attributes.Ethnicity === ethnicity) && (hair === 'all' || p.attributes['Hair Color'] === hair));
  const sort = $('#sortOrder').value;
  if (sort === 'name') list.sort((a,b) => a.talent.name.localeCompare(b.talent.name));
  if (sort === 'height') list.sort((a,b) => (b.talent.heightInches || 0) - (a.talent.heightInches || 0));
  return list;
}

function possibleScore(parsed) {
  return (parsed.gender ? 20 : 0) + (parsed.ethnicity ? 30 : 0) + (parsed.heightInches ? 20 : 0) + (parsed.hairColor ? 15 : 0) + (parsed.eyeColor ? 15 : 0) + (parsed.suitSize ? 15 : 0) + parsed.appearanceTerms.length * 15;
}
function evidenceScore(result, parsed) { return Math.max(0, Math.min(100, Math.round(result.score / Math.max(1, possibleScore(parsed)) * 100))); }

function tagButton(id, tag, tags) {
  const selected = tags.includes(tag);
  return `<button class="tag-button ${selected ? 'selected' : ''}" data-tag="${escapeHTML(tag)}" data-id="${escapeHTML(id)}">${selected ? '✓ ' : '+ '}${escapeHTML(tag)}</button>`;
}

function card(result, parsed) {
  const p = result.talent; const a = p.attributes; const tags = state.tags[p.id] || [];
  const selected = state.shortlist.includes(p.id);
  const image = p.photos[0] ? `<img src="${escapeHTML(p.photos[0])}" alt="Public portfolio image of ${escapeHTML(p.name)}" loading="lazy">` : '<div class="print-image-placeholder">No image</div>';
  return `<article class="print-card">
    <a class="print-image" href="${escapeHTML(p.sourceUrl)}" target="_blank" rel="noreferrer">${image}</a>
    <div class="print-card-body">
      <div class="print-card-top"><div><h3>${escapeHTML(p.name)}</h3><span>${escapeHTML(p.gender === 'men' ? 'Men' : p.gender === 'women' ? 'Women' : 'Unspecified')} · ${escapeHTML(p.market)}</span></div><div class="score compact"><div><strong>${evidenceScore(result,parsed)}</strong><span>evidence</span></div></div></div>
      <div class="attribute-row">
        ${a.Ethnicity ? `<span><b>Agency-listed ethnicity</b>${escapeHTML(a.Ethnicity)}</span>` : ''}
        <span><b>Height</b>${escapeHTML(a.Height || 'Not listed')}</span>
        ${a['Hair Color'] ? `<span><b>Hair</b>${escapeHTML(a['Hair Color'])}</span>` : ''}
        ${a['Eye Color'] ? `<span><b>Eyes</b>${escapeHTML(a['Eye Color'])}</span>` : ''}
      </div>
      <ul class="reason-list">${(result.reasons.length ? result.reasons : ['Requires manual portfolio review']).slice(0,4).map(r=>`<li>${escapeHTML(r)}</li>`).join('')}</ul>
      <div class="human-tags"><span>Local human review:</span>${tagButton(p.id,'bald',tags)}${tagButton(p.id,'beard',tags)}${tagButton(p.id,'glasses',tags)}${tagButton(p.id,'mature presentation',tags)}</div>
      <div class="print-card-actions"><button class="add-button ${selected?'selected':''}" data-add="${escapeHTML(p.id)}">${selected?'Selected':'Add to shortlist'}</button><a href="${escapeHTML(p.sourceUrl)}" target="_blank" rel="noreferrer">Full public portfolio ↗</a></div>
    </div>
  </article>`;
}

function renderResults() {
  const parsed = parsePrintOpportunity(state.query); const visible = filtered();
  $('#criteria').innerHTML = interpretedHTML(parsed);
  $('#resultCount').textContent = `${visible.length} ranked public profiles · showing top ${Math.min(24, visible.length)}`;
  const review = [...parsed.appearanceTerms.map(term => `“${term}” requires a human-reviewed local tag`), ...parsed.unsupportedTerms.map(term => `${term} is not verified` )];
  $('#reviewNotice').hidden = review.length === 0;
  $('#reviewNotice').innerHTML = review.length ? `<strong>Human confirmation needed:</strong> ${review.map(escapeHTML).join('; ')}. The app does not infer age or race from photographs.` : '';
  $('#results').innerHTML = visible.length ? visible.slice(0,24).map(r=>card(r,parsed)).join('') : '<div class="empty-state">No profiles match the selected filters.</div>';
}

function renderShortlist() {
  const people = state.shortlist.map(id => PRINT_TALENT.find(p=>p.id===id)).filter(Boolean);
  $('#shortlistCount').textContent = people.length; $('#shortlistEmpty').hidden = people.length > 0; $('#copyBrief').disabled = !people.length;
  $('#shortlist').innerHTML = people.map(p => `<div class="shortlist-item"><h3>${escapeHTML(p.name)}</h3><p>${escapeHTML([p.attributes.Ethnicity,p.attributes.Height,p.attributes['Hair Color']].filter(Boolean).join(' · '))}</p><button data-remove="${escapeHTML(p.id)}">Remove</button></div>`).join('');
}

function run() { state.query = $('#opportunity').value.trim(); state.results = rankPrintTalent(PRINT_TALENT,state.query,state.tags); renderResults(); renderShortlist(); }
function persist() { localStorage.setItem('ti-print-shortlist',JSON.stringify(state.shortlist)); localStorage.setItem('ti-print-tags',JSON.stringify(state.tags)); }

$('#analyze').addEventListener('click',run);
$('#opportunity').addEventListener('keydown',e=>{ if((e.metaKey||e.ctrlKey)&&e.key==='Enter') run(); });
document.querySelectorAll('.example').forEach(b=>b.addEventListener('click',()=>{ $('#opportunity').value=b.dataset.query; run(); }));
['#nameFilter','#genderFilter','#ethnicityFilter','#hairFilter','#sortOrder'].forEach(s=>$(s).addEventListener(s==='#nameFilter'?'input':'change',renderResults));
$('#clearFilters').addEventListener('click',()=>{ $('#nameFilter').value=''; $('#genderFilter').value='all'; $('#ethnicityFilter').value='all'; $('#hairFilter').value='all'; $('#sortOrder').value='fit'; renderResults(); });
$('#results').addEventListener('click',e=>{
  const add=e.target.closest('[data-add]'); const tag=e.target.closest('[data-tag]');
  if(add){ const id=add.dataset.add; state.shortlist=state.shortlist.includes(id)?state.shortlist.filter(x=>x!==id):[...state.shortlist,id].slice(-5); persist(); renderResults(); renderShortlist(); }
  if(tag){ const id=tag.dataset.id,t=tag.dataset.tag,current=state.tags[id]||[]; state.tags[id]=current.includes(t)?current.filter(x=>x!==t):[...current,t]; persist(); run(); }
});
$('#shortlist').addEventListener('click',e=>{const b=e.target.closest('[data-remove]');if(!b)return;state.shortlist=state.shortlist.filter(x=>x!==b.dataset.remove);persist();renderResults();renderShortlist();});
$('#copyBrief').addEventListener('click',async()=>{
  const selected=state.shortlist.map(id=>state.results.find(r=>r.talent.id===id)).filter(Boolean);
  const text=['PUBLIC-DATA COMMERCIAL PRINT REVIEW','Opportunity: '+state.query,'',...selected.flatMap((r,i)=>[`${i+1}. ${r.talent.name}`,`Evidence: ${r.reasons.join('; ')||'Manual review required'}`,`Source: ${r.sourceUrl}`,'']),'Limitations: Agency-listed public fields and local human tags only. Current representation, residence, availability, preferences, rates, conflicts, and eligibility require authorized confirmation.'].join('\n');
  try{await navigator.clipboard.writeText(text);$('#copyStatus').textContent='Review brief copied.';}catch(_){$('#copyStatus').textContent='Clipboard blocked in this browser.';}setTimeout(()=>$('#copyStatus').textContent='',2500);
});

run();
