// ==UserScript==
// @name         HCMUS Auto DKHP - HK3 23TC Safe
// @namespace    https://github.com/lhlizdabezt/hcmus-auto-dkhp
// @version      4.4.0
// @description  Tampermonkey helper for HCMUS course registration: scheduled reload, target matching, optional checkbox selection and optional submit. Does not bypass CAPTCHA.
// @author       Luong Hai Long
// @homepageURL  https://github.com/lhlizdabezt/hcmus-auto-dkhp
// @supportURL   https://github.com/lhlizdabezt/hcmus-auto-dkhp/issues
// @downloadURL  https://raw.githubusercontent.com/lhlizdabezt/hcmus-auto-dkhp/main/tricker/HCMUS%20Auto%20DKHP%20-%20HK3%2023TC%20Safe-2.0.user.js
// @updateURL    https://raw.githubusercontent.com/lhlizdabezt/hcmus-auto-dkhp/main/tricker/HCMUS%20Auto%20DKHP%20-%20HK3%2023TC%20Safe-2.0.user.js
// @license      MIT
// @match        https://new-portal2.hcmus.edu.vn/*
// @match        http://new-portal2.hcmus.edu.vn/*
// @match        *://*/DangKyHocPhan.aspx*
// @match        *://*/Login.aspx*
// @match        file:///*DangKy*
// @match        file:///*dkhp*
// @match        file:///*Login*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    "use strict";

    // ==== CONFIGURATION ====
    const START_AT = "2026-06-01T08:00:00+07:00"; // Replace with the official registration opening time.
    const AUTO_SUBMIT = false;                    // true = submit after the exact target rows are selected.
    const AUTO_RELOAD = true;                     // false = do not refresh automatically.
    const RELOAD_SECONDS = 3;                     // Base reload interval in seconds.
    const RELOAD_JITTER_MS = 1200;                // Adds 0..N ms random delay to reduce synchronized refresh.
    const POST_SUBMIT_RELOAD_SEC = 6;             // Recovery reload after clicking Submit.
    const HEARTBEAT_RELOAD_SEC = 12;              // Recovery reload if no decision is reached.

    // ==== OPTIONAL LOGIN SUPPORT ====
    const AUTO_LOGIN = false;                     // true = enable localStorage-assisted login after manual setup.
    const AUTO_NAV_TO_DKHP = true;                // Navigate to DangKyHocPhan.aspx after login succeeds.
    const CAPTCHA_POLL_MS = 400;                  // Poll interval after the user completes CAPTCHA.
    const CAPTCHA_WAIT_MAX_MIN = 5;               // Stop waiting for CAPTCHA after this many minutes.
    const CREDS_KEY = "hcmus-creds-v1";           // localStorage key for saved username/password.

    const TARGET_COURSES = [
        { code: "CSC10001", cls: "22_1", name: "Sample Course", time: "T2(1-3)" },
        { code: "ETC10001", cls: "23DTV_CLC1", name: "Sample Lab", time: "T4(7-9)" },
    ];

    const RUN_ID = "hcmus-dkhp-hk3-23tc-safe-v4";
    const STOP_KEY = `${RUN_ID}:stopped`;
    const LAST_TICK_KEY = `${RUN_ID}:lastTick`;
    const RELOAD_COUNT_KEY = `${RUN_ID}:reloadCount`;
    const JUST_LOGGED_IN_KEY = `${RUN_ID}:justLoggedIn`;
    const POST_LOGIN_NAV_MAX_SEC = 30;

    try { window.confirm = () => true; } catch (e) { }
    try { window.alert = () => undefined; } catch (e) { }
    try { window.onbeforeunload = null; } catch (e) { }

    try {
        const n = Number(localStorage.getItem(RELOAD_COUNT_KEY) || "0") + 1;
        localStorage.setItem(RELOAD_COUNT_KEY, String(n));
        console.log("[HCMUS Auto DKHP] page load #" + n + " @ " + location.href);
    } catch (e) { }

    function norm(value) {
        return String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[\u0110\u0111]/g, "d")
            .replace(/\s+/g, " ")
            .trim()
            .toUpperCase();
    }

    function key(target) {
        return `${target.code}|${target.cls}|${target.time}`;
    }

    function log(...args) {
        console.log("[HCMUS Auto DKHP]", ...args);
    }

    function makeBadge() {
        let el = document.getElementById("hcmus-auto-dkhp-badge");
        if (el) return el;

        el = document.createElement("div");
        el.id = "hcmus-auto-dkhp-badge";
        el.style.cssText = `
            position: fixed;
            right: 12px;
            bottom: 12px;
            z-index: 999999;
            max-width: 460px;
            padding: 10px 12px;
            font: 13px/1.45 Arial, sans-serif;
            color: #111;
            background: #fff;
            border: 1px solid #bbb;
            border-radius: 8px;
            box-shadow: 0 2px 12px rgba(0,0,0,.2);
            white-space: pre-wrap;
        `;

        const stopBtn = document.createElement("button");
        stopBtn.textContent = "Stop";
        stopBtn.style.cssText = `
            float: right;
            margin-left: 8px;
            padding: 2px 8px;
            font: 12px Arial, sans-serif;
            cursor: pointer;
            border: 1px solid #c33;
            background: #fee;
            color: #c33;
            border-radius: 4px;
        `;
        stopBtn.onclick = () => {
            localStorage.setItem(STOP_KEY, "1");
            setBadge("Manual stop is active. Automatic reload will not restart.\nTo resume, clear this localStorage key: " + STOP_KEY);
        };

        const resetBtn = document.createElement("button");
        resetBtn.textContent = "Reset";
        resetBtn.style.cssText = `
            float: right;
            margin-left: 8px;
            padding: 2px 8px;
            font: 12px Arial, sans-serif;
            cursor: pointer;
            border: 1px solid #36c;
            background: #eef;
            color: #36c;
            border-radius: 4px;
        `;
        resetBtn.onclick = () => {
            localStorage.removeItem(STOP_KEY);
            localStorage.removeItem(LAST_TICK_KEY);
            location.reload();
        };

        const text = document.createElement("div");
        text.id = "hcmus-auto-dkhp-badge-text";

        el.appendChild(stopBtn);
        el.appendChild(resetBtn);
        el.appendChild(text);
        document.body.appendChild(el);
        return el;
    }

    function setBadge(text) {
        makeBadge();
        const target = document.getElementById("hcmus-auto-dkhp-badge-text");
        if (target) target.textContent = text;
    }

    let reloadScheduled = false;

    function scheduleReload(reason, baseSec) {
        if (!AUTO_RELOAD) {
            setBadge(`${reason}\nAUTO_RELOAD is false; no automatic refresh is scheduled.`);
            return;
        }
        if (reloadScheduled) return;
        reloadScheduled = true;

        const base = (baseSec ?? RELOAD_SECONDS) * 1000;
        const delay = base + Math.floor(Math.random() * RELOAD_JITTER_MS);
        const endAt = Date.now() + delay;

        const tick = () => {
            const left = Math.max(0, endAt - Date.now());
            setBadge(`${reason}\nReload in ${(left / 1000).toFixed(1)} seconds.`);
            if (left <= 0) return;
            setTimeout(tick, 200);
        };
        tick();

        setTimeout(() => location.reload(), delay);
    }

    function armHeartbeat() {
        if (!AUTO_RELOAD) return;
        setTimeout(() => {
            if (localStorage.getItem(STOP_KEY) === "1") return;
            if (!reloadScheduled) {
                log("Heartbeat reload fired because no decision was reached.");
                location.reload();
            }
        }, HEARTBEAT_RELOAD_SEC * 1000);
    }

    function waitForStartTime() {
        if (!START_AT) return false;

        const startMs = new Date(START_AT).getTime();
        if (Number.isNaN(startMs)) {
            setBadge("START_AT has an invalid format. Use a value such as 2026-06-01T08:00:00+07:00.");
            return true;
        }

        const diff = startMs - Date.now();
        if (diff > 0) {
            const reason = `Registration has not opened yet. Remaining time: ${Math.ceil(diff / 1000)} seconds.`;
            const wait = diff > 60000 ? 30 : Math.max(1, Math.ceil(diff / 1000) - 1);
            scheduleReload(reason, wait);
            return true;
        }

        return false;
    }

    function timedOutOrStopped() {
        if (localStorage.getItem(STOP_KEY) === "1") {
            setBadge("The userscript is stopped.\nClick Reset or clear the localStorage key to resume: " + STOP_KEY);
            return true;
        }
        return false;
    }

    function getHeaderMap(table) {
        const map = {};
        const headerRow = Array.from(table.querySelectorAll("tr")).find((row) => {
            const text = norm(row.textContent);
            return text.includes("MA MH") && text.includes("TEN LOP");
        });

        if (!headerRow) return null;

        const cells = Array.from(headerRow.querySelectorAll("th,td"));
        cells.forEach((cell, index) => {
            const h = norm(cell.textContent);
            if (h.includes("MA MH")) map.code = index;
            if (h.includes("TEN LOP") || h === "LOP") map.cls = index;
            if (h.includes("LICH HOC")) map.time = index;
            if (h.includes("CHON")) map.choose = index;
        });

        if (map.code == null || map.cls == null || map.time == null) return null;
        return map;
    }

    function findCourseTables() {
        return Array.from(document.querySelectorAll("table"))
            .map((table) => ({ table, map: getHeaderMap(table) }))
            .filter((item) => item.map);
    }

    function getRowsFromTable(table) {
        return Array.from(table.querySelectorAll("tbody tr"))
            .filter((row) => row.querySelectorAll("td").length >= 4);
    }

    function isRegisteredRow(row, target) {
        const text = norm(row.textContent);
        return text.includes(norm(target.code)) && text.includes(norm(target.cls));
    }

    function getAlreadyRegisteredTargets() {
        const done = new Set();

        for (const { table } of findCourseTables()) {
            const aroundText = norm(table.parentElement?.textContent || "");
            const looksRegisteredTable =
                aroundText.includes("DANH SACH LOP DA DANG KY") ||
                aroundText.includes("DA DANG KY");

            if (!looksRegisteredTable) continue;

            for (const row of getRowsFromTable(table)) {
                for (const target of TARGET_COURSES) {
                    if (isRegisteredRow(row, target)) done.add(key(target));
                }
            }
        }

        return done;
    }

    function findAllowedCourseTables() {
        return findCourseTables().filter(({ table }) => {
            const text = norm(table.parentElement?.textContent || table.textContent);
            const hasCheckbox = !!table.querySelector("input[type='checkbox']");

            const isRegisteredTable =
                text.includes("DANH SACH LOP DA DANG KY") ||
                !!table.querySelector("input[name*='cbHuyDK']");

            if (isRegisteredTable) return false;

            const looksAllowed =
                text.includes("DUOC PHEP DANG KY") ||
                text.includes("DANH SACH LOP MO") ||
                text.includes("DANH SACH LOP") ||
                hasCheckbox;
            return looksAllowed && hasCheckbox;
        });
    }

    function rowMatchesTarget(row, map, target) {
        const tds = Array.from(row.querySelectorAll("td"));
        const code = norm(tds[map.code]?.textContent);
        const cls = norm(tds[map.cls]?.textContent);
        const time = norm(tds[map.time]?.textContent);

        return (
            code === norm(target.code) &&
            cls === norm(target.cls) &&
            time.includes(norm(target.time))
        );
    }

    function selectTargets() {
        const done = getAlreadyRegisteredTargets();
        const leftTargets = TARGET_COURSES.filter((target) => !done.has(key(target)));

        if (!leftTargets.length) {
            localStorage.setItem(STOP_KEY, "1");
            return { selected: [], done, leftTargets: [], status: "all_done" };
        }

        const allowedTables = findAllowedCourseTables();
        if (!allowedTables.length) {
            return { selected: [], done, leftTargets, status: "no_active_table" };
        }

        const selected = [];

        for (const { table, map } of allowedTables) {
            for (const row of getRowsFromTable(table)) {
                for (const target of leftTargets) {
                    if (!rowMatchesTarget(row, map, target)) continue;

                    const checkbox = row.querySelector("input[type='checkbox']");
                    if (!checkbox || checkbox.disabled) {
                        log("Target row found, but the checkbox is missing or disabled:", target);
                        continue;
                    }

                    if (!checkbox.checked) {
                        checkbox.click();
                        if (!checkbox.checked) {
                            checkbox.checked = true;
                            checkbox.dispatchEvent(new Event("input", { bubbles: true }));
                            checkbox.dispatchEvent(new Event("change", { bubbles: true }));
                        }
                    }

                    selected.push(target);
                }
            }
        }

        return { selected, done, leftTargets, status: selected.length ? "ok" : "no_match_yet" };
    }

    function findRegisterButton() {
        const direct = document.getElementById("ctl00_ContentPlaceHolder1_ViewThongTinDangKy1_btnDangKy");
        if (direct) return direct;

        const candidates = Array.from(
            document.querySelectorAll("input[type='submit'], input[type='button'], button")
        );

        return candidates.find((button) => {
            const text = norm([
                button.value,
                button.innerText,
                button.textContent,
                button.id,
                button.name,
                button.getAttribute("onclick"),
            ].join(" "));

            const yes =
                text.includes("DANG KY") ||
                text.includes("DANGKY") ||
                text.includes("DKHP") ||
                text.includes("BTNDANGKY");

            const no =
                text.includes("HUY") ||
                text.includes("XEM") ||
                text.includes("XOA") ||
                text.includes("BTNDELETE");

            return yes && !no;
        }) || null;
    }

    function muteBlockingDialogs() {
        try { window.confirm = () => true; } catch (e) { }
        try { window.alert = () => undefined; } catch (e) { }
        try { window.onbeforeunload = null; } catch (e) { }
    }

    function submitSelected(selected) {
        if (!selected.length) return false;

        const lines = selected.map((item) => `${item.code} - ${item.cls} - ${item.time}`).join("\n");

        if (!AUTO_SUBMIT) {
            setBadge(
                "Target rows have been selected. AUTO_SUBMIT is false, so the script will not submit automatically.\n\n" +
                lines + "\n\nReview the rows and submit manually, or set AUTO_SUBMIT to true."
            );
            return true;
        }

        muteBlockingDialogs();

        const button = findRegisterButton();
        if (!button) {
            setBadge("Rows were selected, but the registration button was not found. Submit manually if the selection is correct.\n\n" + lines);
            scheduleReload("Registration button was not found after target selection.", POST_SUBMIT_RELOAD_SEC);
            return true;
        }

        setBadge("Rows were selected. Submitting now:\n\n" + lines);
        localStorage.setItem(LAST_TICK_KEY, String(Date.now()));

        try {
            button.click();
        } catch (e) {
            log("button.click() failed; the portal may require manual submission.", e);
        }

        scheduleReload("Submit was clicked. Scheduling a recovery reload.", POST_SUBMIT_RELOAD_SEC);
        return true;
    }

    function isOnLoginPage() {
        if (/Login\.aspx/i.test(location.pathname)) return true;
        if (document.getElementById("ctl00_ContentPlaceHolder1_txtPassword")) return true;
        const title = norm(document.title || "");
        return title.includes("DANG NHAP") && title.includes("HCMUS");
    }

    function isOnDKHPPage() {
        if (/DangKyHocPhan\.aspx/i.test(location.pathname)) return true;
        if (document.getElementById("ctl00_ContentPlaceHolder1_ViewThongTinDangKy1_btnDangKy")) return true;
        return hasDKHPCaptchaGate();
    }

    function hasDKHPCaptchaGate() {
        return !!(
            document.getElementById("ctl00_ContentPlaceHolder1_txtCaptcha") &&
            document.getElementById("ctl00_ContentPlaceHolder1_imgCaptcha") &&
            document.getElementById("ctl00_ContentPlaceHolder1_btnVaoDKHP")
        );
    }

    function getCreds() {
        try {
            return JSON.parse(localStorage.getItem(CREDS_KEY) || "null");
        } catch (e) {
            return null;
        }
    }

    function setCreds(username, password) {
        localStorage.setItem(CREDS_KEY, JSON.stringify({ u: username, p: password }));
    }

    function clearCreds() {
        localStorage.removeItem(CREDS_KEY);
    }

    function fillLoginForm(creds) {
        const username = document.getElementById("ctl00_ContentPlaceHolder1_txtUsername");
        const password = document.getElementById("ctl00_ContentPlaceHolder1_txtPassword");
        if (!username || !password) return false;

        if (!username.value) {
            username.value = creds.u;
            username.dispatchEvent(new Event("input", { bubbles: true }));
            username.dispatchEvent(new Event("change", { bubbles: true }));
        }
        if (!password.value) {
            password.value = creds.p;
            password.dispatchEvent(new Event("input", { bubbles: true }));
            password.dispatchEvent(new Event("change", { bubbles: true }));
        }
        return true;
    }

    function getCaptchaToken() {
        try {
            if (typeof grecaptcha !== "undefined" && grecaptcha.getResponse) {
                return grecaptcha.getResponse() || "";
            }
        } catch (e) { }
        const textarea = document.getElementById("g-recaptcha-response");
        return textarea ? (textarea.value || "") : "";
    }

    function markJustLoggedIn() {
        localStorage.setItem(JUST_LOGGED_IN_KEY, String(Date.now()));
    }

    function hookManualLoginClick() {
        const button = document.getElementById("ctl00_ContentPlaceHolder1_btnLogin");
        if (!button || button._hcmusHooked) return;
        button._hcmusHooked = true;
        button.addEventListener("click", markJustLoggedIn, true);
    }

    function waitForCaptchaAndSubmit() {
        const start = Date.now();
        const maxMs = CAPTCHA_WAIT_MAX_MIN * 60 * 1000;

        const interval = setInterval(() => {
            if (Date.now() - start > maxMs) {
                clearInterval(interval);
                setBadge("CAPTCHA wait timed out. Complete CAPTCHA and submit the login form manually.");
                return;
            }
            const token = getCaptchaToken();
            if (token && token.length > 10) {
                clearInterval(interval);
                const button = document.getElementById("ctl00_ContentPlaceHolder1_btnLogin");
                if (!button) {
                    setBadge("CAPTCHA appears complete, but the login button was not found.");
                    return;
                }
                setBadge("CAPTCHA appears complete. Submitting the login form.");
                markJustLoggedIn();
                setTimeout(() => button.click(), 200);
            }
        }, CAPTCHA_POLL_MS);
    }

    function makeLoginPanel(creds) {
        makeBadge();
        const target = document.getElementById("hcmus-auto-dkhp-badge-text");
        if (!target) return;

        target.innerHTML = "";

        const title = document.createElement("div");
        title.style.fontWeight = "bold";
        title.style.marginBottom = "6px";
        title.textContent = creds
            ? "Auto-login support: credentials are saved locally"
            : "Auto-login support: no credentials saved";
        target.appendChild(title);

        const info = document.createElement("div");
        info.style.fontSize = "12px";
        info.style.color = "#555";
        info.textContent = creds
            ? `Username: ${creds.u}\nComplete CAPTCHA; the script can submit login after CAPTCHA is ready.`
            : "Click Save credentials to store username and password in localStorage.";
        info.style.whiteSpace = "pre-wrap";
        target.appendChild(info);

        const btnRow = document.createElement("div");
        btnRow.style.marginTop = "8px";

        const makeButton = (label, color, onClick) => {
            const button = document.createElement("button");
            button.textContent = label;
            button.style.cssText = `
                margin-right: 6px;
                padding: 3px 10px;
                font: 12px Arial, sans-serif;
                cursor: pointer;
                border: 1px solid ${color};
                background: #fff;
                color: ${color};
                border-radius: 4px;
            `;
            button.onclick = onClick;
            return button;
        };

        btnRow.appendChild(makeButton(creds ? "Change credentials" : "Save credentials", "#36c", () => {
            const username = prompt("Username:", creds?.u || "");
            if (username == null) return;
            const password = prompt("Password stored as plain text in localStorage:", "");
            if (password == null) return;
            setCreds(username.trim(), password);
            location.reload();
        }));

        if (creds) {
            btnRow.appendChild(makeButton("Clear credentials", "#c33", () => {
                clearCreds();
                setBadge("Credentials were cleared. Reload the page to save new credentials.");
            }));
        }
        target.appendChild(btnRow);

        const warning = document.createElement("div");
        warning.style.cssText = "margin-top:8px; font-size:11px; color:#a60;";
        warning.textContent = "Security note: credentials are stored as plain text in localStorage. Do not use this on a shared machine.";
        target.appendChild(warning);
    }

    function loginMain(retries = 0) {
        muteBlockingDialogs();
        const creds = getCreds();
        makeLoginPanel(creds);
        hookManualLoginClick();

        if (!AUTO_LOGIN || !creds) return;

        const filled = fillLoginForm(creds);
        if (!filled) {
            if (retries >= 20) {
                setBadge("The login form did not render after 10 seconds. This may not be the expected login page.");
                return;
            }
            setTimeout(() => loginMain(retries + 1), 500);
            return;
        }

        waitForCaptchaAndSubmit();
    }

    function autoNavAfterLogin() {
        if (!AUTO_NAV_TO_DKHP) return false;

        const timestamp = Number(localStorage.getItem(JUST_LOGGED_IN_KEY) || "0");
        if (!timestamp) return false;

        const ageSec = (Date.now() - timestamp) / 1000;
        if (ageSec > POST_LOGIN_NAV_MAX_SEC) {
            localStorage.removeItem(JUST_LOGGED_IN_KEY);
            return false;
        }

        if (isOnLoginPage()) return false;
        if (isOnDKHPPage()) {
            localStorage.removeItem(JUST_LOGGED_IN_KEY);
            return false;
        }

        setBadge(`Login appears successful after ${ageSec.toFixed(1)} seconds. Navigating to course registration.`);
        localStorage.removeItem(JUST_LOGGED_IN_KEY);
        setTimeout(() => { location.href = "/DangKyHocPhan.aspx"; }, 250);
        return true;
    }

    let mainRan = false;

    function main() {
        if (mainRan) return;
        mainRan = true;

        muteBlockingDialogs();

        if (isOnLoginPage()) {
            loginMain();
            return;
        }

        if (autoNavAfterLogin()) return;

        if (!isOnDKHPPage()) {
            return;
        }

        if (hasDKHPCaptchaGate()) {
            setBadge(
                "The DKHP page requires CAPTCHA.\n" +
                "Complete CAPTCHA manually and continue. Automatic refresh is paused while CAPTCHA is pending."
            );
            return;
        }

        armHeartbeat();

        if (waitForStartTime()) return;
        if (timedOutOrStopped()) return;

        const { selected, done, leftTargets, status } = selectTargets();

        const summary =
            `Registered targets: ${done.size}/${TARGET_COURSES.length}.\n` +
            (leftTargets.length
                ? "Waiting for:\n" + leftTargets.map((item) => `  - ${item.code} ${item.cls} ${item.time}`).join("\n")
                : "No target courses remain.");

        if (status === "all_done") {
            setBadge("All target courses appear registered. The userscript is now stopped.\n\n" + summary);
            return;
        }

        if (status === "ok") {
            submitSelected(selected);
            return;
        }

        if (status === "no_active_table") {
            scheduleReload(
                "No active registration table was found. You may still be before CAPTCHA, before the registration window, or outside the target table.\n\n" + summary
            );
            return;
        }

        scheduleReload("Target rows were not found in the active table yet.\n\n" + summary);
    }

    function boot() {
        setTimeout(main, 600);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
    } else {
        boot();
    }

    window.addEventListener("load", boot, { once: true });

    window.addEventListener("pageshow", (event) => {
        if (event.persisted) {
            console.log("[HCMUS Auto DKHP] bfcache restore detected; rerunning main.");
            mainRan = false;
            reloadScheduled = false;
            boot();
        }
    });
})();
