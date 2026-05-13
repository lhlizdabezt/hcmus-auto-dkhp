# HCMUS Auto DKHP

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=700&size=24&duration=2600&pause=700&color=0F766E&center=true&vCenter=true&width=900&lines=HCMUS+Course+Registration+Userscript;Tampermonkey+%7C+JavaScript+%7C+Safe+Defaults;Auto+Reload+%E2%86%92+Target+Match+%E2%86%92+Optional+Submit" alt="Animated HCMUS Auto DKHP title" />
</p>

<p align="center">
  <a href="https://github.com/lhlizdabezt/hcmus-auto-dkhp/releases/latest">
    <img src="https://img.shields.io/github/v/release/lhlizdabezt/hcmus-auto-dkhp?style=for-the-badge&logo=github&label=Release" alt="Latest release" />
  </a>
  <a href="https://github.com/lhlizdabezt/hcmus-auto-dkhp/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/lhlizdabezt/hcmus-auto-dkhp?style=for-the-badge&color=0f766e" alt="License" />
  </a>
  <a href="https://www.tampermonkey.net/">
    <img src="https://img.shields.io/badge/Tampermonkey-Userscript-00485B?style=for-the-badge&logo=tampermonkey&logoColor=white" alt="Tampermonkey userscript" />
  </a>
  <a href="https://new-portal2.hcmus.edu.vn/">
    <img src="https://img.shields.io/badge/HCMUS-Portal-2563EB?style=for-the-badge" alt="HCMUS portal" />
  </a>
</p>

<p align="center">
  <b>Course-registration helper for the HCMUS portal.</b><br/>
  Auto navigates, waits for a configured start time, reloads safely, matches target classes, ticks matched rows, and can optionally submit.
</p>

> [!IMPORTANT]
> This project does **not** bypass CAPTCHA, authentication, seat limits, portal policies, or any school-side validation. CAPTCHA and account authentication remain manual/official portal steps. Use responsibly.

## Why This Repo Looks Like This

This repository is intentionally small and reviewable:

- only the reusable Tampermonkey userscript is tracked;
- saved portal HTML, ViewState, CAPTCHA state, cookies, session data, and local test snapshots are ignored;
- public defaults are conservative: `AUTO_SUBMIT = false` and `AUTO_LOGIN = false`;
- configuration is explicit at the top of the script, so behavior is easy to audit before running.

## Engineering Highlights

| Area | Implementation signal |
| --- | --- |
| Browser automation | Tampermonkey userscript, `document-start`, DOM detection, stateful reload loop |
| Course matching | normalized course code, class code, and schedule matching from portal tables |
| Safe execution | manual CAPTCHA gate, stop/reset badge, heartbeat reload guard, opt-in submit |
| UX | floating status badge with countdown, selected-course summary, stop/reset controls |
| Maintainability | single-file JavaScript, no build system, no server, no external runtime dependency |

## Features

- 🚀 Auto navigate from the HCMUS portal to the course-registration page.
- ⏱ Wait until `START_AT` before attempting registration.
- 🔁 Reload with jitter while waiting for course tables or target rows.
- 🎯 Match target courses by `code`, `cls`, and `time`.
- ✅ Tick matched classes automatically.
- 🧯 Provide a floating badge with status, countdown, `Dừng`, and `Reset`.
- 🔐 Optional login helper using browser `localStorage` only when `AUTO_LOGIN = true`.
- 🧾 Optional submit only when `AUTO_SUBMIT = true`.

## Quick Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) for your browser.
2. Open the raw userscript:

   [Install HCMUS Auto DKHP](https://raw.githubusercontent.com/lhlizdabezt/hcmus-auto-dkhp/main/tricker/HCMUS%20Auto%20DKHP%20-%20HK3%2023TC%20Safe-2.0.user.js)

3. When Tampermonkey opens the install screen, choose `Install`.
4. Open `Tampermonkey Dashboard` and confirm `HCMUS Auto DKHP - HK3 23TC Safe` is enabled.

If the browser shows plain text instead of the Tampermonkey installer:

1. Open `Tampermonkey Dashboard`.
2. Choose `Create a new script`.
3. Delete the default template.
4. Paste the contents of [`tricker/HCMUS Auto DKHP - HK3 23TC Safe-2.0.user.js`](tricker/HCMUS%20Auto%20DKHP%20-%20HK3%2023TC%20Safe-2.0.user.js).
5. Press `Ctrl + S`.

## Configure Before Running

Open the script in Tampermonkey and edit the config block near the top.

### Start Time

```js
const START_AT = "2026-06-01T08:00:00+07:00";
```

Use the real registration opening time. Keep the ISO format and the Vietnam timezone offset `+07:00`.

### Target Courses

```js
const TARGET_COURSES = [
  { code: "CSC10001", cls: "22_1", name: "Sample Course", time: "T2(1-3)" },
  { code: "ETC10001", cls: "23DTV_CLC1", name: "Sample Lab", time: "T4(7-9)" },
];
```

Copy `code`, `cls`, and `time` directly from the portal to avoid whitespace, accent, or formatting mismatch.

### Submit Mode

```js
const AUTO_SUBMIT = false;
```

- `false`: tick matching classes only. You review and submit manually.
- `true`: click the registration button after matching target rows.

Recommended workflow: test with `AUTO_SUBMIT = false`; enable `true` only after you have verified the target list.

### Reload Mode

```js
const AUTO_RELOAD = true;
const RELOAD_SECONDS = 3;
const RELOAD_JITTER_MS = 1200;
```

Increase `RELOAD_SECONDS` to `5`, `8`, or `10` if the portal is slow or if you want a gentler refresh loop.

### Login Helper

```js
const AUTO_LOGIN = false;
const AUTO_NAV_TO_DKHP = true;
```

`AUTO_LOGIN` is disabled by default. If enabled, credentials are stored in browser `localStorage` as plain text. Do not enable it on a shared machine.

## Runbook

1. Open the official portal: <https://new-portal2.hcmus.edu.vn/>.
2. Sign in with your student account.
3. Complete CAPTCHA manually if required.
4. Navigate to `DangKyHocPhan.aspx`.
5. Confirm the script badge appears.
6. Keep one active portal tab open before `START_AT`.
7. When the start time arrives, the script reloads, matches, ticks, and optionally submits depending on your config.

## Safety Checklist

- [ ] `TARGET_COURSES` exactly matches the portal rows.
- [ ] `START_AT` uses the real opening time and `+07:00`.
- [ ] First test uses `AUTO_SUBMIT = false`.
- [ ] No account, password, cookie, portal HTML, ViewState, CAPTCHA state, or session file is committed.
- [ ] Only one browser tab runs the userscript unless you intentionally need otherwise.

## Troubleshooting

### The script does not run

- Confirm Tampermonkey is enabled.
- Confirm the userscript is enabled in `Tampermonkey Dashboard`.
- Refresh the portal page.
- Check that the URL is under `new-portal2.hcmus.edu.vn` or `DangKyHocPhan.aspx`.

### The script does not tick a course

- Re-copy `code`, `cls`, and `time` from the portal.
- Check whether the target class is already registered.
- If HCMUS changes the page HTML, table selectors may need an update.

### The portal keeps refreshing too fast

Set a slower interval:

```js
const RELOAD_SECONDS = 8;
```

Or disable automatic reload:

```js
const AUTO_RELOAD = false;
```

### CAPTCHA blocks progress

This is expected. The script pauses reload on the CAPTCHA gate so you can solve it manually. After passing CAPTCHA, the script continues on the registration page.

### Emergency stop

- Click `Dừng` on the badge.
- Or disable the userscript in Tampermonkey.
- Or close the portal tab.

## Repository Structure

```text
.
├── .gitignore
├── CHANGELOG.md
├── LICENSE
├── README.md
└── tricker/
    └── HCMUS Auto DKHP - HK3 23TC Safe-2.0.user.js
```

## Release

Latest release: [v4.3.0](https://github.com/lhlizdabezt/hcmus-auto-dkhp/releases/tag/v4.3.0)

Install directly from the release-ready raw script:

```text
https://raw.githubusercontent.com/lhlizdabezt/hcmus-auto-dkhp/main/tricker/HCMUS%20Auto%20DKHP%20-%20HK3%2023TC%20Safe-2.0.user.js
```

## Author

**Lương Hải Long**  
Electronics & Telecommunications student, HCMUS  
GitHub: [@lhlizdabezt](https://github.com/lhlizdabezt)

## License

MIT License. See [LICENSE](LICENSE).

## Disclaimer

This is a personal educational automation project and is not affiliated with, endorsed by, or maintained by HCMUS. Use it only in ways that comply with school rules, portal policies, and your own responsibility.
