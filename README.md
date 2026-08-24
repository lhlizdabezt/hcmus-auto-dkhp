# HCMUS Auto DKHP

[![Release](https://img.shields.io/github/v/release/lhlizdabezt/hcmus-auto-dkhp?style=flat-square&label=release)](https://github.com/lhlizdabezt/hcmus-auto-dkhp/releases/latest)
[![Regression checks](https://img.shields.io/badge/regression%20checks-29%20passing-16803c?style=flat-square)](#verification)
[![JavaScript](https://img.shields.io/badge/JavaScript-Tampermonkey-f7df1e?style=flat-square&logo=javascript&logoColor=111827)](https://www.tampermonkey.net/)
[![License: MIT](https://img.shields.io/badge/license-MIT-2563eb?style=flat-square)](LICENSE)

![HCMUS Auto DKHP v5.4.0 portfolio visual](assets/portfolio-motion.svg)

HCMUS Auto DKHP is a Tampermonkey userscript for the official HCMUS course-registration portal. It coordinates scheduled access, optional credential filling, manual CAPTCHA checkpoints, exact course-row matching, timetable planning, credit-limit checks, bounded submission retries, and narrowly scoped registration confirmation.

The implementation is deliberately fail-closed. It will not solve or bypass CAPTCHA, guess changed portal controls, accept partial timetable data, or report a credential write as successful when Tampermonkey storage fails.

> **Important:** v5.4.0 contains a release-specific HK1 2026-2027 plan and has the automatic workflow enabled. Review every target, schedule, credit value, opening time, and switch before using it with your account. Registration availability and acceptance remain decisions of HCMUS.

## Project status

| Item | Current evidence |
|---|---|
| Release | `v5.4.0` |
| Official hosts | HTTPS `new-portal1.hcmus.edu.vn` through `new-portal20.hcmus.edu.vn` |
| Release plan | 7 target courses, 13 credits, 21 ordered class options |
| University limit encoded | 25 credits |
| CAPTCHA boundary | Manual completion only |
| Registration control | Exact verified HCMUS button identity; no text fallback |
| Verification | 29 dependency-free Node.js regression checks |
| Intended environment | Microsoft Edge or Chrome, with Tampermonkey |

The configured opening gate is `2026-09-04T09:00:00+07:00`, matching the K2024-and-earlier start published in the [official HCMUS HK1 2026-2027 notice](https://hcmus.edu.vn/thong-bao-dang-ky-hoc-phan-hk1-2026-2027-doi-voi-sinh-vien-chuong-trinh-clc-tcta-va-viet-phap/). The script does not infer a closing time from inconsistent dates in that notice.

## Installation

### 1. Install Tampermonkey

Install Tampermonkey from its [official website](https://www.tampermonkey.net/) or your browser's extension store.

### 2. Install the userscript

Open the [raw userscript](https://raw.githubusercontent.com/lhlizdabezt/hcmus-auto-dkhp/main/tricker/HCMUS%20Auto%20DKHP%20-%20HK3%2023TC%20Safe-2.0.user.js), review the source shown by Tampermonkey, and select **Install**.

The historical filename is retained so existing Tampermonkey installations continue to receive updates. The metadata version and release tag are the authoritative version identifiers.

### 3. Review the configuration

Open the installed script in the Tampermonkey editor and inspect the configuration block near the top of the file.

For a first review, use this conservative profile:

```javascript
const AUTO_SUBMIT = false;
const AUTO_CONFIRM_REGISTRATION = false;
const AUTO_RELOAD = false;
const AUTO_LOGIN = false;
const AUTO_NAV_TO_DKHP = false;
const AUTO_DKHP_CAPTCHA_CONTINUE = false;
```

Then verify `START_AT`, `MAIN_TARGET_COURSES`, every class code and meeting time, `OPTIONAL_RETAKES`, and `TERM_CREDIT_LIMIT` against your current official sources. Enable one automation stage at a time only after a successful review.

### 4. Use one active portal tab

Run the script in only one active HCMUS portal tab. Credentials are shared through Tampermonkey across the 20 official hosts, but browser storage does not provide an atomic cross-host submission lock. Multiple active tabs can therefore race.

### 5. Complete CAPTCHA manually

The user must complete Google reCAPTCHA on the login page and type the HCMUS image CAPTCHA on the registration gate. The script can continue after manual completion when the corresponding switch is enabled; it does not recognize, solve, or bypass either challenge.

## Workflow

1. Confirm that the page is one of the 20 allow-listed HTTPS HCMUS hosts. All other origins remain dry-run.
2. Wait for the configured opening time and apply jittered reload timing when enabled.
3. Optionally fill a stored username and password; wait for manual reCAPTCHA completion.
4. Optionally navigate an authenticated session to `DangKyHocPhan.aspx`.
5. Pause reloads while the user types the registration CAPTCHA.
6. Read only verified registration-table rows and checkbox identities.
7. Require exact course code, class code, timetable, and credit equality.
8. Build a global non-conflicting plan within the available credit budget.
9. Roll back script-selected boxes and replan if the portal rejects an option.
10. Submit through the exact official control, with `0`, `15`, and `45` second retry stages and a hard stop after three attempts for the same combination.
11. Confirm only the official registration prompt when automatic confirmation is enabled.

## Configuration reference

| Setting | Purpose |
|---|---|
| `START_AT` | ISO 8601 registration opening time with explicit UTC offset |
| `AUTO_SUBMIT` | Click the verified registration button after a valid plan is selected |
| `AUTO_CONFIRM_REGISTRATION` | Accept only the narrowly matched registration confirmation prompt |
| `AUTO_RELOAD` | Enable scheduled portal reloads |
| `RELOAD_SECONDS` | Base reload interval near opening |
| `RELOAD_JITTER_MS` | Random additional delay that reduces synchronized requests |
| `AUTO_LOGIN` | Fill stored credentials and continue after manual reCAPTCHA |
| `AUTO_NAV_TO_DKHP` | Navigate an authenticated portal session to registration |
| `AUTO_DKHP_CAPTCHA_CONTINUE` | Continue after the user finishes typing the image CAPTCHA |
| `MAIN_TARGET_COURSES` | Ordered course, class, meeting-time, and credit evidence |
| `OPTIONAL_RETAKES` | Explicit opt-in retake or improvement targets |
| `TERM_CREDIT_LIMIT` | Local upper bound; the lower portal-reported limit still wins |

Each target follows this structure:

```javascript
{
    code: "COURSE_CODE",
    name: "Course name for review",
    credits: 3,
    options: [
        { cls: "CLASS_CODE_1", time: "T2(1-3)" },
        { cls: "CLASS_CODE_2", time: "T4(7-9)" },
    ],
}
```

Options are ordered by preference. The planner may omit a course when every available option conflicts, exceeds the remaining credit budget, fails an exact row check, or has already been rejected during the current planning cycle.

## Safety boundaries

- **Official origins only:** HTTP, local fixtures, saved HTML, lookalike domains, and hosts outside `new-portal1` to `new-portal20` cannot submit.
- **Manual CAPTCHA:** no CAPTCHA solving, outsourcing, token reuse, or bypass mechanism is included.
- **Exact live evidence:** unknown, incomplete, reversed, or out-of-range meeting fragments are treated as conflicts.
- **Exact controls:** the script recognizes only audited HCMUS checkbox and registration-button identities.
- **Credit guard:** the configured 25-credit ceiling is never widened; a lower portal-specific limit is honored.
- **Manual-selection guard:** unexpected checked rows stop automatic submission.
- **Bounded retries:** one class combination receives at most three submit attempts before a hard stop.
- **Visible stop control:** **Stop** cancels queued reload, navigation, login, CAPTCHA-continuation, and submission actions. **Reset** is required to resume.
- **Plain-text credential warning:** optional credentials are stored by Tampermonkey in plain text. Do not use this feature on a shared or untrusted computer.

## Verification

No package installation is required. From the repository root, run:

```powershell
node --check "tricker/HCMUS Auto DKHP - HK3 23TC Safe-2.0.user.js"
node tests/userscript-regression.cjs
git diff --check
```

The regression harness currently checks configuration invariants, all 20 official hosts, rejected hosts and protocols, shared credential storage and migration, opening-plan coverage, exact checkbox and button identities, malformed timetables, live-credit mismatch, credit-budget behavior, global rollback and replanning, manual-selection stops, dry-run behavior, CAPTCHA continuation, navigation, confirmation scope, click exceptions, and bounded submit backoff.

These are deterministic source and simulated-DOM checks. They do not constitute a live HCMUS registration or a guarantee that the portal has not changed.

## Repository structure

```text
.
|-- assets/
|   `-- portfolio-motion.svg
|-- tests/
|   `-- userscript-regression.cjs
|-- tricker/
|   `-- HCMUS Auto DKHP - HK3 23TC Safe-2.0.user.js
|-- .gitattributes
|-- .gitignore
|-- CHANGELOG.md
|-- LICENSE
|-- README.md
`-- RELEASE_NOTES.md
```

Saved portal pages, CAPTCHA images, ASP.NET state, browser traces, test output, temporary files, personal academic records, and unpublished faculty documents are intentionally excluded from the public repository.

## Troubleshooting

### The script says that the origin is not official

Use an HTTPS host from `new-portal1.hcmus.edu.vn` through `new-portal20.hcmus.edu.vn`. Saved pages and local fixtures are intentionally non-operational.

### The script does not click a class

Compare the live course code, class code, credit value, and complete timetable with the configured option. A mismatch is a safety stop, not a fuzzy match.

### The script cannot read the credit total

Do not force submission. Reload manually, inspect the registered-course table and portal summary, and confirm that the page layout has not changed.

### The login panel cannot save credentials

Confirm that Tampermonkey granted `GM_getValue`, `GM_setValue`, and `GM_deleteValue`. Storage failures are reported and do not silently fall back to per-origin data.

### Automatic actions stopped after an error

Read the overlay message and the portal response first. Correct the configuration or portal state, then use **Reset** only when retrying is appropriate.

### Does the project guarantee registration success?

No. Seat availability, prerequisites, account eligibility, portal behavior, network conditions, and HCMUS policy remain outside the userscript's control.

## Maintainer and contact

**Luong Hai Long** (`22207056`)<br>
Electronics and Telecommunications, University of Science, Vietnam National University Ho Chi Minh City

[GitHub](https://github.com/lhlizdabezt) | [LinkedIn](https://www.linkedin.com/in/lhlizdabezt) | [Facebook](https://www.facebook.com/wageseadrake) | [Instagram](https://www.instagram.com/lhlizdabezt) | [YouTube](https://www.youtube.com/@lhlizdabezt) | [TikTok](https://www.tiktok.com/@wageseadrake)

Student email: [22207056@student.hcmus.edu.vn](mailto:22207056@student.hcmus.edu.vn)<br>
Work email: [luonghailong.work@gmail.com](mailto:luonghailong.work@gmail.com)<br>
Telephone: [+84 988 114 708](tel:+84988114708)

For defects or portal-compatibility reports, use [GitHub Issues](https://github.com/lhlizdabezt/hcmus-auto-dkhp/issues) and remove credentials, student identifiers, CAPTCHA content, session values, and ASP.NET page state before attaching evidence.

## License and responsible use

Released under the [MIT License](LICENSE). This is an independent student engineering project and is not an official HCMUS service. Users are responsible for reviewing the source, following university rules, protecting account data, and verifying every registration result directly on the official portal.
