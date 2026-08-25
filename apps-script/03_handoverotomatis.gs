/**
 * ============================================================================
 * SYSTEM GENERATE HANDOVER TRANS10 (PRESISI KERTAS A4) - v3.3
 * - FIX HEADER BERULANG: Dibuat tanpa tag <thead> agar Google Doc TIDAK
 *   mengulang header saat pindah kertas/halaman.
 * - FOOTER REKAP: Font 10pt (BOLD/TEBAL), Spasi Rapat & Ringkas.
 * ============================================================================
 */

const TARGET_DOC_ID = "1RtMUAW2jJhVl1Y0hpscPFIOCARnUeus6HcMkTGeS8dc";

function GENERATE_DARI_REGISTER() {
  generateHandoverCore(true);
}

function GENERATE_BARIS_PASIEN_SAJA() {
  generateHandoverCore(false);
}

function generateHandoverCore(isLengkap) {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const selection = sheet.getSelection();
  const ranges = selection.getActiveRangeList() ? selection.getActiveRangeList().getRanges() : [sheet.getActiveRange()];

  let selectedRows = [];
  ranges.forEach(range => {
    let startRow = range.getRow();
    let numRows = range.getNumRows();
    for (let i = 0; i < numRows; i++) {
      let r = startRow + i;
      if (r >= 4 && !selectedRows.includes(r)) {
        selectedRows.push(r);
      }
    }
  });

  if (selectedRows.length === 0) {
    ui.alert("⚠️ Peringatan", "Silakan blok/pilih minimal 1 baris data pasien di Master Register!", ui.ButtonSet.OK);
    return;
  }

  let tglDinas = "", pxLamaVal = "0", petugasVal = "-";

  if (isLengkap) {
    let shiftPrompt = ui.prompt("1/3 Header Handover", "Masukkan teks header (contoh: SABTU, 15 AGUSTUS 2026 (DINAS PAGI)):", ui.ButtonSet.OK_CANCEL);
    if (shiftPrompt.getSelectedButton() !== ui.Button.OK) return;
    tglDinas = shiftPrompt.getResponseText();

    let pxLamaPrompt = ui.prompt("2/3 Rekap Pasien", "Masukkan jumlah Px Lama (Misal: 0):", ui.ButtonSet.OK_CANCEL);
    pxLamaVal = pxLamaPrompt.getSelectedButton() === ui.Button.OK ? (pxLamaPrompt.getResponseText() || "0") : "0";

    let petugasPrompt = ui.prompt("3/3 Nama Petugas", "Masukkan Nama Petugas (Misal: Allia,Nita):", ui.ButtonSet.OK_CANCEL);
    petugasVal = petugasPrompt.getSelectedButton() === ui.Button.OK ? (petugasPrompt.getResponseText() || "-") : "-";
  }

  let isBayiBaruResponse = ui.alert("Status Bayi", "Apakah pasien yang dipilih ini adalah BAYI BARU (P/B)?\n\n- Klik YES untuk Bayi Baru (dengan P/B & data persalinan)\n- Klik NO untuk Bayi Lama (tanpa P/B / salin perkembangan)", ui.ButtonSet.YES_NO);
  let isBayiBaru = (isBayiBaruResponse === ui.Button.YES);

  let totalPxBaru = isBayiBaru ? selectedRows.length : 0;
  let totalPasien = (parseInt(pxLamaVal) || 0) + selectedRows.length;

  let tableRowsHtml = "";
  
  selectedRows.forEach((activeRow, index) => {
    const rowData = sheet.getRange(activeRow, 1, 1, 50).getValues()[0];

    let noUrutShift = (index + 1) + ".";
    let noRegister = rowData[0] ? String(rowData[0]).trim() : "-"; 
    let ruangan = rowData[2] || "-";    
    let noRM = rowData[4] || "-";       
    let namaBayi = rowData[5] || "-";   
    let rmIbu = rowData[6] || "-";  
    
    let rawNoHP = rowData[11];
    let noHP = "";
    if (rawNoHP) {
      noHP = String(rawNoHP).replace(/^'/, '').trim();
    }
    
    let tglLahirRaw = rowData[12];      
    let tglLahir = "";
    if (tglLahirRaw) {
      tglLahir = (tglLahirRaw instanceof Date) ? Utilities.formatDate(tglLahirRaw, Session.getScriptTimeZone(), "dd/MM/yyyy") : tglLahirRaw;
    }
    
    let jamLahir = rowData[13];         
    if (jamLahir instanceof Date) jamLahir = Utilities.formatDate(jamLahir, Session.getScriptTimeZone(), "HH.mm");

    let caraLahir = rowData[15] || "Spontan"; 
    let indikasi = rowData[16] || "";        
    let gpa = rowData[17] || "";             
    let a_s = rowData[18] || "-";            
    let jk = rowData[19] || "-";              
    let bb_pb_lk = rowData[20] || "-";        
    let ketuban = rowData[21] || "jernih";    
    let ballard = rowData[23] || "-";         
    let lubchenco = rowData[24] || "-";       
    let downScore = rowData[25] || "0";       

    let bb = "-", pb = "-", lk = "-";
    if (bb_pb_lk && String(bb_pb_lk).includes("/")) {
      let parts = String(bb_pb_lk).split("/");
      bb = parts[0] || "-";
      pb = parts[1] || "-";
      lk = parts[2] || "-";
    } else if (bb_pb_lk) {
      bb = bb_pb_lk;
    }

    let jkText = String(jk).toLowerCase().includes("l") ? "Laki-laki" : "Perempuan";
    
    let badgeNoReg = (noRegister && noRegister !== "-") ? `<br><span style="background-color: #00FF00; color: #000; font-weight: bold; padding: 0px 3px; border-radius: 2px; font-size: 11pt;">(${noRegister})</span>` : "";
    let infoNoHP = noHP ? `<br><span style="font-size: 11pt; color: #111;">📞 ${noHP}</span>` : "";

    let pbHeaderHtml = isBayiBaru ? `<div style="font-weight: bold; margin-bottom: 2px; font-size: 12pt;">P/B</div>` : ``;
    
    let handoverHtml = "";
    if (isBayiBaru) {
      handoverHtml = `
        ${pbHeaderHtml}
        <ul style="margin: 0; padding-left: 16px; font-size: 12pt; line-height: 1.25;">
          <li><b>BBL ${caraLahir}</b> di <b>${ruangan}</b> tgl <b>${tglLahir}</b> jam <b>${jamLahir} WIB</b> ${indikasi ? 'a/i ' + gpa + ' ' + indikasi : ''}</li>
          <li>Jk <b>${jkText}</b>, AS <b>${a_s}</b>, BB <b>${bb} gr</b>, PB <b>${pb} cm</b>, LK <b>${lk} cm</b>, anus ada, ketuban <b>${ketuban}</b>, Kelkong tdk ada</li>
          <li>BS <b>${ballard}</b>, LSP <b>${lubchenco}</b>, down score : <b>${downScore}</b></li>
          <li>Inj Neo K +, tts mata +, imun HB 0 (+), ASI (+), BAK(-) BAB (-)</li>
          <li><b>GDA stik jam ... wib : ... mg/dL</b></li>
          <li><b>Daftar IGD (+) E- Resep (+), pampers & tisu basah (+)</b></li>
        </ul>
      `;
    } else {
      handoverHtml = `
        <ul style="margin: 0; padding-left: 16px; font-size: 12pt; line-height: 1.25;">
          <li>Bayi Rawat Hari Ke-..., Jk <b>${jkText}</b>, BB saat ini: <b>${bb} gr</b></li>
          <li><b>S:</b> ...</li>
          <li><b>O:</b> HR: ...x/m, RR: ...x/m, SpO2: ...%, Suhu: ...°C</li>
          <li><b>A:</b> ...</li>
          <li><b>P:</b> Terapi dilanjutkan / Penyesuaian instruksi dokter</li>
        </ul>
      `;
    }

    tableRowsHtml += `
      <tr class="patient-row">
        <td style="width: 6%; text-align:center; vertical-align:top; font-size: 12pt; font-weight: bold; border: 1px solid #000; padding: 4px;">
          ${noUrutShift}${badgeNoReg}
        </td>
        <td style="width: 18%; vertical-align:top; font-size: 12pt; border: 1px solid #000; padding: 4px;">
          <b>${namaBayi}</b><br>/ <b>${noRM}</b>${infoNoHP}
        </td>
        <td style="width: 10%; text-align:center; vertical-align:top; font-weight:bold; font-size: 12pt; border: 1px solid #000; padding: 4px;">${rmIbu}</td>
        <td style="width: 8%; text-align:center; vertical-align:top; font-weight:bold; font-size: 12pt; border: 1px solid #000; padding: 4px;">ERM (+)</td>
        <td style="width: 58%; vertical-align:top; font-size: 12pt; border: 1px solid #000; padding: 4px;">
          ${handoverHtml}
        </td>
      </tr>
    `;
  });

  // REKAP FOOTER : FONT 10pt + BOLD (TEBAL) + SPASI RAPAT
  let rekapFooterHtml = isLengkap ? `
    <tr class="footer-row">
      <td colspan="3" style="border: 1px solid #000; padding: 1px 4px; font-size: 10pt; line-height: 1.05; font-weight: bold;">Px Lama : ${pxLamaVal}</td>
      <td colspan="2" style="border: 1px solid #000; padding: 1px 4px; font-size: 10pt; line-height: 1.05; font-weight: bold;">Pindah NICU level II/III : 0/0</td>
    </tr>
    <tr class="footer-row">
      <td colspan="3" style="border: 1px solid #000; padding: 1px 4px; font-size: 10pt; line-height: 1.05; font-weight: bold;">Px Baru : ${totalPxBaru}</td>
      <td colspan="2" style="border: 1px solid #000; padding: 1px 4px; font-size: 10pt; line-height: 1.05; font-weight: bold;">Total pasien : ${totalPasien}</td>
    </tr>
    <tr class="footer-row">
      <td colspan="3" style="border: 1px solid #000; padding: 1px 4px; font-size: 10pt; line-height: 1.05; font-weight: bold;">Px RG : 0</td>
      <td colspan="2" style="border: 1px solid #000; padding: 1px 4px; font-size: 10pt; line-height: 1.05; font-weight: bold;">Bed kosong : 2</td>
    </tr>
    <tr class="footer-row">
      <td colspan="3" style="border: 1px solid #000; padding: 1px 4px; font-size: 10pt; line-height: 1.05; font-weight: bold;">Px KRS : 0</td>
      <td colspan="2" style="border: 1px solid #000; padding: 1px 4px; font-size: 10pt; line-height: 1.05; font-weight: bold;">Bayi IUFD/Meninggal : 0</td>
    </tr>
    <tr class="footer-row">
      <td colspan="3" style="border: 1px solid #000; padding: 1px 4px; font-size: 10pt; line-height: 1.05; font-weight: bold;">Pindah Neo : ${totalPxBaru}</td>
      <td colspan="2" style="background-color: #FFFF00; border: 1px solid #000; padding: 1px 4px; font-size: 10pt; line-height: 1.05; font-weight: bold;">Petugas : ${petugasVal.toUpperCase()}</td>
    </tr>
  ` : '';

  let headerHtml = isLengkap ? `<div class="shift-header-title" style="font-weight: bold; text-align: center; font-size: 14pt; margin-bottom: 8px; text-transform: uppercase;">${tglDinas}</div>` : '';

  // HEADER TABEL DIBUAT BARIS TR BIASA (TANPA THEAD) SUPAYA TIDAK BERULANG OTOMATIS
  let tableHeaderHtml = isLengkap ? `
    <tr class="header-table-row">
      <td style="width: 6%; border: 1px solid #000; padding: 4px; font-size: 12pt; font-weight: bold; text-align: center;">No</td>
      <td style="width: 18%; border: 1px solid #000; padding: 4px; font-size: 12pt; font-weight: bold; text-align: center;">By Ny</td>
      <td style="width: 10%; border: 1px solid #000; padding: 4px; font-size: 12pt; font-weight: bold; text-align: center;">NO RM IBU</td>
      <td style="width: 8%; border: 1px solid #000; padding: 4px; font-size: 12pt; font-weight: bold; text-align: center;">ERM (+)</td>
      <td style="width: 58%; border: 1px solid #000; padding: 4px; font-size: 12pt; font-weight: bold; text-align: center;">Handover</td>
    </tr>
  ` : '';

  let btnInsertHtml = !isLengkap ? `<button class="btn-insert" onclick="sisipKeShiftTertentu()">➕ Sisip Otomatis ke Shift Tertentu</button>` : '';

  let htmlOutput = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Calibri, sans-serif; font-size: 12pt; padding: 8px; line-height: 1.2; }
        table { width: 100%; max-width: 100%; border-collapse: collapse; margin-top: 2px; table-layout: fixed; }
        td { border: 1px solid #000; padding: 4px; word-wrap: break-word; font-size: 12pt; font-family: Calibri, sans-serif; }
        .btn-container { margin-bottom: 10px; display: flex; gap: 8px; flex-wrap: wrap; }
        button { padding: 6px 12px; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 11pt; }
        .btn-copy { background-color: #007bff; color: white; }
        .btn-gdoc { background-color: #28a745; color: white; }
        .btn-insert { background-color: #ff9800; color: white; }
        #status { font-size: 11pt; margin-top: 6px; font-weight: bold; color: green; }
      </style>
    </head>
    <body>
      <div class="btn-container">
        <button class="btn-copy" onclick="copyTableFormat()">📋 Salin Format Tabel</button>
        <button class="btn-gdoc" onclick="sisipKeGoogleDoc()">📄 Buat Tabel Baru di Google Doc</button>
        ${btnInsertHtml}
      </div>
      <div id="status"></div>

      <div id="contentToCopy" style="width: 100%;">
        ${headerHtml}
        <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
          <tbody>
            ${tableHeaderHtml}
            ${tableRowsHtml}
            ${rekapFooterHtml}
          </tbody>
        </table>
      </div>

      <script>
        function copyTableFormat() {
          const content = document.getElementById("contentToCopy").innerHTML;
          const blobInput = new Blob([content], { type: 'text/html' });
          const clipboardItem = new ClipboardItem({ 'text/html': blobInput });

          navigator.clipboard.write([clipboardItem]).then(() => {
            document.getElementById("status").style.color = "green";
            document.getElementById("status").innerText = "✅ Berhasil disalin!";
          }).catch(err => {
            document.getElementById("status").style.color = "red";
            document.getElementById("status").innerText = "❌ Gagal menyalin. Silakan blok tabel manual lalu Ctrl+C.";
          });
        }

        function sisipKeGoogleDoc() {
          document.getElementById("status").style.color = "blue";
          document.getElementById("status").innerText = "⏳ Sedang membuat tabel di Google Doc...";
          
          const htmlContent = document.getElementById("contentToCopy").innerHTML;

          google.script.run
            .withSuccessHandler(function(url) {
              document.getElementById("status").style.color = "green";
              document.getElementById("status").innerHTML = '✅ Berhasil dibuat! <a href="' + url + '" target="_blank"><u>Buka Google Doc AGUSTUS 2026</u></a>';
            })
            .withFailureHandler(function(err) {
              document.getElementById("status").style.color = "red";
              document.getElementById("status").innerText = "❌ Gagal: " + err.message;
            })
            .sisipKeDocUtama(htmlContent);
        }

        function sisipKeShiftTertentu() {
          let namaShift = prompt("Masukkan Kata Kunci Shift Target (Misal: DINAS SORE, DINAS PAGI, atau DINAS MALAM):", "DINAS MALAM");
          if (!namaShift) return;

          document.getElementById("status").style.color = "blue";
          document.getElementById("status").innerText = "⏳ Sedang mencari shift terbaru dan menyisipkan baris...";

          const htmlContent = document.getElementById("contentToCopy").innerHTML;

          google.script.run
            .withSuccessHandler(function(res) {
              document.getElementById("status").style.color = "green";
              document.getElementById("status").innerText = "✅ " + res;
            })
            .withFailureHandler(function(err) {
              document.getElementById("status").style.color = "red";
              document.getElementById("status").innerText = "❌ Gagal: " + err.message;
            })
            .sisipPasienKeShiftDoc(htmlContent, namaShift);
        }
      </script>
    </body>
    </html>
  `;

  let html = HtmlService.createHtmlOutput(htmlOutput)
    .setWidth(850)
    .setHeight(620);
  
  SpreadsheetApp.getUi().showModalDialog(html, `📋 Handover Pasien (A4 Presisi)`);
}

/**
 * SISIP BARIS PASIEN KE SHIFT TARGET (Strict: Tanpa Header Berulang)
 */
function sisipPasienKeShiftDoc(htmlContent, targetShiftKeyword) {
  try {
    let doc = DocumentApp.openById(TARGET_DOC_ID);
    let body = doc.getBody();
    let tables = body.getTables();

    if (tables.length === 0) {
      throw new Error("Tidak ditemukan tabel sama sekali di dokumen target.");
    }

    let targetTable = null;

    for (let i = tables.length - 1; i >= 0; i--) {
      let tbl = tables[i];
      let prevSibling = tbl.getPreviousSibling();
      
      while (prevSibling && prevSibling.getType() === DocumentApp.ElementType.PARAGRAPH) {
        let pText = prevSibling.asParagraph().getText().toUpperCase();
        if (pText.includes(targetShiftKeyword.toUpperCase())) {
          targetTable = tbl;
          break;
        }
        if (pText.trim() !== "") break;
        prevSibling = prevSibling.getPreviousSibling();
      }
      if (targetTable) break;
    }

    if (!targetTable) {
      for (let i = tables.length - 1; i >= 0; i--) {
        let tbl = tables[i];
        if (tbl.getText().toUpperCase().includes(targetShiftKeyword.toUpperCase())) {
          targetTable = tbl;
          break;
        }
      }
    }

    if (!targetTable) {
      targetTable = tables[tables.length - 1];
    }

    let tempBlob = Utilities.newBlob(`<!DOCTYPE html><html><body>${htmlContent}</body></html>`, 'text/html', 'temp.html');
    let tempFile = DriveApp.createFile(tempBlob);
    let tempDocFile = Drive.Files.insert({ title: "temp_doc", mimeType: MimeType.GOOGLE_DOCS }, tempFile.getBlob());
    let tempDoc = DocumentApp.openById(tempDocFile.id);
    let tempTable = tempDoc.getBody().getTables()[0];

    let totalRows = tempTable.getNumRows();
    let numExistingRows = targetTable.getNumRows();
    
    let insertIndex = numExistingRows;
    for (let r = numExistingRows - 1; r >= 0; r--) {
      let rowText = targetTable.getRow(r).getText();
      if (rowText.includes("Px Lama") || rowText.includes("Total pasien") || rowText.includes("Petugas")) {
        insertIndex = r;
      }
    }

    let countInserted = 0;
    for (let r = 0; r < totalRows; r++) {
      let row = tempTable.getRow(r);
      let rowText = row.getText();
      
      let isHeaderOrFooter = rowText.includes("Px Lama") || 
                             rowText.includes("Total pasien") || 
                             rowText.includes("Petugas") || 
                             rowText.includes("NO RM IBU") ||
                             rowText.includes("Handover") ||
                             rowText.includes("By Ny");

      if (!isHeaderOrFooter) {
        let copiedRow = row.copy();
        let insertedRow = targetTable.insertTableRow(insertIndex, copiedRow);
        
        for (let c = 0; c < insertedRow.getNumChildren(); c++) {
          let cell = insertedRow.getCell(c);
          cell.setFontFamily("Calibri");
          cell.setFontSize(11);
        }

        insertIndex++;
        countInserted++;
      }
    }

    doc.saveAndClose();
    
    tempFile.setTrashed(true);
    DriveApp.getFileById(tempDocFile.id).setTrashed(true);

    return countInserted + " baris pasien berhasil disisipkan ke shift: " + targetShiftKeyword;

  } catch (err) {
    throw new Error("Gagal menyisipkan ke Shift: " + err.message);
  }
}

/**
 * BUAT TABEL DOKUMEN BARU LENGKAP
 */
function sisipKeDocUtama(htmlContent) {
  try {
    let doc = DocumentApp.openById(TARGET_DOC_ID);
    let body = doc.getBody();

    let tempBlob = Utilities.newBlob(`
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body>${htmlContent}</body>
      </html>
    `, 'text/html', 'temp.html');
    
    let tempFile = DriveApp.createFile(tempBlob);
    let tempDocFile = Drive.Files.insert({
      title: "temp_doc",
      mimeType: MimeType.GOOGLE_DOCS
    }, tempFile.getBlob());

    let tempDoc = DocumentApp.openById(tempDocFile.id);
    let totalChildren = tempDoc.getBody().getNumChildren();

    body.appendParagraph(""); 
    for (let i = 0; i < totalChildren; i++) {
      let element = tempDoc.getBody().getChild(i).copy();
      let type = element.getType();
      
      if (type == DocumentApp.ElementType.PARAGRAPH) {
        let p = body.appendParagraph(element.asParagraph());
        p.setFontFamily("Calibri");
        p.setFontSize(14);
        p.setBold(true);
      } else if (type == DocumentApp.ElementType.TABLE) {
        let table = body.appendTable(element.asTable());

        try {
          table.setColumnWidth(0, 35);  // No
          table.setColumnWidth(1, 105); // By Ny / RM / Telp
          table.setColumnWidth(2, 55);  // NO RM IBU
          table.setColumnWidth(3, 45);  // ERM (+)
          table.setColumnWidth(4, 320); // Handover

          for (let r = 0; r < table.getNumRows(); r++) {
            let row = table.getRow(r);
            
            // PAKSA SEMUA BARIS TABEL TIDAK BERULANG DI HALAMAN BARU
            try { row.setRepeatHeader(false); } catch(e){}

            let rowText = row.getText();
            let isHeaderRow = (r === 0 && rowText.includes("NO RM IBU"));
            let isFooterRow = rowText.includes("Px Lama") || rowText.includes("Total pasien") || rowText.includes("Petugas");

            for (let c = 0; c < row.getNumChildren(); c++) {
              let cell = row.getCell(c);
              cell.setFontFamily("Calibri");
              
              if (isHeaderRow) {
                cell.setFontSize(11);
                cell.setBold(true);
              } else if (isFooterRow) {
                cell.setFontSize(11); // Font 11pt ringkas
                cell.setBold(true);   // DI-BOLD Sesuai Permintaan
                cell.setPaddingTop(1);
                cell.setPaddingBottom(1);
              } else {
                cell.setFontSize(11);
              }
            }
          }
        } catch(e) {}
      }
    }

    doc.saveAndClose();
    
    tempFile.setTrashed(true);
    DriveApp.getFileById(tempDocFile.id).setTrashed(true);

    return doc.getUrl();

  } catch (err) {
    throw new Error("Gagal menyambung ke Doc: " + err.message);
  }
}

/**
 * ============================================================================
 * PENATAAN MENUS
 * ============================================================================
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu("🏥 MENU TRANS10")
    .addItem("Generate Baris Dipilih", "generateSelectedRow")
    .addSeparator()
    .addItem("Buka Folder PDF", "openFolder")
    .addSeparator()
    .addItem("Kalkulator Ballard & LSP", "showSidebar")
    .addSeparator()
    .addItem("Ambil ke NICU LEVEL 2", "ambilMasterKeNICU2")
    .addItem("Ambil ke NICU LEVEL 3", "ambilMasterKeNICU3")
    .addToUi();

  ui.createMenu("🚀 HANDOVER AUTO")
    .addItem("📝 HANDOVER SHIFT", "GENERATE_DARI_REGISTER")
    .addItem("➕ SISIPKAN PASIEN KE HANDOVER", "GENERATE_BARIS_PASIEN_SAJA")
    .addToUi();

  ui.createMenu("👶 ID BAYI")
    .addItem("Generate ID Transisi", "generateIdTransisiKosong")
    .addItem("Generate ID NICU Level 2", "generateIdNICU2Kosong")
    .addItem("Generate ID NICU Level 3", "generateIdNICU3Kosong")
    .addSeparator()
    .addItem("Generate Semua ID Kosong", "generateSemuaIdKosong")
    .addToUi();

  ui.createMenu("📊 REKAP NICU")
    .addItem("Build Dashboard NICU", "buildDashboardNICU")
    .addSeparator()
    .addItem("Isi Formula Rekap", "isiFormulaRekapNICU")
    .addItem("Isi Indikator Mutu", "isiIndikatorMutuNICU")
    .addItem("Top 10 Diagnosis", "isiTopDiagnosisNICU")
    .addToUi();
  
}
