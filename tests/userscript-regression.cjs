const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");

const scriptPath = path.join(__dirname, "..", "tricker", "HCMUS Auto DKHP - HK3 23TC Safe-2.0.user.js");
const originalSource = fs.readFileSync(scriptPath, "utf8");
let source = originalSource;
source = source.replace(
    "const CONFIG_ERRORS = validateConfig();",
    `const CONFIG_ERRORS = validateConfig();
    globalThis.__test = {
        CONFIG_ERRORS, MAIN_TARGET_COURSES, TARGET_TOTAL_CREDITS,
        PASSED_OPEN_CODES, DEFERRED_PLAN_COURSES, EXCLUDED_ALTERNATIVES,
        OFFICIAL_HK1_OFFERING_CODES,
        buildSelectionPlan, schedulesConflict, targetOptionKey, selectTargets,
        findRegisterButton,
        scheduleReload, STOP_KEY, AUTO_LOGIN, CREDS_KEY, loginMain,
        getCreds, setCreds, clearCreds, getCredsSaveErrorMessage,
        AUTO_SUBMIT, AUTO_RELOAD, AUTO_NAV_TO_DKHP,
        NOT_OPEN_YET, REMAINING_PLAN_CREDITS,
        AUTO_CONFIRM_REGISTRATION: typeof AUTO_CONFIRM_REGISTRATION === "undefined"
            ? undefined : AUTO_CONFIRM_REGISTRATION,
        AUTO_DKHP_CAPTCHA_CONTINUE: typeof AUTO_DKHP_CAPTCHA_CONTINUE === "undefined"
            ? undefined : AUTO_DKHP_CAPTCHA_CONTINUE,
        clickRegistrationButton: typeof clickRegistrationButton === "function"
            ? clickRegistrationButton : null,
        submitSelected: typeof submitSelected === "function"
            ? submitSelected : null,
        armDKHPCaptchaAutoContinue: typeof armDKHPCaptchaAutoContinue === "function"
            ? armDKHPCaptchaAutoContinue : null,
        autoNavFromLoggedInPortalPage: typeof autoNavFromLoggedInPortalPage === "function"
            ? autoNavFromLoggedInPortalPage : null,
        isLivePortalOrigin: typeof isLivePortalOrigin === "function"
            ? isLivePortalOrigin : null,
        getSubmitRetryDecision: typeof getSubmitRetryDecision === "function"
            ? getSubmitRetryDecision : null,
        recordSubmitAttempt: typeof recordSubmitAttempt === "function"
            ? recordSubmitAttempt : null,
        clearSubmitAttempts: typeof clearSubmitAttempts === "function"
            ? clearSubmitAttempts : null,
        SUBMIT_ATTEMPT_KEY: typeof SUBMIT_ATTEMPT_KEY === "undefined"
            ? undefined : SUBMIT_ATTEMPT_KEY,
    };`
);

const storage = new Map();
const gmStorage = new Map();
const documentStub = {
    readyState: "loading",
    addEventListener: () => {},
    getElementById: () => null,
    querySelectorAll: () => [],
};
const windowStub = {
    addEventListener: () => {},
    onbeforeunload: null,
    dkhpInfo: {},
    confirm: () => false,
};
const context = vm.createContext({
    console,
    Date,
    Event,
    setTimeout: () => 0,
    clearTimeout: () => {},
    setInterval: () => 0,
    clearInterval: () => {},
    location: {
        href: "file:///DangKyHocPhan.aspx",
        pathname: "/DangKyHocPhan.aspx",
        hostname: "",
        protocol: "file:",
    },
    localStorage: {
        getItem: key => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, String(value)),
        removeItem: key => storage.delete(key),
    },
    GM_getValue: (key, fallback) => gmStorage.has(key) ? gmStorage.get(key) : fallback,
    GM_setValue: (key, value) => gmStorage.set(key, value),
    GM_deleteValue: key => gmStorage.delete(key),
    unsafeWindow: windowStub,
    document: documentStub,
    window: windowStub,
});
vm.runInContext(source, context, { filename: scriptPath });
const api = context.__test;

const creditsByCode = new Map([
    ["BAA00102", 2],
    ["MTH00040", 3],
    ["ETC00020", 2],
    ["ETC00083", 1],
    ["ETC10015", 3],
    ["ETC10016", 1],
    ["ETC10021", 1],
]);
let rowSequence = 0;

function availableRow(code, cls, time, {
    reject = false,
    checked = false,
    credits = creditsByCode.get(code) ?? 1,
    official = true,
} = {}) {
    rowSequence += 1;
    const repeater = "rptLopHocLaiDKHP";
    const ctl = `ctl${String(rowSequence).padStart(2, "0")}`;
    const checkbox = {
        id: official
            ? `ctl00_ContentPlaceHolder1_ViewThongTinDangKy1_${repeater}_${ctl}_cbDK`
            : `decoy_${ctl}_cbDK`,
        name: official
            ? `ctl00$ContentPlaceHolder1$ViewThongTinDangKy1$${repeater}$${ctl}$cbDK`
            : `decoy$${ctl}$cbDK`,
        disabled: false,
        checked,
        click() {
            if (reject && !this.checked) return;
            this.checked = !this.checked;
        },
    };
    const cells = ["", code, "Course name", cls, String(credits), time].map(textContent => ({ textContent }));
    return {
        checkbox,
        textContent: cells.map(cell => cell.textContent).join(" "),
        querySelectorAll: selector => selector === "td" ? cells : [],
        querySelector: selector => selector === "input[type='checkbox']" ? checkbox : null,
    };
}

function openTable(rows) {
    const headers = ["Chon", "Ma MH", "Ten Mon Hoc", "Ten Lop", "So TC", "Lich Hoc"]
        .map(textContent => ({ textContent }));
    const headerRow = {
        textContent: headers.map(header => header.textContent).join(" "),
        querySelectorAll: selector => selector === "th,td" ? headers : [],
    };
    return {
        parentElement: { textContent: "Danh sach lop mo" },
        querySelectorAll: selector => selector === "tr" ? [headerRow, ...rows]
            : selector === "tbody tr" ? rows
                : [],
        querySelector: selector => selector === "input[type='checkbox']"
            ? rows[0]?.checkbox || null
            : null,
    };
}

function registeredTable(rows) {
    const table = openTable(rows);
    table.parentElement.textContent = "Danh sach lop da dang ky";
    const originalQuery = table.querySelector;
    table.querySelector = selector => selector === "input[name*='cbHuyDK']" ? {}
        : originalQuery(selector);
    return table;
}

function useRows(rows, registeredCredits = 0, creditLimit = 25) {
    const table = openTable(rows);
    documentStub.querySelectorAll = selector => selector === "table" ? [table] : [];
    windowStub.dkhpInfo = { SoTCDaDK: registeredCredits, SoTCToiDa: creditLimit };
}

function fullRows({ rejectLabPrimary = false } = {}) {
    return [
        availableRow("BAA00102", "25DTV_DKD2", "T6(7-12)"),
        availableRow("MTH00040", "25DTV_DKD1", "T3(1-6)"),
        availableRow("ETC00020", "25DTV_DKD1", "T6(1-3)"),
        availableRow("ETC00083", "25DTV_DKD1", "T2(7-12)"),
        availableRow("ETC10015", "24DTV_DKD2", "T4(7-12)"),
        availableRow("ETC10015", "24DTV_DKD1", "T4(1-6)"),
        availableRow("ETC10016", "24DTV_DKD2", "T4(1-6)", { reject: rejectLabPrimary }),
        availableRow("ETC10016", "24DTV_DKD1", "T4(7-12)"),
        availableRow("ETC10021", "24DTV_DKD3", "T3(7-12)"),
    ];
}

function everyTargetRow() {
    return api.MAIN_TARGET_COURSES.flatMap(course =>
        course.options.map(option =>
            availableRow(course.code, option.cls, option.time, { credits: course.credits })
        )
    );
}

assert.deepEqual([...api.CONFIG_ERRORS], []);
assert.equal(api.MAIN_TARGET_COURSES.length, 7);
assert.equal(api.TARGET_TOTAL_CREDITS, 13);
assert.equal(api.AUTO_SUBMIT, true);
assert.equal(api.AUTO_RELOAD, true);
assert.equal(api.AUTO_LOGIN, true);
assert.equal(api.AUTO_NAV_TO_DKHP, true);
assert.equal(api.AUTO_CONFIRM_REGISTRATION, true);
assert.equal(api.AUTO_DKHP_CAPTCHA_CONTINUE, true);
assert.equal(api.REMAINING_PLAN_CREDITS, 34);
assert.equal(api.NOT_OPEN_YET.reduce((sum, course) => sum + course.credits, 0), 17);
assert.deepEqual(
    JSON.parse(JSON.stringify(api.NOT_OPEN_YET.find(course => course.code === "MTH00004"))),
    { code: "MTH00004", credits: 3 }
);
assert.equal(typeof api.isLivePortalOrigin, "function");
assert.equal(typeof api.getSubmitRetryDecision, "function");
assert.equal(typeof api.recordSubmitAttempt, "function");
assert.equal(typeof api.clearSubmitAttempts, "function");
const metadataPortalMatches = [...originalSource.matchAll(
    /^\/\/ @match\s+https:\/\/new-portal(\d+)\.hcmus\.edu\.vn\/\*\r?$/gm
)].map(match => Number(match[1]));
assert.deepEqual(metadataPortalMatches, Array.from({ length: 20 }, (_, index) => index + 1));
assert.match(originalSource, /^\/\/ @grant\s+GM_getValue\r?$/m);
assert.match(originalSource, /^\/\/ @grant\s+GM_setValue\r?$/m);
assert.match(originalSource, /^\/\/ @grant\s+GM_deleteValue\r?$/m);
assert.match(originalSource, /^\/\/ @grant\s+unsafeWindow\r?$/m);
assert.match(originalSource, /^\/\/ @sandbox\s+JavaScript\r?$/m);
assert.doesNotMatch(originalSource, /^\/\/ @grant\s+none\r?$/m);
assert.equal(typeof api.getCreds, "function");
assert.equal(typeof api.setCreds, "function");
assert.equal(typeof api.clearCreds, "function");

// Credentials must be shared by the userscript across every matched Portal origin.
assert.equal(api.clearCreds(), true);
assert.equal(api.setCreds("shared-user", "shared-pass"), "ok");
assert.deepEqual(
    JSON.parse(JSON.stringify(api.getCreds())),
    { u: "shared-user", p: "shared-pass" }
);
context.location.hostname = "new-portal20.hcmus.edu.vn";
assert.deepEqual(
    JSON.parse(JSON.stringify(api.getCreds())),
    { u: "shared-user", p: "shared-pass" }
);
assert.equal(storage.has(api.CREDS_KEY), false);
assert.equal(api.clearCreds(), true);
assert.equal(gmStorage.has(api.CREDS_KEY), false);

// Shared-storage failures must be surfaced and must never masquerade as a
// successful per-origin fallback.
const workingGMSetValue = context.GM_setValue;
const workingGMDeleteValue = context.GM_deleteValue;
context.GM_setValue = () => { throw new Error("synthetic GM write failure"); };
assert.equal(api.setCreds("must-not-fallback", "secret"), "storage_error");
assert.equal(storage.has(api.CREDS_KEY), false);
assert.equal(gmStorage.has(api.CREDS_KEY), false);
context.GM_setValue = workingGMSetValue;
assert.equal(api.setCreds("", "secret"), "invalid");
assert.match(api.getCredsSaveErrorMessage("invalid"), /cannot be empty/i);
assert.match(api.getCredsSaveErrorMessage("storage_error"), /Tampermonkey/i);
assert.equal(api.setCreds("delete-test", "secret"), "ok");
context.GM_deleteValue = () => { throw new Error("synthetic GM delete failure"); };
assert.equal(api.clearCreds(), false);
assert.equal(gmStorage.has(api.CREDS_KEY), true);
context.GM_deleteValue = workingGMDeleteValue;
assert.equal(api.clearCreds(), true);
assert.deepEqual(
    JSON.parse(JSON.stringify(api.MAIN_TARGET_COURSES.map(({ code, options }) => ({ code, options })))),
    [
        {
            code: "BAA00102",
            options: [
                { cls: "25DTV_DKD2", time: "T6(7-12)" },
                { cls: "25DTV_DKD1", time: "T5(1-6)" },
                { cls: "25DTV_DKD3", time: "T4(1-6)" },
            ],
        },
        {
            code: "MTH00040",
            options: [
                { cls: "25DTV_DKD1", time: "T3(1-6)" },
                { cls: "25DTV_DKD2", time: "T5(1-6)" },
                { cls: "25DTV_DKD3", time: "T3(7-12)" },
            ],
        },
        {
            code: "ETC00020",
            options: [
                { cls: "25DTV_DKD1", time: "T6(1-3)" },
                { cls: "25DTV_DKD2", time: "T6(4-6)" },
                { cls: "25DTV_DKD3", time: "T5(1-3)" },
            ],
        },
        {
            code: "ETC00083",
            options: [
                { cls: "25DTV_DKD1", time: "T2(7-12)" },
                { cls: "25DTV_DKD2", time: "T4(1-6)" },
                { cls: "25DTV_DKD3", time: "T4(7-12)" },
            ],
        },
        {
            code: "ETC10015",
            options: [
                { cls: "24DTV_DKD2", time: "T4(7-12)" },
                { cls: "24DTV_DKD1", time: "T4(1-6)" },
                { cls: "24DTV_DKD3", time: "T4(1-6)" },
            ],
        },
        {
            code: "ETC10016",
            options: [
                { cls: "24DTV_DKD2", time: "T4(1-6)" },
                { cls: "24DTV_DKD1", time: "T4(7-12)" },
                { cls: "24DTV_DKD3", time: "T4(7-12)" },
            ],
        },
        {
            code: "ETC10021",
            options: [
                { cls: "24DTV_DKD3", time: "T3(7-12)" },
                { cls: "24DTV_DKD2", time: "T7(1-6)" },
                { cls: "24DTV_DKD1", time: "T6(7-12)" },
            ],
        },
    ]
);
const configuredOpenPartition = [
    ...api.PASSED_OPEN_CODES,
    ...api.MAIN_TARGET_COURSES.map(course => course.code),
    ...api.DEFERRED_PLAN_COURSES.map(course => course.code),
    ...api.EXCLUDED_ALTERNATIVES.map(course => course.code),
];
assert.equal(api.OFFICIAL_HK1_OFFERING_CODES.length, 24);
assert.deepEqual(
    [...api.OFFICIAL_HK1_OFFERING_CODES].sort(),
    [...configuredOpenPartition].sort()
);
assert.equal(new Set(configuredOpenPartition).size, 24);
assert.deepEqual([...configuredOpenPartition].sort(), [
    "BAA00004", "BAA00021", "BAA00101", "BAA00102", "BAA00104",
    "ETC00006", "ETC00013", "ETC00015", "ETC00020", "ETC00083",
    "ETC10015", "ETC10016", "ETC10020", "ETC10021", "ETC10128",
    "ETC10129", "ETC10130", "ETC10131", "ETC10190", "ETC10295",
    "ETC10309", "ETC10329", "MTH00003", "MTH00040",
].sort());

// A failed postback must back off and stop after three attempts of the same plan.
const submitPlan = [
    { code: "BAA00102", cls: "25DTV_DKD2", time: "T6(7-12)" },
    { code: "MTH00040", cls: "25DTV_DKD1", time: "T3(1-6)" },
];
api.clearSubmitAttempts();
assert.equal(api.getSubmitRetryDecision(submitPlan, 100_000).status, "ready");
api.recordSubmitAttempt(submitPlan, 100_000);
assert.equal(api.getSubmitRetryDecision(submitPlan, 101_000).status, "cooldown");
assert.equal(api.getSubmitRetryDecision(submitPlan, 115_000).status, "ready");
api.recordSubmitAttempt(submitPlan, 115_000);
assert.equal(api.getSubmitRetryDecision(submitPlan, 140_000).status, "cooldown");
assert.equal(api.getSubmitRetryDecision(submitPlan, 160_000).status, "ready");
api.recordSubmitAttempt(submitPlan, 160_000);
assert.equal(api.getSubmitRetryDecision(submitPlan, 300_000).status, "blocked");
assert.equal(
    api.getSubmitRetryDecision([{ code: "ETC00020", cls: "X", time: "T6(1-3)" }], 300_000).status,
    "ready"
);
api.clearSubmitAttempts();
assert.equal(storage.has(api.SUBMIT_ATTEMPT_KEY), false);

// Every one of the 21 supplied target classes must be represented and remain schedulable.
useRows(everyTargetRow());
const completeClassPlan = api.selectTargets();
assert.equal(everyTargetRow().length, 21);
assert.equal(completeClassPlan.status, "ok");
assert.equal(completeClassPlan.selected.length, 7);
assert.deepEqual(
    JSON.parse(JSON.stringify(completeClassPlan.selected.map(({ code, cls, time }) => ({ code, cls, time })))),
    [
        { code: "BAA00102", cls: "25DTV_DKD2", time: "T6(7-12)" },
        { code: "MTH00040", cls: "25DTV_DKD1", time: "T3(1-6)" },
        { code: "ETC00020", cls: "25DTV_DKD1", time: "T6(1-3)" },
        { code: "ETC00083", cls: "25DTV_DKD1", time: "T2(7-12)" },
        { code: "ETC10015", cls: "24DTV_DKD2", time: "T4(7-12)" },
        { code: "ETC10016", cls: "24DTV_DKD2", time: "T4(1-6)" },
        { code: "ETC10021", cls: "24DTV_DKD3", time: "T3(7-12)" },
    ]
);
for (let i = 0; i < completeClassPlan.selected.length; i += 1) {
    for (let j = i + 1; j < completeClassPlan.selected.length; j += 1) {
        assert.equal(
            api.schedulesConflict(completeClassPlan.selected[i].time, completeClassPlan.selected[j].time),
            false
        );
    }
}

// The revised BAA00102/DKD2 slot conflicts with ETC10021/DKD1; the global
// planner must move BAA00102 to a fallback instead of dropping a course.
useRows([
    availableRow("BAA00102", "25DTV_DKD2", "T6(7-12)"),
    availableRow("BAA00102", "25DTV_DKD1", "T5(1-6)"),
    availableRow("MTH00040", "25DTV_DKD1", "T3(1-6)"),
    availableRow("ETC00020", "25DTV_DKD1", "T6(1-3)"),
    availableRow("ETC00083", "25DTV_DKD1", "T2(7-12)"),
    availableRow("ETC10015", "24DTV_DKD2", "T4(7-12)"),
    availableRow("ETC10015", "24DTV_DKD1", "T4(1-6)"),
    availableRow("ETC10016", "24DTV_DKD2", "T4(1-6)"),
    availableRow("ETC10016", "24DTV_DKD1", "T4(7-12)"),
    availableRow("ETC10021", "24DTV_DKD1", "T6(7-12)"),
]);
const revisedTimeReplan = api.selectTargets();
assert.equal(revisedTimeReplan.status, "ok");
assert.equal(revisedTimeReplan.selected.length, 7);
assert.equal(revisedTimeReplan.selected.find(item => item.code === "BAA00102").cls, "25DTV_DKD1");
assert.equal(revisedTimeReplan.selected.find(item => item.code === "ETC10021").cls, "24DTV_DKD1");

// Later Portal rejection must roll back the earlier theory choice and replan globally.
useRows(fullRows({ rejectLabPrimary: true }));
const rejectedRecovery = api.selectTargets();
assert.equal(rejectedRecovery.status, "ok");
assert.equal(rejectedRecovery.selected.length, 7);
assert.equal(rejectedRecovery.selected.find(item => item.code === "ETC10015").cls, "24DTV_DKD1");
assert.equal(rejectedRecovery.selected.find(item => item.code === "ETC10016").cls, "24DTV_DKD1");

// Existing registrations must reduce the planner's usable credit budget.
useRows(fullRows(), 20, 25);
const creditLimited = api.selectTargets();
assert.equal(creditLimited.status, "credit_limited");
assert.ok(creditLimited.selected.reduce((sum, item) => sum + item.credits, 0) <= 5);

// A higher Portal value must never loosen the official/configured 25-TC cap.
useRows(fullRows(), 15, 30);
const highPortalLimit = api.selectTargets();
assert.equal(highPortalLimit.creditLimit, 25);
assert.equal(highPortalLimit.status, "credit_limited");
assert.ok(highPortalLimit.selected.reduce((sum, item) => sum + item.credits, 0) <= 10);

// Unknown Portal credit state fails closed.
useRows(fullRows());
windowStub.dkhpInfo = {};
const unknownCredits = api.selectTargets();
assert.equal(unknownCredits.status, "unknown_registered_credits");

// When dkhpInfo is unavailable, the registered-course table is the safe fallback.
const registered = registeredTable([
    availableRow("OLD001", "A", "T2(1-3)", { credits: 3 }),
    availableRow("OLD002", "B", "T3(1-3)", { credits: 2 }),
]);
const available = openTable(fullRows());
documentStub.querySelectorAll = selector => selector === "table" ? [registered, available] : [];
windowStub.dkhpInfo = {};
const domCreditFallback = api.selectTargets();
assert.equal(domCreditFallback.registeredCredits, 5);
assert.equal(domCreditFallback.creditLimit, 25);

// A manual checkbox is surfaced even when no target row is currently available.
const manual = availableRow("OTHER001", "X", "T2(1-3)", { checked: true });
useRows([manual]);
const manualOnly = api.selectTargets();
assert.equal(manualOnly.status, "no_match_yet");
assert.equal(manualOnly.unexpectedChecked.length, 1);

// A live row with an extra meeting must not match a shorter configured schedule.
useRows([availableRow("ETC10016", "24DTV_DKD2", "T4(1-6); T5(1-3)")]);
const extraMeeting = api.selectTargets();
assert.equal(extraMeeting.selected.length, 0);
assert.equal(extraMeeting.status, "no_match_yet");
useRows([availableRow("ETC10016", "24DTV_DKD2", "T4(1-6); TCN(1-3)")]);
assert.equal(api.selectTargets().selected.length, 0);

// Unknown, malformed, or partially parsed schedule fragments must fail closed.
for (const invalidTime of [
    "T4(1-6); ONLINE",
    "T4(1-6);",
    "T4(6-1)",
    "T4(1-13)",
]) {
    useRows([availableRow("ETC10016", "24DTV_DKD2", invalidTime)]);
    const invalidSchedule = api.selectTargets();
    assert.equal(invalidSchedule.selected.length, 0, invalidTime);
    assert.equal(invalidSchedule.status, "no_match_yet", invalidTime);
}

// A header-compatible decoy table without an official cbDK identity is ignored.
useRows([availableRow("ETC10016", "24DTV_DKD2", "T4(1-6)", { official: false })]);
assert.equal(api.selectTargets().status, "no_active_table");

// Portal credits are authoritative for the live row and must equal the audited target.
for (const invalidCredits of [3, ""]) {
    useRows([availableRow("BAA00102", "25DTV_DKD2", "T6(7-12)", { credits: invalidCredits })]);
    const invalidCreditRow = api.selectTargets();
    assert.equal(invalidCreditRow.selected.length, 0, `credits=${invalidCredits}`);
    assert.equal(invalidCreditRow.status, "no_match_yet", `credits=${invalidCredits}`);
}

// Without the exact official register-button ID, full auto must fail closed.
documentStub.getElementById = () => null;
documentStub.querySelectorAll = selector => selector.includes("button")
    ? [{ id: "btnQuayLaiDKHP", textContent: "Back to Registration", value: "", getAttribute: () => "" }]
    : [];
assert.equal(api.findRegisterButton(), null);

// Stop must prevent both a new reload timer and an already queued reload callback.
const badgeText = { textContent: "" };
documentStub.getElementById = id => id === "hcmus-auto-dkhp-badge" ? {}
    : id === "hcmus-auto-dkhp-badge-text" ? badgeText
        : null;
const queuedTimers = [];
context.setTimeout = callback => { queuedTimers.push(callback); return queuedTimers.length; };
storage.set(api.STOP_KEY, "1");
api.scheduleReload("test", 1);
assert.equal(queuedTimers.length, 0);
storage.delete(api.STOP_KEY);
api.scheduleReload("test", 1);
assert.ok(queuedTimers.length >= 2);
storage.set(api.STOP_KEY, "1");
for (const callback of queuedTimers) callback();

// With stored credentials, solving CAPTCHA manually must trigger exactly one login click.
storage.delete(api.STOP_KEY);
context.location.href = "https://new-portal2.hcmus.edu.vn/Login.aspx";
context.location.pathname = "/Login.aspx";
context.location.hostname = "new-portal2.hcmus.edu.vn";
context.location.protocol = "https:";
assert.equal(api.isLivePortalOrigin(), true);
for (let portal = 1; portal <= 20; portal += 1) {
    context.location.hostname = `new-portal${portal}.hcmus.edu.vn`;
    assert.equal(api.isLivePortalOrigin(), true, `portal ${portal} must be live-enabled`);
}
for (const hostname of [
    "new-portal0.hcmus.edu.vn",
    "new-portal21.hcmus.edu.vn",
    "new-portal2.hcmus.edu.vn.evil.example",
    "portal1.hcmus.edu.vn",
]) {
    context.location.hostname = hostname;
    assert.equal(api.isLivePortalOrigin(), false, `${hostname} must remain dry-run`);
}
context.location.hostname = "new-portal1.hcmus.edu.vn";
context.location.protocol = "http:";
assert.equal(api.isLivePortalOrigin(), false, "HTTP must remain dry-run");
context.location.hostname = "new-portal2.hcmus.edu.vn";
context.location.protocol = "https:";
const loginElements = new Map();
const makeElement = () => ({
    style: {},
    children: [],
    appendChild(child) { this.children.push(child); return child; },
    dispatchEvent() {},
    textContent: "",
    innerHTML: "",
});
const loginBadge = makeElement();
const loginBadgeText = makeElement();
const username = makeElement();
const password = makeElement();
username.value = "";
password.value = "";
const captchaResponse = makeElement();
captchaResponse.value = "";
let loginClicks = 0;
const loginListeners = [];
const loginButton = {
    _hcmusHooked: false,
    addEventListener(type, listener) {
        if (type === "click") loginListeners.push(listener);
    },
    click() {
        loginClicks += 1;
        for (const listener of loginListeners) listener();
    },
};
loginElements.set("hcmus-auto-dkhp-badge", loginBadge);
loginElements.set("hcmus-auto-dkhp-badge-text", loginBadgeText);
loginElements.set("ctl00_ContentPlaceHolder1_txtUsername", username);
loginElements.set("ctl00_ContentPlaceHolder1_txtPassword", password);
loginElements.set("g-recaptcha-response", captchaResponse);
loginElements.set("ctl00_ContentPlaceHolder1_btnLogin", loginButton);
documentStub.getElementById = id => loginElements.get(id) || null;
documentStub.createElement = () => makeElement();
const captchaPolls = [];
const loginTimeouts = [];
context.setInterval = callback => {
    captchaPolls.push({ callback, cancelled: false });
    return captchaPolls.length;
};
context.clearInterval = id => {
    if (captchaPolls[id - 1]) captchaPolls[id - 1].cancelled = true;
};
context.setTimeout = callback => {
    loginTimeouts.push({ callback, cancelled: false });
    return loginTimeouts.length;
};
context.clearTimeout = id => {
    if (loginTimeouts[id - 1]) loginTimeouts[id - 1].cancelled = true;
};
const runPoll = index => {
    const poll = captchaPolls[index];
    if (!poll.cancelled) poll.callback();
};
const runLoginTimeout = index => {
    const timer = loginTimeouts[index];
    if (!timer.cancelled) timer.callback();
};
storage.set(api.CREDS_KEY, JSON.stringify({ u: "test-user", p: "test-only" }));
api.loginMain();
api.loginMain();
assert.equal(api.AUTO_LOGIN, true);
assert.equal(username.value, "test-user");
assert.equal(password.value, "test-only");
assert.deepEqual(
    JSON.parse(JSON.stringify(gmStorage.get(api.CREDS_KEY))),
    { u: "test-user", p: "test-only" }
);
assert.equal(storage.has(api.CREDS_KEY), false, "legacy per-origin credentials must migrate");
assert.equal(captchaPolls.length, 1);
windowStub.grecaptcha = { getResponse: () => "" };
captchaResponse.value = "fixture-captcha-token-is-long-enough";
runPoll(0);
assert.equal(loginTimeouts.length, 1);
runLoginTimeout(0);
assert.equal(loginClicks, 1);

// Manual Login must cancel both a pending CAPTCHA poll and a queued auto-click.
captchaResponse.value = "";
api.loginMain();
assert.equal(captchaPolls.length, 2);
loginButton.click();
captchaResponse.value = "fixture-captcha-token-is-long-enough";
runPoll(1);
assert.equal(loginTimeouts.length, 1);
assert.equal(loginClicks, 2);

captchaResponse.value = "";
api.loginMain();
assert.equal(captchaPolls.length, 3);
captchaResponse.value = "fixture-captcha-token-is-long-enough";
runPoll(2);
assert.equal(loginTimeouts.length, 2);
loginButton.click();
runLoginTimeout(1);
assert.equal(loginClicks, 3);

// Stop must cancel a queued automatic Login click.
captchaResponse.value = "";
api.loginMain();
assert.equal(captchaPolls.length, 4);
captchaResponse.value = "fixture-captcha-token-is-long-enough";
runPoll(3);
assert.equal(loginTimeouts.length, 3);
storage.set(api.STOP_KEY, "1");
runLoginTimeout(2);
assert.equal(loginClicks, 3);
storage.delete(api.STOP_KEY);

// Local/saved fixtures must remain dry-run even when their form targets the live Portal.
assert.equal(typeof api.armDKHPCaptchaAutoContinue, "function");
context.location.href = "file:///DangkyCaptcha.html";
context.location.pathname = "/DangkyCaptcha.html";
context.location.hostname = "";
context.location.protocol = "file:";
const localGateListeners = new Map();
const localGateInput = {
    value: "ABCDEF",
    addEventListener(type, listener) { localGateListeners.set(type, listener); },
};
let localGateClicks = 0;
const localGateButton = {
    addEventListener() {},
    click() { localGateClicks += 1; },
};
documentStub.getElementById = id => id === "ctl00_ContentPlaceHolder1_txtCaptcha" ? localGateInput
    : id === "ctl00_ContentPlaceHolder1_btnVaoDKHP" ? localGateButton
        : null;
assert.equal(api.isLivePortalOrigin(), false);
assert.equal(api.armDKHPCaptchaAutoContinue(), false);
assert.equal(localGateListeners.size, 0);
assert.equal(localGateClicks, 0);

// The live DKHP image CAPTCHA gate must click Continue once after all six characters.
context.location.href = "https://new-portal2.hcmus.edu.vn/DangKyHocPhan.aspx";
context.location.pathname = "/DangKyHocPhan.aspx";
context.location.hostname = "new-portal2.hcmus.edu.vn";
context.location.protocol = "https:";
const gateListeners = new Map();
const gateInput = {
    value: "",
    addEventListener(type, listener) { gateListeners.set(type, listener); },
};
let gateClicks = 0;
const gateButton = {
    addEventListener(type, listener) { gateListeners.set(`button:${type}`, listener); },
    click() {
        gateClicks += 1;
        gateListeners.get("button:click")?.();
    },
};
const gateImage = {};
const gateElements = new Map([
    ["ctl00_ContentPlaceHolder1_txtCaptcha", gateInput],
    ["ctl00_ContentPlaceHolder1_imgCaptcha", gateImage],
    ["ctl00_ContentPlaceHolder1_btnVaoDKHP", gateButton],
]);
documentStub.getElementById = id => gateElements.get(id) || null;
const gateTimers = [];
context.setTimeout = callback => { gateTimers.push({ callback, cancelled: false }); return gateTimers.length; };
context.clearTimeout = id => {
    if (gateTimers[id - 1]) gateTimers[id - 1].cancelled = true;
};
assert.equal(api.armDKHPCaptchaAutoContinue(), true);
gateInput.value = "ABCDE";
gateListeners.get("input")();
assert.equal(gateClicks, 0);
assert.equal(gateTimers.length, 0);
gateInput.value = "ABCDEF";
gateListeners.get("input")();
assert.equal(gateTimers.length, 1);
storage.set(api.STOP_KEY, "1");
gateTimers.at(-1).callback();
assert.equal(gateClicks, 0);
storage.delete(api.STOP_KEY);
gateListeners.get("input")();
assert.equal(gateTimers.length, 2);
gateTimers.at(-1).callback();
assert.equal(gateClicks, 1);
gateListeners.get("input")();
gateTimers.at(-1)?.callback();
assert.equal(gateClicks, 1);

// Auto-confirm is scoped to the official registration prompt and restored immediately.
assert.equal(typeof api.clickRegistrationButton, "function");
const originalConfirm = message => message === "unrelated";
windowStub.confirm = originalConfirm;
let registrationAccepted = false;
api.clickRegistrationButton({
    click() {
        registrationAccepted = windowStub.confirm("Ban thuc su muon dang ky nhung lop da chon?");
        assert.equal(windowStub.confirm("unrelated"), true);
    },
});
assert.equal(registrationAccepted, true);
assert.equal(windowStub.confirm, originalConfirm);

// An already-authenticated Portal page must navigate to DKHP without a just-logged-in flag.
assert.equal(typeof api.autoNavFromLoggedInPortalPage, "function");
const navBadge = makeElement();
const navBadgeText = makeElement();
documentStub.body = { textContent: "Hello TEST USER | Dang xuat Dashboard" };
documentStub.getElementById = id => id === "hcmus-auto-dkhp-badge" ? navBadge
    : id === "hcmus-auto-dkhp-badge-text" ? navBadgeText
        : null;
context.location.href = "https://new-portal2.hcmus.edu.vn/SinhVien.aspx";
context.location.pathname = "/SinhVien.aspx";
context.location.hostname = "new-portal2.hcmus.edu.vn";
const navTimers = [];
context.setTimeout = callback => { navTimers.push(callback); return navTimers.length; };
assert.equal(api.autoNavFromLoggedInPortalPage(), true);
assert.equal(navTimers.length, 1);
storage.set(api.STOP_KEY, "1");
navTimers[0]();
assert.equal(context.location.href, "https://new-portal2.hcmus.edu.vn/SinhVien.aspx");
storage.delete(api.STOP_KEY);
assert.equal(api.autoNavFromLoggedInPortalPage(), true);
assert.equal(navTimers.length, 2);
navTimers[1]();
assert.equal(context.location.href, "/DangKyHocPhan.aspx");

// A thrown native click is an ambiguous failure, never a reported success.
assert.equal(typeof api.submitSelected, "function");
context.location.hostname = "new-portal1.hcmus.edu.vn";
context.location.protocol = "https:";
storage.delete(api.STOP_KEY);
api.clearSubmitAttempts();
const clickErrorBadge = makeElement();
const clickErrorBadgeText = makeElement();
documentStub.getElementById = id => id === "hcmus-auto-dkhp-badge" ? clickErrorBadge
    : id === "hcmus-auto-dkhp-badge-text" ? clickErrorBadgeText
        : id === "ctl00_ContentPlaceHolder1_ViewThongTinDangKy1_btnDangKy"
            ? { click() { throw new Error("synthetic click failure"); } }
            : null;
assert.equal(api.submitSelected([
    { code: "ETC10016", cls: "24DTV_DKD2", time: "T4(1-6)", credits: 1 },
], []), true);
assert.match(clickErrorBadgeText.textContent, /Register click failed/);
assert.doesNotMatch(clickErrorBadgeText.textContent, /Register was clicked/);

console.log(JSON.stringify({
    config: "pass",
    portalHostWhitelist: "pass",
    crossPortalCredentialStore: "pass",
    credentialStorageFailure: "pass",
    remainingCredits: "pass",
    officialOfferingCoverage: "pass",
    submitRetryBackoff: "pass",
    targetClassCoverage: "pass",
    revisedTimeGlobalReplan: "pass",
    globalRollback: "pass",
    creditBudget: "pass",
    configuredCapWins: "pass",
    unknownCreditsFailClosed: "pass",
    registeredTableCreditFallback: "pass",
    manualSelectionGuard: "pass",
    exactLiveScheduleMatch: "pass",
    malformedScheduleFailClosed: "pass",
    officialCheckboxIdentity: "pass",
    liveCreditMatch: "pass",
    exactRegisterButton: "pass",
    stopCancelsReload: "pass",
    captchaAutoLogin: "pass",
    manualLoginCancelsAutoClick: "pass",
    stopCancelsQueuedActions: "pass",
    localFixtureDryRun: "pass",
    dkhpCaptchaAutoContinue: "pass",
    scopedRegistrationConfirm: "pass",
    clickExceptionStatus: "pass",
    loggedInPortalAutoRedirect: "pass",
}));
