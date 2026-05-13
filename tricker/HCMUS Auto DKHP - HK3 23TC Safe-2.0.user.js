// ==UserScript==
// @name         HCMUS Auto DKHP - HK3 23TC Safe
// @namespace    hcmus-auto-dkhp
// @version      4.3
// @description  Auto login + auto tick + auto submit + auto F5. Không bypass captcha.
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

    // ==== CONFIG ====
    const START_AT = "2026-05-12T09:00:00+07:00"; // sửa nếu portal đổi giờ
    const AUTO_SUBMIT = true;                     // false = chỉ tick, không bấm Đăng Ký
    const AUTO_RELOAD = true;                     // false = không F5
    const RELOAD_SECONDS = 3;                     // chu kỳ F5 cơ bản (giây)
    const RELOAD_JITTER_MS = 1200;                // cộng thêm ngẫu nhiên 0..N ms để tránh đồng bộ
    const POST_SUBMIT_RELOAD_SEC = 6;             // F5 cứu sau khi bấm Đăng Ký (chờ postback)
    const HEARTBEAT_RELOAD_SEC = 12;              // nếu trang đứng quá lâu thì F5 cứu

    // ==== AUTO LOGIN CONFIG ====
    const AUTO_LOGIN = true;                      // false = tắt module login
    const AUTO_NAV_TO_DKHP = true;                // sau login xong tự sang DangKyHocPhan.aspx
    const CAPTCHA_POLL_MS = 400;                  // tần suất check captcha xong
    const CAPTCHA_WAIT_MAX_MIN = 5;               // sau X phút không tick captcha thì bỏ
    const CREDS_KEY = "hcmus-creds-v1";           // key localStorage chứa user/pass

    const TARGET_COURSES = [
        { code: "ETC10123", cls: "23DTV_CLC1", name: "TH Thiết kế vi mạch điện tử", time: "T2(1-6)" },
        { code: "ETC10234", cls: "24DTV_DKD3", name: "Cấu trúc dữ liệu và giải thuật", time: "T2(7-9)" },

        { code: "ETC10227", cls: "22DTV_CLC1", name: "An ninh mạng", time: "T3(1-3)" },
        { code: "ETC10132", cls: "22DTV_CLC1", name: "Xử lý tín hiệu y sinh", time: "T3(4-6)" },
        { code: "ETC10013", cls: "24DTV_DKD1", name: "Xử lý tín hiệu số", time: "T3(7-12)" },

        { code: "ETC00085", cls: "24DTV_DK1A", name: "TH Cảm biến, đo, máy đo", time: "T4(1-3)" },
        { code: "ETC10133", cls: "22DTV_CLC2", name: "Bộ nhớ máy tính", time: "T4(4-6)" },
        { code: "ETC00021", cls: "24DTV_DKD3", name: "Cảm biến, đo, máy đo", time: "T4(7-9)" },

        { code: "ETC10122", cls: "23DTV_CLC3", name: "Thiết kế vi mạch điện tử", time: "T5(7-12)" },

        { code: "ETC00002", cls: "25DTV_DKD3", name: "Điện tử số", time: "T6(1-3)" },
        { code: "ETC10126", cls: "23DTV_CLC1", name: "Anten và truyền sóng", time: "T6(4-6)" },
        { code: "ETC10014", cls: "24DTV_DKD2", name: "TH xử lý tín hiệu số", time: "T7(1-6)" },
    ];

    const RUN_ID = "hcmus-dkhp-hk3-23tc-safe-v3";
    const STOP_KEY = `${RUN_ID}:stopped`;
    const LAST_TICK_KEY = `${RUN_ID}:lastTick`;
    const RELOAD_COUNT_KEY = `${RUN_ID}:reloadCount`;
    const JUST_LOGGED_IN_KEY = `${RUN_ID}:justLoggedIn`;
    const POST_LOGIN_NAV_MAX_SEC = 30;

    // ==== EARLY: bịt dialog NGAY khi script load (trước cả page scripts attach onbeforeunload)
    try { window.confirm = () => true; } catch (e) { }
    try { window.alert = () => undefined; } catch (e) { }
    try { window.onbeforeunload = null; } catch (e) { }

    // Đếm reload để debug
    try {
        const n = Number(localStorage.getItem(RELOAD_COUNT_KEY) || "0") + 1;
        localStorage.setItem(RELOAD_COUNT_KEY, String(n));
        console.log("[HCMUS Auto DKHP] page load #" + n + " @ " + location.href);
    } catch (e) { }

    // ==== UTILS ====
    function norm(s) {
        return String(s || "")
            .normalize("NFC")
            .replace(/\s+/g, " ")
            .trim()
            .toUpperCase();
    }

    function key(t) { return `${t.code}|${t.cls}|${t.time}`; }
    function log(...args) { console.log("[HCMUS Auto DKHP]", ...args); }

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
        stopBtn.textContent = "⏹ Dừng";
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
            setBadge("Đã dừng thủ công. Reload trang sẽ KHÔNG chạy lại.\nMuốn bật lại: xoá key " + STOP_KEY + " trong localStorage.");
        };

        const resetBtn = document.createElement("button");
        resetBtn.textContent = "↻ Reset";
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
        const t = document.getElementById("hcmus-auto-dkhp-badge-text");
        if (t) t.textContent = text;
    }

    // ==== RELOAD LOOP ====
    let reloadScheduled = false;
    function scheduleReload(reason, baseSec) {
        if (!AUTO_RELOAD) {
            setBadge(`${reason}\n(AUTO_RELOAD=false, không tự F5)`);
            return;
        }
        if (reloadScheduled) return;
        reloadScheduled = true;

        const base = (baseSec ?? RELOAD_SECONDS) * 1000;
        const delay = base + Math.floor(Math.random() * RELOAD_JITTER_MS);
        const startAt = Date.now();
        const endAt = startAt + delay;

        const tick = () => {
            const left = Math.max(0, endAt - Date.now());
            setBadge(`${reason}\nF5 sau ${(left / 1000).toFixed(1)}s...`);
            if (left <= 0) return;
            setTimeout(tick, 200);
        };
        tick();

        setTimeout(() => location.reload(), delay);
    }

    // Heartbeat: nếu sau HEARTBEAT_RELOAD_SEC giây mà script chưa quyết định F5
    // (vd: trang đứng vì JS crash khác), tự cứu bằng F5. Bỏ qua khi đã STOP.
    function armHeartbeat() {
        if (!AUTO_RELOAD) return;
        setTimeout(() => {
            if (localStorage.getItem(STOP_KEY) === "1") return;
            if (!reloadScheduled) {
                log("Heartbeat fired — không có nhịp nào đặt reload, tự F5.");
                location.reload();
            }
        }, HEARTBEAT_RELOAD_SEC * 1000);
    }

    // ==== TIME / STOP GATES ====
    function waitForStartTime() {
        if (!START_AT) return false;

        const startMs = new Date(START_AT).getTime();
        if (Number.isNaN(startMs)) {
            setBadge("START_AT sai format. Dùng dạng 2026-05-12T09:00:00+07:00");
            return true;
        }

        const diff = startMs - Date.now();
        if (diff > 0) {
            const reason = `Chưa tới giờ ĐKHP. Còn ${Math.ceil(diff / 1000)}s.`;
            // Khi còn xa thì F5 thưa hơn để khỏi hammer
            const wait = diff > 60000 ? 30 : Math.max(1, Math.ceil(diff / 1000) - 1);
            scheduleReload(reason, wait);
            return true;
        }

        return false;
    }

    function timedOutOrStopped() {
        if (localStorage.getItem(STOP_KEY) === "1") {
            setBadge("Script đang dừng.\nBấm ↻ Reset hoặc xoá key " + STOP_KEY + " để chạy lại.");
            return true;
        }
        return false;
    }

    // ==== DOM HELPERS ====
    function getHeaderMap(table) {
        const map = {};
        const headerRow = Array.from(table.querySelectorAll("tr")).find(tr => {
            const text = norm(tr.textContent);
            return text.includes("MÃ MH") && text.includes("TÊN LỚP");
        });

        if (!headerRow) return null;

        const cells = Array.from(headerRow.querySelectorAll("th,td"));
        cells.forEach((cell, index) => {
            const h = norm(cell.textContent);
            if (h.includes("MÃ MH")) map.code = index;
            if (h.includes("TÊN LỚP") || h === "LỚP") map.cls = index;
            if (h.includes("LỊCH HỌC")) map.time = index;
            if (h.includes("CHỌN")) map.choose = index;
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

    function isRegisteredRow(row, target) {
        const text = norm(row.textContent);
        return text.includes(norm(target.code)) && text.includes(norm(target.cls));
    }

    function getAlreadyRegisteredTargets() {
        const done = new Set();

        for (const { table } of findCourseTables()) {
            const aroundText = norm(table.parentElement?.textContent || "");
            const looksRegisteredTable =
                aroundText.includes("DANH SÁCH LỚP ĐÃ ĐĂNG KÝ") ||
                aroundText.includes("ĐÃ ĐĂNG KÝ");

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

            // Loại bảng "Đã đăng ký" (checkbox của nó là cbHuyDK — hủy ĐK, không phải đăng ký mới)
            const isRegisteredTable =
                text.includes("DANH SÁCH LỚP ĐÃ ĐĂNG KÝ") ||
                !!table.querySelector("input[name*='cbHuyDK']");

            if (isRegisteredTable) return false;

            const looksAllowed =
                text.includes("ĐƯỢC PHÉP ĐĂNG KÝ") ||
                text.includes("DANH SÁCH LỚP MỞ") ||
                text.includes("DANH SÁCH LỚP") ||
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
        const leftTargets = TARGET_COURSES.filter(t => !done.has(key(t)));

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
                        log("Tìm thấy target nhưng checkbox thiếu/disabled:", target);
                        continue;
                    }

                    if (!checkbox.checked) {
                        checkbox.click();
                        // Đảm bảo state checked (vài trường hợp click bị onclick cancel)
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

    // ==== SUBMIT ====
    function findRegisterButton() {
        // Ưu tiên đúng id chuẩn của portal
        const direct = document.getElementById("ctl00_ContentPlaceHolder1_ViewThongTinDangKy1_btnDangKy");
        if (direct) return direct;

        const candidates = Array.from(
            document.querySelectorAll("input[type='submit'], input[type='button'], button")
        );

        return candidates.find(btn => {
            const text = norm([
                btn.value, btn.innerText, btn.textContent,
                btn.id, btn.name, btn.getAttribute("onclick")
            ].join(" "));

            const yes =
                text.includes("ĐĂNG KÝ") ||
                text.includes("DANG KY") ||
                text.includes("DANGKY") ||
                text.includes("DKHP") ||
                text.includes("BTNDANGKY");

            const no =
                text.includes("HỦY") ||
                text.includes("HUY") ||
                text.includes("XEM") ||
                text.includes("XÓA") ||
                text.includes("XOA") ||
                text.includes("BTNDELETE");

            return yes && !no;
        }) || null;
    }

    // Bịt mọi dialog chặn submit
    function muteBlockingDialogs() {
        try { window.confirm = () => true; } catch (e) { }
        try { window.alert = () => undefined; } catch (e) { }
        try { window.onbeforeunload = null; } catch (e) { }
    }

    function submitSelected(selected) {
        if (!selected.length) return false;

        const lines = selected.map(x => `${x.code} - ${x.cls} - ${x.time}`).join("\n");

        if (!AUTO_SUBMIT) {
            setBadge(
                "Đã tick xong. AUTO_SUBMIT=false nên không bấm Đăng Ký.\n\n" +
                lines + "\n\nKiểm tra rồi bấm tay, hoặc đổi AUTO_SUBMIT=true."
            );
            return true;
        }

        muteBlockingDialogs();

        const btn = findRegisterButton();
        if (!btn) {
            setBadge("Tick xong nhưng KHÔNG thấy nút Đăng Ký. Bấm tay đi.\n\n" + lines);
            // Vẫn F5 để retry sang lượt sau
            scheduleReload("Không thấy nút Đăng Ký", POST_SUBMIT_RELOAD_SEC);
            return true;
        }

        setBadge("Đã tick. Đang bấm Đăng Ký:\n\n" + lines);
        localStorage.setItem(LAST_TICK_KEY, String(Date.now()));

        try {
            btn.click();
        } catch (e) {
            log("btn.click() lỗi, thử __doPostBack:", e);
        }

        // F5 cứu nếu postback không trigger reload tự nhiên
        scheduleReload("Đã bấm Đăng Ký. F5 cứu để chắc.", POST_SUBMIT_RELOAD_SEC);
        return true;
    }

    // ==== PAGE DETECTION ====
    function isOnLoginPage() {
        if (/Login\.aspx/i.test(location.pathname)) return true;
        if (document.getElementById("ctl00_ContentPlaceHolder1_txtPassword")) return true;
        const t = norm(document.title || "");
        return t.includes("ĐĂNG NHẬP") && t.includes("HCMUS");
    }

    function isOnDKHPPage() {
        if (/DangKyHocPhan\.aspx/i.test(location.pathname)) return true;
        if (document.getElementById("ctl00_ContentPlaceHolder1_ViewThongTinDangKy1_btnDangKy")) return true;
        return hasDKHPCaptchaGate();
    }

    // DKHP page có thể ở 2 state: (1) gate yêu cầu nhập captcha, (2) bảng đăng ký.
    // Có đủ 3 element captcha = đang ở gate, chưa qua được để vào bảng.
    function hasDKHPCaptchaGate() {
        return !!(
            document.getElementById("ctl00_ContentPlaceHolder1_txtCaptcha") &&
            document.getElementById("ctl00_ContentPlaceHolder1_imgCaptcha") &&
            document.getElementById("ctl00_ContentPlaceHolder1_btnVaoDKHP")
        );
    }

    // ==== CREDS STORE ====
    function getCreds() {
        try { return JSON.parse(localStorage.getItem(CREDS_KEY) || "null"); }
        catch (e) { return null; }
    }
    function setCreds(u, p) {
        localStorage.setItem(CREDS_KEY, JSON.stringify({ u, p }));
    }
    function clearCreds() {
        localStorage.removeItem(CREDS_KEY);
    }

    // ==== LOGIN FLOW ====
    function fillLoginForm(creds) {
        const u = document.getElementById("ctl00_ContentPlaceHolder1_txtUsername");
        const p = document.getElementById("ctl00_ContentPlaceHolder1_txtPassword");
        if (!u || !p) return false;

        // Chỉ fill nếu trường còn rỗng — tránh đè khi user vừa gõ tay
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
            if (typeof grecaptcha !== "undefined" && grecaptcha.getResponse) {
                return grecaptcha.getResponse() || "";
            }
        } catch (e) { }
        const ta = document.getElementById("g-recaptcha-response");
        return ta ? (ta.value || "") : "";
    }

    function markJustLoggedIn() {
        localStorage.setItem(JUST_LOGGED_IN_KEY, String(Date.now()));
    }

    function hookManualLoginClick() {
        const btn = document.getElementById("ctl00_ContentPlaceHolder1_btnLogin");
        if (!btn || btn._hcmusHooked) return;
        btn._hcmusHooked = true;
        // User tự bấm bằng tay thì cũng đánh dấu, để autoNav vẫn hoạt động
        btn.addEventListener("click", markJustLoggedIn, true);
    }

    function waitForCaptchaAndSubmit() {
        const start = Date.now();
        const maxMs = CAPTCHA_WAIT_MAX_MIN * 60 * 1000;

        const iv = setInterval(() => {
            if (Date.now() - start > maxMs) {
                clearInterval(iv);
                setBadge("⏱ Hết giờ chờ captcha. Tick captcha rồi tự bấm Đăng nhập đi.");
                return;
            }
            const tok = getCaptchaToken();
            if (tok && tok.length > 10) {
                clearInterval(iv);
                const btn = document.getElementById("ctl00_ContentPlaceHolder1_btnLogin");
                if (!btn) {
                    setBadge("Captcha xong nhưng không thấy nút Đăng nhập.");
                    return;
                }
                setBadge("✅ Captcha xong → bấm Đăng nhập...");
                markJustLoggedIn();
                setTimeout(() => btn.click(), 200);
            }
        }, CAPTCHA_POLL_MS);
    }

    function makeLoginPanel(creds) {
        makeBadge();
        const t = document.getElementById("hcmus-auto-dkhp-badge-text");
        if (!t) return;

        t.innerHTML = "";
        const title = document.createElement("div");
        title.style.fontWeight = "bold";
        title.style.marginBottom = "6px";
        title.textContent = creds
            ? "🔐 Auto-login: đã có creds"
            : "🔐 Auto-login: chưa lưu creds";
        t.appendChild(title);

        const info = document.createElement("div");
        info.style.fontSize = "12px";
        info.style.color = "#555";
        info.textContent = creds
            ? `User: ${creds.u}\nTick captcha → auto bấm Đăng nhập.`
            : "Bấm [Lưu] để nhập user/pass.";
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

        btnRow.appendChild(mkBtn(creds ? "Đổi creds" : "Lưu creds", "#36c", () => {
            const u = prompt("Tên đăng nhập:", creds?.u || "");
            if (u == null) return;
            const p = prompt("Mật khẩu (lưu vào localStorage plain text):", "");
            if (p == null) return;
            setCreds(u.trim(), p);
            location.reload();
        }));

        if (creds) {
            btnRow.appendChild(mkBtn("Xoá creds", "#c33", () => {
                clearCreds();
                setBadge("Đã xoá creds. Reload để nhập lại.");
            }));
        }
        t.appendChild(btnRow);

        const warn = document.createElement("div");
        warn.style.cssText = "margin-top:8px; font-size:11px; color:#a60;";
        warn.textContent = "⚠ Pass lưu plain text trong localStorage. Đừng dùng máy chung.";
        t.appendChild(warn);
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
                setBadge("Form login chưa render sau 10s. Có thể đây không phải trang login chuẩn.");
                return;
            }
            setTimeout(() => loginMain(retries + 1), 500);
            return;
        }

        waitForCaptchaAndSubmit();
    }

    // ==== POST-LOGIN NAV → DKHP ====
    // Dùng flag localStorage (đặt khi click Đăng nhập) thay vì document.referrer.
    // Referrer hay rỗng do COOP/strict-origin policy → kém tin cậy.
    function autoNavAfterLogin() {
        if (!AUTO_NAV_TO_DKHP) return false;

        const t = Number(localStorage.getItem(JUST_LOGGED_IN_KEY) || "0");
        if (!t) return false;

        const ageSec = (Date.now() - t) / 1000;
        if (ageSec > POST_LOGIN_NAV_MAX_SEC) {
            localStorage.removeItem(JUST_LOGGED_IN_KEY);
            return false;
        }

        if (isOnLoginPage()) return false;   // login chưa thành công, để loginMain xử
        if (isOnDKHPPage()) {
            localStorage.removeItem(JUST_LOGGED_IN_KEY);
            return false;
        }

        setBadge(`✅ Login OK (sau ${ageSec.toFixed(1)}s). Sang trang ĐKHP...`);
        // Xoá flag trước khi nav, tránh loop nếu DKHP lại redirect về Login
        localStorage.removeItem(JUST_LOGGED_IN_KEY);
        setTimeout(() => { location.href = "/DangKyHocPhan.aspx"; }, 250);
        return true;
    }

    // ==== MAIN (dispatcher) ====
    let mainRan = false;
    function main() {
        if (mainRan) return; // tránh chạy 2 lần khi cả DOMContentLoaded + load cùng fire
        mainRan = true;

        muteBlockingDialogs();

        if (isOnLoginPage()) {
            loginMain();
            return;
        }

        // Vừa login xong (flag justLoggedIn còn hạn) → bất kể đang ở trang nào của portal,
        // tự lái sang DangKyHocPhan.aspx. Tin cậy hơn so với check document.referrer.
        if (autoNavAfterLogin()) return;

        if (!isOnDKHPPage()) {
            // Trang khác trên cùng domain (vd: SinhVien.aspx). Không làm gì.
            return;
        }

        // ==== DKHP MODULE ====
        if (hasDKHPCaptchaGate()) {
            // KHÔNG F5, KHÔNG armHeartbeat — để không reset ảnh captcha lúc user đang gõ.
            setBadge(
                "👁 Trang ĐKHP cần captcha.\n" +
                "Gõ captcha rồi Enter (hoặc bấm Tiếp Tục).\n" +
                "Script tạm dừng F5 cho bạn gõ. Qua captcha xong sẽ tự chạy lại."
            );
            return;
        }

        armHeartbeat();

        if (waitForStartTime()) return;
        if (timedOutOrStopped()) return;

        const { selected, done, leftTargets, status } = selectTargets();

        const summary =
            `Đã ĐK ${done.size}/${TARGET_COURSES.length} môn.\n` +
            (leftTargets.length
                ? "Còn chờ:\n" + leftTargets.map(x => `  • ${x.code} ${x.cls} ${x.time}`).join("\n")
                : "Không còn môn nào.");

        if (status === "all_done") {
            setBadge("✅ Đăng ký đủ target rồi. Script dừng.\n\n" + summary);
            return;
        }

        if (status === "ok") {
            // selected.length > 0 → submitSelected sẽ tự đặt scheduleReload cứu
            submitSelected(selected);
            return;
        }

        if (status === "no_active_table") {
            scheduleReload(
                "Chưa thấy bảng lớp được phép đăng ký.\nCó thể chưa qua captcha / chưa tới lượt.\n\n" + summary
            );
            return;
        }

        // no_match_yet — có bảng, có checkbox, nhưng target chưa xuất hiện
        scheduleReload("Chưa thấy lớp target trong bảng.\n\n" + summary);
    }

    // ==== BOOT (chống bfcache + race DOMContentLoaded/load) ====
    function boot() { setTimeout(main, 600); }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
    } else {
        boot(); // script chạy trễ, DOM đã sẵn sàng
    }
    window.addEventListener("load", boot, { once: true });

    // Bfcache restore: browser khôi phục page từ back-forward cache → load KHÔNG fire.
    // pageshow fire với persisted=true. Reset mainRan để chạy lại.
    window.addEventListener("pageshow", (e) => {
        if (e.persisted) {
            console.log("[HCMUS Auto DKHP] pageshow persisted=true (bfcache restore) — re-run main");
            mainRan = false;
            reloadScheduled = false;
            boot();
        }
    });
})();
