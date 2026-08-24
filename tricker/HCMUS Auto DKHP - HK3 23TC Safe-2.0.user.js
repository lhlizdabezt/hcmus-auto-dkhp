// ==UserScript==
// @name         HCMUS Auto DKHP - HK1 26-27 13TC Full Auto
// @namespace    https://github.com/lhlizdabezt/hcmus-auto-dkhp
// @version      5.4.0
// @description  HCMUS HK1 2026-2027 support on portal hosts 1-20: login, navigation, exact planning, submission, and confirmation. CAPTCHA remains manual.
// @author       Luong Hai Long
// @homepageURL  https://github.com/lhlizdabezt/hcmus-auto-dkhp
// @supportURL   https://github.com/lhlizdabezt/hcmus-auto-dkhp/issues
// @downloadURL  https://raw.githubusercontent.com/lhlizdabezt/hcmus-auto-dkhp/main/tricker/HCMUS%20Auto%20DKHP%20-%20HK3%2023TC%20Safe-2.0.user.js
// @updateURL    https://raw.githubusercontent.com/lhlizdabezt/hcmus-auto-dkhp/main/tricker/HCMUS%20Auto%20DKHP%20-%20HK3%2023TC%20Safe-2.0.user.js
// @license      MIT
// @match        https://new-portal1.hcmus.edu.vn/*
// @match        https://new-portal2.hcmus.edu.vn/*
// @match        https://new-portal3.hcmus.edu.vn/*
// @match        https://new-portal4.hcmus.edu.vn/*
// @match        https://new-portal5.hcmus.edu.vn/*
// @match        https://new-portal6.hcmus.edu.vn/*
// @match        https://new-portal7.hcmus.edu.vn/*
// @match        https://new-portal8.hcmus.edu.vn/*
// @match        https://new-portal9.hcmus.edu.vn/*
// @match        https://new-portal10.hcmus.edu.vn/*
// @match        https://new-portal11.hcmus.edu.vn/*
// @match        https://new-portal12.hcmus.edu.vn/*
// @match        https://new-portal13.hcmus.edu.vn/*
// @match        https://new-portal14.hcmus.edu.vn/*
// @match        https://new-portal15.hcmus.edu.vn/*
// @match        https://new-portal16.hcmus.edu.vn/*
// @match        https://new-portal17.hcmus.edu.vn/*
// @match        https://new-portal18.hcmus.edu.vn/*
// @match        https://new-portal19.hcmus.edu.vn/*
// @match        https://new-portal20.hcmus.edu.vn/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        unsafeWindow
// @sandbox      JavaScript
// ==/UserScript==

(function () {
    "use strict";

    // Portal variables such as dkhpInfo, grecaptcha, and confirm live in page context.
    // Tampermonkey provides unsafeWindow on Edge; the fallback keeps local fixtures testable.
    const pageWindow = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;

    // ==== CONFIG ====
    // K2022 is in the K2024-and-earlier group, which opens at 09:00 on 2026-09-04.
    // The official notice contains inconsistent end-year values, so no closing time is inferred.
    const START_AT = "2026-09-04T09:00:00+07:00";
    const AUTO_SUBMIT = true;                     // click Register after a complete valid plan is selected
    const AUTO_CONFIRM_REGISTRATION = true;       // accept only the official registration confirmation
    const AUTO_RELOAD = true;                     // false disables automatic reloads
    const RELOAD_SECONDS = 3;                     // base reload interval in seconds
    const RELOAD_JITTER_MS = 1200;                // add a random 0..N ms to reduce synchronization
    const POST_SUBMIT_RELOAD_SEC = 6;             // recovery reload while waiting for postback
    const HEARTBEAT_RELOAD_SEC = 12;              // recovery reload if the page stalls

    // ==== AUTO LOGIN CONFIG ====
    const AUTO_LOGIN = true;                      // fill credentials; the user still completes reCAPTCHA
    const AUTO_NAV_TO_DKHP = true;                // navigate to registration after login
    const AUTO_DKHP_CAPTCHA_CONTINUE = true;      // continue after the user types the image CAPTCHA
    const CAPTCHA_POLL_MS = 400;                  // CAPTCHA completion polling interval
    const CAPTCHA_WAIT_MAX_MIN = 5;               // stop waiting after this many minutes
    const DKHP_CAPTCHA_IDLE_MS = 900;             // wait for typing to stop before continuing
    const DKHP_CAPTCHA_MIN_CHARS = 6;             // current HCMUS image CAPTCHA length
    const CREDS_KEY = "hcmus-creds-v1";           // shared Tampermonkey storage key for hosts 1-20

    // Audited on 2026-08-24: 24 offered codes equal 15 completed, 7 targets,
    // and 2 graduation alternatives that are not selected automatically.
    // The release contains 21 ordered class options for 7 courses and 13 credits.
    // The script selects at most one class per course.
    const MAIN_TARGET_COURSES = [
        {
            code: "BAA00102",
            name: "Political Economics of Marxism-Leninism",
            credits: 2,
            options: [
                { cls: "25DTV_DKD2", time: "T6(7-12)" },
                { cls: "25DTV_DKD1", time: "T5(1-6)" },
                { cls: "25DTV_DKD3", time: "T4(1-6)" },
            ],
        },
        {
            code: "MTH00040",
            name: "Probability and Statistics",
            credits: 3,
            options: [
                { cls: "25DTV_DKD1", time: "T3(1-6)" },
                { cls: "25DTV_DKD2", time: "T5(1-6)" },
                { cls: "25DTV_DKD3", time: "T3(7-12)" },
            ],
        },
        {
            code: "ETC00020",
            name: "Signals and Systems",
            credits: 2,
            options: [
                { cls: "25DTV_DKD1", time: "T6(1-3)" },
                { cls: "25DTV_DKD2", time: "T6(4-6)" },
                { cls: "25DTV_DKD3", time: "T5(1-3)" },
            ],
        },
        {
            code: "ETC00083",
            name: "Analog Electronics Laboratory",
            credits: 1,
            options: [
                { cls: "25DTV_DKD1", time: "T2(7-12)" },
                { cls: "25DTV_DKD2", time: "T4(1-6)" },
                { cls: "25DTV_DKD3", time: "T4(7-12)" },
            ],
        },
        {
            code: "ETC10015",
            name: "Communication Systems (English)",
            credits: 3,
            options: [
                { cls: "24DTV_DKD2", time: "T4(7-12)" },
                { cls: "24DTV_DKD1", time: "T4(1-6)" },
                { cls: "24DTV_DKD3", time: "T4(1-6)" },
            ],
        },
        {
            code: "ETC10016",
            name: "Communication Systems Laboratory",
            credits: 1,
            options: [
                { cls: "24DTV_DKD2", time: "T4(1-6)" },
                { cls: "24DTV_DKD1", time: "T4(7-12)" },
                { cls: "24DTV_DKD3", time: "T4(7-12)" },
            ],
        },
        {
            code: "ETC10021",
            name: "Numerical Methods Laboratory",
            credits: 1,
            options: [
                { cls: "24DTV_DKD3", time: "T3(7-12)" },
                { cls: "24DTV_DKD2", time: "T7(1-6)" },
                { cls: "24DTV_DKD1", time: "T6(7-12)" },
            ],
        },
    ];

    // The audited curriculum plan has 34 credits remaining after correcting the
    // current-term total from 27 to 25. These courses are not yet offered; class
    // codes and meeting times are never guessed.
    const NOT_OPEN_YET = [
        { code: "MTH00004", credits: 3 },
        { code: "ETC00081", credits: 1 },
        { code: "ETC10006", credits: 1 },
        { code: "ETC10008", credits: 1 },
        { code: "ETC10010", credits: 1 },
        { code: "ETC10124", credits: 2 },
        { code: "ETC10125", credits: 1 },
        { code: "ETC10207", credits: 1 },
        { code: "ETC10017", credits: 3 },
        { code: "ETC10191", credits: 2 },
        { code: "ETC10018", credits: 1 },
    ];

    // Offered but intentionally excluded from the active target. The plan defers
    // ETC10190 and treats ETC10295 as a mutually exclusive alternative.
    const DEFERRED_PLAN_COURSES = [
        { code: "ETC10190", name: "Graduation Project", credits: 4 },
    ];
    const EXCLUDED_ALTERNATIVES = [
        { code: "ETC10295", name: "Graduation Thesis", credits: 10 },
    ];

    // These offered codes are already complete and must not be registered again.
    const PASSED_OPEN_CODES = [
        "BAA00004", "BAA00021", "BAA00101", "BAA00104",
        "ETC00006", "ETC00013", "ETC00015", "ETC10020",
        "ETC10128", "ETC10129", "ETC10130", "ETC10131",
        "ETC10309", "ETC10329", "MTH00003",
    ];

    // This offered retake is outside the main 13-credit target. Enable it only
    // after confirming eligibility and an explicit intent to retake the course.
    const OPTIONAL_RETAKES = [
        {
            enabled: false,
            code: "ETC00015",
            name: "Programming Techniques for Electronics and Telecommunications",
            credits: 3,
            options: [
                { cls: "26DTV_DKD2", time: "T5(7-9); T6(7-12)" },
                { cls: "26DTV_DKD3", time: "T4(4-6); T3(1-6)" },
                { cls: "26DTV_DKD1", time: "T7(7-12); T4(7-9)" },
            ],
        },
    ];

    const TARGET_COURSES = [
        ...MAIN_TARGET_COURSES,
        ...OPTIONAL_RETAKES.filter(course => course.enabled),
    ];
    const TERM_CREDIT_LIMIT = 25;
    const REMAINING_PLAN_CREDITS = 34;
    // Locked to the official Faculty offering list and cross-checked against the
    // portal class list on 2026-08-24. The source PDF is not redistributed here.
    const OFFICIAL_HK1_OFFERING_CODES = [
        "BAA00101", "MTH00003", "ETC00013", "ETC00015", "BAA00021",
        "BAA00102", "BAA00004", "MTH00040", "ETC00006", "ETC00083", "ETC00020",
        "BAA00104", "ETC10015", "ETC10016", "ETC10020", "ETC10021",
        "ETC10128", "ETC10129", "ETC10130", "ETC10131", "ETC10309", "ETC10329",
        "ETC10295", "ETC10190",
    ];
    const SUPPLIED_OPEN_COURSE_COUNT = 24;
    const TARGET_TOTAL_CREDITS = MAIN_TARGET_COURSES.reduce((sum, course) => sum + course.credits, 0);
    const ACTIVE_TARGET_CREDITS = TARGET_COURSES.reduce((sum, course) => sum + course.credits, 0);

    const RUN_ID = "hcmus-dkhp-hk1-2627-13tc-full-auto-v3";
    const STOP_KEY = `${RUN_ID}:stopped`;
    const LAST_TICK_KEY = `${RUN_ID}:lastTick`;
    const RELOAD_COUNT_KEY = `${RUN_ID}:reloadCount`;
    const JUST_LOGGED_IN_KEY = `${RUN_ID}:justLoggedIn`;
    const SUBMIT_ATTEMPT_KEY = `${RUN_ID}:submitAttempts`;
    const POST_LOGIN_NAV_MAX_SEC = 30;
    const SUBMIT_MAX_ATTEMPTS = 3;
    const SUBMIT_RETRY_DELAYS_SEC = [0, 15, 45];
    const SUBMIT_ATTEMPT_RESET_MS = 10 * 60 * 1000;

    // Count page loads for local diagnostics.
    try {
        const n = Number(localStorage.getItem(RELOAD_COUNT_KEY) || "0") + 1;
        localStorage.setItem(RELOAD_COUNT_KEY, String(n));
        console.log("[HCMUS Auto DKHP] page load #" + n + " @ " + location.href);
    } catch (e) { }

    // ==== UTILS ====
    function norm(s) {
        return String(s || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[\u0111\u0110]/g, "D")
            .replace(/\s+/g, " ")
            .trim()
            .toUpperCase();
    }

    function log(...args) { console.log("[HCMUS Auto DKHP]", ...args); }

    const LIVE_PORTAL_HOST_PATTERN = /^new-portal(?:[1-9]|1\d|20)\.hcmus\.edu\.vn$/i;

    function isLivePortalOrigin() {
        return String(location.protocol || "").toLowerCase() === "https:" &&
            LIVE_PORTAL_HOST_PATTERN.test(String(location.hostname || ""));
    }

    function parseTimeSlots(value) {
        const raw = norm(value);
        if (!raw) return [];

        const fragments = raw.split(";").map(fragment => fragment.trim());
        if (!fragments.length || fragments.some(fragment => !fragment)) return [];

        const slots = [];
        const pattern = /^T(2|3|4|5|6|7|8|CN)\((\d+)-(\d+)\)$/;
        for (const fragment of fragments) {
            const match = pattern.exec(fragment);
            if (!match) return [];
            const start = Number(match[2]);
            const end = Number(match[3]);
            if (start < 1 || end > 12 || start > end) return [];
            slots.push({
                day: match[1] === "CN" ? 8 : Number(match[1]),
                start,
                end,
            });
        }
        return slots;
    }

    function canonicalSchedule(value) {
        const slots = parseTimeSlots(value);
        if (!slots.length) return null;
        return slots
            .map(slot => `${slot.day}:${slot.start}-${slot.end}`)
            .sort()
            .join(";");
    }

    function schedulesConflict(first, second) {
        const firstText = norm(first);
        const secondText = norm(second);
        const firstSlots = parseTimeSlots(firstText);
        const secondSlots = parseTimeSlots(secondText);

        // A non-empty timetable that cannot be parsed completely is unknown data.
        // Treat it as a conflict instead of planning from a partial meeting list.
        if ((firstText && !firstSlots.length) || (secondText && !secondSlots.length)) return true;

        return firstSlots.some(a =>
            secondSlots.some(b =>
                a.day === b.day && a.start <= b.end && b.start <= a.end
            )
        );
    }

    function conflictsWithAny(time, scheduledItems) {
        return scheduledItems.some(item => schedulesConflict(time, item.time));
    }

    function validateConfig() {
        const errors = [];
        const seenCodes = new Set();
        const passedCodes = new Set(PASSED_OPEN_CODES.map(norm));

        for (const course of [...MAIN_TARGET_COURSES, ...OPTIONAL_RETAKES]) {
            const code = norm(course.code);
            if (!code || seenCodes.has(code)) errors.push(`Course code is empty or duplicated: ${course.code}`);
            seenCodes.add(code);
            if (!Number.isFinite(course.credits) || course.credits <= 0) {
                errors.push(`${course.code} has an invalid credit value.`);
            }

            if (!course.options?.length) errors.push(`${course.code} has no preferred class option.`);
            const seenOptions = new Set();
            for (const option of course.options || []) {
                const optionKey = `${norm(option.cls)}|${norm(option.time)}`;
                if (!option.cls || !option.time || !parseTimeSlots(option.time).length || seenOptions.has(optionKey)) {
                    errors.push(`${course.code} has an empty, invalid, or duplicate class schedule.`);
                }
                seenOptions.add(optionKey);
            }
        }

        const notOpenCredits = NOT_OPEN_YET.reduce((sum, course) => sum + course.credits, 0);
        const deferredCredits = DEFERRED_PLAN_COURSES.reduce((sum, course) => sum + course.credits, 0);
        if (TARGET_TOTAL_CREDITS + notOpenCredits + deferredCredits !== REMAINING_PLAN_CREDITS) {
            errors.push(`Configured credits do not match the ${REMAINING_PLAN_CREDITS}-credit remaining plan.`);
        }
        if (ACTIVE_TARGET_CREDITS > TERM_CREDIT_LIMIT) {
            errors.push(`Enabled targets exceed the ${TERM_CREDIT_LIMIT}-credit limit.`);
        }
        for (const course of MAIN_TARGET_COURSES) {
            if (passedCodes.has(norm(course.code))) {
                errors.push(`${course.code} is complete but also appears in the main target.`);
            }
        }

        const openPartition = [
            ...PASSED_OPEN_CODES,
            ...MAIN_TARGET_COURSES.map(course => course.code),
            ...DEFERRED_PLAN_COURSES.map(course => course.code),
            ...EXCLUDED_ALTERNATIVES.map(course => course.code),
        ].map(norm);
        const officialOfferingCodes = OFFICIAL_HK1_OFFERING_CODES.map(norm);
        if (
            openPartition.length !== SUPPLIED_OPEN_COURSE_COUNT ||
            new Set(openPartition).size !== SUPPLIED_OPEN_COURSE_COUNT
        ) {
            errors.push("The 24-code offering partition contains a missing or duplicate code.");
        }
        if (
            officialOfferingCodes.length !== SUPPLIED_OPEN_COURSE_COUNT ||
            new Set(officialOfferingCodes).size !== SUPPLIED_OPEN_COURSE_COUNT ||
            openPartition.some(code => !officialOfferingCodes.includes(code)) ||
            officialOfferingCodes.some(code => !openPartition.includes(code))
        ) {
            errors.push("The offering partition does not match the official HK1 2026-2027 source list.");
        }
        return errors;
    }

    const CONFIG_ERRORS = validateConfig();

    // ==== BADGE UI ====
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
            cancelCaptchaWatcher();
            cancelDkhpCaptchaAutoContinue();
            cancelPendingNavigation();
            setBadge("Stopped manually. Reloading will not restart the workflow.\nSelect Reset to resume.");
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
            clearSubmitAttempts();
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
        const t = document.getElementById("hcmus-auto-dkhp-badge-text");
        if (t) t.textContent = text;
    }

    // ==== RELOAD LOOP ====
    let reloadScheduled = false;
    function scheduleReload(reason, baseSec) {
        if (localStorage.getItem(STOP_KEY) === "1") {
            setBadge("The workflow is stopped. No new reload is scheduled.\nSelect Reset to resume.");
            return;
        }
        if (!AUTO_RELOAD) {
            setBadge(`${reason}\n(AUTO_RELOAD=false; automatic reload is disabled)`);
            return;
        }
        if (reloadScheduled) return;
        reloadScheduled = true;

        const base = (baseSec ?? RELOAD_SECONDS) * 1000;
        const delay = base + Math.floor(Math.random() * RELOAD_JITTER_MS);
        const startAt = Date.now();
        const endAt = startAt + delay;
        const countdownStepMs = delay > 300000 ? 10000 : delay > 60000 ? 1000 : 200;

        const tick = () => {
            if (localStorage.getItem(STOP_KEY) === "1") {
                setBadge("Stopped manually. The pending reload was cancelled.");
                return;
            }
            const left = Math.max(0, endAt - Date.now());
            setBadge(`${reason}\nReload in ${(left / 1000).toFixed(1)}s...`);
            if (left <= 0) return;
            setTimeout(tick, countdownStepMs);
        };
        tick();

        setTimeout(() => {
            if (localStorage.getItem(STOP_KEY) === "1") return;
            clearBeforeUnloadGuard();
            location.reload();
        }, delay);
    }

    // Recovery heartbeat: reload if no decision is reached within the configured
    // interval. A manual stop always takes precedence.
    function armHeartbeat() {
        if (!AUTO_RELOAD) return;
        setTimeout(() => {
            if (localStorage.getItem(STOP_KEY) === "1") return;
            if (!reloadScheduled) {
                log("Recovery heartbeat fired because no reload was scheduled.");
                location.reload();
            }
        }, HEARTBEAT_RELOAD_SEC * 1000);
    }

    // ==== TIME / STOP GATES ====
    function waitForStartTime() {
        if (!START_AT) {
            reloadScheduled = true;
            setBadge(
                "START_AT is empty, so the workflow is locked.\n" +
                "Enter the official opening time, for example 2026-08-20T08:00:00+07:00."
            );
            return true;
        }

        const startMs = new Date(START_AT).getTime();
        if (Number.isNaN(startMs)) {
            reloadScheduled = true;
            setBadge("START_AT is invalid. Use a value such as 2026-05-12T09:00:00+07:00.");
            return true;
        }

        const diff = startMs - Date.now();
        if (diff > 0) {
            const reason = `Registration is not open yet. ${Math.ceil(diff / 1000)}s remain.`;
            // Use a wider interval while the opening time is still distant.
            const wait = diff > 86400000 ? 3600
                : diff > 3600000 ? 600
                    : diff > 300000 ? 60
                        : diff > 60000 ? 30
                            : Math.max(1, Math.ceil(diff / 1000) - 1);
            scheduleReload(reason, wait);
            return true;
        }

        return false;
    }

    function timedOutOrStopped() {
        if (localStorage.getItem(STOP_KEY) === "1") {
            setBadge("The workflow is stopped.\nSelect Reset to resume.");
            return true;
        }
        return false;
    }

    // ==== DOM HELPERS ====
    function getHeaderMap(table) {
        const map = {};
        const headerRow = Array.from(table.querySelectorAll("tr")).find(tr => {
            const text = norm(tr.textContent);
            return text.includes("MA MH") && text.includes("TEN LOP");
        });

        if (!headerRow) return null;

        const cells = Array.from(headerRow.querySelectorAll("th,td"));
        cells.forEach((cell, index) => {
            const h = norm(cell.textContent);
            if (h.includes("MA MH")) map.code = index;
            if (h.includes("TEN LOP") || h === "LOP") map.cls = index;
            if (h.includes("SO TC") || h === "TC") map.credits = index;
            if (h.includes("LICH HOC")) map.time = index;
            if (h.includes("CHON")) map.choose = index;
        });

        if (map.code == null || map.cls == null || map.time == null) return null;
        return map;
    }

    function findCourseTables() {
        return Array.from(document.querySelectorAll("table"))
            .map(table => ({ table, map: getHeaderMap(table) }))
            .filter(x => x.map);
    }

    function getRowsFromTable(table) {
        return Array.from(table.querySelectorAll("tbody tr"))
            .filter(row => row.querySelectorAll("td").length >= 4);
    }

    function getRowCourseCode(row, map) {
        const cells = Array.from(row.querySelectorAll("td"));
        return norm(cells[map.code]?.textContent);
    }

    function getRowCredits(row, map) {
        if (map.credits == null) return null;
        const cells = Array.from(row.querySelectorAll("td"));
        const raw = String(cells[map.credits]?.textContent || "").trim().replace(",", ".");
        if (!/^\d+(?:\.\d+)?$/.test(raw)) return null;
        const credits = Number(raw);
        return Number.isFinite(credits) && credits > 0 ? credits : null;
    }

    function getAlreadyRegisteredState() {
        const done = new Set();
        const occupiedSchedules = [];
        const targetCodes = new Set(TARGET_COURSES.map(course => norm(course.code)));
        let domRegisteredCredits = 0;
        let registeredRows = 0;
        let domCreditsKnown = true;
        let foundRegisteredTable = false;

        for (const { table, map } of findCourseTables()) {
            const aroundText = norm(table.parentElement?.textContent || "");
            const looksRegisteredTable =
                aroundText.includes("DANH SACH LOP DA DANG KY") ||
                aroundText.includes("DA DANG KY") ||
                !!table.querySelector("input[name*='cbHuyDK']");

            if (!looksRegisteredTable) continue;
            foundRegisteredTable = true;

            for (const row of getRowsFromTable(table)) {
                const cells = Array.from(row.querySelectorAll("td"));
                const code = getRowCourseCode(row, map);
                const time = norm(cells[map.time]?.textContent);
                registeredRows += 1;
                const credits = getRowCredits(row, map);
                if (credits == null) {
                    domCreditsKnown = false;
                } else {
                    domRegisteredCredits += credits;
                }
                if (time) occupiedSchedules.push({ code, time });
                if (targetCodes.has(code)) done.add(code);
            }
        }

        // Prefer the portal's aggregate values; use the registered-course table as fallback.
        const rawPortalCredits = pageWindow.dkhpInfo?.SoTCDaDK;
        const rawPortalLimit = pageWindow.dkhpInfo?.SoTCToiDa;
        const portalRegisteredCredits = Number(rawPortalCredits);
        const portalCreditLimit = Number(rawPortalLimit);
        const portalCreditsKnown = rawPortalCredits != null && rawPortalCredits !== "" &&
            Number.isFinite(portalRegisteredCredits) && portalRegisteredCredits >= 0;
        const portalLimitKnown = rawPortalLimit != null && rawPortalLimit !== "" &&
            Number.isFinite(portalCreditLimit) && portalCreditLimit > 0;
        const registeredCreditsKnown = portalCreditsKnown ||
            (foundRegisteredTable && (registeredRows === 0 || domCreditsKnown));
        const registeredCredits = portalCreditsKnown ? portalRegisteredCredits : domRegisteredCredits;
        // Never widen the published 25-credit ceiling. A lower account-specific
        // portal limit still takes precedence.
        const creditLimit = portalLimitKnown
            ? Math.min(TERM_CREDIT_LIMIT, portalCreditLimit)
            : TERM_CREDIT_LIMIT;

        return {
            done,
            occupiedSchedules,
            registeredCredits,
            creditLimit,
            registeredCreditsKnown,
        };
    }

    const OFFICIAL_REGISTER_CHECKBOX_PATTERN =
        /^ctl00(?:_|\$)ContentPlaceHolder1(?:_|\$)ViewThongTinDangKy1(?:_|\$)(?:rptLopMoDKHP|rptLopHocLaiDKHP|rptLopCaiThienDiem)(?:_|\$)ctl\d+(?:_|\$)cbDK$/i;

    function isOfficialRegistrationCheckbox(checkbox) {
        if (!checkbox) return false;
        const id = String(checkbox.id || "");
        const name = String(checkbox.name || checkbox.getAttribute?.("name") || "");
        return OFFICIAL_REGISTER_CHECKBOX_PATTERN.test(id) ||
            OFFICIAL_REGISTER_CHECKBOX_PATTERN.test(name);
    }

    function findAllowedCourseTables() {
        return findCourseTables().filter(({ table, map }) => {
            if (map.credits == null) return false;
            return getRowsFromTable(table).some(row =>
                isOfficialRegistrationCheckbox(row.querySelector("input[type='checkbox']"))
            );
        });
    }

    function rowMatchesTarget(row, map, target) {
        const tds = Array.from(row.querySelectorAll("td"));
        const code = norm(tds[map.code]?.textContent);
        const cls = norm(tds[map.cls]?.textContent);
        const time = norm(tds[map.time]?.textContent);
        const liveCredits = getRowCredits(row, map);
        const liveSchedule = canonicalSchedule(time);
        const configuredSchedule = canonicalSchedule(target.time);

        return (
            code === norm(target.code) &&
            cls === norm(target.cls) &&
            liveCredits != null &&
            liveCredits === Number(target.credits) &&
            liveSchedule != null &&
            liveSchedule === configuredSchedule
        );
    }

    function targetOptionKey(target) {
        return `${norm(target.code)}|${norm(target.cls)}|${norm(target.time)}`;
    }

    // Find the combination that covers the most main targets across the complete
    // timetable. Ties prefer credits, optional targets, then option order.
    function buildSelectionPlan(courses, availableRows, occupiedSchedules, rejectedOptionKeys, creditBudget = Infinity) {
        const mainCodes = new Set(MAIN_TARGET_COURSES.map(course => norm(course.code)));
        const candidatesByCourse = courses.map(course => ({
            course,
            candidates: course.options.flatMap((option, preference) => {
                const target = { ...course, ...option };
                delete target.options;
                const key = targetOptionKey(target);
                if (rejectedOptionKeys.has(key)) return [];

                const match = availableRows.find(({ row, map }) => rowMatchesTarget(row, map, target));
                if (!match) return [];
                const checkbox = match.row.querySelector("input[type='checkbox']");
                if (!isOfficialRegistrationCheckbox(checkbox) || checkbox.disabled) return [];
                return [{ target, checkbox, preference }];
            }),
        }));

        let best = null;
        const betterThanBest = score => {
            if (!best) return true;
            const current = [
                score.mainCount,
                score.mainCredits,
                score.totalCount,
                score.totalCredits,
                -score.preferencePenalty,
            ];
            const previous = [
                best.score.mainCount,
                best.score.mainCredits,
                best.score.totalCount,
                best.score.totalCredits,
                -best.score.preferencePenalty,
            ];
            for (let i = 0; i < current.length; i++) {
                if (current[i] !== previous[i]) return current[i] > previous[i];
            }
            return false;
        };

        const visit = (index, choices, scheduledItems, score) => {
            if (index >= candidatesByCourse.length) {
                if (betterThanBest(score)) best = { choices: [...choices], score: { ...score } };
                return;
            }

            const { course, candidates } = candidatesByCourse[index];
            const isMain = mainCodes.has(norm(course.code));
            for (const candidate of candidates) {
                if (conflictsWithAny(candidate.target.time, scheduledItems)) continue;
                if (score.totalCredits + course.credits > creditBudget) continue;
                choices.push(candidate);
                visit(
                    index + 1,
                    choices,
                    [...scheduledItems, candidate.target],
                    {
                        mainCount: score.mainCount + (isMain ? 1 : 0),
                        mainCredits: score.mainCredits + (isMain ? course.credits : 0),
                        totalCount: score.totalCount + 1,
                        totalCredits: score.totalCredits + course.credits,
                        preferencePenalty: score.preferencePenalty + candidate.preference,
                    }
                );
                choices.pop();
            }

            // Allow omission so the planner can maximize coverage when options are full or conflicting.
            visit(index + 1, choices, scheduledItems, score);
        };

        visit(0, [], occupiedSchedules, {
            mainCount: 0,
            mainCredits: 0,
            totalCount: 0,
            totalCredits: 0,
            preferencePenalty: 0,
        });
        return best?.choices || [];
    }

    function selectTargets() {
        const {
            done,
            occupiedSchedules,
            registeredCredits,
            creditLimit,
            registeredCreditsKnown,
        } = getAlreadyRegisteredState();
        const leftCourses = TARGET_COURSES.filter(course => !done.has(norm(course.code)));
        const commonState = { done, leftCourses, registeredCredits, creditLimit };

        if (!leftCourses.length) {
            localStorage.setItem(STOP_KEY, "1");
            return { ...commonState, selected: [], unexpectedChecked: [], rejectedTargets: [], status: "all_done" };
        }

        if (!registeredCreditsKnown) {
            return {
                ...commonState,
                selected: [],
                unexpectedChecked: [],
                rejectedTargets: [],
                status: "unknown_registered_credits",
            };
        }

        const allowedTables = findAllowedCourseTables();
        if (!allowedTables.length) {
            return {
                ...commonState,
                selected: [],
                unexpectedChecked: [],
                rejectedTargets: [],
                status: "no_active_table",
            };
        }

        const availableRows = allowedTables.flatMap(({ table, map }) =>
            getRowsFromTable(table).map(row => ({ row, map }))
        );
        const selected = [];
        const rejectedOptionKeys = new Set();
        const rejectedTargetsByKey = new Map();
        let pendingCourses = [...leftCourses];
        const remainingTargetCredits = leftCourses.reduce((sum, course) => sum + course.credits, 0);
        const creditLimited = remainingTargetCredits > Math.max(0, creditLimit - registeredCredits);

        const rollbackScriptSelections = () => {
            for (const item of [...selected].reverse()) {
                if (!item.clickedByScript || !item.checkbox.checked) continue;
                item.checkbox.click();
                if (item.checkbox.checked) {
                    log("The checkbox could not be rolled back; retain it as a fixed constraint:", item.target);
                }
            }

            const fixedSelections = selected.filter(item => item.checkbox.checked);
            selected.length = 0;
            selected.push(...fixedSelections);
            const fixedCodes = new Set(selected.map(item => norm(item.target.code)));
            pendingCourses = leftCourses.filter(course => !fixedCodes.has(norm(course.code)));
        };

        // If the portal rejects an option, roll back unsubmitted script selections,
        // exclude the rejected option, and rebuild the global plan.
        while (pendingCourses.length) {
            const fixedCredits = selected.reduce((sum, item) => sum + item.target.credits, 0);
            const creditBudget = Math.max(0, creditLimit - registeredCredits - fixedCredits);
            const plan = buildSelectionPlan(
                pendingCourses,
                availableRows,
                [...occupiedSchedules, ...selected.map(item => item.target)],
                rejectedOptionKeys,
                creditBudget
            );
            if (!plan.length) break;

            let portalRejected = false;
            for (const candidate of plan) {
                const { target, checkbox } = candidate;
                const clickedByScript = !checkbox.checked;
                if (!checkbox.checked) {
                    checkbox.click();
                    if (!checkbox.checked) {
                        const rejectedKey = targetOptionKey(target);
                        rejectedOptionKeys.add(rejectedKey);
                        rejectedTargetsByKey.set(rejectedKey, target);
                        log("The portal rejected an option; roll back and rebuild the global plan:", target);
                        portalRejected = true;
                        break;
                    }
                }

                selected.push({ target, checkbox, clickedByScript });
                pendingCourses = pendingCourses.filter(course => norm(course.code) !== norm(target.code));
            }

            if (portalRejected) {
                rollbackScriptSelections();
                continue;
            }

            // The plan was applied; remaining courses have no valid combination.
            break;
        }

        const selectedCheckboxes = new Set(selected.map(item => item.checkbox));
        const unexpectedChecked = availableRows
            .map(({ row }) => row.querySelector("input[type='checkbox']"))
            .filter(checkbox => checkbox?.checked && !selectedCheckboxes.has(checkbox));

        const pendingCodes = new Set(pendingCourses.map(course => norm(course.code)));
        const unresolvedRejectedTargets = [...rejectedTargetsByKey.values()]
            .filter(target => pendingCodes.has(norm(target.code)));
        const status = unresolvedRejectedTargets.length
            ? "portal_rejected"
            : creditLimited
                ? "credit_limited"
                : selected.length
                    ? "ok"
                    : "no_match_yet";

        return {
            ...commonState,
            selected: selected.map(item => item.target),
            unexpectedChecked,
            rejectedTargets: unresolvedRejectedTargets,
            status,
        };
    }

    // ==== SUBMIT ====
    function findRegisterButton() {
        // Full-auto may use only the verified official ID. If the portal DOM changes,
        // stop instead of guessing a control from its label.
        return document.getElementById(
            "ctl00_ContentPlaceHolder1_ViewThongTinDangKy1_btnDangKy"
        );
    }

    // Remove only the leave-page guard; preserve portal alerts so errors remain visible.
    function clearBeforeUnloadGuard() {
        try { pageWindow.onbeforeunload = null; } catch (e) { }
    }

    function submitPlanSignature(selected) {
        return selected
            .map(item => `${norm(item.code)}|${norm(item.cls)}|${norm(item.time)}`)
            .sort()
            .join(";");
    }

    function readSubmitAttemptState() {
        try {
            const state = JSON.parse(localStorage.getItem(SUBMIT_ATTEMPT_KEY) || "null");
            return state && typeof state === "object" ? state : null;
        } catch (e) {
            return null;
        }
    }

    function getSubmitRetryDecision(selected, now = Date.now()) {
        const signature = submitPlanSignature(selected);
        const state = readSubmitAttemptState();
        const sameActivePlan = state?.signature === signature &&
            Number.isFinite(Number(state.count)) &&
            Number.isFinite(Number(state.lastAt)) &&
            now >= Number(state.lastAt) &&
            now - Number(state.lastAt) <= SUBMIT_ATTEMPT_RESET_MS;

        if (!sameActivePlan) {
            return { status: "ready", signature, count: 0, attempt: 1, remainingMs: 0 };
        }

        const count = Number(state.count);
        if (count >= SUBMIT_MAX_ATTEMPTS) {
            return { status: "blocked", signature, count, attempt: count + 1, remainingMs: 0 };
        }

        const retryDelaySec = SUBMIT_RETRY_DELAYS_SEC[Math.min(
            count,
            SUBMIT_RETRY_DELAYS_SEC.length - 1
        )];
        const remainingMs = retryDelaySec * 1000 - (now - Number(state.lastAt));
        return remainingMs > 0
            ? { status: "cooldown", signature, count, attempt: count + 1, remainingMs }
            : { status: "ready", signature, count, attempt: count + 1, remainingMs: 0 };
    }

    function recordSubmitAttempt(selected, now = Date.now()) {
        const decision = getSubmitRetryDecision(selected, now);
        const nextState = {
            signature: decision.signature,
            count: Math.min(decision.count + 1, SUBMIT_MAX_ATTEMPTS),
            lastAt: now,
        };
        localStorage.setItem(SUBMIT_ATTEMPT_KEY, JSON.stringify(nextState));
        localStorage.setItem(LAST_TICK_KEY, String(now));
        return nextState;
    }

    function clearSubmitAttempts() {
        localStorage.removeItem(SUBMIT_ATTEMPT_KEY);
        localStorage.removeItem(LAST_TICK_KEY);
    }

    function clickRegistrationButton(btn) {
        const originalConfirm = pageWindow.confirm;
        let confirmWasScoped = false;

        if (AUTO_CONFIRM_REGISTRATION && typeof originalConfirm === "function") {
            try {
                pageWindow.confirm = message => {
                    const text = norm(message);
                    const isRegistrationPrompt =
                        text.includes("THUC SU MUON DANG KY");
                    if (isRegistrationPrompt) {
                        log("Accepted the official portal registration confirmation.");
                        return true;
                    }
                    return originalConfirm.call(pageWindow, message);
                };
                confirmWasScoped = pageWindow.confirm !== originalConfirm;
            } catch (e) {
                log("Automatic confirmation could not be scoped; the portal will ask manually.", e);
            }
        }

        try {
            btn.click();
        } finally {
            if (confirmWasScoped) {
                try { pageWindow.confirm = originalConfirm; } catch (e) { }
            }
        }
    }

    function submitSelected(selected, unexpectedChecked) {
        if (!selected.length) return false;

        const lines = selected.map(x => `${x.code} - ${x.cls} - ${x.time}`).join("\n");

        if (!AUTO_SUBMIT) {
            // Stop recovery reloads so the user has time to review and submit manually.
            reloadScheduled = true;
            setBadge(
                "Selection complete. AUTO_SUBMIT=false, so Register was not clicked.\n\n" +
                lines +
                (unexpectedChecked.length
                    ? `\n\n${unexpectedChecked.length} additional checkbox(es) were selected manually.`
                    : "") +
                `\n\nAll 24 offered codes are accounted for: ${MAIN_TARGET_COURSES.length} targets/${TARGET_TOTAL_CREDITS} credits; ` +
                `${PASSED_OPEN_CODES.length} completed courses; 2 graduation alternatives excluded.` +
                "\nAutomatic reload is paused. Review and submit manually, or set AUTO_SUBMIT=true."
            );
            return true;
        }

        if (unexpectedChecked.length) {
            reloadScheduled = true;
            setBadge(
                `Automatic submission stopped: ${unexpectedChecked.length} non-target checkbox(es) are selected.\n` +
                "Clear non-target selections, then reload."
            );
            return true;
        }

        if (!isLivePortalOrigin()) {
            reloadScheduled = true;
            setBadge(
                "DRY-RUN: this is not an official HTTPS portal origin.\n" +
                "The script will not register, confirm, or send a form post."
            );
            return true;
        }

        const retry = getSubmitRetryDecision(selected);
        if (retry.status === "blocked") {
            reloadScheduled = true;
            setBadge(
                `The same combination reached the ${SUBMIT_MAX_ATTEMPTS}-attempt limit without portal confirmation.\n` +
                "Submission and reload are stopped to prevent repetition. Inspect the portal before selecting Reset."
            );
            return true;
        }
        if (retry.status === "cooldown") {
            const waitSec = Math.max(1, Math.ceil(retry.remainingMs / 1000));
            scheduleReload(
                `Waiting for backoff before submit attempt ${retry.attempt}/${SUBMIT_MAX_ATTEMPTS}.`,
                waitSec
            );
            return true;
        }

        clearBeforeUnloadGuard();

        const btn = findRegisterButton();
        if (!btn) {
            setBadge("Selection complete, but the exact Register button was not found. Submit manually.\n\n" + lines);
            // Retain the recovery cycle so a later page state can be inspected.
            scheduleReload("The exact Register button was not found.", POST_SUBMIT_RELOAD_SEC);
            return true;
        }

        const attemptState = recordSubmitAttempt(selected);
        setBadge(
            `Selection complete. Clicking Register (attempt ${attemptState.count}/${SUBMIT_MAX_ATTEMPTS})` +
            (AUTO_CONFIRM_REGISTRATION ? " with scoped confirmation" : "") +
            ":\n\n" + lines
        );

        try {
            clickRegistrationButton(btn);
        } catch (e) {
            log("Register click threw; no postback is inferred in fail-closed mode:", e);
            const reason =
                "The Register click failed; portal receipt cannot be confirmed.\n" +
                "The backoff state is preserved for the next inspection.";
            setBadge(reason);
            scheduleReload(reason, POST_SUBMIT_RELOAD_SEC);
            return true;
        }

        // Recovery reload if the postback does not trigger a natural navigation.
        scheduleReload("Register was clicked. Waiting for portal state confirmation.", POST_SUBMIT_RELOAD_SEC);
        return true;
    }

    // ==== PAGE DETECTION ====
    function isOnLoginPage() {
        if (/Login\.aspx/i.test(location.pathname)) return true;
        if (document.getElementById("ctl00_ContentPlaceHolder1_txtPassword")) return true;
        const t = norm(document.title || "");
        return t.includes("DANG NHAP") && t.includes("HCMUS");
    }

    function isOnDKHPPage() {
        if (/DangKyHocPhan\.aspx/i.test(location.pathname)) return true;
        if (document.getElementById("ctl00_ContentPlaceHolder1_ViewThongTinDangKy1_btnDangKy")) return true;
        return hasDKHPCaptchaGate();
    }

    // The registration page has two states: the image-CAPTCHA gate and the class
    // table. All three CAPTCHA elements indicate that the gate is still active.
    function hasDKHPCaptchaGate() {
        return !!(
            document.getElementById("ctl00_ContentPlaceHolder1_txtCaptcha") &&
            document.getElementById("ctl00_ContentPlaceHolder1_imgCaptcha") &&
            document.getElementById("ctl00_ContentPlaceHolder1_btnVaoDKHP")
        );
    }

    let dkhpCaptchaContinueTimerId = null;
    function cancelDkhpCaptchaAutoContinue() {
        if (dkhpCaptchaContinueTimerId != null) {
            clearTimeout(dkhpCaptchaContinueTimerId);
            dkhpCaptchaContinueTimerId = null;
        }
    }

    function armDKHPCaptchaAutoContinue() {
        if (
            !AUTO_DKHP_CAPTCHA_CONTINUE ||
            !isLivePortalOrigin() ||
            localStorage.getItem(STOP_KEY) === "1"
        ) return false;

        const input = document.getElementById("ctl00_ContentPlaceHolder1_txtCaptcha");
        const button = document.getElementById("ctl00_ContentPlaceHolder1_btnVaoDKHP");
        if (!input || !button) return false;
        if (input._hcmusAutoContinueHooked) return true;
        input._hcmusAutoContinueHooked = true;

        let submitted = false;

        button.addEventListener("click", () => {
            submitted = true;
            cancelDkhpCaptchaAutoContinue();
        }, true);

        input.addEventListener("input", () => {
            cancelDkhpCaptchaAutoContinue();
            if (submitted) return;

            const snapshot = String(input.value || "").trim();
            if (snapshot.length < DKHP_CAPTCHA_MIN_CHARS) return;

            dkhpCaptchaContinueTimerId = setTimeout(() => {
                dkhpCaptchaContinueTimerId = null;
                if (localStorage.getItem(STOP_KEY) === "1" || !isLivePortalOrigin()) return;
                if (submitted || String(input.value || "").trim() !== snapshot) return;
                submitted = true;
                clearBeforeUnloadGuard();
                button.click();
            }, DKHP_CAPTCHA_IDLE_MS);
        });

        return true;
    }

    // ==== CREDS STORE ====
    function normalizeCreds(value) {
        let parsed = value;
        if (typeof parsed === "string") {
            try { parsed = JSON.parse(parsed); } catch (e) { return null; }
        }
        if (!parsed || typeof parsed !== "object") return null;
        const u = String(parsed.u || "").trim();
        const p = String(parsed.p || "");
        return u && p ? { u, p } : null;
    }

    function getCreds() {
        if (typeof GM_getValue !== "function") {
            log("GM_getValue is unavailable; per-origin credentials are not used as fallback.");
            return null;
        }

        try {
            const shared = normalizeCreds(GM_getValue(CREDS_KEY, null));
            if (shared) {
                localStorage.removeItem(CREDS_KEY);
                return shared;
            }
        } catch (e) {
            log("Tampermonkey storage could not be read; credential filling is stopped.", e);
            return null;
        }

        const legacy = normalizeCreds(localStorage.getItem(CREDS_KEY));
        if (legacy) {
            if (typeof GM_setValue !== "function") {
                log("Legacy credentials cannot be migrated because GM_setValue is unavailable.");
                return null;
            }
            try {
                GM_setValue(CREDS_KEY, legacy);
                localStorage.removeItem(CREDS_KEY);
                return legacy;
            } catch (e) {
                log("Legacy credentials could not be migrated to Tampermonkey storage.", e);
                return null;
            }
        }
        return null;
    }

    function setCreds(u, p) {
        const creds = normalizeCreds({ u, p });
        if (!creds) return "invalid";
        if (typeof GM_setValue !== "function") {
            log("GM_setValue is unavailable; no per-origin storage fallback is used.");
            return "storage_error";
        }
        try {
            GM_setValue(CREDS_KEY, creds);
            localStorage.removeItem(CREDS_KEY);
            return "ok";
        } catch (e) {
            log("Tampermonkey storage write failed; credentials were not saved.", e);
            return "storage_error";
        }
    }

    function getCredsSaveErrorMessage(status) {
        if (status === "invalid") {
            return "Username and password cannot be empty.";
        }
        if (status === "storage_error") {
            return "Shared credentials were not saved. Check Tampermonkey storage permissions and try again.";
        }
        return "";
    }

    function clearCreds() {
        let sharedDeleted = false;
        if (typeof GM_deleteValue !== "function") {
            log("GM_deleteValue is unavailable; shared-credential deletion cannot be confirmed.");
        } else {
            try {
                GM_deleteValue(CREDS_KEY);
                sharedDeleted = true;
            } catch (e) {
                log("Tampermonkey credentials could not be deleted.", e);
            }
        }
        localStorage.removeItem(CREDS_KEY);
        return sharedDeleted;
    }

    // ==== LOGIN FLOW ====
    function fillLoginForm(creds) {
        const u = document.getElementById("ctl00_ContentPlaceHolder1_txtUsername");
        const p = document.getElementById("ctl00_ContentPlaceHolder1_txtPassword");
        if (!u || !p) return false;

        // Fill only empty fields so recent manual input is never overwritten.
        if (!u.value) {
            u.value = creds.u;
            u.dispatchEvent(new Event("input", { bubbles: true }));
            u.dispatchEvent(new Event("change", { bubbles: true }));
        }
        if (!p.value) {
            p.value = creds.p;
            p.dispatchEvent(new Event("input", { bubbles: true }));
            p.dispatchEvent(new Event("change", { bubbles: true }));
        }
        return true;
    }

    function getCaptchaToken() {
        try {
            if (pageWindow.grecaptcha?.getResponse) {
                const response = pageWindow.grecaptcha.getResponse() || "";
                if (response) return response;
            }
        } catch (e) { }
        const ta = document.getElementById("g-recaptcha-response") ||
            document.querySelector?.("textarea[name='g-recaptcha-response']");
        return ta ? (ta.value || "") : "";
    }

    function markJustLoggedIn() {
        localStorage.setItem(JUST_LOGGED_IN_KEY, String(Date.now()));
    }

    let captchaWatcherStarted = false;
    let captchaWatcherIntervalId = null;
    let captchaLoginTimeoutId = null;
    let loginRetryTimeoutId = null;
    function cancelCaptchaWatcher() {
        if (captchaWatcherIntervalId != null) clearInterval(captchaWatcherIntervalId);
        if (captchaLoginTimeoutId != null) clearTimeout(captchaLoginTimeoutId);
        if (loginRetryTimeoutId != null) clearTimeout(loginRetryTimeoutId);
        captchaWatcherIntervalId = null;
        captchaLoginTimeoutId = null;
        loginRetryTimeoutId = null;
        captchaWatcherStarted = false;
    }

    function hookManualLoginClick() {
        const btn = document.getElementById("ctl00_ContentPlaceHolder1_btnLogin");
        if (!btn || btn._hcmusHooked) return;
        btn._hcmusHooked = true;
        // A manual click cancels pending watchers and prevents a duplicate login.
        btn.addEventListener("click", () => {
            cancelCaptchaWatcher();
            markJustLoggedIn();
        }, true);
    }

    function waitForCaptchaAndSubmit() {
        if (!isLivePortalOrigin() || localStorage.getItem(STOP_KEY) === "1") return;
        if (captchaWatcherStarted) return;
        captchaWatcherStarted = true;
        const start = Date.now();
        const maxMs = CAPTCHA_WAIT_MAX_MIN * 60 * 1000;

        const iv = setInterval(() => {
            if (localStorage.getItem(STOP_KEY) === "1" || !isLivePortalOrigin()) {
                cancelCaptchaWatcher();
                return;
            }
            if (Date.now() - start > maxMs) {
                cancelCaptchaWatcher();
                setBadge("CAPTCHA wait expired. Complete CAPTCHA and select Login manually.");
                return;
            }
            const tok = getCaptchaToken();
            if (tok && tok.length > 10) {
                const username = document.getElementById("ctl00_ContentPlaceHolder1_txtUsername");
                const password = document.getElementById("ctl00_ContentPlaceHolder1_txtPassword");
                if (!username?.value?.trim() || !password?.value) {
                    setBadge("CAPTCHA is complete, but username or password is missing.");
                    return;
                }

                const btn = document.getElementById("ctl00_ContentPlaceHolder1_btnLogin");
                if (!btn) {
                    cancelCaptchaWatcher();
                    setBadge("CAPTCHA is complete, but the exact Login button was not found.");
                    return;
                }
                clearInterval(iv);
                captchaWatcherIntervalId = null;
                setBadge("CAPTCHA complete. Selecting Login...");
                captchaLoginTimeoutId = setTimeout(() => {
                    captchaLoginTimeoutId = null;
                    if (localStorage.getItem(STOP_KEY) === "1" || !isLivePortalOrigin()) {
                        cancelCaptchaWatcher();
                        return;
                    }
                    btn.click();
                }, 200);
            }
        }, CAPTCHA_POLL_MS);
        captchaWatcherIntervalId = iv;
    }

    function makeLoginPanel(creds) {
        makeBadge();
        const t = document.getElementById("hcmus-auto-dkhp-badge-text");
        if (!t) return;

        t.innerHTML = "";
        const title = document.createElement("div");
        title.style.fontWeight = "bold";
        title.style.marginBottom = "6px";
        title.textContent = !AUTO_LOGIN
            ? "Auto-login: disabled"
            : creds
                ? "Auto-login: credentials available"
                : "Auto-login: no saved credentials";
        t.appendChild(title);

        const info = document.createElement("div");
        info.style.fontSize = "12px";
        info.style.color = "#555";
        info.textContent = !AUTO_LOGIN
            ? "Enable AUTO_LOGIN in the configuration to use this feature."
            : creds
                ? `User: ${creds.u}\nComplete CAPTCHA manually; the script will then select Login.`
                : "Enter credentials directly or select Save. After manual CAPTCHA, the script will select Login.";
        info.style.whiteSpace = "pre-wrap";
        t.appendChild(info);

        const btnRow = document.createElement("div");
        btnRow.style.marginTop = "8px";

        const mkBtn = (label, color, onClick) => {
            const b = document.createElement("button");
            b.textContent = label;
            b.style.cssText = `
                margin-right: 6px;
                padding: 3px 10px;
                font: 12px Arial, sans-serif;
                cursor: pointer;
                border: 1px solid ${color};
                background: #fff;
                color: ${color};
                border-radius: 4px;
            `;
            b.onclick = onClick;
            return b;
        };

        btnRow.appendChild(mkBtn(creds ? "Change credentials" : "Save credentials", "#36c", () => {
            const u = prompt("Username:", creds?.u || "");
            if (u == null) return;
            const p = prompt("Password (stored by Tampermonkey and shared across portal hosts 1-20):", "");
            if (p == null) return;
            const saveStatus = setCreds(u, p);
            if (saveStatus !== "ok") {
                setBadge(getCredsSaveErrorMessage(saveStatus));
                return;
            }
            location.reload();
        }));

        if (creds) {
            btnRow.appendChild(mkBtn("Delete credentials", "#c33", () => {
                const cleared = clearCreds();
                setBadge(cleared
                    ? "Shared credentials were deleted. Reload to enter new values."
                    : "Shared-credential deletion could not be confirmed. Check Tampermonkey and try again."
                );
            }));
        }
        t.appendChild(btnRow);

        const warn = document.createElement("div");
        warn.style.cssText = "margin-top:8px; font-size:11px; color:#a60;";
        warn.textContent = "Passwords are stored by Tampermonkey in plain text and shared across hosts 1-20. Do not use a shared computer.";
        t.appendChild(warn);
    }

    function loginMain(retries = 0) {
        if (!isLivePortalOrigin()) {
            setBadge("DRY-RUN: auto-login runs only on an official HTTPS portal origin.");
            return;
        }
        if (localStorage.getItem(STOP_KEY) === "1") return;

        const creds = getCreds();
        makeLoginPanel(creds);
        hookManualLoginClick();

        if (!AUTO_LOGIN) return;

        if (!creds) {
            waitForCaptchaAndSubmit();
            return;
        }

        const filled = fillLoginForm(creds);
        if (!filled) {
            if (retries >= 20) {
                setBadge("The login form did not render within 10 seconds. This may not be the expected login page.");
                return;
            }
            loginRetryTimeoutId = setTimeout(() => {
                loginRetryTimeoutId = null;
                if (localStorage.getItem(STOP_KEY) === "1" || !isLivePortalOrigin()) return;
                loginMain(retries + 1);
            }, 500);
            return;
        }

        waitForCaptchaAndSubmit();
    }

    // ==== POST-LOGIN NAVIGATION ====
    // Use a short-lived localStorage flag set at Login instead of document.referrer,
    // which may be empty under COOP or strict-origin policies.
    const pendingNavigationTimeoutIds = new Set();
    function cancelPendingNavigation() {
        for (const timeoutId of pendingNavigationTimeoutIds) clearTimeout(timeoutId);
        pendingNavigationTimeoutIds.clear();
    }

    function schedulePortalNavigation(path) {
        if (!isLivePortalOrigin() || localStorage.getItem(STOP_KEY) === "1") return false;
        const timeoutId = setTimeout(() => {
            pendingNavigationTimeoutIds.delete(timeoutId);
            if (localStorage.getItem(STOP_KEY) === "1" || !isLivePortalOrigin()) return;
            clearBeforeUnloadGuard();
            location.href = path;
        }, 250);
        pendingNavigationTimeoutIds.add(timeoutId);
        return true;
    }

    function autoNavAfterLogin() {
        if (!AUTO_NAV_TO_DKHP || !isLivePortalOrigin()) return false;

        const t = Number(localStorage.getItem(JUST_LOGGED_IN_KEY) || "0");
        if (!t) return false;

        const ageSec = (Date.now() - t) / 1000;
        if (ageSec > POST_LOGIN_NAV_MAX_SEC) {
            localStorage.removeItem(JUST_LOGGED_IN_KEY);
            return false;
        }

        if (isOnLoginPage()) return false;   // login has not completed; loginMain retains control
        if (isOnDKHPPage()) {
            localStorage.removeItem(JUST_LOGGED_IN_KEY);
            return false;
        }

        setBadge(`Login completed after ${ageSec.toFixed(1)}s. Opening course registration...`);
        // Clear the flag before navigation to prevent a redirect loop.
        localStorage.removeItem(JUST_LOGGED_IN_KEY);
        return schedulePortalNavigation("/DangKyHocPhan.aspx");
    }

    function autoNavFromLoggedInPortalPage() {
        if (!AUTO_NAV_TO_DKHP || !isLivePortalOrigin()) return false;
        if (isOnLoginPage() || isOnDKHPPage()) return false;

        const bodyText = norm(document.body?.textContent || "");
        if (!bodyText.includes("DANG XUAT")) return false;

        setBadge("An authenticated session was detected. Opening course registration...");
        return schedulePortalNavigation("/DangKyHocPhan.aspx");
    }

    // ==== MAIN (dispatcher) ====
    let mainRan = false;
    function main() {
        if (mainRan) return; // prevent duplicate execution when both DOM events fire
        mainRan = true;

        if (timedOutOrStopped()) return;

        if (!isLivePortalOrigin()) {
            reloadScheduled = true;
            setBadge(
                "DRY-RUN: the workflow runs only on HCMUS HTTPS hosts new-portal1 through new-portal20.\n" +
                "Local files and snapshots cannot log in, navigate, continue CAPTCHA, or submit."
            );
            return;
        }

        if (isOnLoginPage()) {
            loginMain();
            return;
        }

        // A fresh login flag allows navigation from any authenticated portal page.
        // This is more reliable than document.referrer.
        if (autoNavAfterLogin()) return;

        // An existing authenticated session can navigate without the fresh-login flag.
        if (autoNavFromLoggedInPortalPage()) return;

        if (!isOnDKHPPage()) {
            return;
        }

        // ==== DKHP MODULE ====
        if (hasDKHPCaptchaGate()) {
            // Do not reload or arm the heartbeat while the user types CAPTCHA.
            armDKHPCaptchaAutoContinue();
            setBadge(
                "The registration page requires manual CAPTCHA.\n" +
                (AUTO_DKHP_CAPTCHA_CONTINUE
                    ? `Enter the complete code, then pause for ${DKHP_CAPTCHA_IDLE_MS / 1000}s to continue automatically.\n`
                    : "Enter the CAPTCHA and press Enter or select Continue.\n") +
                "Automatic reload is paused while you type and resumes after the gate."
            );
            return;
        }

        armHeartbeat();

        if (waitForStartTime()) return;

        if (CONFIG_ERRORS.length) {
            reloadScheduled = true;
            setBadge("The course configuration is invalid:\n" + CONFIG_ERRORS.join("\n"));
            return;
        }

        const {
            selected,
            done,
            leftCourses,
            unexpectedChecked,
            rejectedTargets,
            registeredCredits,
            creditLimit,
            status,
        } = selectTargets();
        const doneMainCourses = MAIN_TARGET_COURSES.filter(course => done.has(norm(course.code)));
        const doneCredits = doneMainCourses
            .reduce((sum, course) => sum + course.credits, 0);
        const notOpenCodes = NOT_OPEN_YET.map(course => course.code).join(", ");
        const notOpenCredits = NOT_OPEN_YET.reduce((sum, course) => sum + course.credits, 0);
        const enabledRetakes = OPTIONAL_RETAKES.filter(course => course.enabled);
        const retakeStatus = enabledRetakes.length
            ? `\nEnabled retakes: ${enabledRetakes.map(course => course.code).join(", ")}.`
            : `\nRetakes remain opt-in and disabled: ${OPTIONAL_RETAKES.map(course => course.code).join(", ")}.`;

        const summary =
            `Active main targets: ${doneMainCourses.length}/${MAIN_TARGET_COURSES.length} courses registered (${doneCredits}/${TARGET_TOTAL_CREDITS} credits).\n` +
            (leftCourses.length
                ? "Pending:\n" + leftCourses.map(course => {
                    const first = course.options[0];
                    return `  - ${course.code}; first option ${first.cls} ${first.time}`;
                }).join("\n")
                : "All currently offered targets are complete.") +
            `\n\nOffering audit: ${SUPPLIED_OPEN_COURSE_COUNT} codes equal ` +
            `${PASSED_OPEN_CODES.length} completed, ${MAIN_TARGET_COURSES.length} targets, and 2 graduation alternatives.` +
            `\nPortal state: ${registeredCredits}/${creditLimit} credits; main targets total at most ${TARGET_TOTAL_CREDITS} credits.` +
            `\nRemaining curriculum plan: ${REMAINING_PLAN_CREDITS} credits; configured term limit: ${TERM_CREDIT_LIMIT} credits.` +
            `\nNot yet offered (${NOT_OPEN_YET.length} courses/${notOpenCredits} credits): ${notOpenCodes}.` +
            `\nOffered but deferred: ETC10190; mutually exclusive alternative excluded: ETC10295.` +
            retakeStatus;

        if (status === "all_done") {
            clearSubmitAttempts();
            setBadge("All configured targets are registered. The workflow is stopped.\n\n" + summary);
            return;
        }

        if (status === "unknown_registered_credits") {
            reloadScheduled = true;
            setBadge(
                "The registered-credit total could not be read, so the credit limit cannot be verified.\n" +
                "Fail-closed lock: no selection or reload. Inspect the page or reload manually."
            );
            return;
        }

        if (status === "portal_rejected") {
            reloadScheduled = true;
            const rejectedLines = rejectedTargets
                .map(target => `${target.code} - ${target.cls} - ${target.time}`)
                .join("\n");
            const selectedLines = selected.length
                ? "\n\nOther selected classes for review:\n" +
                    selected.map(target => `${target.code} - ${target.cls} - ${target.time}`).join("\n")
                : "";
            setBadge(
                "The portal rejected every remaining valid option for the following course(s); reload is stopped:\n" +
                rejectedLines + selectedLines +
                (unexpectedChecked.length ? `\n\n${unexpectedChecked.length} checkbox(es) were selected manually.` : "") +
                "\n\nNo automatic submission. Review the portal message and course conditions manually."
            );
            return;
        }

        if (status === "credit_limited") {
            reloadScheduled = true;
            const selectedLines = selected.length
                ? selected.map(target => `${target.code} - ${target.cls} - ${target.time}`).join("\n")
                : "No target fits within the remaining credit budget.";
            setBadge(
                `Insufficient credit budget: the portal reports ${registeredCredits}/${creditLimit} credits.\n` +
                "The planner shows the maximum feasible set below and will not submit it:\n\n" + selectedLines +
                "\n\nChoose which courses to retain, then register manually."
            );
            return;
        }

        if (status === "ok") {
            // submitSelected owns its post-action recovery schedule.
            submitSelected(selected, unexpectedChecked);
            return;
        }

        if (unexpectedChecked.length) {
            reloadScheduled = true;
            setBadge(
                `${unexpectedChecked.length} manual checkbox selection(s) were found without a valid target plan.\n` +
                "Automatic reload is stopped to preserve those selections."
            );
            return;
        }

        if (status === "no_active_table") {
            scheduleReload(
                "The available-class table is not visible.\nCAPTCHA may still be active, or registration may not be available yet.\n\n" + summary
            );
            return;
        }

        // The table exists, but no configured target row is currently available.
        scheduleReload("No configured target class is visible in the table.\n\n" + summary);
    }

    // ==== BOOT: BFCache AND DOM EVENT GUARDS ====
    function boot() { setTimeout(main, 600); }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
    } else {
        boot(); // the script started after the DOM became ready
    }
    window.addEventListener("load", boot, { once: true });

    // BFCache restore may not fire load. pageshow with persisted=true resets the guards.
    window.addEventListener("pageshow", (e) => {
        if (e.persisted) {
            console.log("[HCMUS Auto DKHP] pageshow persisted=true; rerun main after BFCache restore");
            mainRan = false;
            reloadScheduled = false;
            boot();
        }
    });
})();
