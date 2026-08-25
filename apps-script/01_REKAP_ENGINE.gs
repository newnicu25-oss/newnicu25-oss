// =========================================================================
// REKAP ENGINE NICU AUTOMATIC - VALIDATED & REVISED (2026)
// RSUD DR. M. SOEWANDHI
// =========================================================================

const MAP_KOLOM = {
"NICU_LEVEL_2": {
MRS: "B", // Tgl MRS Masuk
KRS: "AS", // TGL_KRS (Kolom 45) - ACUAN UTAMA REKAP
NAMA: "F", // nama_bayi (Kolom 6)
HARI_RAWAT: "AT", // Hari Rawat (Kolom 46)
STATUS: "AJ", // Status Keluar (Kolom 36) / STATUS TERAKHIR "AX"
KET_MATI: "AQ", // Meninggal <48 / >=48 (Kolom 43)
CPAP: "AM", // CPAP (Kolom 39)
VENTILATOR: "AN", // VENTILATOR (Kolom 40)
INKUBATOR: "AO", // INKUBATOR/BOX (Kolom 41)
FOTOTERAPI: "AP" // FOTOTERAPI (Kolom 42)
},
"NICU_LEVEL_3": {
MRS: "B",
KRS: "AS",
NAMA: "F",
HARI_RAWAT: "AT",
STATUS: "AJ",
KET_MATI: "AQ",
CPAP: "AM",
VENTILATOR: "AN",
INKUBATOR: "AO",
FOTOTERAPI: "AP"
}
};

function colToIdx(colStr) {
if (!colStr) return -1;
let col = colStr.trim().toUpperCase();
let sum = 0;
for (let i = 0; i < col.length; i++) {
sum = sum * 26 + (col.charCodeAt(i) - 64);
}
return sum - 1;
}

function PAKSA_GENERATE_REKAP(tampilkanToast = true) {
const ss = SpreadsheetApp.getActiveSpreadsheet();
let sh = ss.getSheetByName("REKAP_NICU");

if (!sh) sh = ss.insertSheet("REKAP_NICU");
sh.clear();

// Header Judul Utama
sh.getRange("A1:N1")
.merge()
.setValue("REKAP LENGKAP INDIKATOR PELAYANAN NICU TAHUN 2026")
.setFontSize(14)
.setFontWeight("bold")
.setBackground("#1565C0")
.setFontColor("white")
.setHorizontalAlignment("center");

const level2 = olahDataNICUEksplisit("NICU_LEVEL_2", 12, 2026);
const level3 = olahDataNICUEksplisit("NICU_LEVEL_3", 8, 2026);
const gabungan = gabungDataNICULengkap(level2, level3, 20, 2026);

let row = 3;
row = tulisTabelLengkap(sh, row, "NICU LEVEL 2 (12 Tempat Tidur)", level2, 2026);
row += 2;
row = tulisTabelLengkap(sh, row, "NICU LEVEL 3 (8 Tempat Tidur)", level3, 2026);
row += 2;
row = tulisTabelLengkap(sh, row, "NICU GABUNGAN (20 Tempat Tidur)", gabungan, 2026);

sh.autoResizeColumns(1, 14);

if (tampilkanToast) {
ss.toast("Rekapitulasi Indikator NICU 2026 Berhasil Divalidasi!", "Sukses", 3);
}
}

/**
* Parser Tanggal Presisi Standar Indonesia (DD/MM/YYYY)
*/
function parseTanggalIndo(val) {
if (!val) return null;
if (val instanceof Date) return isNaN(val.getTime()) ? null : val;

let str = String(val).trim();
if (!str) return null;

let parts = str.split(/[\/\-\s.]+/);
if (parts.length >= 3) {
let p1 = parseInt(parts[0], 10);
let p2 = parseInt(parts[1], 10);
let p3 = parseInt(parts[2], 10);

if (p3 > 1000) return new Date(p3, p2 - 1, p1);
if (p1 > 1000) return new Date(p1, p2 - 1, p3);
}

let d = new Date(str);
return isNaN(d.getTime()) ? null : d;
}

function olahDataNICUEksplisit(namaSheet, tt, tahun) {
const ss = SpreadsheetApp.getActiveSpreadsheet();
const sh = ss.getSheetByName(namaSheet);

let bulan = Array.from({ length: 12 }, () => ({
pasien: 0, meninggal: 0, kurang48: 0, lebih48: 0,
krs: 0, rujuk: 0, pp: 0, keluar: 0,
hariRawat: 0, pasien7: 0,
cpap: 0, inkubator: 0, ventilator: 0, fototerapi: 0,
BOR: 0, ALOS: 0, TOI: 0, BTO: 0, NDR: 0, GDR: 0
}));

if (!sh) return { tt: tt, bulan: bulan };

const values = sh.getDataRange().getValues();
if (values.length < 4) return { tt: tt, bulan: bulan };

const cfg = MAP_KOLOM[namaSheet] || MAP_KOLOM["NICU_LEVEL_2"];
const iMrs = colToIdx(cfg.MRS);
const iKrs = colToIdx(cfg.KRS);
const iNama = colToIdx(cfg.NAMA);
const iHari = colToIdx(cfg.HARI_RAWAT);
const iStatus = colToIdx(cfg.STATUS);
const iKetMati = colToIdx(cfg.KET_MATI);
const iCpap = colToIdx(cfg.CPAP);
const iInk = colToIdx(cfg.INKUBATOR);
const iVent = colToIdx(cfg.VENTILATOR);
const iFoto = colToIdx(cfg.FOTOTERAPI);

for (let r = 3; r < values.length; r++) {
const row = values[r];

let namaPasien = String(row[iNama] || "").trim();
if (namaPasien === "" && !row[0]) continue;

// ACUAN KELUAR: Lebih utama menggunakan TGL KRS untuk statistik indikator
let tglRaw = row[iKrs] || row[iMrs];
if (!tglRaw) continue;

let tgl = parseTanggalIndo(tglRaw);
if (!tgl || tgl.getFullYear() !== tahun) continue;

let idxBln = tgl.getMonth();
let b = bulan[idxBln];

b.pasien++; // Pasien Keluar / Terolah pada bulan acuan

// Evaluasi Status Keluar Pasien
let statusText = String(row[iStatus] || "").toUpperCase().trim();
let ketMatiText = String(row[iKetMati] || "").toUpperCase().trim();

if (statusText.includes("MATI") || statusText.includes("MENINGGAL") || ketMatiText !== "") {
b.meninggal++;
if (ketMatiText.includes("<48") || statusText.includes("<48") || ketMatiText.includes("< 48")) {
b.kurang48++;
} else {
b.lebih48++;
}
} else if (statusText.includes("RUJUK") || statusText.includes("RJK")) {
b.rujuk++;
} else if (statusText.includes("PAKSA") || statusText.includes("PP") || statusText.includes("APS")) {
b.pp++;
} else {
b.krs++;
}

// Evaluasi Hari Rawat
let h = Number(row[iHari]);
if (!isNaN(h) && h > 0) {
b.hariRawat += h;
if (h > 7) b.pasien7++;
}

// Evaluasi Pemakaian Alat (Akumulasi Angka Bulat / Integer)
if (iCpap !== -1 && adaTindakan(row[iCpap])) b.cpap++;
if (iInk !== -1 && adaTindakan(row[iInk])) b.inkubator++;
if (iVent !== -1 && adaTindakan(row[iVent])) b.ventilator++;
if (iFoto !== -1 && adaTindakan(row[iFoto])) b.fototerapi++;
}

// Kalkulasi Indikator Mutu Sesuai Standar Kemenkes
bulan.forEach((b, index) => {
let daysInMonth = new Date(tahun, index + 1, 0).getDate();
let jmlKeluar = (b.krs + b.rujuk + b.pp + b.meninggal);
b.keluar = jmlKeluar;

b.BOR = (tt > 0 && daysInMonth > 0) ? (b.hariRawat / (tt * daysInMonth)) * 100 : 0;
b.ALOS = jmlKeluar > 0 ? b.hariRawat / jmlKeluar : 0;
b.TOI = jmlKeluar > 0 ? ((tt * daysInMonth) - b.hariRawat) / jmlKeluar : 0;
b.BTO = tt > 0 ? jmlKeluar / tt : 0;
b.GDR = jmlKeluar > 0 ? (b.meninggal / jmlKeluar) * 1000 : 0;
b.NDR = jmlKeluar > 0 ? (b.lebih48 / jmlKeluar) * 1000 : 0;
});

return { tt: tt, bulan: bulan };
}

function gabungDataNICULengkap(a, b, tt, tahun) {
let bulan = [];
for (let i = 0; i < 12; i++) {
let bA = a.bulan[i];
let bB = b.bulan[i];

let item = {
pasien: bA.pasien + bB.pasien,
meninggal: bA.meninggal + bB.meninggal,
kurang48: bA.kurang48 + bB.kurang48,
lebih48: bA.lebih48 + bB.lebih48,
krs: bA.krs + bB.krs,
rujuk: bA.rujuk + bB.rujuk,
pp: bA.pp + bB.pp,
hariRawat: bA.hariRawat + bB.hariRawat,
pasien7: bA.pasien7 + bB.pasien7,
cpap: bA.cpap + bB.cpap,
inkubator: bA.inkubator + bB.inkubator,
ventilator: bA.ventilator + bB.ventilator,
fototerapi: bA.fototerapi + bB.fototerapi,
BOR: 0, ALOS: 0, TOI: 0, BTO: 0, NDR: 0, GDR: 0
};

let daysInMonth = new Date(tahun, i + 1, 0).getDate();
let jmlKeluar = (item.krs + item.rujuk + item.pp + item.meninggal);
item.keluar = jmlKeluar;

item.BOR = (tt > 0 && daysInMonth > 0) ? (item.hariRawat / (tt * daysInMonth)) * 100 : 0;
item.ALOS = jmlKeluar > 0 ? item.hariRawat / jmlKeluar : 0;
item.TOI = jmlKeluar > 0 ? ((tt * daysInMonth) - item.hariRawat) / jmlKeluar : 0;
item.BTO = tt > 0 ? item.keluar / tt : 0;
item.GDR = jmlKeluar > 0 ? (item.meninggal / jmlKeluar) * 1000 : 0;
item.NDR = jmlKeluar > 0 ? (item.lebih48 / jmlKeluar) * 1000 : 0;

bulan.push(item);
}

return { tt: tt, bulan: bulan };
}

function tulisTabelLengkap(sh, startRow, judul, dataObj, tahun) {
let r = startRow;

sh.getRange(r, 1, 1, 14).merge().setValue(judul).setBackground("#2E7D32").setFontColor("white").setFontWeight("bold");
r++;

sh.getRange(r, 1, 1, 14).setValues([[
"VARIABEL", "JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGS", "SEP", "OKT", "NOV", "DES", "TOTAL / RATA2"
]]).setBackground("#42A5F5").setFontColor("white").setFontWeight("bold");
r++;

const list = [
["A. TOTAL PASIEN", "HEADER"],
["TOTAL PASIEN KELUAR", "pasien"],
["MENINGGAL", "meninggal"],
[" - MENINGGAL < 48 JAM", "kurang48"],
[" - MENINGGAL >= 48 JAM", "lebih48"],
["KRS / SEMBUH", "krs"],
["RUJUK", "rujuk"],
["PULANG PAKSA / APS", "pp"],

["B. LAMA RAWAT", "HEADER"],
["JUMLAH HARI RAWAT", "hariRawat"],
["> 7 HARI RAWAT", "pasien7"],

["C. TINDAKAN & ALAT (JUMLAH PASIEN)", "HEADER"],
["CPAP", "cpap"],
["INKUBATOR / BOX", "inkubator"],
["VENTILATOR", "ventilator"],
["FOTOTERAPI", "fototerapi"],

["D. INDIKATOR MUTU & EFISIENSI", "HEADER"],
["BOR (%)", "BOR"],
["ALOS (Hari)", "ALOS"],
["TOI (Hari)", "TOI"],
["BTO (Kali)", "BTO"],
["NDR (‰)", "NDR"],
["GDR (‰)", "GDR"]
];

const mutukeys = ["BOR", "ALOS", "TOI", "BTO", "NDR", "GDR"];

let totalHariRawatThn = 0;
let totalKeluarThn = 0;
let totalMeninggalThn = 0;
let totalLebih48Thn = 0;

dataObj.bulan.forEach(b => {
totalHariRawatThn += b.hariRawat;
totalKeluarThn += b.keluar;
totalMeninggalThn += b.meninggal;
totalLebih48Thn += b.lebih48;
});

let daysInYear = ((tahun % 4 === 0 && tahun % 100 !== 0) || (tahun % 400 === 0)) ? 366 : 365;

let borRowIdx = -1;
let matrixOutput = [];
let headerRows = [];

list.forEach((item) => {
const nama = item[0];
const key = item[1];

if (key === "HEADER") {
matrixOutput.push([nama, "", "", "", "", "", "", "", "", "", "", "", "", ""]);
headerRows.push(matrixOutput.length - 1);
return;
}

let arr = [nama];
let totalSum = 0;

dataObj.bulan.forEach(b => {
let val = Number(b[key] || 0);

if (key === "BOR") {
arr.push((val / 100));
} else if (mutukeys.includes(key)) {
arr.push(Number(val.toFixed(2)));
} else {
arr.push(Math.round(val)); // Angka bulat murni untuk jumlah pasien/tindakan
}

totalSum += val;
});

if (key === "BOR") {
let borThn = (dataObj.tt > 0) ? (totalHariRawatThn / (dataObj.tt * daysInYear)) : 0;
arr.push(borThn);
borRowIdx = matrixOutput.length;
} else if (key === "ALOS") {
let alosThn = totalKeluarThn > 0 ? totalHariRawatThn / totalKeluarThn : 0;
arr.push(Number(alosThn.toFixed(2)));
} else if (key === "TOI") {
let toiThn = totalKeluarThn > 0 ? ((dataObj.tt * daysInYear) - totalHariRawatThn) / totalKeluarThn : 0;
arr.push(Number(toiThn.toFixed(2)));
} else if (key === "BTO") {
let btoThn = dataObj.tt > 0 ? totalKeluarThn / dataObj.tt : 0;
arr.push(Number(btoThn.toFixed(2)));
} else if (key === "GDR") {
let gdrThn = totalKeluarThn > 0 ? (totalMeninggalThn / totalKeluarThn) * 1000 : 0;
arr.push(Number(gdrThn.toFixed(2)));
} else if (key === "NDR") {
let ndrThn = totalKeluarThn > 0 ? (totalLebih48Thn / totalKeluarThn) * 1000 : 0;
arr.push(Number(ndrThn.toFixed(2)));
} else {
arr.push(Math.round(totalSum)); // Total tahunan murni integer
}

matrixOutput.push(arr);
});

const targetRange = sh.getRange(r, 1, matrixOutput.length, 14);
targetRange.setValues(matrixOutput);

// Set format sel khusus: hanya baris BOR yang berformat persen (%), sisanya terformat sebagai Angka/Desimal biasa
for (let i = 0; i < matrixOutput.length; i++) {
let rowKey = list[i][1];
if (rowKey !== "HEADER" && rowKey !== "BOR") {
if (mutukeys.includes(rowKey)) {
sh.getRange(r + i, 2, 1, 13).setNumberFormat("0.00");
} else {
sh.getRange(r + i, 2, 1, 13).setNumberFormat("0");
}
}
}

headerRows.forEach(hIdx => {
sh.getRange(r + hIdx, 1, 1, 14).merge().setBackground("#BBDEFB").setFontWeight("bold");
});

if (borRowIdx !== -1) {
sh.getRange(r + borRowIdx, 1, 1, 14).setBackground("#FFF9C4").setFontWeight("bold");
sh.getRange(r + borRowIdx, 2, 1, 13).setNumberFormat("0.00%");
}

return r + matrixOutput.length;
}

function adaTindakan(v) {
if (v === true) return true;
if (typeof v === "number" && v > 0) return true;
const x = String(v || "").trim().toUpperCase();
return (x !== "" && x !== "FALSE" && x !== "TIDAK" && x !== "NO" && x !== "0" && x !== "-");
}
