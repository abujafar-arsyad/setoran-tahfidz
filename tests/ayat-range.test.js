// Jalankan: node tests/ayat-range.test.js  (tanpa framework; memuat fungsi murni dari www/index.html)
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const html = fs.readFileSync(path.join(__dirname, "..", "www", "index.html"), "utf8");
const surahSrc = html.slice(html.indexOf("var SURAHS = ["), html.indexOf("var dl = document.getElementById(\"surahList\")") - 20);
const pureSrc = html.slice(html.indexOf("// PG-PURE-BEGIN"), html.indexOf("// PG-PURE-END"));
const pad2 = (n) => String(n).padStart(2, "0");
const api = new Function("pad2", surahSrc + "\n" + pureSrc +
  "\nreturn {SURAHS, pgParseText, pgAnalyze, pgRangeCheck, pgFormatRange, pgRowsFromText, pgTextFromRows, pgSurahIndex, pgJuzOf,   pgJuzSplit, pgJuzStats, pgSuggestSurah, pgDisplayText, pgResolveRow};")(pad2);
  const { SURAHS, pgParseText, pgAnalyze, pgRangeCheck, pgFormatRange, pgRowsFromText, pgTextFromRows, pgSurahIndex, pgJuzOf, pgJuzSplit, pgJuzStats, pgSuggestSurah, pgDisplayText, pgResolveRow } = api;

const idx = (n) => pgSurahIndex(n);
const BAQ = idx("Al-Baqarah"), IMR = idx("Ali 'Imran"), NIS = idx("An-Nisa"), NAS = idx("An-Nas"), FAT = idx("Al-Fatihah");
let n = 0;
function t(name, fn) { fn(); n++; console.log("ok - " + name); }

t("surah data", () => { assert.strictEqual(SURAHS.length, 114); assert.strictEqual(SURAHS[BAQ].ayat, 286); });

// Hafs/Kufan (edisi Mushaf standar, total 6236); dicocokkan dengan api.alquran.cloud/v1/meta
const EXPECTED = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
t("all 114 surah ayat counts match the Hafs reference; total 6236", () => {
  assert.strictEqual(EXPECTED.length, 114);
  EXPECTED.forEach((c, i) => assert.strictEqual(SURAHS[i].ayat, c, "surah " + (i + 1)));
  assert.strictEqual(SURAHS.reduce((s, x) => s + x.ayat, 0), 6236);
});
t("representative counts", () => {
  const c = (name) => SURAHS[idx(name)].ayat;
  assert.strictEqual(c("Al-Fatihah"), 7); assert.strictEqual(c("Al-Baqarah"), 286);
  assert.strictEqual(c("Ali 'Imran"), 200); assert.strictEqual(c("Al-Mulk"), 30); assert.strictEqual(c("An-Nas"), 6);
});
t("each surah full range equals its count; whole-Qur'an cross range is 6236", () => {
  SURAHS.forEach((s, i) => assert.strictEqual(pgRangeCheck(i, 1, i, s.ayat).count, s.ayat));
  assert.strictEqual(pgRangeCheck(0, 1, 113, 6).count, 6236);
});

t("same surah", () => assert.strictEqual(pgRangeCheck(BAQ, 1, BAQ, 30).count, 30));
t("single ayat", () => assert.strictEqual(pgRangeCheck(BAQ, 5, BAQ, 5).count, 1));
t("cross surah Al-Baqarah 200 -> Ali Imran 23", () => {
  const r = pgRangeCheck(BAQ, 200, IMR, 23);
  assert.ok(r.ok); assert.strictEqual(r.count, (286 - 200 + 1) + 23);
});
t("cross multiple surahs includes intervening ones", () => {
  assert.strictEqual(pgRangeCheck(BAQ, 286, NIS, 1).count, 1 + 200 + 1);
});
t("boundaries: whole Qur'an", () => assert.strictEqual(pgRangeCheck(FAT, 1, NAS, 6).count, 6236));
t("boundaries: out of range rejected", () => {
  assert.ok(!pgRangeCheck(BAQ, 0, BAQ, 5).ok);
  assert.ok(!pgRangeCheck(BAQ, 1, BAQ, 287).ok);
  assert.ok(pgRangeCheck(BAQ, 286, BAQ, 286).ok);
  assert.ok(!pgRangeCheck(BAQ, 1, IMR, 201).ok);
  assert.ok(!pgRangeCheck(BAQ, 1.5, BAQ, 5).ok);
  assert.ok(!pgRangeCheck(BAQ, NaN, BAQ, 5).ok);
});
t("invalid: end before start", () => {
  assert.ok(!pgRangeCheck(BAQ, 10, BAQ, 9).ok);
  assert.ok(!pgRangeCheck(IMR, 1, BAQ, 5).ok);
});

t("serialize canonical", () => {
  assert.strictEqual(pgFormatRange(BAQ, 1, BAQ, 30), "Al-Baqarah 1-30");
  assert.strictEqual(pgFormatRange(BAQ, 5, BAQ, 5), "Al-Baqarah 5");
  assert.strictEqual(pgFormatRange(BAQ, 200, IMR, 23), "Al-Baqarah 200 → Ali 'Imran 23");
});

t("canonical text parsed by progress parser", () => {
  const p = pgParseText("Al-Baqarah 1-30; Al-Baqarah 200 → Ali 'Imran 23");
  assert.deepStrictEqual(p.bad, []);
  assert.strictEqual(p.ranges.reduce((s, r) => s + r.b - r.a + 1, 0), 30 + 87 + 23);
});
t("invalid arrow range reported as bad, not counted", () => {
  const p = pgParseText("Ali 'Imran 5 → Al-Baqarah 3");
  assert.strictEqual(p.ranges.length, 0); assert.strictEqual(p.bad.length, 1);
});

t("multiple rows round trip / edit & reopen", () => {
  const rows = [{ i1: BAQ, a1: 1, i2: BAQ, a2: 30 }, { i1: BAQ, a1: 200, i2: IMR, a2: 23 }];
  const text = pgTextFromRows(rows, "");
  const back = pgRowsFromText(text);
  assert.deepStrictEqual(back.rows, rows); assert.strictEqual(back.rest, "");
  assert.strictEqual(pgTextFromRows(back.rows, back.rest), text);
});

t("multiple rows are all counted (none overwritten) in progress", () => {
  const text = pgTextFromRows([{ i1: BAQ, a1: 1, i2: BAQ, a2: 5 }, { i1: BAQ, a1: 10, i2: BAQ, a2: 12 }], "");
  const an = pgAnalyze({ "2026-01-01": { tahfidz: text } }, "tahfidz");
  assert.strictEqual(an.unique, 8); assert.strictEqual(an.total, 8);
});
t("progress for cross-surah range is exact", () => {
  const text = pgTextFromRows([{ i1: BAQ, a1: 200, i2: IMR, a2: 23 }], "");
  const an = pgAnalyze({ "2026-01-01": { tahfidz: text } }, "tahfidz");
  assert.strictEqual(an.total, 110);
  assert.strictEqual(an.perSurah.length, 2);
});

t("legacy free text stays free text and still parses", () => {
  const legacy = "Al-Mulk ayat 1-30, An-Naba";
  const back = pgRowsFromText(legacy);
  assert.strictEqual(back.rows.length, 0); assert.strictEqual(back.rest, legacy);
  assert.ok(pgParseText(legacy).ranges.length >= 2);
});
t("mixed legacy + structured rows keep both", () => {
  const text = pgTextFromRows([{ i1: BAQ, a1: 1, i2: BAQ, a2: 5 }], "An-Naba, juz 30");
  const back = pgRowsFromText(text);
  assert.strictEqual(back.rows.length, 1); assert.strictEqual(back.rest, "An-Naba, juz 30");
});
t("unreadable legacy text yields bad entry", () => {
  const an = pgAnalyze({ "2026-01-01": { tahfidz: "asdfgh xyz" } }, "tahfidz");
  assert.strictEqual(an.bad.length, 1);
});
t("invalid canonical-looking piece is not turned into a row", () => {
  const back = pgRowsFromText("Al-Baqarah 1-500");
  assert.strictEqual(back.rows.length, 0); assert.strictEqual(back.rest, "Al-Baqarah 1-500");
});
t("Iqro text stays free text in Tahsin (never a row)", () => {
  const text = pgTextFromRows([{ i1: BAQ, a1: 1, i2: BAQ, a2: 5 }], "Iqro 3 halaman 12");
  const back = pgRowsFromText(text);
  assert.strictEqual(back.rows.length, 1); assert.strictEqual(back.rest, "Iqro 3 halaman 12");
  assert.strictEqual(pgRowsFromText("Iqro 3 halaman 12").rows.length, 0);
  const an = pgAnalyze({ "2026-01-01": { tahsin: "Iqro 3 halaman 12" } }, "tahfidz");
  assert.strictEqual(an.total, 0);
});

// ---- Juz (Mushaf Madinah/Hafs; dicocokkan dengan api.alquran.cloud/v1/juz/N) ----
const JUZ_SIZES = [148,111,126,131,124,110,149,142,159,127,151,170,154,227,185,269,190,202,339,171,178,169,357,175,246,195,399,137,431,564];
t("juz sizes match reference and sum to 6236", () => {
  const st = pgJuzStats(SURAHS.map((s) => new Uint8Array(s.ayat + 1)));
  assert.deepStrictEqual(st.map((x) => x.total), JUZ_SIZES);
  assert.strictEqual(st.reduce((s, x) => s + x.total, 0), 6236);
});
t("juz boundaries", () => {
  assert.strictEqual(pgJuzOf(FAT, 1), 1);
  assert.strictEqual(pgJuzOf(BAQ, 141), 1); assert.strictEqual(pgJuzOf(BAQ, 142), 2);
  assert.strictEqual(pgJuzOf(BAQ, 252), 2); assert.strictEqual(pgJuzOf(BAQ, 253), 3);
  assert.strictEqual(pgJuzOf(IMR, 92), 3); assert.strictEqual(pgJuzOf(IMR, 93), 4);
  assert.strictEqual(pgJuzOf(idx("Al-Mulk"), 1), 29); assert.strictEqual(pgJuzOf(idx("Al-Mursalat"), 50), 29);
  assert.strictEqual(pgJuzOf(idx("An-Naba"), 1), 30); assert.strictEqual(pgJuzOf(NAS, 6), 30);
});
t("ranges crossing juz boundaries are split exactly", () => {
  assert.deepStrictEqual(pgJuzSplit(BAQ, 140, BAQ, 143), { 1: 2, 2: 2 });
  assert.deepStrictEqual(pgJuzSplit(BAQ, 142, BAQ, 142), { 2: 1 });
  assert.deepStrictEqual(pgJuzSplit(BAQ, 200, IMR, 23), { 2: 53, 3: 57 });
  assert.deepStrictEqual(pgJuzSplit(BAQ, 252, IMR, 93), { 2: 1, 3: 126, 4: 1 });
  assert.deepStrictEqual(pgJuzSplit(idx("Al-Mursalat"), 50, idx("An-Naba"), 1), { 29: 1, 30: 1 });
});
t("juz stats from progress analysis, tahfidz and murojaah consistent", () => {
  const text = pgTextFromRows([{ i1: BAQ, a1: 252, i2: IMR, a2: 93 }], "Iqro 3 halaman 12");
  const ents = { "2026-01-01": { tahfidz: text, murojaah: text, tahsin: "Iqro 4 halaman 253" } };
  ["tahfidz", "murojaah"].forEach((f) => {
    const st = pgJuzStats(pgAnalyze(ents, f).covered);
    assert.deepStrictEqual([st[1].cnt, st[2].cnt, st[3].cnt, st[0].cnt], [1, 126, 1, 0]);
  });
  const none = pgJuzStats(pgAnalyze({ "2026-01-01": { tahsin: "Iqro 4 halaman 253" } }, "tahfidz").covered);
  assert.strictEqual(none.reduce((s, x) => s + x.cnt, 0), 0);
});
t("full Qur'an covers every juz", () => {
  const cov = SURAHS.map((s) => new Uint8Array(s.ayat + 1).fill(1));
  pgJuzStats(cov).forEach((x) => assert.strictEqual(x.cnt, x.total));
});

// ---- Regresi v1.0.8: rentang lintas surah berformat " - " ----
// Catatan: "Ali 'Imran 6 - Al-An'am 7" melewati An-Nisa (176) dan Al-Ma'idah (120): 195 + 176 + 120 + 7 = 498, bukan 202.
t("regresi: 3 rentang lintas surah (' - ') terhitung 37, 261, 498; unik 796; juz & grafik konsisten", () => {
  const ents = {
    "2026-01-01": { tahsin: "Al-Fatihah 1 - Al-Baqarah 30", tahfidz: "Al-Fatihah 1 - Al-Baqarah 30", murojaah: "Al-Fatihah 1 - Al-Baqarah 30" },
    "2026-01-02": { tahsin: "Al-Baqarah 31 - Ali 'Imran 5", tahfidz: "Al-Baqarah 31 - Ali 'Imran 5", murojaah: "Al-Baqarah 31 - Ali 'Imran 5" },
    "2026-01-03": { tahsin: "Ali 'Imran 6 - Al-An'am 7", tahfidz: "Ali 'Imran 6 - Al-An'am 7", murojaah: "Ali 'Imran 6 - Al-An'am 7" }
  };
  ["tahfidz", "murojaah"].forEach((f) => {
    const an = pgAnalyze(ents, f);
    assert.deepStrictEqual(an.bad, []);
    assert.deepStrictEqual(an.daily.map((d) => d.value), [37, 261, 498]);
    assert.strictEqual(an.total, 796); assert.strictEqual(an.unique, 796);
    const st = pgJuzStats(an.covered);
    assert.deepStrictEqual(st.slice(0, 8).map((x) => x.cnt), [148, 111, 126, 131, 124, 110, 46, 0]);
    assert.strictEqual(st.reduce((s, x) => s + x.cnt, 0), an.unique);
    assert.strictEqual(an.perSurah.reduce((s, x) => s + x.cnt, 0), an.unique);
  });
  const only = (a, b) => pgParseText(a).ranges.reduce((s, r) => s + r.b - r.a + 1, 0);
  assert.strictEqual(only("Al-Fatihah 1 - Al-Baqarah 30"), 37);
  assert.strictEqual(only("Al-Baqarah 31 - Ali 'Imran 5"), 261);
  assert.strictEqual(only("Ali 'Imran 6 - Al-An'am 7"), 498);
});t("variasi pemisah lintas surah dan pemisah antar-surah tetap bekerja", () => {
  const sum = (s) => pgParseText(s).ranges.reduce((a, r) => a + r.b - r.a + 1, 0);
  ["Al-Fatihah 1 - Al-Baqarah 30", "Al-Fatihah 1 – Al-Baqarah 30", "Al-Fatihah 1 → Al-Baqarah 30", "Al-Fatihah ayat 1 s/d Al-Baqarah ayat 30", "al fatihah 1 sampai baqoroh 30"]
    .forEach((s) => assert.strictEqual(sum(s), 37, s));
  assert.strictEqual(sum("Al-Kafirun - An-Nas"), 6 + 3 + 5 + 4 + 5 + 6);
  assert.strictEqual(sum("Al-Baqarah 1-30"), 30);
  assert.strictEqual(sum("Al-Baqarah 1-30 - An-Nas"), 36);
  assert.strictEqual(pgParseText("Ali 'Imran 5 - Al-Baqarah 3").bad.length, 1);
  assert.strictEqual(pgParseText("Al-Baqarah 1 - Ali 'Imran 201").ranges.length, 0);
});

t("Tahsin metric: structured ranges counted (unique, per juz, timeline); Iqro never read nor warned", () => {
  const ents = {
    "2026-01-01": { tahsin: "Al-Fatihah 1 - Al-Baqarah 30; Iqro 3 halaman 12" },
    "2026-01-02": { tahsin: "Iqro 4 halaman 253\nAl-Baqarah 31 → Ali 'Imran 5" },
    "2026-01-03": { tahsin: "Tilawati 2 hal 40, Ummi 3" },
    "2026-01-04": { tahsin: "Al-Fatihah 1-7; Juz 'Amma" }
  };
  const an = pgAnalyze(ents, "tahsin");
  assert.deepStrictEqual(an.bad, []);
  assert.deepStrictEqual(an.daily.map((d) => d.value), [37, 261, 0]);
  assert.strictEqual(an.unique, 298);
  const st = pgJuzStats(an.covered);
  assert.deepStrictEqual([st[0].cnt, st[1].cnt, st[2].cnt, st[3].cnt], [148, 111, 39, 0]);
  assert.strictEqual(st.reduce((s, x) => s + x.cnt, 0), 298);
  assert.strictEqual(pgAnalyze({ d: { tahsin: "Iqro 3 halaman 12" } }, "tahsin").unique, 0);
  assert.strictEqual(pgAnalyze({ "2026-01-01": { tahsin: "Iqro 3 halaman 12" } }, "tahsin").bad.length, 0);
});

// ---- Regresi: dropdown surah, lintas surah independen, tampilan Tahsin ----
t("saran surah: ketik 'L' menampilkan pilihan yang bisa dipilih; hasil terpilih dikenali", () => {
  const s = pgSuggestSurah("L", 8);
  assert.ok(s.length > 0);
  s.forEach((i) => assert.strictEqual(pgSurahIndex(SURAHS[i].name), i));
  assert.ok(pgSuggestSurah("Lu", 8).map((i) => SURAHS[i].name).includes("Luqman"));
  assert.deepStrictEqual(pgSuggestSurah("", 8), []);
  assert.strictEqual(SURAHS[pgSuggestSurah("ma'id")[0]].name, "Al-Ma'idah");
  assert.strictEqual(SURAHS[pgSuggestSurah("المائدة")[0]].name, "Al-Ma'idah");
});
t("lintas surah bebas: Al-Ma'idah -> surah mana pun setelahnya, batas ayat dijaga", () => {
  const MAI = idx("Al-Ma'idah"), ANA = idx("Al-An'am"), NAH = idx("An-Nahl");
  assert.strictEqual(pgRangeCheck(MAI, 120, ANA, 1).count, 2);
  assert.strictEqual(pgRangeCheck(MAI, 1, NAH, 128).count, SURAHS.slice(MAI, NAH + 1).reduce((a, x) => a + x.ayat, 0));
  assert.ok(!pgRangeCheck(MAI, 121, ANA, 1).ok);
  assert.ok(!pgRangeCheck(MAI, 1, ANA, 166).ok);
  assert.ok(!pgRangeCheck(ANA, 1, MAI, 1).ok);
});
t("teks lintas surah lama dimuat kembali sebagai baris terstruktur dan tampil kanonik", () => {
  const back = pgRowsFromText("Al-Fatihah 1 - Al-Baqarah 30; Iqro 3");
  assert.deepStrictEqual(back.rows, [{ i1: FAT, a1: 1, i2: BAQ, a2: 30 }]);
  assert.strictEqual(back.rest, "Iqro 3");
  assert.strictEqual(pgDisplayText("Al-Fatihah 1 - Al-Baqarah 30"), "Al-Fatihah 1 \u2192 Al-Baqarah 30");
  assert.strictEqual(pgDisplayText("Al-Baqarah 1-30; Iqro 3"), "Al-Baqarah 1-30; Iqro 3");
  assert.strictEqual(pgDisplayText("Al-Kafirun - An-Nas"), "Al-Kafirun - An-Nas");
});
t("Tahsin: simpan -> muat -> tampil -> progres konsisten dengan Tahfidz", () => {
  const rows = [{ i1: BAQ, a1: 200, i2: IMR, a2: 23 }];
  const saved = pgTextFromRows(rows, "Iqro 3 halaman 12");
  assert.deepStrictEqual(pgRowsFromText(saved).rows, rows);
  assert.strictEqual(pgDisplayText(saved), saved);
  const a = pgAnalyze({ "2026-01-01": { tahsin: saved } }, "tahsin");
  const b = pgAnalyze({ "2026-01-01": { tahfidz: saved } }, "tahfidz");
  assert.strictEqual(a.unique, 110); assert.strictEqual(a.total, b.total);
  assert.deepStrictEqual(pgJuzStats(a.covered), pgJuzStats(b.covered));
});
t("UI: dropdown memakai panel kustom (bukan datalist), dengan click/keyboard", () => {
  assert.ok(!/class="rs rs[12]"[^>]*list=/.test(html));
  ["ArrowDown", "ArrowUp", "Enter", "Escape"].forEach((k) => assert.ok(html.includes('"' + k + '"'), k));
  assert.ok(html.includes('rsPanel.addEventListener("click"'));
  assert.ok(html.includes('rsPanel.addEventListener("mousedown"'));
  assert.ok(html.includes("rs2Touched"));
  assert.ok(html.includes('it.setAttribute("data-i", pos)'), "data-i harus posisi saran, bukan indeks surah");
});

t("dialog edit Laporan memakai komponen rentang yang sama dengan Catat", () => {
  ["Tahsin", "Tahfidz", "Murojaah"].forEach((c) => {
    assert.ok(html.includes('id="mrng' + c + '"'), c);
    assert.ok(html.includes('data-cat="' + c + '" data-m="1"'), c);
  });
  assert.strictEqual((html.match(/function rngAddRow\(/g) || []).length, 1);
  assert.strictEqual((html.match(/function rngCollect\(/g) || []).length, 1);
  assert.ok(html.includes('rngLoad("Tahsin", e.tahsin || "", true)'));
  assert.ok(html.includes("rngCollect(mcats[q], true)"));
});

// ---- Surah tanpa nomor ayat = satu surah penuh (jumlah ayat terverifikasi) ----
t("surah tanpa nomor ayat dihitung penuh: Al-Fatihah = 1-7, Al-Falaq = 1-5, An-Nas = 1-6", () => {
  const one = (s) => pgParseText(s).ranges;
  assert.deepStrictEqual(one("Al-Fatihah"), [{ i: FAT, a: 1, b: 7 }]);
  assert.deepStrictEqual(one("Al-Falaq"), [{ i: idx("Al-Falaq"), a: 1, b: 5 }]);
  assert.deepStrictEqual(one("An-Nas"), [{ i: NAS, a: 1, b: 6 }]);
  assert.deepStrictEqual(one("Al-Baqarah"), [{ i: BAQ, a: 1, b: 286 }]);
  assert.strictEqual(pgParseText("Al-Fatihah").bad.length, 0);
});
t("rentang surah tanpa nomor: Al-Falaq - An-Nas = 5 + 6 = 11 ayat (semua pemisah)", () => {
  const sum = (s) => pgParseText(s).ranges.reduce((a, r) => a + r.b - r.a + 1, 0);
  ["Al-Falaq - An-Nas", "Al-Falaq – An-Nas", "Al-Falaq → An-Nas", "Al-Falaq s/d An-Nas", "al falaq sampai an nas", "Al-Falaq hingga An-Nas"]
    .forEach((s) => assert.strictEqual(sum(s), 11, s));
  assert.deepStrictEqual(pgParseText("Al-Falaq - An-Nas").ranges, [{ i: idx("Al-Falaq"), a: 1, b: 5 }, { i: NAS, a: 1, b: 6 }]);
});
t("rentang tanpa nomor melewati surah di antaranya", () => {
  const sum = (s) => pgParseText(s).ranges.reduce((a, r) => a + r.b - r.a + 1, 0);
  assert.strictEqual(sum("Al-Fatihah - Al-Baqarah"), 7 + 286);
  assert.strictEqual(sum("Al-Ikhlas - An-Nas"), 4 + 5 + 6);
  assert.strictEqual(sum("Al-Fatihah - An-Nas"), 6236);
  assert.strictEqual(pgParseText("An-Nas - Al-Falaq").bad.length, 1);
});
t("ujung tanpa nomor di satu sisi: awal = ayat 1, akhir = ayat terakhir", () => {
  const sum = (s) => pgParseText(s).ranges.reduce((a, r) => a + r.b - r.a + 1, 0);
  assert.strictEqual(sum("Al-Falaq 2 - An-Nas"), 4 + 6);
  assert.strictEqual(sum("Al-Falaq - An-Nas 3"), 5 + 3);
  assert.strictEqual(sum("Al-Baqarah 286 - Ali 'Imran"), 1 + 200);
});
t("ujung bernomor eksplisit dipertahankan", () => {
  const sum = (s) => pgParseText(s).ranges.reduce((a, r) => a + r.b - r.a + 1, 0);
  assert.strictEqual(sum("Al-Falaq 2 - An-Nas 3"), 4 + 3);
  assert.strictEqual(sum("Al-Falaq 2-4"), 3);
  assert.strictEqual(sum("Al-Falaq 3"), 1);
  assert.strictEqual(pgParseText("Al-Falaq 6 - An-Nas").bad.length, 1);
  assert.strictEqual(pgParseText("Al-Falaq 6 - An-Nas").ranges.length, 0);
  assert.strictEqual(pgParseText("Al-Falaq 1-3, 5").bad.length, 0);
});
t("progres: surah tanpa nomor ikut terhitung dan Iqro tetap dikecualikan", () => {
  const an = pgAnalyze({ "2026-01-01": { tahfidz: "Al-Falaq - An-Nas; Al-Fatihah", tahsin: "Iqro 3 halaman 12" } }, "tahfidz");
  assert.deepStrictEqual(an.bad, []); assert.strictEqual(an.unique, 5 + 6 + 7);
  assert.strictEqual(pgAnalyze({ "2026-01-01": { tahsin: "Iqro 3 halaman 12" } }, "tahsin").unique, 0);
});
t("input terstruktur (Catat/Laporan): ayat kosong = surah penuh", () => {
  const FAL = idx("Al-Falaq"), chk = (r) => pgRangeCheck(r.i1, r.a1, r.i2, r.a2);
  const full = pgResolveRow(FAT, null, FAT, null);
  assert.deepStrictEqual(full, { i1: FAT, a1: 1, i2: FAT, a2: 7 }); assert.strictEqual(chk(full).count, 7);
  const rng = pgResolveRow(FAL, null, NAS, null);
  assert.deepStrictEqual(rng, { i1: FAL, a1: 1, i2: NAS, a2: 6 }); assert.strictEqual(chk(rng).count, 11);
  assert.deepStrictEqual(pgResolveRow(FAL, 2, NAS, null), { i1: FAL, a1: 2, i2: NAS, a2: 6 });
  assert.deepStrictEqual(pgResolveRow(FAL, null, NAS, 3), { i1: FAL, a1: 1, i2: NAS, a2: 3 });
  assert.deepStrictEqual(pgResolveRow(FAL, 2, NAS, 3), { i1: FAL, a1: 2, i2: NAS, a2: 3 });
  assert.deepStrictEqual(pgResolveRow(FAL, 2, FAL, null), { i1: FAL, a1: 2, i2: FAL, a2: 2 });
  assert.deepStrictEqual(pgResolveRow(FAL, null, FAL, 3), { i1: FAL, a1: 1, i2: FAL, a2: 3 });
  assert.strictEqual(pgFormatRange(FAL, 1, NAS, 6), "Al-Falaq 1 \u2192 An-Nas 6");
});
console.log(n + " tests passed");
