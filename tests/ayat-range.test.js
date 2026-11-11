// Jalankan: node tests/ayat-range.test.js  (tanpa framework; memuat fungsi murni dari www/index.html)
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const html = fs.readFileSync(path.join(__dirname, "..", "www", "index.html"), "utf8");
const surahSrc = html.slice(html.indexOf("var SURAHS = ["), html.indexOf("var dl = document.getElementById(\"surahList\")") - 20);
const pureSrc = html.slice(html.indexOf("// PG-PURE-BEGIN"), html.indexOf("// PG-PURE-END"));
const pad2 = (n) => String(n).padStart(2, "0");
const BULAN_ID = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const api = new Function("pad2", "BULAN_ID", surahSrc + "\n" + pureSrc +
  "\nreturn {SURAHS, pgParseText, pgAnalyze, pgRangeCheck, pgFormatRange, pgRowsFromText, pgTextFromRows, pgSurahIndex, pgJuzOf, pgJuzSplit, pgJuzStats, pgSuggestSurah, pgDisplayText, pgResolveRow, PG_GRADES, pgGradeSummary, pgGradeBuckets, pgGradeEntryError, pgNormalizeEntryGrades, pgNormalizeEntries, pgRapor, pgMonthAyat, pgCleanHalaqah, pgHalaqahNames, pgGroupStudents, pgNormalizeStudents, PG_NO_HALAQAH, pgWaliLaporanText, pgWaliRaporText, pgFillTemplate, pgWaliLaporanVals, pgWaliRaporVals, PG_WALI_TPL, PG_WALI_FIELDS, pgMonthHafalan, pgDescribeCoverage, pgLastSetoran};")(pad2, BULAN_ID);
const { SURAHS, pgParseText, pgAnalyze, pgRangeCheck, pgFormatRange, pgRowsFromText, pgTextFromRows, pgSurahIndex, pgJuzOf, pgJuzSplit, pgJuzStats, pgSuggestSurah, pgDisplayText, pgResolveRow, PG_GRADES, pgGradeSummary, pgGradeBuckets, pgGradeEntryError, pgNormalizeEntryGrades, pgNormalizeEntries, pgRapor, pgMonthAyat, pgCleanHalaqah, pgHalaqahNames, pgGroupStudents, pgNormalizeStudents, PG_NO_HALAQAH, pgWaliLaporanText, pgWaliRaporText, pgFillTemplate, pgWaliLaporanVals, pgWaliRaporVals, PG_WALI_TPL, PG_WALI_FIELDS, pgMonthHafalan, pgDescribeCoverage, pgLastSetoran } = api;

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
t("rows typed in Arabic are stored, reloaded and displayed in Arabic, and still counted", () => {
  const BALAD = 89, SYAMS = 90, ALAQ = 95;
  const rows = [{ i1: BALAD, a1: 1, i2: BALAD, a2: 7, ar: true }, { i1: SYAMS, a1: 1, i2: ALAQ, a2: 19, ar: true }];
  const text = pgTextFromRows(rows, "");
  assert.strictEqual(text, "البلد ١-٧; الشمس ١ - العلق ١٩");
  const back = pgRowsFromText(text);
  assert.strictEqual(back.rest, ""); assert.strictEqual(back.rows.length, 2);
  assert.ok(back.rows.every((r) => r.ar));
  assert.strictEqual(pgTextFromRows(back.rows, back.rest), text);
  assert.strictEqual(pgDisplayText(text), text);
  const an = pgAnalyze({ "2026-01-01": { tahfidz: text } }, "tahfidz");
  assert.strictEqual(an.total, 7 + 82);
  // Latin rows stay Latin
  assert.strictEqual(pgTextFromRows([{ i1: BALAD, a1: 1, i2: BALAD, a2: 7 }], ""), "Al-Balad 1-7");
});
t("pgLastSetoran: last entry before a date, with next ayat / repeat / nothing", () => {
  const BALAD = 89;
  const ents = {
    "2026-11-01": { tahfidz: "Al-Balad 1-7", nilai: { tahfidz: "JJ" }, tahsin: "Iqro 3 hal 5" },
    "2026-11-03": { tahfidz: "Al-Balad 8-20", nilai: { tahfidz: "M" } },
    "2026-11-05": { tahfidz: "Al-Balad 1-7", nilai: { tahfidz: "R" } },
    "2026-11-07": { tahfidz: "البلد ١-٧", nilai: { tahfidz: "J" } },
  };
  assert.strictEqual(pgLastSetoran(ents, "tahfidz", "2026-11-01"), null);
  let L = pgLastSetoran(ents, "tahfidz", "2026-11-02");
  assert.strictEqual(L.date, "2026-11-01"); assert.strictEqual(L.text, "Al-Balad 1-7");
  assert.deepStrictEqual(L.next, { i: BALAD, a: 8, ar: false }); assert.strictEqual(L.repeat, null);
  L = pgLastSetoran(ents, "tahfidz", "2026-11-04"); // surah finished, no direction known yet: nothing to continue
  assert.strictEqual(L.next, null); assert.strictEqual(L.repeat, null);
  L = pgLastSetoran(ents, "tahfidz", "2026-11-06"); // Rasib: repeat the same range
  assert.strictEqual(L.next, null); assert.strictEqual(L.repeat.length, 1); assert.strictEqual(L.repeat[0].a2, 7);
  L = pgLastSetoran(ents, "tahfidz", "2026-11-08"); // Arabic row keeps its script
  assert.deepStrictEqual(L.next, { i: BALAD, a: 8, ar: true });
  L = pgLastSetoran(ents, "tahsin", "2026-11-08"); // free text: info only
  assert.strictEqual(L.text, "Iqro 3 hal 5"); assert.strictEqual(L.next, null);
});
t("pgLastSetoran: finished surah continues to the neighbouring surah in the direction of past setoran", () => {
  const SYAMS = 90, QADR = 96, NAS = 113;
  // forward, read from a cross-surah range
  let L = pgLastSetoran({ "2026-11-10": { murojaah: "Asy-Syams 1 → Al-'Alaq 19" } }, "murojaah", "2026-11-11");
  assert.deepStrictEqual(L.next, { i: QADR, a: 1, ar: false, newSurah: true });
  // backward (An-Nas towards An-Naba), read from earlier entries
  L = pgLastSetoran({ "2026-11-01": { tahfidz: "An-Nas 1-6" }, "2026-11-03": { tahfidz: "Al-Falaq 1-5" } }, "tahfidz", "2026-11-05");
  assert.deepStrictEqual(L.next, { i: NAS - 2, a: 1, ar: false, newSurah: true });
  // forward from earlier entries
  L = pgLastSetoran({ "2026-11-01": { tahfidz: "Al-Lail 1-21" }, "2026-11-03": { tahfidz: "Ad-Duha 1-11" } }, "tahfidz", "2026-11-05");
  assert.strictEqual(L.next.i, 93); assert.strictEqual(L.next.a, 1);
  // end of the mushaf: nothing after An-Nas
  L = pgLastSetoran({ "2026-11-01": { tahfidz: "Al-Falaq 1-5" }, "2026-11-03": { tahfidz: "An-Nas 1-6" } }, "tahfidz", "2026-11-05");
  assert.strictEqual(L.next, null);
  assert.ok(SYAMS);
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

t("UI: surah terisi terpilih saat fokus/ketuk dan saran tetap tersedia untuk kecocokan persis", () => {
  const attach = html.slice(html.indexOf("function rsAttach(inp)"), html.indexOf("function rngBox(cat, m)"));
  assert.ok(attach.includes('inp.addEventListener("focus"'));
  assert.ok(attach.includes('inp.addEventListener("click"'));
  assert.ok((attach.match(/inp\.select\(\)/g) || []).length >= 2);
  assert.ok(!html.includes('SURAHS[list[0]].name === inp.value.trim()'));
  assert.ok(html.includes("rsAttach(q(\"rs1\")); rsAttach(q(\"rs2\"));"));
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

t("entri lama tanpa nilai mempertahankan hasil progres yang sama", () => {
  const legacy = {
    "2026-01-01": { tahfidz: "Al-Mulk 1-30" },
    "2026-01-02": { tahfidz: "Al-Mulk 1-10" }
  };
  const result = pgAnalyze(legacy, "tahfidz");
  assert.deepStrictEqual(result.daily, [
    { date: "2026-01-01", raw: 30, fresh: 30, value: 30 },
    { date: "2026-01-02", raw: 10, fresh: 0, value: 0 }
  ]);
  assert.deepStrictEqual(result.perSurah, [{ i: idx("Al-Mulk"), cnt: 30, total: 30, last: "2026-01-02" }]);
  assert.strictEqual(result.unique, 30);
  assert.strictEqual(result.total, 30);
  assert.deepStrictEqual(result.rasib, []);
});
t("Tahfidz Al-Mulk bernilai Rasib dikecualikan, lalu nilai JJ menghitung 30 ayat", () => {
  const result = pgAnalyze({
    "2026-01-01": { tahfidz: "Al-Mulk 1-30", nilai: { tahfidz: "R" } },
    "2026-01-02": { tahfidz: "Al-Mulk 1-30", nilai: { tahfidz: "JJ" } }
  }, "tahfidz");
  assert.strictEqual(result.daily[0].value, 0);
  assert.strictEqual(result.daily[1].value, 30);
  assert.strictEqual(result.unique, 30);
  assert.strictEqual(result.total, 30);
  assert.deepStrictEqual(result.rasib, ["2026-01-01"]);
});
t("Murojaah bernilai Rasib tidak dihitung tetapi harinya tetap tercatat", () => {
  const result = pgAnalyze({
    "2026-01-01": { murojaah: "Al-Mulk 1-30", nilai: { murojaah: "R" } }
  }, "murojaah");
  assert.strictEqual(result.daily.length, 1);
  assert.strictEqual(result.daily[0].value, 0);
  assert.strictEqual(result.unique, 0);
  assert.strictEqual(result.total, 0);
});
t("rekap nilai per bulan menghitung kode yang dikenal dalam urutan skala", () => {
  const entries = {
    "2026-03-01": { tahfidz: "Al-Mulk 1-3", nilai: { tahfidz: "M" } },
    "2026-03-02": { tahfidz: "Al-Mulk 4-5", nilai: { tahfidz: "JJ" } },
    "2026-03-03": { tahfidz: "Al-Mulk 6", nilai: { tahfidz: "R" } },
    "2026-03-04": { tahfidz: "Al-Mulk 7", nilai: { tahfidz: "JJ" } },
    "2026-04-01": { tahfidz: "Al-Mulk 8", nilai: { tahfidz: "J" } }
  };
  assert.deepStrictEqual(pgGradeSummary(entries, "tahfidz", 2026, 2), [
    { code: "M", count: 1 }, { code: "JJ", count: 2 }, { code: "R", count: 1 }
  ]);
});
t("impor backup membersihkan kode nilai yang tidak dikenal tanpa mengubah teks lama", () => {
  const incoming = {
    santri: {
      "2026-03-01": { tahsin: "Al-Fatihah 1-7", nilai: { tahsin: "U", tahfidz: "X", murojaah: "JJ" } },
      "2026-03-02": { tahsin: "Iqro 3 halaman 12" }
    }
  };
  const normalized = pgNormalizeEntries(incoming);
  assert.deepStrictEqual(normalized.santri["2026-03-01"].nilai, { tahsin: "", tahfidz: "", murojaah: "JJ" });
  assert.strictEqual(normalized.santri["2026-03-01"].tahsin, "Al-Fatihah 1-7");
  assert.ok(!Object.prototype.hasOwnProperty.call(normalized.santri["2026-03-02"], "nilai"));
  assert.deepStrictEqual(pgNormalizeEntryGrades({ nilai: { tahsin: "Z" } }).nilai, { tahsin: "", tahfidz: "", murojaah: "" });
  assert.ok(html.includes("data.entries = pgNormalizeEntries(pendingImport.entries || {})"));
});
t("sebaran nilai membuat 12 bucket tanpa menghilangkan label skala", () => {
  const buckets = pgGradeBuckets({
    "2026-01-10": { nilai: { tahsin: "M" } },
    "2026-01-11": { nilai: { tahsin: "R" } }
  }, "tahsin", 12, "2026-01-15");
  assert.strictEqual(buckets.length, 12);
  assert.strictEqual(buckets[11].counts.M, 1);
  assert.strictEqual(buckets[11].counts.R, 1);
  assert.deepStrictEqual(PG_GRADES.map((grade) => grade.label), ["Mumtaz", "Jayyid Jiddan", "Jayyid", "Maqbul", "Rasib"]);
});
t("menolak nilai tanpa setoran di Catat dan dialog Laporan", () => {
  const categories = ["Tahsin", "Tahfidz", "Murojaah"];
  const error = pgGradeEntryError(categories, { Tahsin: "Al-Fatihah 1-7", Tahfidz: "   ", Murojaah: "" }, {
    tahsin: "M", tahfidz: "JJ", murojaah: "R"
  });
  assert.strictEqual(error, "Tahfidz: nilai diisi tapi setorannya kosong");
  assert.strictEqual(pgGradeEntryError(categories, { Tahsin: "", Tahfidz: "", Murojaah: "" }, {
    tahsin: "", tahfidz: "", murojaah: ""
  }), "");
  assert.strictEqual(pgGradeEntryError(categories, { Tahsin: "", Tahfidz: "Iqro 3 halaman 12", Murojaah: "Al-Mulk 1-10" }, {
    tahsin: "", tahfidz: "J", murojaah: "MQ"
  }), "");
  assert.match(html, /var gradeError = pgGradeEntryError\(cats, cols, grades\)/);
  assert.match(html, /var gradeError = pgGradeEntryError\(mcats, mc, grades\)/);
});
t("teks laporan bernilai membungkus utuh dan badge disisihkan di kanan atas", () => {
  const start = html.indexOf("  function drawFitted(");
  const end = html.indexOf("\n  function exportReport(", start);
  assert.ok(start >= 0 && end > start);
  const drawFitted = new Function("ARABIC_RE", "FONT_FAMILY",
    html.slice(start, end) + "\nreturn drawFitted;")(/[\u0600-\u06FF]/, "Arial");
  const rendered = [];
  const ctx = {
    measureText(text) { return { width: text.length * 7 }; },
    fillText(text) { rendered.push(text); }
  };
  const sample = "An-Naba 1 → An-Nazi'at 10; Al-Ikhlas 1-4; Al-Falaq 1-5";
  drawFitted(ctx, sample, 0, 281 - 38 - 7, 0, 43.833, 1, {});
  assert.strictEqual(rendered.join(" "), sample);
  assert.ok(rendered.length > 1, "long multi-range text should wrap");
  assert.ok(rendered.every((line) => !line.includes("…")));
  const report = html.slice(end);
  assert.match(report, /var badgeX = cellRight - badgeW - 6 \* S, badgeY = top \+ 5 \* S/);
  assert.match(report, /drawFitted\(ctx, val \|\| "", cellLeft, badgeX - badgeGap, top, bottom, S, \{\}\)/);
});
t("rapor progres: ringkasan satu halaman", () => {
  const ents = {
    "2026-09-10": { tahsin: "", tahfidz: "Al-Mulk 1-30", murojaah: "", keterangan: "", nilai: { tahsin: "", tahfidz: "R", murojaah: "" } },
    "2026-10-05": { tahsin: "Iqro 3 hal 10", tahfidz: "Al-Mulk 1-30", murojaah: "An-Nas 1-6", keterangan: "", nilai: { tahsin: "J", tahfidz: "JJ", murojaah: "M" } },
    "2026-11-02": { tahsin: "Iqro 4 hal 2", tahfidz: "An-Naba 1-10", murojaah: "Al-Mulk 1-30", keterangan: "" },
    "2026-11-03": { tahsin: "", tahfidz: "", murojaah: "", keterangan: "Izin" }
  };
  const r = pgRapor(ents, "2026-11-06");
  assert.strictEqual(r.unique, 40);                       // Rasib September tidak dihitung
  assert.strictEqual(r.surahDone, 1);
  assert.strictEqual(r.months.length, 6);
  assert.deepStrictEqual(r.months.map((m) => m.label), ["Jun", "Jul", "Agu", "Sep", "Okt", "Nov"]);
  assert.deepStrictEqual([r.prev.thf, r.cur.thf], [30, 10]);
  assert.deepStrictEqual([r.prev.mur, r.cur.mur], [6, 30]);
  assert.strictEqual(r.setoranDays, 3);                   // hari Rasib tetap hari setoran; hari Izin tidak
  assert.strictEqual(r.juz.length, 30);
  assert.strictEqual(r.juz[28].cnt, 30); assert.strictEqual(r.juz[29].cnt, 10);
  assert.deepStrictEqual(r.recent.map((x) => x.name), ["An-Naba", "Al-Mulk"]);
  assert.deepStrictEqual(r.tahsinLast, { date: "2026-11-02", text: "Iqro 4 hal 2" });
  assert.strictEqual(r.grades.tahfidz.total, 2);          // 3 bulan terakhir (Sep-Nov): R di Sep + JJ di Okt
  assert.strictEqual(r.grades.tahfidz.counts.R, 1); assert.strictEqual(r.grades.tahfidz.counts.JJ, 1);
  assert.strictEqual(pgRapor(ents, "2026-12-15").grades.tahfidz.total, 1);   // per Desember: Sep sudah keluar dari 3 bulan
  assert.strictEqual(r.grades.murojaah.counts.M, 1);
  const empty = pgRapor({}, "2026-11-06");
  assert.strictEqual(empty.unique, 0); assert.strictEqual(empty.recent.length, 0); assert.strictEqual(empty.tahsinLast, null);
});
t("ringkasan ayat laporan bulanan", () => {
  const ents = {
    "2026-09-30": { tahsin: "", tahfidz: "Al-Mulk 1-10", murojaah: "", keterangan: "" },
    "2026-10-01": { tahsin: "Al-Baqarah 106-109", tahfidz: "Al-Mulk 1-15", murojaah: "An-Nas 1-6; Al-Falaq 1-5", keterangan: "" },
    "2026-10-02": { tahsin: "Iqro 4 hal 3", tahfidz: "Al-Mulk 11-20", murojaah: "An-Nas 1-6", keterangan: "" },
    "2026-10-03": { tahsin: "", tahfidz: "Al-Qalam 1-5", murojaah: "", keterangan: "", nilai: { tahsin: "", tahfidz: "R", murojaah: "" } },
    "2026-11-01": { tahsin: "", tahfidz: "Al-Qalam 1-5", murojaah: "", keterangan: "" }
  };
  // Oktober: hafalan baru 11-15 (5) + 16-20 (5) = 10; Rasib tidak dihitung; murojaah 11 + 6 = 17; tahsin 4 (Iqro diabaikan)
  assert.deepStrictEqual(pgMonthAyat(ents, 2026, 9), { tahfidz: 10, murojaah: 17, tahsin: 4 });
  assert.deepStrictEqual(pgMonthAyat(ents, 2026, 10), { tahfidz: 5, murojaah: 0, tahsin: 0 });
  assert.deepStrictEqual(pgMonthAyat({}, 2026, 9), { tahfidz: 0, murojaah: 0, tahsin: 0 });
});
t("kelompok halaqah", () => {
  assert.strictEqual(pgCleanHalaqah("  Kelas   A  "), "Kelas A");
  assert.strictEqual(pgCleanHalaqah(5), "");
  const st = [
    { id: "a", name: "Ali", halaqah: "Sore" }, { id: "b", name: "Badr", halaqah: "pagi" }, { id: "c", name: "Cici" },
    { id: "d", name: "Dina", halaqah: "Pagi" }, { id: "e", name: "Eko", halaqah: "Kelas 10" }, { id: "f", name: "Fai", halaqah: "Kelas 2" }
  ];
  // unik tanpa beda huruf besar/kecil (ejaan pertama dipakai), urutan alami angka
  assert.deepStrictEqual(pgHalaqahNames(st), ["Kelas 2", "Kelas 10", "pagi", "Sore"]);
  const g = pgGroupStudents(st, "");
  assert.deepStrictEqual(g.map((x) => [x.name, x.students.map((s) => s.id).join("")]),
    [["Kelas 2", "f"], ["Kelas 10", "e"], ["pagi", "bd"], ["Sore", "a"], ["", "c"]]);
  assert.deepStrictEqual(pgGroupStudents(st, "PAGI").map((x) => x.students.map((s) => s.id).join("")), ["bd"]);
  assert.deepStrictEqual(pgGroupStudents(st, PG_NO_HALAQAH).map((x) => x.students.map((s) => s.id).join("")), ["c"]);
  assert.deepStrictEqual(pgGroupStudents(st, "Tidak ada"), []);
  // tanpa halaqah sama sekali: satu kelompok tanpa nama berisi semua santri
  assert.deepStrictEqual(pgGroupStudents([{ id: "x", name: "X" }], "").map((x) => x.name), [""]);
  // normalisasi data lama/impor: field lain tetap, halaqah kosong/bukan teks dibuang
  const n = pgNormalizeStudents([{ id: "a", name: "A", createdAt: 1, halaqah: "  Pagi " }, { id: "b", name: "B", halaqah: 7 }, null, "rusak", { id: "c", name: "C", halaqah: "" }]);
  assert.deepStrictEqual(n, [{ id: "a", name: "A", createdAt: 1, halaqah: "Pagi" }, { id: "b", name: "B" }, { id: "c", name: "C" }]);
  assert.deepStrictEqual(pgNormalizeStudents(undefined), []);
});
t("pesan kirim ke wali (template bawaan, tanpa tanda *)", () => {
  const B = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
  // tanpa uraian surah (d.bulanan) jatuh ke jumlah ayat
  const lap = pgWaliLaporanText({ name: "Fulan", bulan: "Oktober 2026", att: { hadir: 11, izin: 4, sakit: 2, ghoib: 0 },
    ayat: { tahfidz: 29, murojaah: 1412, tahsin: 0 }, nilai: ["Tahfidz: 3× Mumtaz, 1× Jayyid"], pengajar: "Ustadz Fulan", lembaga: "Ma'had Contoh" });
  assert.strictEqual(lap, [B, "",
    "Assalamu'alaikum warahmatullahi wabarakatuh.", "",
    "Berikut laporan setoran ananda Fulan bulan Oktober 2026:",
    "• Hadir: 11 hari (Izin 4, Sakit 2)", "• Hafalan baru: 29 ayat", "• Murojaah: 1.412 ayat",
    "• Nilai Tahfidz: 3× Mumtaz, 1× Jayyid", "", "Laporan lengkap ada di gambar terlampir.", "",
    "Jazakumullahu khairan.", "— Ustadz Fulan"].join("\n"));
  assert.ok(!lap.includes("*"), "tanpa tanda bintang");
  // tanpa izin, tanpa tahsin/nilai, tanpa pengajar: baris kosong dibuang
  const kosong = pgWaliLaporanText({ name: "A", bulan: "Mei 2026", att: { hadir: 2, izin: 0, sakit: 0, ghoib: 0 }, ayat: { tahfidz: 0, murojaah: 0, tahsin: 0 } });
  assert.ok(kosong.includes("• Hadir: 2 hari\n"));
  assert.ok(kosong.includes("• Hafalan baru: belum ada\n• Murojaah: belum ada\n"));
  assert.ok(!kosong.includes("Tahsin") && !kosong.includes("Nilai") && !kosong.includes("—"));
  assert.ok(kosong.endsWith("Jazakumullahu khairan."));
  assert.ok(!/\n\n\n/.test(kosong), "tidak ada baris kosong berlebih");
  // rapor dari data sungguhan: hafalan disebut per surah, tanpa persentase
  const ents = {
    "2026-09-22": { tahsin: "", tahfidz: "Al-Qadr 1-5", murojaah: "", keterangan: "" },
    "2026-10-06": { tahsin: "Al-Baqarah 106-109", tahfidz: "Al-Bayyinah 1-8", murojaah: "An-Nas 1-6; Al-Falaq 1-5", keterangan: "" },
    "2026-11-02": { tahsin: "Iqro 5 hal 2", tahfidz: "Al-Alaq 1-4", murojaah: "Al-Qadr 1-5; Al-Bayyinah 1-8", keterangan: "" },
    "2026-11-03": { tahsin: "", tahfidz: "Al-Alaq 5-6", murojaah: "", keterangan: "" }
  };
  const R = pgRapor(ents, "2026-11-06");
  const rap = pgWaliRaporText({ name: "Amr", tanggal: "6 November 2026", unique: R.unique, surahDone: R.surahDone, juzDone: R.juzDone,
    bulan: "November", cur: R.cur, recent: R.recent, hafalan: R.hafalan, bulanIni: R.bulanIni, pengajar: "Ustadz Fulan" });
  assert.strictEqual(rap, [B, "", "Assalamu'alaikum warahmatullahi wabarakatuh.", "",
    "Berikut rapor progres hafalan ananda Amr per 6 November 2026.", "",
    "Alhamdulillah, ananda sudah hafal 2 surah dan 6 ayat, yaitu Al-'Alaq ayat 1–6, Al-Qadr, dan Al-Bayyinah.", "",
    "Bulan November:", "• Hafalan baru: Al-'Alaq ayat 1–6 (6 ayat)", "• Murojaah: Al-Qadr dan Al-Bayyinah (13 ayat)", "",
    "Rapor lengkap ada di gambar terlampir.", "", "Jazakumullahu khairan.", "— Ustadz Fulan"].join("\n"));
  assert.ok(!rap.includes("%") && !rap.includes("*"));
  // laporan bulanan dengan uraian surah; tahsin ayat dan Iqro
  const okt = pgWaliLaporanText({ name: "Amr", bulan: "Oktober 2026", att: { hadir: 1 }, bulanan: pgMonthHafalan(ents, 2026, 9) });
  assert.ok(okt.includes("• Hafalan baru: Al-Bayyinah (8 ayat)\n• Murojaah: Al-Falaq dan An-Nas (11 ayat)\n• Tahsin: Al-Baqarah ayat 106–109 (4 ayat)"));
  const nov = pgWaliLaporanText({ name: "Amr", bulan: "November 2026", att: { hadir: 2 }, bulanan: pgMonthHafalan(ents, 2026, 10) });
  assert.ok(nov.includes("• Tahsin: Iqro 5 hal 2"), "tahsin Iqro ditulis apa adanya");
});
t("uraian hafalan per surah dan juz", () => {
  // An-Naba (78) s.d. An-Nas (114) = Juz 30 penuh, ditambah Al-Mulk 1-10
  const ents = { "2026-10-01": { tahfidz: "An-Naba 1 → An-Nas 6; Al-Mulk 1-10", murojaah: "", tahsin: "", keterangan: "" } };
  const R = pgRapor(ents, "2026-11-06");
  assert.strictEqual(R.hafalan.text, "Al-Mulk ayat 1–10 dan Juz 30");
  assert.strictEqual(R.hafalan.jumlah, "37 surah dan 10 ayat");
  // ayat yang tidak bersambung
  const R2 = pgRapor({ "2026-10-01": { tahfidz: "Al-Baqarah 1-5; Al-Baqarah 10; Al-Baqarah 12-20", murojaah: "", tahsin: "", keterangan: "" } }, "2026-11-06");
  assert.strictEqual(R2.hafalan.text, "Al-Baqarah ayat 1–5, 10, 12–20");
  assert.strictEqual(R2.hafalan.jumlah, "15 ayat");
  // tanpa hafalan: kalimat "sudah hafal" tidak ditampilkan
  const R3 = pgRapor({}, "2026-11-06");
  const txt = pgWaliRaporText({ name: "X", tanggal: "6 November 2026", bulan: "November", hafalan: R3.hafalan, bulanIni: R3.bulanIni });
  assert.ok(!txt.includes("sudah hafal") && txt.includes("• Hafalan baru: belum ada"));
});
t("template pesan wali buatan sendiri", () => {
  const d = { name: "Fulan", bulan: "Oktober 2026", att: { hadir: 9, izin: 0, sakit: 1, ghoib: 0 }, ayat: { tahfidz: 12, murojaah: 40, tahsin: 0 }, pengajar: "" };
  const tpl = "Salam, ini laporan {nama} ({bulan}).\r\nHadir {hadir} hari{izin_sakit}.\nTahsin: {tahsin}\nKalimat {tidak_dikenal} tetap.\n\n\n\nTtd. {pengajar}\nWassalam";
  assert.strictEqual(pgWaliLaporanText(d, tpl),
    "Salam, ini laporan Fulan (Oktober 2026).\nHadir 9 hari (Sakit 1).\nKalimat {tidak_dikenal} tetap.\n\nWassalam");
  // template kosong/spasi = bawaan
  assert.strictEqual(pgWaliLaporanText(d, "   "), pgWaliLaporanText(d));
  // baris dengan beberapa isian tetap tampil bila salah satunya terisi
  assert.strictEqual(pgFillTemplate("{a}{b} x", { a: "", b: "1" }), "1 x");
  assert.strictEqual(pgFillTemplate("{a}{b} x\nlain", { a: "", b: "" }), "lain");
  // semua isian yang ditawarkan di Setelan memang dikenal pembuat pesan
  const vl = pgWaliLaporanVals(d), vr = pgWaliRaporVals({});
  PG_WALI_FIELDS.laporan.forEach(([k]) => assert.ok(k in vl, "isian laporan " + k));
  PG_WALI_FIELDS.rapor.forEach(([k]) => assert.ok(k in vr, "isian rapor " + k));
  // template bawaan hanya memakai isian yang dikenal
  for (const kind of ["laporan", "rapor"]) {
    const keys = (PG_WALI_TPL[kind].match(/\{([a-z_]+)\}/g) || []).map((x) => x.slice(1, -1));
    const ok = kind === "laporan" ? vl : vr;
    keys.forEach((k) => assert.ok(k in ok, kind + ": " + k));
  }
});

console.log(n + " tests passed");
