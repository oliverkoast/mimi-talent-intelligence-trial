# Mimi session guide: Talent Intelligence trial

## Session outcome

By the end of the call, Mimi should be able to explain:

1. How Voice and Commercial Print require different kinds of public evidence.
2. What public information can and cannot support a talent recommendation.
3. How to turn an opportunity into explicit criteria without inventing facts.
4. Why a result is a possible match for human review, not a booking or submission decision.
5. How the same product can add another agency through a reviewed public-source adapter.

## 60-minute working session

### 0–5 minutes: Set the boundary

Open `http://localhost:4173/`.

Say:

> This is an independent local research prototype using dated snapshots of public portfolio information. It is not an agency system, and it cannot establish representation status, availability, conflicts, preferences, rates, or submission eligibility.

Ask Mimi to identify two pieces of information that must never be pasted into a personal AI tool.

Expected examples: private client names, contact details, schedules, deal terms, holds, conflicts, internal preferences, or confidential breakdowns.

### 5–15 minutes: Voice discovery

Stay on the **Voice** department.

Use:

> Spanish-speaking woman for a warm, conversational national commercial.

Have Mimi inspect three results and answer:

- Which public demo directly supports each match?
- Which evidence is experience rather than preference?
- Which phrase in the query cannot be verified?
- What would require agent approval?

Then use:

> Warm automotive commercial voice based in Los Angeles and available next week.

Ask Mimi to explain why location, availability, conflicts, and automotive fit remain unknown.

### 15–30 minutes: Commercial Print discovery

Switch to **Commercial Print NY**.

Use:

> Bald Black man for a contemporary lifestyle campaign.

Explain the evidence layers:

- “Men” comes from the public roster filter.
- “African American” comes from the agency-listed public portfolio field.
- “Bald” is not inferred by the system. A human must inspect the public image and add a local review tag.

Have Mimi inspect the first few headshots and add a **bald** tag only where she is comfortable making that visual review. Rerun the query and note how reviewed profiles move up.

Then use:

> White older man with a beard for a heritage brand campaign.

Ask Mimi to identify:

- What is supported by agency-listed data?
- What requires human visual review?
- Why “older” is a subjective presentation tag rather than a verified age?
- What the app must never claim about residence, availability, or client preference?

### 30–42 minutes: Build a shortlist

Choose one fictional Voice or Print opportunity.

Mimi should:

1. Convert it into must-have and nice-to-have criteria.
2. Review source evidence for at least five profiles.
3. Add no more than three people to the shortlist.
4. Remove one initially plausible result and explain why.
5. Copy the review brief.

Emphasize that the brief is a preparation artifact for human review. It is not a submission.

### 42–52 minutes: Add another agency on paper

Open `ADDING-AN-AGENCY.md`.

Choose one agency from Mimi's application tracker that publishes a large official roster.

Have Mimi define:

- The official source URL
- Departments exposed publicly
- Fields explicitly listed
- Fields that would require inference and must be excluded
- Whether a generic list-and-profile adapter could parse it
- What ten-profile sample should be manually verified
- The required disclaimer and freshness date

If the agency has no appropriate public directory or prohibits collection, decide to use a small cited sample or fictional data instead.

### 52–60 minutes: Interview rehearsal

Mimi explains the project in 60–90 seconds:

> We built an independent local prototype that organizes dated public portfolio information across Voice and Commercial Print. It turns a fictional opportunity into transparent criteria, shows the evidence behind possible matches, and flags what the public data cannot establish. Department-specific evidence stays separate, and subjective appearance descriptors require human review rather than automatic image inference. The final shortlist remains with the human, and another agency can be added through a reviewed public-source adapter.

Follow with:

- What would need legal, security, and IT review before agency deployment?
- What would you do if a public roster changed tomorrow?
- How would you respond if the top-ranked result felt wrong?
- What should remain in authorized internal systems?

## Strong discussion prompts

- Is the field explicitly published, inferred, or unknown?
- Does this evidence prove experience, or only suggest relevance?
- What information might be stale?
- Could this criterion create unfair or unsupported exclusion?
- What would an agent need to confirm?
- Is this a source adapter problem or a new department schema?

## Safety and accuracy rules

- Use fictional opportunities during the session.
- Do not paste private breakdowns, contact information, client names, schedules, rates, holds, or conflicts.
- Never claim the public directory is complete or current.
- Never derive ethnicity or age from a photograph.
- Keep human-reviewed appearance tags local and distinguish them from agency-listed facts.
- Do not submit, contact, or book anyone through the prototype.
- Treat “Commercial Print NY” as a department label, not proof of residence.
- Confirm current representation and all operational facts through authorized agency systems.
