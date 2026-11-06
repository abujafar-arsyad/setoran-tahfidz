// Tes tampilan otomatis: membuka www/index.html di Chrome/Edge (headless) dan memakainya seperti pengguna:
// mengetuk layar, mengetik, menyimpan, mengunduh gambar, ekspor-impor.
// Tanpa paket tambahan: memakai Chrome DevTools Protocol lewat fetch/WebSocket bawaan Node (perlu Node 22+).
//
// Jalankan:  npm run test:ui
// Browser dicari otomatis (Chrome, Edge, Chromium). Atur sendiri bila perlu:
//   PowerShell:  $env:CHROME_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"; npm run test:ui
//   Bash:        CHROME_PATH=/usr/bin/chromium npm run test:ui
// Tambahkan SHOW=1 untuk melihat jendela browser (tidak headless).

"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const net = require("net");
const assert = require("assert");
const { spawn } = require("child_process");

const APP = path.resolve(__dirname, "..", "..", "www", "index.html");
const APP_URL = "file:///" + APP.replace(/\\/g, "/").replace(/^\/+/, "");

// ---------------------------------------------------------------- browser
function findBrowser() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const env = process.env, cands = [];
  if (process.platform === "win32") {
    [env["PROGRAMFILES"], env["PROGRAMFILES(X86)"], env.LOCALAPPDATA].filter(Boolean).forEach((base) => {
      cands.push(path.join(base, "Google", "Chrome", "Application", "chrome.exe"));
      cands.push(path.join(base, "Microsoft", "Edge", "Application", "msedge.exe"));
      cands.push(path.join(base, "Chromium", "Application", "chrome.exe"));
    });
  } else if (process.platform === "darwin") {
    cands.push("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      "/Applications/Chromium.app/Contents/MacOS/Chromium");
  } else {
    ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "microsoft-edge"].forEach((b) =>
      (env.PATH || "").split(":").forEach((d) => cands.push(path.join(d, b))));
    // browser bawaan Playwright, bila ada
    [path.join(os.homedir(), ".cache", "ms-playwright"), "/opt/pw-browsers"].forEach((root) => {
      try {
        fs.readdirSync(root).filter((d) => /^chromium-\d+$/.test(d)).forEach((d) => {
          ["chrome-linux64", "chrome-linux"].forEach((sub) => cands.push(path.join(root, d, sub, "chrome")));
        });
      } catch (e) { /* tidak ada */ }
    });
  }
  return cands.find((p) => { try { return fs.statSync(p).isFile(); } catch (e) { return false; } });
}

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, "127.0.0.1", () => { const p = srv.address().port; srv.close(() => resolve(p)); });
    srv.on("error", reject);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch() {
  if (typeof WebSocket === "undefined" || typeof fetch === "undefined") {
    throw new Error("Tes tampilan butuh Node.js 22 atau lebih baru (fetch & WebSocket bawaan). Versi sekarang: " + process.version);
  }
  const exe = findBrowser();
  if (!exe) throw new Error("Chrome/Edge/Chromium tidak ditemukan. Atur CHROME_PATH ke lokasi chrome.exe atau msedge.exe.");
  const port = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "setoran-ui-"));
  const args = ["--remote-debugging-port=" + port, "--user-data-dir=" + profile, "--no-first-run", "--no-default-browser-check",
    "--disable-gpu", "--allow-file-access-from-files", "about:blank"];
  if (!process.env.SHOW) args.unshift("--headless=new");
  if (process.platform === "linux") args.unshift("--no-sandbox");
  const proc = spawn(exe, args, { stdio: "ignore" });
  let page;
  for (let i = 0; i < 60 && !page; i++) {
    await sleep(250);
    try { page = (await (await fetch("http://127.0.0.1:" + port + "/json/list")).json()).find((t) => t.type === "page"); } catch (e) { /* belum siap */ }
  }
  if (!page) { proc.kill(); throw new Error("Browser tidak merespons: " + exe); }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error("Gagal tersambung ke browser")); });
  const B = { exe, proc, ws, profile, id: 0, pending: {}, errors: [], dialogs: [] };
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && B.pending[msg.id]) { B.pending[msg.id](msg); delete B.pending[msg.id]; }
    if (msg.method === "Runtime.exceptionThrown") B.errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
    if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") B.errors.push("console.error: " + msg.params.args.map((a) => a.value || a.description).join(" "));
    if (msg.method === "Page.javascriptDialogOpening") { B.dialogs.push(msg.params.message); send("Page.handleJavaScriptDialog", { accept: true }); }
  };
  const send = (method, params = {}) => new Promise((res) => { const i = ++B.id; B.pending[i] = res; ws.send(JSON.stringify({ id: i, method, params })); });
  B.send = send;
  await send("Runtime.enable"); await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  return B;
}

async function close(B) {
  try { B.ws.close(); } catch (e) { /* */ }
  try { B.proc.kill(); } catch (e) { /* */ }
  await sleep(300);
  try { fs.rmSync(B.profile, { recursive: true, force: true }); } catch (e) { /* profil bisa masih terkunci di Windows */ }
}

// ---------------------------------------------------------------- aksi seperti pengguna
function api(B) {
  const ev = async (js) => {
    const r = await B.send("Runtime.evaluate", { expression: "(async()=>{" + js + "})()", awaitPromise: true, returnByValue: true });
    if (r.result.exceptionDetails) throw new Error("Error di halaman: " + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text));
    return r.result.result.value;
  };
  const H = {
    ev,
    // buka aplikasi dengan data awal tertentu (null = kosong)
    async open(data, settings) {
      await B.send("Page.navigate", { url: APP_URL }); await sleep(500);
      await ev("localStorage.clear();" +
        (data ? "localStorage.setItem('tahfidz_webapp_v1'," + JSON.stringify(JSON.stringify(data)) + ");" : "") +
        "localStorage.setItem('tahfidz_settings_v1'," + JSON.stringify(JSON.stringify(Object.assign({ mode: "light", palette: "ungu" }, settings || {}))) + ");");
      await B.send("Page.reload"); await sleep(900);
      B.errors.length = 0;
    },
    async tap(sel) {
      const p = await ev(`const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null;
        el.scrollIntoView({ block: "center" }); await new Promise((r) => setTimeout(r, 80));
        const b = el.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 };`);
      assert.ok(p, "elemen tidak ditemukan untuk diketuk: " + sel);
      await B.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: p.x, y: p.y }] });
      await sleep(50);
      await B.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await sleep(250);
    },
    async type(text) { await B.send("Input.insertText", { text }); await sleep(180); },
    async tab(name) { await H.tap(`nav.tabbar button[data-tab="${name}"]`); await sleep(150); },
    store: () => ev("return JSON.parse(localStorage.getItem('tahfidz_webapp_v1') || '{}');"),
    toast: () => ev("return document.getElementById('toast').textContent;"),
    text: (sel) => ev(`const el = document.querySelector(${JSON.stringify(sel)}); return el ? el.innerText : null;`),
    // tangkap file yang diunduh aplikasi (gambar/JSON) tanpa menyimpannya ke disk
    async download(buttonSel) {
      await ev(`window.__dl = []; if (!window.__hooked) { window.__hooked = 1; const o = URL.createObjectURL;
        URL.createObjectURL = function (b) { window.__dl.push(b); return o.call(URL, b); };
        HTMLAnchorElement.prototype.click = function () { window.__dlName = this.download; }; }`);
      await H.tap(buttonSel);
      return ev(`for (let i = 0; i < 80 && !window.__dl.length; i++) await new Promise((r) => setTimeout(r, 100));
        const b = window.__dl[0]; if (!b) return null;
        const out = { type: b.type, size: b.size, name: window.__dlName || "" };
        if (b.type === "image/png") {
          const bmp = await createImageBitmap(b); out.width = bmp.width; out.height = bmp.height;
          const c = document.createElement("canvas"); c.width = bmp.width; c.height = bmp.height;
          const ctx = c.getContext("2d"); ctx.drawImage(bmp, 0, 0); window.__lastImg = ctx;
        } else { out.text = await b.text(); }
        return out;`);
    },
    // jumlah piksel gelap dalam kotak (koordinat gambar terakhir yang diunduh)
    darkPixels: (x, y, w, h) => ev(`const d = window.__lastImg.getImageData(${Math.round(x)}, ${Math.round(y)}, ${Math.round(w)}, ${Math.round(h)}).data;
      let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] < 450) n++; return n;`),
    // pilih surah lewat kotak saran: ketuk kolom, ketik, ketuk saran pertama
    async pickSurah(inputSel, query) {
      await H.tap(inputSel); await H.type(query); await sleep(150);
      await H.tap(".rs-panel .rs-item");
    },
    rowInfo: (sel) => ev(`const r = document.querySelector(${JSON.stringify(sel)}); return r ? r.querySelector(".rng-info").textContent : null;`)
  };
  return H;
}

// ---------------------------------------------------------------- data contoh
const SEED = {
  students: [
    { id: "a", name: "Ali", halaqah: "Pagi" }, { id: "b", name: "Badr", halaqah: "Pagi" },
    { id: "c", name: "Cici", halaqah: "Sore" }, { id: "d", name: "Dina" }
  ],
  entries: {
    a: {
      "2026-10-05": { tahsin: "Iqro 3 hal 10", tahfidz: "Al-Mulk 1-30", murojaah: "", keterangan: "", nilai: { tahsin: "", tahfidz: "JJ", murojaah: "" } },
      "2026-10-12": { tahsin: "", tahfidz: "An-Naba 1-20", murojaah: "Al-Mulk 1-30", keterangan: "", nilai: { tahsin: "", tahfidz: "R", murojaah: "M" } },
      "2026-10-13": { tahsin: "", tahfidz: "An-Naba 1-20", murojaah: "", keterangan: "", nilai: { tahsin: "", tahfidz: "MQ", murojaah: "" } },
      "2026-10-19": { tahsin: "", tahfidz: "", murojaah: "", keterangan: "Izin" }
    },
    b: {}, c: {}, d: {}
  },
  selectedStudentId: "a"
};

// ---------------------------------------------------------------- tes
const tests = [];
const t = (name, fn) => tests.push({ name, fn });

t("aplikasi terbuka tanpa error dan punya 5 tab", async (H, B) => {
  await H.open(null);
  const tabs = await H.ev("return [...document.querySelectorAll('nav.tabbar button')].map((b) => b.dataset.tab);");
  assert.deepStrictEqual(tabs, ["catat", "santri", "laporan", "progres", "setelan"]);
  assert.strictEqual(await H.ev("return document.getElementById('halaqahSelect').hidden;"), true, "pilihan halaqah tersembunyi bila belum ada halaqah");
});

t("tambah santri dengan halaqah, daftar dikelompokkan, filter halaqah", async (H) => {
  await H.open(null);
  await H.tab("santri");
  for (const [nama, hal] of [["Ali", "Pagi"], ["Badr", "pagi"], ["Cici", ""]]) {
    await H.tap("#newStudentName"); await H.type(nama);
    await H.ev(`const h = document.getElementById('newStudentHalaqah'); h.value = ${JSON.stringify(hal)};`);
    await H.tap("#btnAddStudent");
  }
  const st = (await H.store()).students.map((s) => [s.name, s.halaqah || ""]);
  assert.deepStrictEqual(st, [["Ali", "Pagi"], ["Badr", "Pagi"], ["Cici", ""]], "ejaan halaqah disamakan dengan yang sudah ada");
  const heads = await H.ev("return [...document.querySelectorAll('#studentList .halaqah-head')].map((h) => h.textContent);");
  assert.deepStrictEqual(heads, ["Halaqah Pagi · 2 santri", "Tanpa halaqah · 1 santri"]);
  const hopts = await H.ev("return [...document.querySelectorAll('#halaqahSelect option')].map((o) => o.textContent);");
  assert.deepStrictEqual(hopts, ["Semua halaqah", "Halaqah Pagi", "Tanpa halaqah"]);
  // filter ke Pagi: pilihan santri hanya Ali & Badr, dan santri terpilih (Cici) berpindah
  await H.ev("const s = document.getElementById('halaqahSelect'); s.value = 'Pagi'; s.dispatchEvent(new Event('change'));");
  const names = await H.ev("return [...document.querySelectorAll('#studentSelect option')].map((o) => o.textContent);");
  assert.deepStrictEqual(names, ["Ali", "Badr"]);
  assert.strictEqual(await H.ev("return document.getElementById('studentSelect').selectedOptions[0].textContent;"), "Ali");
  assert.strictEqual((await H.store()).halaqahFilter, "Pagi", "pilihan halaqah tersimpan");
});

t("ubah halaqah santri lewat tombol ubah data", async (H) => {
  await H.open(SEED);
  await H.tab("santri");
  await H.tap('#studentList button[aria-label="Ubah data Dina"]');
  await H.tap("#renameHalaqah"); await H.type("sore");
  await H.tap("#renameSave");
  const dina = (await H.store()).students.find((s) => s.id === "d");
  assert.strictEqual(dina.halaqah, "Sore", "ejaan disamakan dengan halaqah Sore yang sudah ada");
});

t("catat rentang lintas surah dengan ketukan (kolom Sampai bisa diganti)", async (H) => {
  await H.open(SEED);
  await H.ev("const d = document.getElementById('entryDate'); d.value = '2026-11-02'; d.dispatchEvent(new Event('change'));");
  const row = "#rngTahfidz .rng-row";
  await H.pickSurah(row + " .rs1", "naba"); await H.type("1");
  assert.strictEqual(await H.ev(`return document.querySelector('${row} .rs2').value;`), "An-Naba", "kolom Sampai terisi otomatis");
  await H.pickSurah(row + " .rs2", "nazi"); await H.type("10");   // mengetik langsung harus mengganti isi kolom
  assert.match(await H.rowInfo(row), /50 ayat/);
  await H.tap('#gradeTahfidz button[data-code="JJ"]');
  await H.tap("#btnSave");
  const e = (await H.store()).entries.a["2026-11-02"];
  assert.ok(e && /An-Naba 1/.test(e.tahfidz) && /An-Nazi'at 10/.test(e.tahfidz), "tersimpan: " + (e && e.tahfidz));
  assert.strictEqual(e.nilai.tahfidz, "JJ");
});

t("rentang ayat salah dan nilai tanpa setoran ditolak", async (H) => {
  await H.open(SEED);
  await H.ev("const d = document.getElementById('entryDate'); d.value = '2026-11-03'; d.dispatchEvent(new Event('change'));");
  const row = "#rngTahfidz .rng-row";
  await H.pickSurah(row + " .rs1", "ikhlas"); await H.type("1");
  await H.tap(row + " .ra2"); await H.type("10");
  assert.match(await H.rowInfo(row), /1–4|1-4/);
  await H.tap("#btnSave");
  assert.strictEqual((await H.store()).entries.a["2026-11-03"], undefined, "rentang salah tidak disimpan");
  await H.ev("const d = document.getElementById('entryDate'); d.value = '2026-11-04'; d.dispatchEvent(new Event('change'));");
  await H.tap('#gradeMurojaah button[data-code="J"]');
  await H.tap("#btnSave");
  assert.match(await H.toast(), /Murojaah: nilai diisi tapi setorannya kosong/);
  assert.strictEqual((await H.store()).entries.a["2026-11-04"], undefined);
});

t("laporan: label nilai, dialog edit, dan gambar laporan bernomor tanggal", async (H) => {
  await H.open(SEED, { lembaga: "Ma'had Uji" });
  await H.tab("laporan");
  if (!/Oktober 2026/.test(await H.text("#monthLabel"))) {
    // laporan dibuka di bulan berjalan; mundur sampai Oktober 2026
    for (let i = 0; i < 24 && !/Oktober 2026/.test(await H.text("#monthLabel")); i++) await H.ev("document.getElementById('prevMonth').click();");
  }
  const badges = await H.ev("return [...document.querySelectorAll('#monthTable .grade-badge')].map((b) => b.dataset.code);");
  assert.deepStrictEqual(badges.sort(), ["JJ", "M", "MQ", "R"]);
  await H.tap('#monthTable tr[data-date="2026-10-05"]');
  await H.tap('#mgradeTahfidz button[data-code="M"]');
  await H.tap("#mSave");
  assert.strictEqual((await H.store()).entries.a["2026-10-05"].nilai.tahfidz, "M");
  const img = await H.download("#btnExport");
  assert.ok(img && img.type === "image/png", "gambar laporan terunduh");
  // kolom Tgl: harus ada angka (piksel gelap) di baris tanggal 1, 5, dan 31
  const S = img.width / 1241;
  for (const d of [1, 5, 31]) {
    const y = (325 + (d - 1) * 43.833) * S;
    const n = await H.darkPixels(64 * S, y + 6 * S, 54 * S, 32 * S);
    assert.ok(n > 15, "nomor tanggal " + d + " tidak tergambar (piksel gelap: " + n + ")");
  }
});

t("progres: Rasib tidak dihitung, rapor satu halaman, tema gelap tetap", async (H) => {
  await H.open(SEED, { mode: "dark" });
  await H.tab("progres");
  const sum = await H.text("#pgSummary");
  // Al-Mulk 30 + An-Naba 1-20 (Rasib 12 Okt, lulus 13 Okt) = 50
  assert.match(sum, /\b50\b/, "ringkasan: " + sum);
  assert.match(await H.text("#pgWarn"), /Rasib/);
  const img = await H.download("#pgDownload");
  assert.ok(img && img.type === "image/png", "rapor terunduh");
  assert.strictEqual(img.width, 1080);
  assert.ok(img.height < 2200, "rapor harus satu halaman ringkas, tinggi " + img.height);
  assert.strictEqual(await H.ev("return document.documentElement.getAttribute('data-theme');"), "dark", "tema aplikasi kembali gelap setelah unduh");
});

t("ekspor lalu impor data: semua kembali termasuk halaqah", async (H) => {
  await H.open(SEED);
  await H.tab("setelan");
  const file = await H.download("#btnExportData");
  assert.ok(file && file.text, "file cadangan terunduh");
  const backup = JSON.parse(file.text);
  await H.open({ students: [{ id: "z", name: "Lain" }], entries: { z: {} }, selectedStudentId: "z" });
  await H.ev(`const f = new File([${JSON.stringify(file.text)}], "cadangan.json", { type: "application/json" });
    const dt = new DataTransfer(); dt.items.add(f); const inp = document.getElementById("importFileInput"); inp.files = dt.files;
    inp.dispatchEvent(new Event("change")); await new Promise((r) => setTimeout(r, 400));`);
  await H.tap("#importConfirm");
  const st = await H.store();
  assert.deepStrictEqual(st.students.map((s) => s.name + ":" + (s.halaqah || "")), ["Ali:Pagi", "Badr:Pagi", "Cici:Sore", "Dina:"]);
  assert.deepStrictEqual(st.entries.a, (backup.data || backup).entries.a);
});

// ---------------------------------------------------------------- jalankan
(async () => {
  let B;
  try { B = await launch(); } catch (e) { console.error("TIDAK BISA MENJALANKAN TES TAMPILAN: " + e.message); process.exit(1); }
  console.log("Browser: " + B.exe);
  const H = api(B);
  let failed = 0;
  for (const test of tests) {
    try {
      await test.fn(H, B);
      if (B.errors.length) throw new Error("error di halaman: " + B.errors.join(" | "));
      if (B.dialogs.length) throw new Error("dialog muncul: " + B.dialogs.join(" | "));
      console.log("ok - " + test.name);
    } catch (e) {
      failed++;
      console.log("GAGAL - " + test.name + "\n    " + (e && e.message ? e.message : e));
    }
    B.errors.length = 0; B.dialogs.length = 0;
  }
  await close(B);
  console.log(failed ? `\n${failed} dari ${tests.length} tes tampilan gagal` : `\n${tests.length} tes tampilan lulus`);
  process.exit(failed ? 1 : 0);
})();
