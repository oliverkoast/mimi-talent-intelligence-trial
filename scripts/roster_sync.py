#!/usr/bin/env python3
"""Sync approved public roster pages into normalized local datasets.

Every new source requires a manual review of robots.txt, site terms, field sensitivity,
and source completeness before it is enabled. This script never bypasses logins or gates.
"""
from __future__ import annotations
import argparse, json, re, time, unicodedata
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
USER_AGENT = 'TalentIntelligencePublicRosterResearch/1.0'


def normalize_slug(value: str) -> str:
    value = value.replace('’', '-').replace('‘', '-').replace("'", '-')
    value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', value).strip('-')


def height_to_inches(value: str | None) -> int | None:
    match = re.search(r"(\d+)\s*'\s*(\d+)", value or '')
    return int(match.group(1)) * 12 + int(match.group(2)) if match else None


def parse_colon_attributes(lines: list[str]) -> dict[str, str]:
    result = {}
    for line in lines:
        if ':' in line:
            key, value = line.split(':', 1)
            result[key.strip()] = value.strip()
    return result


def robots_allows(url: str) -> bool:
    parsed = urlparse(url)
    robots_url = f'{parsed.scheme}://{parsed.netloc}/robots.txt'
    parser = RobotFileParser()
    try:
        response = requests.get(robots_url, timeout=15, headers={'User-Agent': USER_AGENT})
        if response.status_code == 404:
            return True
        response.raise_for_status()
        parser.parse(response.text.splitlines())
        return parser.can_fetch(USER_AGENT, url)
    except requests.RequestException:
        raise RuntimeError(f'Could not verify robots policy: {robots_url}')


def fetch_soup(session: requests.Session, url: str) -> BeautifulSoup:
    response = session.get(url, timeout=40)
    response.raise_for_status()
    return BeautifulSoup(response.text, 'html.parser')


def voice_categories(label: str) -> list[str]:
    text = label.lower(); categories = []
    rules = [
        ('Commercial', ('comm', 'commer')), ('Narration', ('narrat',)),
        ('Audiobooks', ('audio',)), ('Promo', ('promo',)), ('Trailers', ('trailer',)),
        ('Spanish Speakers', ('spanish',)), ('Political', ('politic',)),
        ('Affiliate & Imaging', ('affiliate', 'imaging')),
        ('Character / Animation', ('character', 'animation', 'gaming'))
    ]
    for name, needles in rules:
        if any(needle in text for needle in needles): categories.append(name)
    if 'international' in text or any(x in text for x in ('british','australian','irish','french','german','italian','russian')):
        categories.append('International')
    return categories or ['Other']


def sync_voice(source: dict, session: requests.Session) -> list[dict]:
    base = source['roster_url']
    def tracks(url):
        soup = fetch_soup(session, url); rows = []
        for element in soup.select('.voiceOverTrack'):
            text = ' '.join(element.get_text(' ', strip=True).split())
            if ':' not in text: continue
            name, label = [part.strip() for part in text.split(':', 1)]
            link = element.select_one('a[href]')
            rows.append((name, label, link.get('href') if link else element.get('data-source')))
        return rows
    all_tracks = tracks(base)
    men = {name for name, _, _ in tracks(base + '?gender=men')}
    women = {name for name, _, _ in tracks(base + '?gender=women')}
    grouped = {}
    for name, label, audio in all_tracks:
        record = grouped.setdefault(name, {'demos': [], 'categories': set()})
        record['demos'].append({'label': label, 'url': audio}); record['categories'].update(voice_categories(label))
    checked = date.today().isoformat(); output = []
    for name in sorted(grouped):
        gender = 'all' if name in men and name in women else ('men' if name in men else ('women' if name in women else 'unknown'))
        output.append({'id': normalize_slug(name), 'name': name, 'gender': gender, 'categories': sorted(grouped[name]['categories']), 'demos': sorted(grouped[name]['demos'], key=lambda x: x['label'].lower()), 'sourceUrl': base, 'verifiedAt': checked, 'location': 'Not publicly verified'})
    return output


def sync_generic_directory(source: dict, session: requests.Session, workers: int = 5) -> list[dict]:
    roster = fetch_soup(session, source['roster_url']); entries = []
    for card in roster.select(source['list_selector']):
        link = card.select_one(source['link_selector'])
        if not link: continue
        name_node = card.select_one(source.get('name_selector', source['link_selector']))
        entries.append({'name': name_node.get_text(' ', strip=True), 'url': urljoin(source['roster_url'], link.get('href')), 'gender': card.get(source.get('gender_attribute', ''), '').lower() or 'unknown'})
    checked = date.today().isoformat()
    def detail(entry):
        soup = fetch_soup(session, entry['url'])
        lines = [' '.join(node.get_text(' ', strip=True).split()) for node in soup.select(source['detail_attribute_selector'])]
        attrs = parse_colon_attributes(lines)
        photos = [urljoin(entry['url'], image.get('src')) for image in soup.select(source['detail_image_selector']) if image.get('src')]
        return {'id': normalize_slug(entry['name']), 'name': entry['name'], 'gender': 'men' if entry['gender'] == 'men' else ('women' if entry['gender'] == 'women' else 'unknown'), 'heightInches': height_to_inches(attrs.get('Height')), 'attributes': attrs, 'photos': photos, 'sourceUrl': entry['url'], 'rosterSourceUrl': source['roster_url'], 'verifiedAt': checked, 'market': source['department']}
    output = []
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = [pool.submit(detail, entry) for entry in entries]
        for future in as_completed(futures): output.append(future.result())
    return sorted(output, key=lambda x: x['name'])


def write_outputs(source: dict, records: list[dict], dry_run: bool) -> None:
    print(f"{source['id']}: {len(records)} public records")
    if dry_run: return
    output = ROOT / source['output_module']
    note = f"// Public-data snapshot from {source['agency']} {source['department']}. Review source freshness and limitations.\n"
    output.write_text(note + f"export const {source['export_name']} = " + json.dumps(records, indent=2, ensure_ascii=False) + ';\n', encoding='utf-8')
    data_dir = ROOT / 'data'; data_dir.mkdir(exist_ok=True)
    (data_dir / f"{source['id']}.json").write_text(json.dumps({'source': source, 'records': records}, indent=2, ensure_ascii=False), encoding='utf-8')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', default='all')
    parser.add_argument('--list', action='store_true')
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--workers', type=int, default=5)
    args = parser.parse_args()
    config = json.loads((ROOT / 'sources.json').read_text())['sources']
    if args.list:
        for source in config: print(source['id'], '-', source['agency'], source['department'])
        return
    selected = config if args.source == 'all' else [source for source in config if source['id'] == args.source]
    if not selected: raise SystemExit(f'Unknown source: {args.source}')
    session = requests.Session(); session.headers.update({'User-Agent': USER_AGENT})
    for source in selected:
        if not robots_allows(source['roster_url']): raise SystemExit(f"Robots policy disallows source: {source['roster_url']}")
        if source['adapter'] == 'buchwald_voice_tracks': records = sync_voice(source, session)
        elif source['adapter'] == 'generic_profile_directory': records = sync_generic_directory(source, session, args.workers)
        else: raise SystemExit(f"Unsupported adapter: {source['adapter']}")
        write_outputs(source, records, args.dry_run)
        time.sleep(.5)

if __name__ == '__main__': main()
