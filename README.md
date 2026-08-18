# Talent Intelligence trial

A local, independent public-data prototype for exploring two Buchwald public portfolio directories:

- Voice: 271 public talent profiles and 714 public demos
- Commercial Print NY: 409 public portfolio profiles

The directories are dated public snapshots. They are not complete or authoritative internal rosters.

## Start it

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Open:

- Voice: `http://localhost:4173/`
- Commercial Print NY: `http://localhost:4173/print.html`

The department switch in the header moves between the two experiences.

## Voice evidence

Voice matching uses public demo labels and categories such as Commercial, Narration, Audiobooks, Promo, Trailers, International, Spanish, Political, and Character / Animation.

## Commercial Print evidence

Commercial Print matching can use explicit public portfolio fields such as:

- Public men/women directory filter
- Agency-listed ethnicity
- Height
- Hair color
- Eye color
- Public clothing and shoe sizes when requested

Bald, beard, and mature presentation are optional human-reviewed local tags. The software does not derive age, ethnicity, or other sensitive traits from images.

## Repeatable source ingestion

`sources.json` is the source registry. `scripts/roster_sync.py` contains a generic list-and-profile directory adapter plus a specialized Voice adapter.

```bash
python3 scripts/roster_sync.py --list
python3 scripts/roster_sync.py --source buchwald-voice --dry-run
python3 scripts/roster_sync.py --source buchwald-commercial-print-ny --dry-run
```

See `ADDING-AN-AGENCY.md` for the admission checklist, normalized schema, adapter instructions, and verification requirements.

## Tests

```bash
npm test
```

The suite covers Voice matching, Commercial Print parsing and ranking, provenance, unsupported operational claims, human-reviewed appearance tags, and roster-ingestion helpers.

## Privacy and decision boundary

The app does not collect or claim to know:

- Private contact information
- Availability, holds, or conflicts
- Rates or deal terms
- Client preferences
- Current residence or real-time location
- Current representation or submission eligibility

Every result is a possible match for human review. The app does not submit or contact talent.

## Files

- `index.html`, `app.js`, `matching.js`: Voice experience
- `print.html`, `print-app.js`, `print-matching.js`: Commercial Print experience
- `talent-data.js`, `print-data.js`: generated public snapshots
- `sources.json`: source registry
- `scripts/roster_sync.py`: responsible roster adapter runner
- `tests/`: deterministic matching and ingestion tests
- `SESSION-GUIDE.md`: facilitated session plan
- `ADDING-AN-AGENCY.md`: repeatable agency-onboarding guide
