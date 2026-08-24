# HCMUS Auto DKHP v5.4.0

## Scope

Version 5.4.0 publishes the audited HK1 2026-2027 workflow for the 20 official HTTPS HCMUS portal hosts. It preserves manual CAPTCHA completion and strengthens the boundaries around credentials, live row evidence, timetable parsing, and repeated submission.

## Changes

- Allow-listed exactly `new-portal1.hcmus.edu.vn` through `new-portal20.hcmus.edu.vn`; HTTP, local files, saved pages, out-of-range hosts, and lookalike domains remain dry-run.
- Updated the current seven-course, 13-credit release plan while retaining 21 ordered class alternatives.
- Shared optional credentials across official hosts through Tampermonkey storage and made failed writes, reads, migrations, and deletions visible.
- Required verified HCMUS checkbox identities plus exact live course, class, timetable, and credit values.
- Made unknown, partial, empty, reversed, and out-of-range timetable fragments fail closed.
- Added global rollback and replanning when a portal option is rejected.
- Retained a 25-credit local ceiling while honoring any lower limit reported by the account's portal state.
- Added staged submit retries at 0, 15, and 45 seconds, followed by a hard stop after three attempts for the same class combination.
- Treated a thrown registration-button click as an ambiguous failure instead of reporting success.
- Expanded the dependency-free regression harness to 29 checks.
- Rebuilt the English README and ASCII-only SVG visual with no connector lines.

## Operating boundary

The release configuration enables automatic login support, navigation, reload, selection, submission, and narrowly scoped confirmation. The user must still complete both CAPTCHA checkpoints manually. Review all release-specific targets and switches before use, and keep only one active portal tab because browser storage does not provide an atomic cross-host submit lock.

This project does not claim privileged portal access, CAPTCHA bypass, guaranteed seat availability, or guaranteed registration success.
