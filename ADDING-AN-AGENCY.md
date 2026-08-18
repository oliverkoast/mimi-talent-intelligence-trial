# Adding another public agency roster

This prototype is organized so a new agency or department is a source adapter, not a copy-and-paste rebuild.

## Admission checklist

Only add a source when all of the following are true:

1. The roster is publicly browseable without a login, access control, or circumvention.
2. `robots.txt` allows the relevant pages for the configured research user agent.
3. The site's terms and intended public use have been reviewed by a human.
4. The dataset is described as a dated public snapshot, not a complete or current internal roster.
5. Every record retains its public source URL and verification date.
6. No private contact details, schedules, rates, holds, conflicts, or internal preferences are collected.
7. Sensitive or subjective traits are never inferred automatically from images.

If a large official directory does not meet these criteria, use a small manually curated, cited sample or fictional data instead.

## Architecture

`sources.json` is the source registry. Each entry declares:

- Agency and department
- Official public roster URL
- Adapter type
- DOM selectors when the generic directory adapter is sufficient
- Output module and JavaScript export name

`scripts/roster_sync.py` provides:

- A reusable generic list-and-profile directory adapter
- A Buchwald Voice track adapter for its specialized audio layout
- `robots.txt` validation before collection
- Polite, limited concurrency
- Normalized IDs, source URLs, verification dates, and shared core fields
- JSON archives in `data/` plus the JavaScript modules consumed by the prototype

The normalized shared core is:

```json
{
  "id": "stable-slug",
  "name": "Public name",
  "gender": "men | women | unknown",
  "sourceUrl": "official public profile URL",
  "rosterSourceUrl": "official public directory URL",
  "verifiedAt": "YYYY-MM-DD",
  "market": "public department label",
  "attributes": {},
  "photos": []
}
```

Department-specific evidence remains separate. Voice uses demos and audio categories. Commercial Print uses explicitly listed professional portfolio fields. A new department should not be forced into either schema if its evidence is different.

## Add a simple profile directory

1. Add a new `generic_profile_directory` record to `sources.json`.
2. Provide selectors for each roster card, profile link, public name, attributes, and images.
3. Run:

```bash
python3 scripts/roster_sync.py --list
python3 scripts/roster_sync.py --source your-source-id --dry-run
python3 scripts/roster_sync.py --source your-source-id
```

4. Inspect a sample of at least ten records against their original profiles.
5. Add department-specific matching tests before enabling search.
6. Add the department to navigation only after browser and source-provenance checks pass.

## Add a specialized source

If selectors are insufficient, add a small adapter function to `scripts/roster_sync.py`. The adapter must output the shared core and preserve department-specific evidence without inventing missing values.

## Matching policy

- Match facts only when the public source explicitly supplies them.
- Appearance terms such as bald, beard, or mature presentation may be added as local human-reviewed tags.
- Ethnicity can match the agency's explicitly listed portfolio field, but the UI must label it as agency-listed.
- Do not use image models to infer race, ethnicity, age, disability, health, sexuality, or other sensitive traits.
- “NY,” “LA,” or another market in a department name does not establish residence or current location.
- Availability, conflicts, preferences, rates, current representation, and submission eligibility always require authorized confirmation.

## Verification

Run all tests:

```bash
npm test
```

Then verify:

- Plain-language query parsing
- Department-specific ranking
- Source links
- Empty states
- Filters
- Human-review tags
- Shortlist persistence
- Department navigation
- Responsive presentation
