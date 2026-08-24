# Changelog

All notable changes to this project are documented here.

## v5.4.0

- Expanded Tampermonkey metadata and the fail-closed runtime origin gate from only `new-portal2` to exactly the official HTTPS hosts `new-portal1` through `new-portal20`; HTTP, out-of-range numbers, lookalike domains and local fixtures remain dry-run.
- Updated the latest published timetable for `BAA00102/25DTV_DKD2` from `T7(7-12)` to `T6(7-12)` while retaining all 21 fallback classes for the seven unfinished targets/13 TC.
- Moved credentials to shared Tampermonkey userscript storage, with automatic migration from the older per-origin `localStorage`, so one saved login works across all 20 Portal nodes; failed shared writes/deletes are surfaced and never reported as a successful per-origin fallback.
- Restricted live class selection to the three verified HCMUS `cbDK` repeater identities and required the live row's credit value to equal the audited target credits.
- Made schedule parsing fail closed for unknown, partial, empty, reversed, or out-of-range meeting fragments instead of silently accepting a recognized substring.
- Made a thrown registration-button click report an ambiguous failure/backoff state rather than the success message used after a completed click.
- Added regression coverage for all 20 allowed hosts, rejected lookalike/out-of-range hosts, HTTP dry-run, exact userscript metadata, shared credentials/migration, decoy tables, malformed schedules, and live-credit mismatch.
- Documented the one-active-portal-tab operating rule; shared storage does not provide an atomic cross-host submit lock.

## v5.3.2

- Reconciled the active configuration against the Faculty's official `CT Dao tao CLC_HK1_2026-2027_gui SV (1).pdf`: all 24 offered course codes are represented exactly once as passed, active target, deferred project, or excluded graduation alternative.
- Confirmed that the revised `ETC10128/23DTV_CLC2` timetable belongs to an already-passed course and therefore does not change the seven active targets/13 TC or their 21 class options.
- Added a runtime configuration gate and regression assertion for exact official-offering code coverage, preventing a future same-count/wrong-code configuration from running.
- Replaced partial timetable matching with exact canonical meeting-slot equality (including `TCN`), so an added or changed live Portal meeting cannot be hidden from conflict detection.
- Removed the broad registration-button fallback; full-auto now clicks only the verified official button ID and fails closed after an unrecognized Portal DOM change.

## v5.3.1

- Restricted the userscript to the official HTTPS Portal origin and made local/saved HTML fixtures dry-run only.
- Added persisted submit retry protection for a failed postback: immediate first attempt, 15-second and 45-second backoff, then a hard stop after three attempts of the same class combination.
- Extended `Dừng` so queued login, DKHP CAPTCHA continuation, navigation and reload callbacks cannot perform an action afterward.
- Expanded regression coverage for the official-origin gate, submit backoff/attempt cap, and stopped queued actions.

## v5.3.0

- Enabled the requested full-auto path: login, navigation, controlled reload, target selection, registration submit, and a narrowly scoped automatic confirmation for the official registration prompt.
- Added idle-debounced automatic `Tiếp Tục` after the user manually types the DKHP image CAPTCHA; CAPTCHA solving/bypass remains out of scope.
- Added automatic navigation from an already-authenticated Portal page, without depending on the short-lived post-login flag.
- Corrected the remaining-degree accounting from 31 to 34 TC: the current 14-course HK3 plan totals 25 rather than 27 TC, and mandatory `MTH00004` (3 TC) was missing from the future-course ledger.
- Kept the active Portal target unchanged at all seven unpassed/open courses (13 TC, 21 class options); `MTH00004` is recorded as not open and `ETC10190` remains deferred.
- Expanded the dependency-free regression harness to cover the 34-TC invariant, DKHP CAPTCHA continuation, scoped confirmation, and authenticated-Portal redirect.

## v5.2.1

- Revalidated the seven required targets/13 TC and all 21 Portal class options directly against `CTDT_K2022_CLC.pdf`, the updated GPA export, and non-GPA completion history; no target changes were needed.
- Cancelled the CAPTCHA poller and queued 200 ms automatic Login click when the user clicks Login manually, preventing a double-submit race.
- Added regression coverage for manual Login during both the CAPTCHA polling phase and the queued auto-click window.

## v5.2.0

- Reconciled the 20/08/2026 Portal open-class list against the updated `GPA.csv` and the existing non-GPA completion evidence.
- Kept the same seven unpassed targets/13 TC; the supplied list still contains the same 24 unique course codes.
- Added every newly published fallback class for unpassed targets: `BAA00102` DKD1/DKD3 and `ETC10021` DKD2.
- Locked all 21 class/time options across the seven targets into the dependency-free regression check.

## v5.1.1

- Enabled the stored-credentials login flow so completing Google reCAPTCHA manually now triggers the Portal login button.
- Made reCAPTCHA token detection resilient to both `window.grecaptcha` and the standard hidden response textarea, including when the API returns an empty response for its default widget.
- Supported manually typed credentials too, while refusing to click Login when either credential field is empty.
- Added a one-watcher guard to prevent duplicate CAPTCHA pollers and duplicate login attempts.
- Corrected the login badge/documentation so they reflect the actual `AUTO_LOGIN` state.
- Added a regression scenario covering credential fill, manual CAPTCHA completion, and the single automatic login click.

## v5.1.0

- Scanned all 24 course codes in the supplied HK1/2026-2027 open-class list against `GPA.csv`, the K2022 CLC curriculum, and `KeHoach_HK_TiepTheo.typ`.
- Expanded the main target from four courses/7 TC to all seven relevant unpassed courses/13 TC, including the three HK2-plan courses currently offered in HK1: `ETC00020`, `ETC10015`, and `ETC10016`.
- Added a complete safety partition: 15 passed courses excluded, `ETC10190` deferred to the planned graduation term, and alternative `ETC10295` excluded.
- Replaced greedy per-course selection with a global timetable planner that maximizes main-course coverage; a Portal rejection rolls back script-selected, unsubmitted checkboxes and triggers a full replan.
- Read current/maximum credits from Portal state (with registered-table fallback), enforce the remaining credit budget, and fail closed when credit totals are unavailable.
- Stop automatic reload after an unresolved Portal rejection, a credit-limit conflict, or a manual checkbox selection; the `Dừng` control now also cancels queued pre-opening reloads.
- Added a dependency-free Node regression harness covering eight configuration, planning, credit, rejection, manual-selection, and reload-safety scenarios.
- Configured the official K2022 opening gate at `2026-09-04T09:00:00+07:00`; did not infer a closing gate from the HCMUS notice's two incorrect `2025` end dates.
- Added validation for the 25-credit term cap, the 31-credit remaining plan, and the complete 24-code open-course partition.
- Reduced far-future reload frequency while preserving the near-opening retry cadence.

## v5.0.0

- Replaced sample targets with the HK1 2026-2027 plan derived from `KeHoach_HK_TiepTheo.typ` and the supplied open-class list.
- Added ordered class fallbacks with timetable-conflict checks; only one class can be selected per course.
- Accounted for four currently open main-plan courses (7 TC), seven not-yet-open courses (8 TC), and an opt-in `ETC00015` retake.
- Fixed registered-course detection for HCMUS `cbHuyDK` tables.
- Stopped manual review mode from losing checked rows to the heartbeat reload.
- Removed forced checkbox state and preserved the portal's official alert/confirm checks.
- Made an empty or invalid `START_AT` fail closed instead of starting immediately.

## v4.3.0

- Added professional userscript metadata for Tampermonkey update/install flow.
- Set public defaults to safer review mode: `AUTO_SUBMIT = false` and `AUTO_LOGIN = false`.
- Replaced personal target courses with sample configuration values.
- Documented install, configuration, safety checklist, troubleshooting, and release workflow.
- Kept portal snapshots, CAPTCHA state, session artifacts, and downloaded portal assets ignored by default.
