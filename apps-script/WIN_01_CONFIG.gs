// =====================================================
// WIN DISCHARGE PLANNING
// WIN_01_CONFIG.gs
// Konfigurasi utama sistem WIN
// =====================================================

const WIN_CONFIG = {

  // ==============================
  // NAMA SHEET
  // ==============================

  SOURCE_SHEET: "NICU_LEVEL_2",

  EPISODE_SHEET: "WIN_DISCHARGE_PLANNING",

  MATERI_SHEET: "WIN_MATERI",

  PROGRESS_SHEET: "WIN_PROGRESS",

  ASSESSMENT_SHEET: "WIN_ASSESSMENT",

  PRAKTIK_SHEET: "WIN_PRAKTIK",

  EVALUASI_SHEET: "WIN_EVALUASI",

  ACTION_PLAN_SHEET: "WIN_ACTION_PLAN",

  CERTIFICATE_SHEET: "WIN_CERTIFICATE",

  FOLLOWUP_SHEET: "WIN_FOLLOWUP",

  CONFIG_SHEET: "CONFIG",


  // ==============================
  // HEADER ROW
  // ==============================

  HEADER_ROW: 3,

  WIN_HEADER_ROW: 1,


  // ==============================
  // DATA START ROW
  // ==============================

  SOURCE_DATA_START_ROW: 4,

  WIN_DATA_START_ROW: 2,


  // ==============================
  // STATUS EPISODE
  // ==============================

  STATUS_AUTO_CREATED: "AUTO_CREATED",

  STATUS_ASSESSMENT: "ASSESSMENT",

  STATUS_LEARNING: "PEMBELAJARAN",

  STATUS_PRAKTIK: "PRAKTIK",

  STATUS_EVALUASI: "EVALUASI",

  STATUS_ACTION_PLAN: "ACTION_PLAN",

  STATUS_SIAP_PULANG: "SIAP_PULANG",


  // ==============================
  // PREFIX EPISODE
  // ==============================

  EPISODE_PREFIX: "WIN",


  // ==============================
  // MATERI LMS
  // ==============================

  DEFAULT_FIRST_MATERIAL: "MAT001",


  // ==============================
  // TIMEZONE
  // ==============================

  TIMEZONE: Session.getScriptTimeZone() || "Asia/Jakarta"

};


// =====================================================
// FUNGSI MENGAMBIL SPREADSHEET UTAMA
// =====================================================

function WIN_getSpreadsheet() {

  return SpreadsheetApp.getActiveSpreadsheet();

}


// =====================================================
// FUNGSI MENGAMBIL SHEET WIN
// =====================================================

function WIN_getSheet(sheetName) {

  const ss = WIN_getSpreadsheet();

  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {

    throw new Error(
      "Sheet WIN tidak ditemukan: " + sheetName
    );

  }

  return sheet;

}


// =====================================================
// FUNGSI FORMAT TANGGAL
// =====================================================

function WIN_formatDate(value) {

  if (!value) return "";

  if (!(value instanceof Date)) {

    value = new Date(value);

  }

  if (isNaN(value.getTime())) return "";

  return Utilities.formatDate(
    value,
    WIN_CONFIG.TIMEZONE,
    "dd/MM/yyyy"
  );

}


// =====================================================
// FUNGSI FORMAT TANGGAL + JAM
// =====================================================

function WIN_formatDateTime(value) {

  if (!value) return "";

  if (!(value instanceof Date)) {

    value = new Date(value);

  }

  if (isNaN(value.getTime())) return "";

  return Utilities.formatDate(
    value,
    WIN_CONFIG.TIMEZONE,
    "dd/MM/yyyy HH:mm:ss"
  );

}


// =====================================================
// FUNGSI NORMALISASI TEXT
// =====================================================

function WIN_cleanText(value) {

  if (value === null || value === undefined) {

    return "";

  }

  return String(value)
    .trim();

}


// =====================================================
// FUNGSI MEMBACA HEADER SHEET
// =====================================================

function WIN_getHeaders(sheet, headerRow) {

  headerRow = headerRow || WIN_CONFIG.HEADER_ROW;

  const lastColumn = sheet.getLastColumn();

  if (lastColumn < 1) return [];

  return sheet
    .getRange(headerRow, 1, 1, lastColumn)
    .getValues()[0]
    .map(function(header) {

      return WIN_cleanText(header);

    });

}


// =====================================================
// FUNGSI MENCARI NOMOR KOLOM BERDASARKAN HEADER
// =====================================================

function WIN_findColumn(sheet, headerName, headerRow) {

  const headers = WIN_getHeaders(
    sheet,
    headerRow
  );

  const target = WIN_cleanText(headerName)
    .toLowerCase();

  for (let i = 0; i < headers.length; i++) {

    const current = headers[i]
      .toLowerCase();

    if (current === target) {

      return i + 1;

    }

  }

  return -1;

}


// =====================================================
// FUNGSI MENCARI KOLOM DENGAN HEADER FLEKSIBEL
// =====================================================

function WIN_findColumnFlexible(
  sheet,
  possibleNames,
  headerRow
) {

  const headers = WIN_getHeaders(
    sheet,
    headerRow
  );

  const targets = possibleNames.map(function(name) {

    return WIN_cleanText(name)
      .toLowerCase()
      .replace(/\s+/g, "_");

  });

  for (let i = 0; i < headers.length; i++) {

    const current = headers[i]
      .toLowerCase()
      .replace(/\s+/g, "_");

    if (targets.includes(current)) {

      return i + 1;

    }

  }

  return -1;

}


// =====================================================
// CEK SHEET WIN
// =====================================================

function WIN_checkSheets() {

  const ss = WIN_getSpreadsheet();

  const requiredSheets = [

    WIN_CONFIG.SOURCE_SHEET,

    WIN_CONFIG.EPISODE_SHEET,

    WIN_CONFIG.MATERI_SHEET,

    WIN_CONFIG.PROGRESS_SHEET,

    WIN_CONFIG.ASSESSMENT_SHEET,

    WIN_CONFIG.PRAKTIK_SHEET,

    WIN_CONFIG.EVALUASI_SHEET,

    WIN_CONFIG.ACTION_PLAN_SHEET,

    WIN_CONFIG.CERTIFICATE_SHEET,

    WIN_CONFIG.FOLLOWUP_SHEET,

    WIN_CONFIG.CONFIG_SHEET

  ];

  const missing = [];

  requiredSheets.forEach(function(name) {

    if (!ss.getSheetByName(name)) {

      missing.push(name);

    }

  });

  if (missing.length > 0) {

    throw new Error(
      "Sheet berikut belum ditemukan:\n\n" +
      missing.join("\n")
    );

  }

  return true;

}


// =====================================================
// TEST CONFIG
// =====================================================

function WIN_testConfig() {

  const ss = WIN_getSpreadsheet();

  Logger.log(
    "Spreadsheet: " + ss.getName()
  );

  Logger.log(
    "Source: " +
    WIN_CONFIG.SOURCE_SHEET
  );

  Logger.log(
    "Episode: " +
    WIN_CONFIG.EPISODE_SHEET
  );

  WIN_checkSheets();

  Logger.log(
    "================================"
  );

  Logger.log(
    "WIN CONFIG BERHASIL"
  );

  Logger.log(
    "Semua sheet WIN ditemukan."
  );

  Logger.log(
    "================================"
  );

  return "WIN CONFIG OK";

}
