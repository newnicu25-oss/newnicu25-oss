// @ts-nocheck
// =====================================================
// AUTO BABY CARD RS TRANSISI / NICU
// FINAL STABLE VERSION - SMART ID BY NO RM INTEGRATED
// =====================================================

const SHEET_NAME = "MASTER_REGISTER";
const TEMPLATE_LAKI = "183qIrWwkoWiNY5_uoN87MtUicpuZxO9gpDFdmtYC1jc";
const TEMPLATE_PEREMPUAN = "1vFdEGn5JhJPQnnR9nz1mZ13wEKCWomtfUhGSqjpwSco";
const OUTPUT_FOLDER_ID = "1-QAjm5rD_oSDhpP40VXL5dXMnOIWD9QH";
const REGISTER_SHEET = "MASTER_REGISTER";
const LOG_SHEET = "LOG_TRANSFER";
const HEADER_ROW = 3;

// =====================================================
// GENERATE MANUAL BARIS AKTIF
// =====================================================
function generateSelectedRow() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();

  if (!sheet) {
    SpreadsheetApp.getUi().alert("Silakan buka sheet MASTER_REGISTER dulu");
    return;
  }

  if (sheet.getName() != SHEET_NAME) {
    SpreadsheetApp.getUi().alert("Pilih sheet MASTER_REGISTER dulu");
    return;
  }

  const activeCell = sheet.getActiveCell();
  if (!activeCell) {
    SpreadsheetApp.getUi().alert("Pilih salah satu cell pada baris bayi dulu");
    return;
  }

  const row = activeCell.getRow();
  if (row < 4) {
    SpreadsheetApp.getUi().alert("Pilih baris data bayi dulu");
    return;
  }

  processRow(sheet, row);
}

// =====================================================
// PROCESS 1 BARIS (VERSI PERBAIKAN STABIL - QR SCANNABLE)
// =====================================================
function processRow(sheet, rowNumber) {
  const lastCol = sheet.getLastColumn();

  // HEADER & DATA
  const headers = sheet.getRange(3, 1, 1, lastCol).getValues()[0];
  const row = sheet.getRange(rowNumber, 1, 1, lastCol).getValues()[0];

  // STATUS PDF
  let statusCol = -1;
  headers.forEach((h, i) => {
    if (h.toString().toLowerCase().trim() == "status_pdf") {
      statusCol = i + 1;
    }
  });

  if (statusCol > 0 && row[statusCol - 1] == "DONE") {
    Logger.log("SUDAH DONE");
    return;
  }

  // NAMA BAYI
  const namaBayi = row[5];
  if (!namaBayi) return;

  let rowData = {};

  // AMBIL DATA
  headers.forEach((header, i) => {
    const key = header.toString().trim().toLowerCase();
    let value = row[i] || "-";

    // FORMAT DATE
    if (value instanceof Date) {
      if (key.includes("jam")) {
        value = Utilities.formatDate(value, Session.getScriptTimeZone(), "HH.mm");
      } else {
        value = Utilities.formatDate(value, Session.getScriptTimeZone(), "dd/MM/yyyy");
      }
    }
    rowData[key] = value;
  });

  // SPLIT BB PB LK
  const bbpb = rowData["bb_pb_lk"];
  if (bbpb && bbpb != "-") {
    const angka = bbpb.toString().match(/\d+/g);
    if (angka) {
      rowData["bb"] = angka[0] || "-";
      rowData["pb"] = angka[1] || "-";
      rowData["lk"] = angka[2] || "-";
    }
  }

  // SPLIT APGAR
  if (rowData["a_s"]) {
    const apgar = rowData["a_s"].toString().match(/\d+/g);
    if (apgar) {
      rowData["apgar1"] = apgar[0] || "-";
      rowData["apgar5"] = apgar[1] || "-";
    }
  }

  // AMBIL UK
  const ukRaw = rowData["gxpx_uk"];
  if (ukRaw && ukRaw != "-") {
    const ukText = ukRaw.toString();
    const matchUK = ukText.match(/\d+\s*\/\s*\d+/);
    if (matchUK) {
      rowData["uk"] = matchUK[0].replace(/\s/g, "");
    }
  }

  // TEMPLATE JK
  const jk = (rowData["jk"] || "").toString().toUpperCase();
  let templateId = (jk == "L" || jk.includes("LAKI")) ? TEMPLATE_LAKI : TEMPLATE_PEREMPUAN;
  const rm = rowData["no_rm"] || "";

  // 1. COPY TEMPLATE SLIDES
  const outputFolder = DriveApp.getFolderById(OUTPUT_FOLDER_ID);
  const copyFile = DriveApp.getFileById(templateId).makeCopy("TEMP_" + namaBayi);
  const presentation = SlidesApp.openById(copyFile.getId());
  const slides = presentation.getSlides();

  // 2. BUAT FILE PDF TARGET UNTUK DAPATKAN LINK SCANNER DULU
  const pdfName = rm + "_" + namaBayi + ".pdf";
  const targetPdfFile = outputFolder.createFile(" ", pdfName, MimeType.PDF);
  
  try {
    targetPdfFile.setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.VIEW);
  } catch(e) {
    Logger.log("Menggunakan hak akses default folder output.");
  }
  const pdfUrl = targetPdfFile.getUrl();

  // 3. REPLACE TEXT & FOTO KAKI DI SLIDE
  slides.forEach(slide => {
    Object.keys(rowData).forEach(key => {
      if (key != "foto_kaki" && key != "qrcode") {
        slide.replaceAllText("{{" + key + "}}", rowData[key].toString());
      }
    });

    if (rowData["foto_kaki"] && rowData["foto_kaki"] != "-") {
      insertDriveImage(slide, "{{FOTO_KAKI}}", rowData["foto_kaki"]);
    }
  });

  // 4. MASUKKAN QR CODE DENGAN LINK PDF URL TARGET
  slides.forEach(slide => {
    const qrUrl = "https://quickchart.io/qr?text=" + encodeURIComponent(pdfUrl) + "&size=300";
    insertBarcode(slide, "{{QRCODE}}", qrUrl);
  });

  presentation.saveAndClose();
  Utilities.sleep(2500);

  // 5. TIMPA ISI PDF TARGET DENGAN HASIL RENDER SLIDES
  const finalPdfBlob = DriveApp.getFileById(copyFile.getId()).getBlob().getAs("application/pdf");
  Drive.Files.update({title: targetPdfFile.getName(), mimeType: targetPdfFile.getMimeType()}, targetPdfFile.getId(), finalPdfBlob);

  // UPDATE LINK PDF KE SHEET (KOLOM 44)
  const linkPdfCol = 44;
  sheet.getRange(rowNumber, linkPdfCol).setValue(pdfUrl);

  // HAPUS TEMP SLIDES
  DriveApp.getFileById(copyFile.getId()).setTrashed(true);

  if (statusCol > 0) {
    sheet.getRange(rowNumber, statusCol).setValue("DONE");
  }
  Logger.log("BERHASIL! PDF Normal kembali & QR Code Scan siap digunakan.");
}

// =====================================================
// INSERT QR / BARCODE
// =====================================================
function insertBarcode(slide, placeholder, imageUrl) {
  const shapes = slide.getShapes();
  for (let i = 0; i < shapes.length; i++) {
    try {
      const shape = shapes[i];
      const text = shape.getText().asString().replace(/\s+/g, "");

      if (text.includes(placeholder.replace(/\s+/g, ""))) {
        const left = shape.getLeft();
        const top = shape.getTop();
        const width = shape.getWidth();
        const height = shape.getHeight();

        shape.remove();
        
        const response = UrlFetchApp.fetch(imageUrl, { muteHttpExceptions: true });
        if (response.getResponseCode() === 200) {
          const blob = response.getBlob();
          slide.insertImage(blob).setLeft(left).setTop(top).setWidth(width).setHeight(height);
          Logger.log("QR BERHASIL DISISIPKAN");
        } else {
          Logger.log("Gagal Fetch QR: " + response.getResponseCode());
        }
        return;
      }
    } catch(err) {
      Logger.log("Error insertBarcode: " + err.message);
    }
  }
}

// =====================================================
// INSERT FOTO KAKI
// =====================================================
function insertDriveImage(slide, placeholder, imageUrl) {
  if (!imageUrl || imageUrl == "-") return;

  const shapes = slide.getShapes();
  for (let i = 0; i < shapes.length; i++) {
    try {
      const shape = shapes[i];
      const text = shape.getText().asString();

      if (text.includes(placeholder)) {
        const left = shape.getLeft();
        const top = shape.getTop();
        const width = shape.getWidth();
        const height = shape.getHeight();

        shape.remove();
        let fileId = "";
        const match1 = imageUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
        const match2 = imageUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);

        if (match1) {
          fileId = match1[1];
        } else if (match2) {
          fileId = match2[1];
        } else {
          const match3 = imageUrl.match(/[-\w]{25,}/);
          if (match3) fileId = match3[0];
        }

        if (!fileId) {
          Logger.log("FILE ID TIDAK DITEMUKAN");
          return;
        }

        const file = DriveApp.getFileById(fileId);
        try {
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        } catch(err) {
          Logger.log("Tidak bisa ubah sharing file");
        }

        const blob = file.getBlob();
        slide.insertImage(blob).setLeft(left).setTop(top).setWidth(width).setHeight(height);
        Logger.log("FOTO KAKI BERHASIL");
        return;
      }
    } catch(err) {
      Logger.log(err);
    }
  }
}

function openFolder() {
  const url = "https://drive.google.com/drive/folders/" + OUTPUT_FOLDER_ID;
  const html = HtmlService.createHtmlOutput(
    "<script>window.open('" + url + "');google.script.host.close();</script>"
  );
  SpreadsheetApp.getUi().showModalDialog(html, "Membuka Folder");
}

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile("sidebar").setTitle("Ballard & Lubchenco");
  SpreadsheetApp.getUi().showSidebar(html);
}

// =====================================================
// ID BAYI GENERATOR SYSTEM (SMART ID BY NO RM)
// =====================================================
function generateIdBayi(prefix, tanggal, noRM) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const listSheets = ["MASTER_REGISTER", "NICU_LEVEL_2", "NICU_LEVEL_3"];
  
  const rmClean = noRM ? String(noRM).trim() : "";

  // 1. CEK DULU APAKAH NO RM INI SUDAH PUNYA ID DI SHEET MANAPUN
  if (rmClean !== "") {
    for (let i = 0; i < listSheets.length; i++) {
      const sh = ss.getSheetByName(listSheets[i]);
      if (sh) {
        const lastRow = sh.getLastRow();
        if (lastRow >= 4) {
          const dataRM = sh.getRange(4, 5, lastRow - 3, 1).getValues().flat(); // Kolom E (No RM)
          const dataID = sh.getRange(4, 4, lastRow - 3, 1).getValues().flat(); // Kolom D (ID Bayi)
          
          for (let j = 0; j < dataRM.length; j++) {
            if (String(dataRM[j]).trim() === rmClean && dataID[j] && String(dataID[j]).trim() !== "") {
              // RETURN ID LAMA YANG SUDAH TERDAFTAR
              return String(dataID[j]).trim(); 
            }
          }
        }
      }
    }
  }

  // 2. JIKA NO RM BARU (BELUM ADA ID), BUATKAN ID UNIK BARU
  const dateObj = tanggal ? new Date(tanggal) : new Date();
  const periode = Utilities.formatDate(dateObj, Session.getScriptTimeZone(), "yyMMdd");
  const targetPrefix = prefix + periode; 

  let maxNo = 0;

  listSheets.forEach(sheetName => {
    const sh = ss.getSheetByName(sheetName);
    if (sh) {
      const lastRow = sh.getLastRow();
      if (lastRow >= 4) {
        const ids = sh.getRange(4, 4, lastRow - 3, 1).getValues().flat();
        ids.forEach(id => {
          if (id && id.toString().includes(targetPrefix)) {
            const strId = id.toString().trim();
            const num = Number(strId.slice(-4));
            if (!isNaN(num)) maxNo = Math.max(maxNo, num);
          }
        });
      }
    }
  });

  return targetPrefix + String(maxNo + 1).padStart(4, "0");
}

// =====================================================
// TRIGGER ONEDIT TUNGGAL (AUTO ID + TRANSFER + STATUS)
// =====================================================
function onEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  const sheetName = sheet.getName();
  const row = e.range.getRow();
  const col = e.range.getColumn(); 
  const val = e.value;

  if (row < 4) return;

  const validSheets = ["MASTER_REGISTER", "NICU_LEVEL_2", "NICU_LEVEL_3"];
  if (!validSheets.includes(sheetName)) return;

  // 1. AUTO GENERATE ID SAAT KETIK NAMA BAYI (KOLOM 6 / F) ATAU NO RM (KOLOM 5 / E)
  if (col === 5 || col === 6) {
    const idRange = sheet.getRange(row, 4); // Kolom D (ID Pasien)
    const currentId = idRange.getValue();

    // Jalankan jika ID masih kosong
    if (!currentId || currentId.toString().trim() === "") {
      const tglMasuk = sheet.getRange(row, 2).getValue();
      const noRM = sheet.getRange(row, 5).getValue(); // Ambil No RM dari Kolom E
      const keadaanCell = sheet.getRange(row, 15).getValue();
      const keadaan = keadaanCell ? String(keadaanCell).trim().toUpperCase() : "";

      let prefix = "TRN";
      if (sheetName === "NICU_LEVEL_2") prefix = "NIC2";
      else if (sheetName === "NICU_LEVEL_3") prefix = "NIC3";
      else if (keadaan === "IUFD") prefix = "IUFD";

      // Panggil fungsi pintar pencari ID lama / buat ID baru
      const newId = generateIdBayi(prefix, tglMasuk, noRM);
      idRange.setValue(newId);
    }
  }

  // =====================================================
// TRIGGER STATUS AKHIR NICU
// DINAMIS BERDASARKAN HEADER
// =====================================================

if (
  sheetName === "NICU_LEVEL_2" ||
  sheetName === "NICU_LEVEL_3"
) {

  const headers =
    sheet
      .getRange(
        HEADER_ROW,
        1,
        1,
        sheet.getLastColumn()
      )
      .getValues()[0];


  const statusCol =
    headers.findIndex(function(h) {

      return String(h)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        === "status_akhir_nicu";

    }) + 1;


  // Jika header ternyata namanya berbeda,
  // fallback ke posisi lama.

  const targetStatusCol =
    statusCol > 0

      ? statusCol

      : (
          sheetName === "NICU_LEVEL_2"
            ? 50
            : 51
        );


  if (
    col === targetStatusCol &&
    val
  ) {

    prosesStatusAkhirNICU(
      sheet,
      row,
      val
    );

  }

}

  // 3. MASTER REGISTER TRN/IUFD & TRANSFER SYSTEM
  if (sheetName === "MASTER_REGISTER") {
    const idCellVal = sheet.getRange(row, 4).getValue();
    const tglMasuk = sheet.getRange(row, 2).getValue();

    if (col === 15 && val) {
      const keadaan = String(val).trim().toUpperCase();
      if (keadaan === "IUFD" && idCellVal && !idCellVal.toString().startsWith("IUFD")) {
        const noRM = sheet.getRange(row, 5).getValue();
        sheet.getRange(row, 4).setValue(generateIdBayi("IUFD", tglMasuk, noRM));
      }
    }

    const headers = sheet.getRange(HEADER_ROW, 1, 1, sheet.getLastColumn()).getValues()[0];
    const transferCol = headers.findIndex(h => h.toString().trim().replace(/\s+/g,"_").toLowerCase() === "transfer_ke") + 1;

    if (transferCol > 0 && col === transferCol && val) {
      prosesTrackingNICU(sheet, row, val);
      if (val === "LEVEL_2") kirimKeNICU2(sheet, row);
      if (val === "LEVEL_3") kirimKeNICU3(sheet, row);
    }
  }
}

// =====================================================
// MANUAL GENERATE ID KOSONG
// =====================================================
function generateIdNICU2Kosong() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("NICU_LEVEL_2");
  const lastRow = sh.getLastRow();

  let count = 0;
  for (let row = 4; row <= lastRow; row++) {
    const nama = sh.getRange(row, 6).getValue();
    const id = sh.getRange(row, 4).getValue();
    const tglMasuk = sh.getRange(row, 2).getValue();
    const noRM = sh.getRange(row, 5).getValue();

    if (nama && !id) {
      sh.getRange(row, 4).setValue(generateIdBayi("NIC2", tglMasuk, noRM));
      count++;
    }
  }
  SpreadsheetApp.getUi().alert("Generate ID NICU Level 2 selesai. Berhasil mengisi " + count + " ID baru.");
}

function generateIdNICU3Kosong() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("NICU_LEVEL_3");
  const lastRow = sh.getLastRow();

  let count = 0;
  for (let row = 4; row <= lastRow; row++) {
    const nama = sh.getRange(row, 6).getValue();
    const id = sh.getRange(row, 4).getValue();
    const tglMasuk = sh.getRange(row, 2).getValue();
    const noRM = sh.getRange(row, 5).getValue();

    if (nama && !id) {
      sh.getRange(row, 4).setValue(generateIdBayi("NIC3", tglMasuk, noRM));
      count++;
    }
  }
  SpreadsheetApp.getUi().alert("Generate ID NICU Level 3 selesai. Berhasil mengisi " + count + " ID baru.");
}

function generateIdTransisiKosong() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("MASTER_REGISTER");
  const lastRow = sh.getLastRow();

  for (let row = 4; row <= lastRow; row++) {
    const nama = sh.getRange(row, 6).getValue();
    const id = sh.getRange(row, 4).getValue();
    const tglMasuk = sh.getRange(row, 2).getValue();
    const noRM = sh.getRange(row, 5).getValue();

    if (nama && !id) {
      const keadaan = sh.getRange(row, 15).getValue().toString().trim().toUpperCase();
      const prefix = (keadaan == "IUFD") ? "IUFD" : "TRN";
      sh.getRange(row, 4).setValue(generateIdBayi(prefix, tglMasuk, noRM));
    }
  }
  SpreadsheetApp.getUi().alert("Generate ID Transisi selesai.");
}

function generateSemuaIdKosong() {
  generateIdTransisiKosong();
  generateIdNICU2Kosong();
  generateIdNICU3Kosong();
  SpreadsheetApp.getUi().alert("Semua ID kosong berhasil digenerate.");
}

// =====================================================
// FORM SYNC & DATA MOVEMENT LOGIC
// =====================================================
function syncFormToRegister(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName("MASTER_REGISTER");
  const formData = e.values;

  let insertRow = 4;
  const data = masterSheet.getRange(4, 4, masterSheet.getMaxRows() - 3, 1).getValues();

  for (let i = 0; i < data.length; i++) {
    if (!data[i][0]) {
      insertRow = i + 4;
      break;
    }
  }

  let prefix = "TRN";
  const keadaan = String(formData[11] || "").trim().toUpperCase();
  if (keadaan == "IUFD") prefix = "IUFD";

  masterSheet.getRange(insertRow, 4).setValue(generateIdBayi(prefix, formData[1], formData[3]));

  masterSheet.getRange(insertRow, 2).setValue(formData[1]);
  masterSheet.getRange(insertRow, 3).setValue(formData[2]);
  masterSheet.getRange(insertRow, 5).setValue(formData[3]);
  masterSheet.getRange(insertRow, 6).setValue(formData[4]);
  masterSheet.getRange(insertRow, 8).setValue(formData[5]);
  masterSheet.getRange(insertRow, 9).setValue(formData[30]);
  masterSheet.getRange(insertRow, 10).setValue(formData[6]);
  masterSheet.getRange(insertRow, 11).setValue(formData[7]);
  masterSheet.getRange(insertRow, 12).setValue(formData[8]);
  masterSheet.getRange(insertRow, 13).setValue(formData[9]);
  masterSheet.getRange(insertRow, 14).setValue(formData[10]).setNumberFormat("HH.mm");
  masterSheet.getRange(insertRow, 15).setValue(formData[11]);
  masterSheet.getRange(insertRow, 16).setValue(formData[12]);
  masterSheet.getRange(insertRow, 17).setValue(formData[13]);
  masterSheet.getRange(insertRow, 18).setValue(formData[14]);
  masterSheet.getRange(insertRow, 19).setValue(formData[15]);
  masterSheet.getRange(insertRow, 20).setValue(formData[16]);
  masterSheet.getRange(insertRow, 21).setValue(formData[17]);
  masterSheet.getRange(insertRow, 22).setValue(formData[18]);
  masterSheet.getRange(insertRow, 23).setValue(formData[19]);
  masterSheet.getRange(insertRow, 24).setValue(formData[20]);
  masterSheet.getRange(insertRow, 25).setValue(formData[21]);
  masterSheet.getRange(insertRow, 27).setValue(formData[22]);
  masterSheet.getRange(insertRow, 28).setValue(formData[23]);
  masterSheet.getRange(insertRow, 29).setValue(formData[24]);
  masterSheet.getRange(insertRow, 30).setValue(formData[25]);
  masterSheet.getRange(insertRow, 43).setValue(formData[27]);

  const formHeaders = ss.getSheetByName("Form Responses 1").getRange(1, 1, 1, ss.getSheetByName("Form Responses 1").getLastColumn()).getValues()[0];
  const regHeaders = masterSheet.getRange(3, 1, 1, masterSheet.getLastColumn()).getValues()[0];
  
  const fotoIndex = formHeaders.findIndex(h => h.toString().toLowerCase().trim().replace(/\s+/g, "").includes("foto_kaki"));
  const aoIndex = regHeaders.findIndex(h => h.toString().toLowerCase().trim().replace(/\s+/g, "").includes("foto_kaki"));

  if (fotoIndex >= 0 && aoIndex >= 0) {
    const fotoKaki = formData[fotoIndex];
    masterSheet.getRange(insertRow, aoIndex + 1).setValue(fotoKaki);
  }
}

function ambilMasterKeNICU2() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const master = ss.getSheetByName("MASTER_REGISTER");
  const row = master.getActiveCell().getRow();

  if (row < 4) {
    SpreadsheetApp.getUi().alert("Pilih baris pasien di MASTER_REGISTER terlebih dahulu.");
    return;
  }
  kirimKeNICU2(master, row);
}

function ambilMasterKeNICU3() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const master = ss.getSheetByName("MASTER_REGISTER");
  const row = master.getActiveCell().getRow();

  if (row < 4) {
    SpreadsheetApp.getUi().alert("Pilih baris pasien di MASTER_REGISTER terlebih dahulu.");
    return;
  }
  kirimKeNICU3(master, row);
}

// =====================================================
// TRACKING & LOGGING LOGIC
// =====================================================
function prosesTrackingNICU(sheet, row, statusBaru) {
  const headers = sheet.getRange(HEADER_ROW, 1, 1, sheet.getLastColumn()).getValues()[0];
  const data = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];

  const idxId = headers.indexOf("id_bayi");
  const idxRm = headers.indexOf("no_rm");
  const idxNama = headers.indexOf("nama_bayi");
  const idxHari = headers.indexOf("∑ hari rawat");

  if (idxId < 0 || idxRm < 0 || idxNama < 0) return;

  const id = data[idxId]; const rm = data[idxRm]; const nama = data[idxNama];
  const last = getLastStatus(id);
  let lama = 0;

  if (last.tanggal) {
    lama = Math.max(1, Math.ceil((new Date() - new Date(last.tanggal)) / 86400000));
  }

  simpanLogTransfer(id, rm, nama, last.status, statusBaru, lama);
  if (idxHari >= 0) updateTotalHariRawat(sheet, row, idxHari + 1, id);
}

function getLastStatus(id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LOG_SHEET);
  if (!sheet) return {tanggal: null, status: "MASUK"};

  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][1] == id) return {tanggal: data[i][0], status: data[i][5]};
  }
  return {tanggal: null, status: "MASUK"};
}

function simpanLogTransfer(id, rm, nama, dari, ke, lama) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LOG_SHEET);
  if (!sheet) return;
  sheet.appendRow([new Date(), id, rm, nama, dari, ke, lama]);
}

function updateTotalHariRawat(sheet, row, colHari, id) {
  const logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LOG_SHEET);
  const data = logSheet.getDataRange().getValues();
  let total = 0;

  data.forEach(r => {
    if (r[1] == id) total += Number(r[6]) || 0;
  });
  sheet.getRange(row, colHari).setValue(total);
}

// =====================================================
// BALLARD & LUBCHENCO CALCULATOR ENGINE
// =====================================================
function prosesBallard(score, bb, posture, square, recoil, popliteal, scarf, heel, skin, lanugo, plantar, breast, eye, genital, selectedRow, rincian) {
  if (score < -10) score = -10;
  if (score > 50) score = 50;

  const map = {
    "35": {label: "38", plot: 38}, "36": {label: "38/39", plot: 38.5}, "37": {label: "38/39", plot: 38.5},
    "38": {label: "39/40", plot: 39.3}, "39": {label: "39/40", plot: 39.3}, "40": {label: "40", plot: 40}, "41": {label: "40/41", plot: 40.3}
  };

  const ukAsli = ((2 * score) + 120) / 5;
  let ukKlinis = Math.floor(ukAsli) + "/" + (Math.floor(ukAsli) + 1);
  let ukPlot = ukAsli;

  if (map[score]) {
    ukKlinis = map[score].label;
    ukPlot = map[score].plot;
  }

  let interpretasi = (ukPlot < 37) ? "Prematur" : (ukPlot <= 41) ? "Cukup Bulan" : "Post Term";
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetLub = ss.getSheetByName("LUBCHENCO");
  const data = sheetLub.getDataRange().getValues();

  let p10 = 0, p25 = 0, p50 = 0, p75 = 0, p90 = 0;
  const minggu = Math.ceil(ukPlot);

  for (let i = 1; i < data.length; i++) {
    if (Number(data[i][0]) == minggu) {
      p10 = data[i][1]; p25 = data[i][2]; p50 = data[i][3]; p75 = data[i][4]; p90 = data[i][5];
      break;
    }
  }

  let percentile = (bb < p10) ? "< P10" : (bb < p25) ? "P10 - P25" : (bb < p50) ? "P25 - P50" : (bb < p75) ? "P50 - P75" : (bb < p90) ? "P75 - P90" : "> P90";

  rincian = "\n=== NEUROMUSKULAR ===\nPosture : " + posture + "\nSquare Window : " + square + "\nArm Recoil : " + recoil + "\nPopliteal Angle : " + popliteal + "\nScarf Sign : " + scarf + "\nHeel To Ear : " + heel + "\n\n=== FISIK ===\nKulit : " + skin + "\nLanugo : " + lanugo + "\nPlantar Surface : " + plantar + "\nBreast : " + breast + "\nMata / Telinga : " + eye + "\nGenitalia : " + genital + "\n\n=====================\nTOTAL SCORE : " + score + "\nUK BALLARD : " + ukKlinis + " mg\nUK ASLI : " + ukAsli.toFixed(1) + " mg\nBB : " + bb + " gram\n\nKATEGORI :\n" + percentile + "\n";

  simpanHasilBallard(score, ukKlinis, percentile, rincian, selectedRow);

  return "<h2>HASIL</h2><p><b>Total Score Ballard:</b> " + score + "</p><p><b>Usia Kehamilan:</b> " + ukKlinis + " minggu (" + ukAsli.toFixed(1) + ")</p><p><b>Interpretasi:</b> " + interpretasi + "</p><p><b>Berat Badan:</b> " + bb + " gram</p><p><b>Kategori Lubchenco:</b> " + percentile + "</p>";
}

function simpanHasilBallard(score, uk, percentile, rincian, selectedRow) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("MASTER_REGISTER");
  if (selectedRow < 4) return "Pilih baris bayi dulu";

  const colBallard = 23; const colUK = 24; const colLub = 25;
  const cell = sheet.getRange(selectedRow, colBallard);
  
  cell.setValue(score);
  if (rincian) {
    cell.clearNote();
    cell.setNote(rincian);
  }

  sheet.getRange(selectedRow, colUK).setValue(uk + " mg");
  sheet.getRange(selectedRow, colLub).setValue(percentile);
  SpreadsheetApp.flush();
  return "OK";
}

function getSelectedRow() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("MASTER_REGISTER");
  return sheet ? sheet.getActiveCell().getRow() : 4;
}

// =====================================================
// FUNGSI TRANSFER PASIEN ANTAR UNIT / LEVEL
// MASTER_REGISTER → LEVEL 2
// MASTER_REGISTER → LEVEL 3
// LEVEL 3 → LEVEL 2
// LEVEL 2 → LEVEL 3
//
// PRINSIP:
// 1. ID BAYI TIDAK BOLEH BERUBAH SAAT TRANSFER
// 2. NO RM TIDAK BOLEH BERUBAH
// 3. DATA UTAMA DIBAWA DARI SHEET SUMBER
// 4. ANTI DUPLIKASI BERDASARKAN ID BAYI
// 5. WIN TIDAK DIBUAT ULANG JIKA SUDAH ADA
// =====================================================

function kirimKeNICU(sheetAwal, row, targetSheetName) {

  try {

    const ss =
      SpreadsheetApp.getActiveSpreadsheet();

    // -------------------------------------------------
    // VALIDASI SHEET SUMBER
    // -------------------------------------------------

    const sourceName =
      sheetAwal.getName();

    const validSources = [
      "MASTER_REGISTER",
      "NICU_LEVEL_2",
      "NICU_LEVEL_3"
    ];

    if (!validSources.includes(sourceName)) {

      throw new Error(
        "Sheet sumber tidak valid: " +
        sourceName
      );

    }


    // -------------------------------------------------
    // VALIDASI TARGET
    // -------------------------------------------------

    const validTargets = [
      "NICU_LEVEL_2",
      "NICU_LEVEL_3"
    ];

    if (!validTargets.includes(targetSheetName)) {

      throw new Error(
        "Target transfer tidak valid: " +
        targetSheetName
      );

    }


    if (
      sourceName === targetSheetName
    ) {

      throw new Error(
        "Pasien sudah berada di " +
        targetSheetName
      );

    }


    // -------------------------------------------------
    // VALIDASI BARIS
    // -------------------------------------------------

    if (row < 4) {

      throw new Error(
        "Baris pasien tidak valid."
      );

    }


    const tujuan =
      ss.getSheetByName(
        targetSheetName
      );

    if (!tujuan) {

      throw new Error(
        "Sheet tujuan " +
        targetSheetName +
        " tidak ditemukan."
      );

    }


    // -------------------------------------------------
    // AMBIL DATA SUMBER
    // -------------------------------------------------

    const sourceLastCol =
      sheetAwal.getLastColumn();

    const sourceHeaders =
      sheetAwal
        .getRange(
          HEADER_ROW,
          1,
          1,
          sourceLastCol
        )
        .getValues()[0];


    const sourceData =
      sheetAwal
        .getRange(
          row,
          1,
          1,
          sourceLastCol
        )
        .getValues()[0];


    // -------------------------------------------------
    // CARI KOLOM BERDASARKAN HEADER
    // -------------------------------------------------

    function findColumn(headers, nama) {

      const target =
        String(nama)
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "_");

      return headers.findIndex(
        h =>
          String(h)
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "_") ===
          target
      );

    }


    const idxId =
      findColumn(
        sourceHeaders,
        "id_bayi"
      );

    const idxRM =
      findColumn(
        sourceHeaders,
        "no_rm"
      );

    const idxNama =
      findColumn(
        sourceHeaders,
        "nama_bayi"
      );


    if (idxId < 0) {

      throw new Error(
        "Kolom id_bayi tidak ditemukan di " +
        sourceName
      );

    }

    if (idxRM < 0) {

      throw new Error(
        "Kolom no_rm tidak ditemukan di " +
        sourceName
      );

    }

    if (idxNama < 0) {

      throw new Error(
        "Kolom nama_bayi tidak ditemukan di " +
        sourceName
      );

    }


    // -------------------------------------------------
    // AMBIL IDENTITAS UTAMA
    // -------------------------------------------------

    let existingId =
      String(
        sourceData[idxId] || ""
      ).trim();

    const noRM =
      String(
        sourceData[idxRM] || ""
      ).trim();

    const namaBayi =
      String(
        sourceData[idxNama] || ""
      ).trim();


    if (!namaBayi) {

      throw new Error(
        "Nama bayi kosong."
      );

    }


    if (!noRM) {

      throw new Error(
        "No. RM kosong."
      );

    }


    // -------------------------------------------------
    // ID BAYI HARUS DIPERTAHANKAN
    //
    // HANYA MASTER BARU YANG BOLEH MEMBUAT ID BARU
    // -------------------------------------------------

    if (!existingId) {

      let prefix = "TRN";

      if (
        targetSheetName ===
        "NICU_LEVEL_2"
      ) {

        prefix = "NIC2";

      }

      if (
        targetSheetName ===
        "NICU_LEVEL_3"
      ) {

        prefix = "NIC3";

      }


      const idxTanggal =
        findColumn(
          sourceHeaders,
          "tgl_masuk"
        );


      let tanggal =
        idxTanggal >= 0
          ? sourceData[idxTanggal]
          : new Date();


      existingId =
        generateIdBayi(
          prefix,
          tanggal,
          noRM
        );


      // Hanya tulis kembali ke sumber
      // jika ID memang kosong
      sheetAwal
        .getRange(
          row,
          idxId + 1
        )
        .setValue(existingId);

    }


    // -------------------------------------------------
    // CEK DUPLIKASI DI TARGET
    // -------------------------------------------------

    const targetLastRow =
      tujuan.getLastRow();


    if (targetLastRow >= 4) {

      const targetLastCol =
        tujuan.getLastColumn();


      const targetHeaders =
        tujuan
          .getRange(
            HEADER_ROW,
            1,
            1,
            targetLastCol
          )
          .getValues()[0];


      const targetIdxId =
        findColumn(
          targetHeaders,
          "id_bayi"
        );


      const targetIdxRM =
        findColumn(
          targetHeaders,
          "no_rm"
        );


      if (targetIdxId >= 0) {

        const ids =
          tujuan
            .getRange(
              4,
              targetIdxId + 1,
              Math.max(
                targetLastRow - 3,
                1
              ),
              1
            )
            .getValues()
            .flat()
            .map(
              x =>
                String(x || "").trim()
            );


        if (
          ids.includes(existingId)
        ) {

          ss.toast(
            "Pasien ID " +
            existingId +
            " sudah ada di " +
            targetSheetName +
            ". Tidak dibuat duplikat.",
            "TRANSFER DIBATALKAN"
          );

          return {

            success: false,

            duplicate: true,

            idBayi:
              existingId,

            target:
              targetSheetName

          };

        }

      }

    }


    // -------------------------------------------------
    // TENTUKAN BARIS TUJUAN
    // -------------------------------------------------

    let targetRow =
      Math.max(
        tujuan.getLastRow() + 1,
        4
      );


    // -------------------------------------------------
    // SIAPKAN DATA
    //
    // KITA PERTAHANKAN STRUKTUR B:AG
    // SEPERTI SISTEM LAMA
    // -------------------------------------------------

    const dataToTransfer =
      sourceData
        .slice(1, 33);


    // -------------------------------------------------
    // PAKSA ID SUMBER TETAP
    //
    // B:AG
    // Kolom D berada pada index 2
    // -------------------------------------------------

    dataToTransfer[2] =
      existingId;


    // -------------------------------------------------
    // TULIS KE TARGET
    // -------------------------------------------------

    tujuan
      .getRange(
        targetRow,
        2,
        1,
        dataToTransfer.length
      )
      .setValues([
        dataToTransfer
      ]);


    // -------------------------------------------------
    // PASTIKAN ID TARGET BENAR
    // -------------------------------------------------

    const targetId =
      tujuan
        .getRange(
          targetRow,
          4
        )
        .getValue();


    if (
      String(targetId).trim() !==
      existingId
    ) {

      throw new Error(
        "Transfer gagal: ID bayi di target tidak sama dengan ID sumber."
      );

    }


    // =================================================
    // LOG TRANSFER
    // =================================================

    try {

      if (
        typeof prosesTrackingNICU ===
        "function"
      ) {

        prosesTrackingNICU(
          sheetAwal,
          row,
          targetSheetName
        );

      }

    } catch (logError) {

      Logger.log(
        "LOG TRANSFER ERROR: " +
        logError.message
      );

    }


    // =================================================
    // WIN DISCHARGE PLANNING
    //
    // HANYA TARGET LEVEL 2
    //
    // TAPI TIDAK MEMBUAT WIN BARU JIKA
    // EPISODE SUDAH ADA
    // =================================================

    if (
      targetSheetName ===
      "NICU_LEVEL_2"
    ) {

      try {

        if (
          typeof WIN_02_AUTO_CREATE_FROM_NICU2 ===
          "function"
        ) {

          const winResult =
            WIN_02_AUTO_CREATE_FROM_NICU2(
              tujuan,
              targetRow
            );


          Logger.log(
            "WIN AUTO CREATE / RESUME: " +
            JSON.stringify(
              winResult
            )
          );

        }

      } catch (winErr) {

        Logger.log(
          "WIN ERROR: " +
          winErr.message
        );

      }

    }


    // =================================================
    // NOTIFIKASI
    // =================================================

    ss.toast(

      "Pasien " +
      namaBayi +
      " berhasil dipindahkan\n" +

      sourceName +
      " → " +
      targetSheetName +

      "\nID: " +
      existingId +

      "\nNo RM: " +
      noRM,

      "TRANSFER BERHASIL"

    );


    return {

      success: true,

      source:
        sourceName,

      target:
        targetSheetName,

      idBayi:
        existingId,

      noRM:
        noRM,

      namaBayi:
        namaBayi,

      targetRow:
        targetRow

    };


  } catch (err) {

    Logger.log(
      "TRANSFER ERROR: " +
      err.stack
    );


    SpreadsheetApp
      .getActiveSpreadsheet()
      .toast(
        "Gagal transfer pasien:\n" +
        err.message,
        "ERROR"
      );


    return {

      success: false,

      message:
        err.message

    };

  }

}


function kirimKeNICU2(sheet, row) { kirimKeNICU(sheet, row, "NICU_LEVEL_2"); }
function kirimKeNICU3(sheet, row) { kirimKeNICU(sheet, row, "NICU_LEVEL_3"); }

// =====================================================
// PROCESS STATUS AKHIR NICU
//
// LEVEL 2:
//   PINDAH LEVEL 3
//
// LEVEL 3:
//   PINDAH LEVEL 2
//
// LANJUT:
//   Membuat episode baru di level yang sama
// =====================================================

function prosesStatusAkhirNICU(
  sheet,
  row,
  status
) {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const namaSheet =
    sheet.getName();

  const statusClean =
    String(status || "")
      .trim()
      .toUpperCase();


  // ===================================================
  // VALIDASI SUMBER
  // ===================================================

  if (
    namaSheet !== "NICU_LEVEL_2" &&
    namaSheet !== "NICU_LEVEL_3"
  ) {

    ss.toast(
      "Status akhir hanya diproses dari NICU Level 2 atau Level 3.",
      "Peringatan"
    );

    return;

  }


  // ===================================================
  // LEVEL 3 → LEVEL 2
  // ===================================================

  if (
    namaSheet === "NICU_LEVEL_3" &&
    statusClean === "PINDAH LEVEL 2"
  ) {

    ss.toast(
      "Memindahkan pasien dari LEVEL 3 → LEVEL 2...",
      "PROSES"
    );


    try {

      if (
        typeof prosesTrackingNICU ===
        "function"
      ) {

        prosesTrackingNICU(
          sheet,
          row,
          "LEVEL_2"
        );

      }


      const hasil =
        kirimKeNICU2(
          sheet,
          row
        );


      Logger.log(
        "LEVEL 3 → LEVEL 2: " +
        JSON.stringify(hasil)
      );


    } catch (err) {

      ss.toast(
        "Gagal LEVEL 3 → LEVEL 2:\n" +
        err.message,
        "ERROR"
      );

      Logger.log(
        err.stack
      );

    }

    return;

  }


  // ===================================================
  // LEVEL 2 → LEVEL 3
  // ===================================================

  if (
    namaSheet === "NICU_LEVEL_2" &&
    statusClean === "PINDAH LEVEL 3"
  ) {

    ss.toast(
      "Memindahkan pasien dari LEVEL 2 → LEVEL 3...",
      "PROSES"
    );


    try {

      if (
        typeof prosesTrackingNICU ===
        "function"
      ) {

        prosesTrackingNICU(
          sheet,
          row,
          "LEVEL_3"
        );

      }


      const hasil =
        kirimKeNICU3(
          sheet,
          row
        );


      Logger.log(
        "LEVEL 2 → LEVEL 3: " +
        JSON.stringify(hasil)
      );


    } catch (err) {

      ss.toast(
        "Gagal LEVEL 2 → LEVEL 3:\n" +
        err.message,
        "ERROR"
      );

      Logger.log(
        err.stack
      );

    }

    return;

  }


  // ===================================================
  // LANJUT EPISODE DI LEVEL 2
  // ===================================================

  if (
    namaSheet === "NICU_LEVEL_2" &&
    (
      statusClean === "LANJUT LEVEL 2"
    )
  ) {

    ss.toast(
      "Membuat episode baru LEVEL 2...",
      "PROSES"
    );


    try {

      lanjutEpisodeNICU(
        sheet,
        row
      );

    } catch (err) {

      ss.toast(
        "Gagal membuat episode baru:\n" +
        err.message,
        "ERROR"
      );

    }

    return;

  }


  // ===================================================
  // LANJUT EPISODE DI LEVEL 3
  // ===================================================

  if (
    namaSheet === "NICU_LEVEL_3" &&
    (
      statusClean === "LANJUT LEVEL 3"
    )
  ) {

    ss.toast(
      "Membuat episode baru LEVEL 3...",
      "PROSES"
    );


    try {

      lanjutEpisodeNICU(
        sheet,
        row
      );

    } catch (err) {

      ss.toast(
        "Gagal membuat episode baru:\n" +
        err.message,
        "ERROR"
      );

    }

    return;

  }


  // ===================================================
  // STATUS KRS / SELESAI
  // ===================================================

  const cfg =
    namaSheet === "NICU_LEVEL_2"

      ? {
          tglMrs: 44,
          tglKrs: 45,
          hari: 46,
          lebih7: 47,
          total: 48
        }

      : {
          tglMrs: 45,
          tglKrs: 46,
          hari: 47,
          lebih7: 48,
          total: 49
        };


  const tglMrs =
    sheet
      .getRange(
        row,
        cfg.tglMrs
      )
      .getValue();


  const tglKrs =
    sheet
      .getRange(
        row,
        cfg.tglKrs
      )
      .getValue();


  if (
    !tglMrs ||
    !tglKrs
  ) {

    ss.toast(
      "Gagal menghitung lama rawat: Tgl MRS/KRS kosong.",
      "Peringatan"
    );

    return;

  }


  const hariRawat =
    Math.max(
      1,
      Math.ceil(
        (
          new Date(tglKrs) -
          new Date(tglMrs)
        ) /
        86400000
      )
    );


  sheet
    .getRange(
      row,
      cfg.hari
    )
    .setValue(
      hariRawat
    );


  const totalLama =
    Number(
      sheet
        .getRange(
          row,
          cfg.total
        )
        .getValue()
    ) || 0;


  const totalBaru =
    totalLama +
    hariRawat;


  sheet
    .getRange(
      row,
      cfg.total
    )
    .setValue(
      totalBaru
    );


  sheet
    .getRange(
      row,
      cfg.lebih7
    )
    .setValue(
      totalBaru > 7
        ? "YA"
        : ""
    );


  ss.toast(
    "Lama rawat berhasil dihitung: " +
    hariRawat +
    " hari.",
    "SELESAI"
  );

}

function lanjutEpisodeNICU(sheet, row) {
  const ids = sheet.getRange(4, 4, Math.max(sheet.getLastRow() - 3, 1), 1).getValues().flat();
  const idxKosong = ids.findIndex(x => !x);
  const barisBaru = idxKosong >= 0 ? idxKosong + 4 : sheet.getLastRow() + 1;

  const data = sheet.getRange(row, 1, 1, 33).getValues();
  sheet.getRange(barisBaru, 1, 1, 33).setValues(data);
  
  SpreadsheetApp.getActive().toast("Episode baru berhasil dilanjutkan di baris " + barisBaru);
}
