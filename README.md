# HCMUS Course Registration Userscript

<p align="center">
  <a href="https://github.com/lhlizdabezt/hcmus-auto-dkhp/releases/latest"><img src="https://img.shields.io/github/v/release/lhlizdabezt/hcmus-auto-dkhp?style=for-the-badge&logo=github&label=Release" alt="Latest release for hcmus-auto-dkhp" /></a>
  <a href="https://github.com/lhlizdabezt/hcmus-auto-dkhp/tags"><img src="https://img.shields.io/github/v/tag/lhlizdabezt/hcmus-auto-dkhp?style=for-the-badge&logo=git&label=Tag" alt="Latest tag for hcmus-auto-dkhp" /></a>
  <img src="https://img.shields.io/badge/Portfolio-English%20review%20ready-0f766e?style=for-the-badge" alt="English portfolio ready" />
</p>

<p align="center">
  <img src="assets/portfolio-motion.svg" alt="English SVG visual for the HCMUS course registration userscript" width="100%" />
</p>

## Overview

`hcmus-auto-dkhp` is a Tampermonkey userscript for HCMUS course-registration support. It helps a student monitor the registration page, wait for a configured opening time, match exact target course rows, select eligible checkboxes and optionally click the registration button after the user has reviewed the configuration.

This project is a student productivity tool. It does not bypass CAPTCHA, does not replace manual account authentication and does not claim privileged access to the HCMUS portal. Manual steps remain manual where the portal requires them.

| Field | Details |
|---|---|
| Repository | [hcmus-auto-dkhp](https://github.com/lhlizdabezt/hcmus-auto-dkhp) |
| Portfolio category | Browser userscript, workflow tooling and student productivity support |
| Primary stack | JavaScript, Tampermonkey, DOM inspection, browser automation and HCMUS portal workflow support |
| Current userscript version | `4.4.0` |
| Latest release | [GitHub Releases](https://github.com/lhlizdabezt/hcmus-auto-dkhp/releases/latest) |
| Version tags | [Tags](https://github.com/lhlizdabezt/hcmus-auto-dkhp/tags) |
| Owner profile | [Luong Hai Long](https://github.com/lhlizdabezt) |

## Evidence Highlights

- Scheduled reload with jitter to reduce synchronized refresh behavior.
- Exact target matching by course code, class and schedule text.
- Checkbox selection for matching rows when the portal exposes eligible classes.
- Optional submit mode, disabled by default for safer manual review.
- Manual CAPTCHA boundary: the script pauses when CAPTCHA is present.
- English user-facing overlay, comments, README, release notes and SVG visual asset.
- Release-backed portfolio snapshots for HR screening and engineering review.

## Repository Structure

| Path | Purpose |
|---|---|
| `tricker/HCMUS Auto DKHP - HK3 23TC Safe-2.0.user.js` | Main Tampermonkey userscript |
| `assets/portfolio-motion.svg` | English, line-free SVG visual for README and profile review |
| `CHANGELOG.md` | Previous version history |
| `RELEASE_NOTES.md` | Current release notes used by GitHub Releases |
| `.gitattributes` | Text and binary asset handling |
| `.gitignore` | Local cache, browser and generated-file exclusions |
| `LICENSE` | MIT license |

## How It Works

1. The script loads on the configured HCMUS portal URLs and on local test files that match the DKHP page patterns.
2. It blocks disruptive browser dialogs that would otherwise interrupt the workflow.
3. If the login page is detected, it can show an optional local login helper. This helper is off by default.
4. If the DKHP CAPTCHA gate is detected, the script pauses automatic refresh so the user can complete CAPTCHA manually.
5. If the configured opening time has not arrived, the script schedules a controlled reload.
6. After the registration page is available, the script searches course tables, normalizes Vietnamese portal text internally and matches the configured target rows.
7. Matching eligible rows are selected. If `AUTO_SUBMIT` is false, the script stops at selection and asks the user to review manually.
8. If `AUTO_SUBMIT` is true, the script attempts to click the registration button and schedules a recovery reload.

## Quick Start

1. Install a userscript manager such as [Tampermonkey](https://www.tampermonkey.net/) in Chrome, Microsoft Edge or another compatible browser.
2. Open the raw userscript file:
   [HCMUS Auto DKHP userscript](https://raw.githubusercontent.com/lhlizdabezt/hcmus-auto-dkhp/main/tricker/HCMUS%20Auto%20DKHP%20-%20HK3%2023TC%20Safe-2.0.user.js)
3. Tampermonkey should detect the file and show an installation page.
4. Review the script before installing. Confirm that the `@match` portal URLs and local test paths are appropriate for your browser.
5. Edit the `TARGET_COURSES` configuration before relying on the script.
6. Keep `AUTO_SUBMIT = false` for the first run so you can verify the selected rows manually.
7. Open the HCMUS portal and complete login or CAPTCHA manually where required.

## Configuration

Edit the configuration block near the top of the userscript.

```javascript
const START_AT = "2026-06-01T08:00:00+07:00";
const AUTO_SUBMIT = false;
const AUTO_RELOAD = true;
const RELOAD_SECONDS = 3;
const RELOAD_JITTER_MS = 1200;

const TARGET_COURSES = [
    { code: "CSC10001", cls: "22_1", name: "Sample Course", time: "T2(1-3)" },
    { code: "ETC10001", cls: "23DTV_CLC1", name: "Sample Lab", time: "T4(7-9)" },
];
```

| Setting | Meaning | Recommended first value |
|---|---|---|
| `START_AT` | Official registration opening time in ISO format with timezone | Set to the announced HCMUS opening time |
| `AUTO_SUBMIT` | Whether the script clicks the registration button after target selection | `false` for first run |
| `AUTO_RELOAD` | Whether the script refreshes while waiting | `true` |
| `RELOAD_SECONDS` | Base reload interval | `3` |
| `RELOAD_JITTER_MS` | Random delay added to each reload cycle | `1200` |
| `TARGET_COURSES` | Exact course rows to match | Replace every sample row |

## Target Course Format

Each target entry should match the row shown by the portal.

```javascript
{ code: "ETC10001", cls: "23DTV_CLC1", name: "Course Name", time: "T4(7-9)" }
```

| Key | Description |
|---|---|
| `code` | Course code shown in the portal course table |
| `cls` | Class/group code shown in the portal course table |
| `name` | Human-readable label for your own review |
| `time` | Schedule fragment that must appear in the row |

Use exact course and class values. Keep the schedule string specific enough to avoid selecting a different row with the same course code.

## Safety Boundaries

- The userscript does not solve or bypass CAPTCHA.
- The userscript does not change HCMUS server behavior.
- The userscript does not create hidden network requests outside the normal page workflow.
- The userscript does not store credentials unless `AUTO_LOGIN` is enabled and the user saves them manually.
- Saved login credentials, when enabled, are stored as plain text in browser `localStorage`; do not use that feature on a shared computer.
- The default `AUTO_SUBMIT = false` mode is recommended because it keeps human review before final submission.

## Manual Review Checklist

Before using the script in a live registration window:

1. Confirm the portal URL matches the userscript `@match` patterns.
2. Confirm `START_AT` matches the official opening time.
3. Replace the sample `TARGET_COURSES` entries.
4. Keep `AUTO_SUBMIT = false` for a dry run.
5. Watch the overlay and confirm that the selected course rows are correct.
6. Submit manually only after the selected rows are correct.
7. Use the Stop button in the overlay if the portal state looks different from expected.

## Troubleshooting

| Symptom | Likely Cause | Action |
|---|---|---|
| The overlay does not appear | The URL did not match the userscript patterns or Tampermonkey is disabled | Check Tampermonkey status and the `@match` rules |
| The page keeps refreshing before registration opens | `START_AT` is still in the future | Confirm the opening time and timezone |
| CAPTCHA is visible and refresh stops | This is expected behavior | Complete CAPTCHA manually |
| No active table is found | The portal has not exposed the registration table yet | Wait or review whether you are on `DangKyHocPhan.aspx` |
| A target row is not selected | Course code, class or schedule text does not match exactly | Copy values from the portal row into `TARGET_COURSES` |
| The wrong row is selected | The target schedule string is too broad | Make `time` more specific and keep `AUTO_SUBMIT = false` |
| Login helper shows a warning | Credentials are stored locally as plain text | Use only on a trusted personal machine or leave `AUTO_LOGIN = false` |

## FAQ

### Does this bypass CAPTCHA?

No. CAPTCHA remains manual. The script pauses automatic refresh when it detects the CAPTCHA gate.

### Does this guarantee registration success?

No. It only supports the browser-side workflow. Final registration depends on portal availability, course capacity, account permissions and the official registration rules.

### Why is automatic submit disabled by default?

Manual review is safer. The default behavior selects matching rows but lets the user confirm before submitting.

### Can I use it for different semesters?

Yes, but update `START_AT`, `TARGET_COURSES` and any portal URL changes before each registration period.

### Why does the code normalize Vietnamese portal text internally?

The HCMUS portal may display Vietnamese headings. The script normalizes page text to ASCII for matching while keeping the source code and user-facing overlay in English.

### What should an engineering reviewer inspect?

Review the matching logic, explicit CAPTCHA boundary, local credential warning, reload scheduling, DOM-table detection and release history. These are the main engineering decisions in the repository.

## Release and Tagging Notes

The repository uses GitHub Releases and tags to preserve reviewable snapshots of the userscript, README, release notes and visual assets. The release page is also the stable homepage for portfolio screening.

## Portfolio Context

Luong Hai Long maintains this project as a practical browser-automation and workflow-tooling repository. It complements larger portfolio projects in computer vision, AI/ML, network communications, FPGA/SoC and embedded systems by showing small-tool discipline: source hygiene, explicit boundaries, documentation and release packaging.

## Writing Standard

The README uses restrained engineering prose: direct technical nouns, clear project boundaries, release-backed evidence and no inflated claims beyond what the repository can support.
