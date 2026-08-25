/**
 * ============================================================
 * WIN_07_CERTIFICATE.gs
 * WIN — Discharge Planning Perinatologi
 *
 * MODULE : CERTIFICATE / SERTIFIKAT KELULUSAN
 *
 * ALUR :
 *   LMS 100%
 *      ↓
 *   PRAKTIK 100% + VERIFIED
 *      ↓
 *   EVALUASI LULUS
 *      ↓
 *   CERTIFICATE ID
 *      ↓
 *   SERTIFIKAT DITERBITKAN
 *
 * DEPENDENCY :
 *   WIN_01_CONFIG.gs
 *   WIN_02_EPISODE.gs
 *   WIN_04_LMS.gs
 *   WIN_05_PRAKTIK.gs
 *   WIN_06_EVALUASI.gs
 *
 * NEXT :
 *   WIN_08_WEBAPP.gs
 * ============================================================
 */


/* ============================================================
 * 1. KONFIGURASI CERTIFICATE
 * ============================================================
 */

const WIN_CERTIFICATE = {

  SHEET_NAME: 'WIN_CERTIFICATE',

  HEADERS: [
    'TIMESTAMP',
    'CERTIFICATE_ID',
    'EPISODE_ID',
    'NO_RM',
    'NAMA_IBU',
    'PROGRAM',
    'NILAI_EVALUASI',
    'STATUS',
    'TANGGAL_TERBIT',
    'TANGGAL_KELULUSAN',
    'VERIFIED_BY',
    'VERIFIED_NAME',
    'CERTIFICATE_URL',
    'PDF_URL',
    'KETERANGAN'
  ],

  STATUS: {
    PENDING: 'PENDING',
    ISSUED: 'ISSUED',
    REVOKED: 'REVOKED'
  },

  PROGRAM:
    'WIN Discharge Planning Perinatologi'

};


/* ============================================================
 * 2. MEMBUAT SHEET CERTIFICATE
 * ============================================================
 */

function WIN_CERTIFICATE_ensureSheet() {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  let sheet =
    ss.getSheetByName(
      WIN_CERTIFICATE.SHEET_NAME
    );

  if (!sheet) {

    sheet =
      ss.insertSheet(
        WIN_CERTIFICATE.SHEET_NAME
      );

    sheet
      .getRange(
        1,
        1,
        1,
        WIN_CERTIFICATE.HEADERS.length
      )
      .setValues([
        WIN_CERTIFICATE.HEADERS
      ]);

    sheet.setFrozenRows(1);

  }

  return sheet;

}


/* ============================================================
 * 3. MENGAMBIL SEMUA DATA CERTIFICATE
 * ============================================================
 */

function WIN_CERTIFICATE_getAllData() {

  const sheet =
    WIN_CERTIFICATE_ensureSheet();

  const lastRow =
    sheet.getLastRow();

  if (lastRow < 2) {
    return [];
  }

  return sheet
    .getRange(
      2,
      1,
      lastRow - 1,
      WIN_CERTIFICATE.HEADERS.length
    )
    .getValues();

}


/* ============================================================
 * 4. GENERATE CERTIFICATE ID
 *
 * Contoh:
 * WIN-2026-000001
 * ============================================================
 */

function WIN_CERTIFICATE_generateId() {

  const sheet =
    WIN_CERTIFICATE_ensureSheet();

  const year =
    new Date().getFullYear();

  const lastRow =
    sheet.getLastRow();

  let nomor =
    Math.max(
      0,
      lastRow - 1
    ) + 1;

  let nomorString =
    String(nomor)
      .padStart(6, '0');

  return (
    'WIN-' +
    year +
    '-' +
    nomorString
  );

}


/* ============================================================
 * 5. CEK LMS
 * ============================================================
 */

function WIN_CERTIFICATE_checkLMS(
  episodeId,
  noRM
) {

  try {

    if (
      typeof WIN_LMS_isComplete ===
      'function'
    ) {

      return WIN_LMS_isComplete(
        episodeId,
        noRM
      );

    }

  } catch (error) {

    console.log(
      'Error cek LMS: ' +
      error.message
    );

  }

  return false;

}


/* ============================================================
 * 6. CEK PRAKTIK
 * ============================================================
 */

function WIN_CERTIFICATE_checkPraktik(
  episodeId,
  noRM
) {

  try {

    if (
      typeof WIN_PRAKTIK_isComplete ===
      'function'
    ) {

      return WIN_PRAKTIK_isComplete(
        episodeId,
        noRM
      );

    }

  } catch (error) {

    console.log(
      'Error cek praktik: ' +
      error.message
    );

  }

  return false;

}


/* ============================================================
 * 7. CEK EVALUASI
 * ============================================================
 */

function WIN_CERTIFICATE_checkEvaluasi(
  episodeId,
  noRM
) {

  try {

    if (
      typeof WIN_EVALUASI_isPassed ===
      'function'
    ) {

      return WIN_EVALUASI_isPassed(
        episodeId,
        noRM
      );

    }

  } catch (error) {

    console.log(
      'Error cek evaluasi: ' +
      error.message
    );

  }

  return false;

}


/* ============================================================
 * 8. CEK KELENGKAPAN SELURUH PROGRAM
 * ============================================================
 */

function WIN_CERTIFICATE_checkEligibility(
  episodeId,
  noRM
) {

  const lms =
    WIN_CERTIFICATE_checkLMS(
      episodeId,
      noRM
    );

  const praktik =
    WIN_CERTIFICATE_checkPraktik(
      episodeId,
      noRM
    );

  const evaluasi =
    WIN_CERTIFICATE_checkEvaluasi(
      episodeId,
      noRM
    );


  const eligible =
    lms &&
    praktik &&
    evaluasi;


  return {

    success: true,

    eligible:
      eligible,

    requirement: {

      lms:
        lms,

      praktik:
        praktik,

      evaluasi:
        evaluasi

    },

    message:
      eligible

        ? 'Ibu memenuhi seluruh syarat sertifikat.'

        : 'Syarat sertifikat belum lengkap.'

  };

}


/* ============================================================
 * 9. MENCARI CERTIFICATE YANG SUDAH ADA
 * ============================================================
 */

function WIN_CERTIFICATE_find(
  episodeId,
  noRM
) {

  const data =
    WIN_CERTIFICATE_getAllData();


  for (
    let i = data.length - 1;
    i >= 0;
    i--
  ) {

    const row =
      data[i];


    if (

      String(row[2] || '') ===
        String(episodeId) &&

      String(row[3] || '') ===
        String(noRM) &&

      String(row[7] || '') ===
        WIN_CERTIFICATE.STATUS.ISSUED

    ) {

      return {

        found: true,

        row: row,

        rowNumber:
          i + 2

      };

    }

  }


  return {

    found: false

  };

}


/* ============================================================
 * 10. MENERBITKAN CERTIFICATE
 * ============================================================
 */

function WIN_CERTIFICATE_issue(
  episodeId,
  noRM,
  namaIbu,
  verifiedBy,
  verifiedName
) {

  if (
    !episodeId ||
    !noRM
  ) {

    return {

      success: false,

      message:
        'Episode ID dan No. RM wajib diisi.'

    };

  }


  /*
   * CEK KELAYAKAN
   */

  const eligibility =
    WIN_CERTIFICATE_checkEligibility(
      episodeId,
      noRM
    );


  if (!eligibility.eligible) {

    return {

      success: false,

      eligible: false,

      requirement:
        eligibility.requirement,

      message:
        'Sertifikat belum dapat diterbitkan. Seluruh tahapan harus selesai terlebih dahulu.'

    };

  }


  /*
   * CEK APAKAH SUDAH PERNAH TERBIT
   */

  const existing =
    WIN_CERTIFICATE_find(
      episodeId,
      noRM
    );


  if (existing.found) {

    return {

      success: true,

      alreadyIssued: true,

      certificate:
        WIN_CERTIFICATE_formatRow(
          existing.row
        ),

      message:
        'Sertifikat untuk episode ini sudah diterbitkan.'

    };

  }


  /*
   * AMBIL NILAI EVALUASI
   */

  let nilaiEvaluasi = '';


  try {

    const hasil =
      WIN_EVALUASI_getLatestResult(
        episodeId,
        noRM
      );


    if (hasil && hasil.success) {

      nilaiEvaluasi =
        hasil.nilai;

    }

  } catch (error) {

    console.log(
      'Nilai evaluasi tidak ditemukan: ' +
      error.message
    );

  }


  const now =
    new Date();


  const certificateId =
    WIN_CERTIFICATE_generateId();


  const sheet =
    WIN_CERTIFICATE_ensureSheet();


  sheet.appendRow([

    now,

    certificateId,

    episodeId,

    noRM,

    namaIbu || '',

    WIN_CERTIFICATE.PROGRAM,

    nilaiEvaluasi,

    WIN_CERTIFICATE.STATUS.ISSUED,

    now,

    now,

    verifiedBy || '',

    verifiedName || '',

    '',

    '',

    'Sertifikat diterbitkan setelah seluruh tahapan WIN selesai.'

  ]);


  return {

    success: true,

    alreadyIssued: false,

    certificate: {

      certificateId:
        certificateId,

      episodeId:
        episodeId,

      noRM:
        noRM,

      namaIbu:
        namaIbu || '',

      program:
        WIN_CERTIFICATE.PROGRAM,

      nilaiEvaluasi:
        nilaiEvaluasi,

      status:
        WIN_CERTIFICATE.STATUS.ISSUED,

      tanggalTerbit:
        now,

      verifiedBy:
        verifiedBy || '',

      verifiedName:
        verifiedName || ''

    },

    message:
      'Sertifikat berhasil diterbitkan.'

  };

}


/* ============================================================
 * 11. FORMAT ROW MENJADI OBJECT
 * ============================================================
 */

function WIN_CERTIFICATE_formatRow(
  row
) {

  return {

    certificateId:
      row[1],

    episodeId:
      row[2],

    noRM:
      row[3],

    namaIbu:
      row[4],

    program:
      row[5],

    nilaiEvaluasi:
      row[6],

    status:
      row[7],

    tanggalTerbit:
      row[8],

    tanggalKelulusan:
      row[9],

    verifiedBy:
      row[10],

    verifiedName:
      row[11],

    certificateUrl:
      row[12],

    pdfUrl:
      row[13],

    keterangan:
      row[14]

  };

}


/* ============================================================
 * 12. MENGAMBIL SERTIFIKAT BERDASARKAN ID
 * ============================================================
 */

function WIN_CERTIFICATE_getById(
  certificateId
) {

  if (!certificateId) {

    return {

      success: false,

      message:
        'Certificate ID wajib diisi.'

    };

  }


  const data =
    WIN_CERTIFICATE_getAllData();


  for (
    let i = 0;
    i < data.length;
    i++
  ) {

    const row =
      data[i];


    if (
      String(row[1] || '') ===
      String(certificateId)
    ) {

      return {

        success: true,

        certificate:
          WIN_CERTIFICATE_formatRow(
            row
          )

      };

    }

  }


  return {

    success: false,

    message:
      'Certificate ID tidak ditemukan.'

  };

}


/* ============================================================
 * 13. MENGAMBIL SERTIFIKAT BERDASARKAN EPISODE
 * ============================================================
 */

function WIN_CERTIFICATE_getByEpisode(
  episodeId,
  noRM
) {

  const existing =
    WIN_CERTIFICATE_find(
      episodeId,
      noRM
    );


  if (!existing.found) {

    return {

      success: false,

      message:
        'Sertifikat belum diterbitkan.'

    };

  }


  return {

    success: true,

    certificate:
      WIN_CERTIFICATE_formatRow(
        existing.row
      )

  };

}


/* ============================================================
 * 14. UPDATE URL CERTIFICATE
 *
 * Nanti digunakan setelah PDF / halaman sertifikat
 * berhasil dibuat oleh WIN_08_WEBAPP.gs.
 * ============================================================
 */

function WIN_CERTIFICATE_updateUrl(
  certificateId,
  certificateUrl,
  pdfUrl
) {

  if (!certificateId) {

    return {

      success: false,

      message:
        'Certificate ID wajib diisi.'

    };

  }


  const sheet =
    WIN_CERTIFICATE_ensureSheet();

  const data =
    WIN_CERTIFICATE_getAllData();


  let rowNumber = -1;


  for (
    let i = 0;
    i < data.length;
    i++
  ) {

    if (
      String(data[i][1] || '') ===
      String(certificateId)
    ) {

      rowNumber =
        i + 2;

      break;

    }

  }


  if (rowNumber === -1) {

    return {

      success: false,

      message:
        'Certificate ID tidak ditemukan.'

    };

  }


  sheet
    .getRange(
      rowNumber,
      13
    )
    .setValue(
      certificateUrl || ''
    );


  sheet
    .getRange(
      rowNumber,
      14
    )
    .setValue(
      pdfUrl || ''
    );


  return {

    success: true,

    message:
      'URL sertifikat berhasil diperbarui.',

    certificateId:
      certificateId

  };

}


/* ============================================================
 * 15. REVOKE CERTIFICATE
 *
 * Dipersiapkan untuk kebutuhan administrasi.
 * ============================================================
 */

function WIN_CERTIFICATE_revoke(
  certificateId,
  alasan
) {

  if (!certificateId) {

    return {

      success: false,

      message:
        'Certificate ID wajib diisi.'

    };

  }


  const sheet =
    WIN_CERTIFICATE_ensureSheet();

  const data =
    WIN_CERTIFICATE_getAllData();


  let rowNumber = -1;


  for (
    let i = 0;
    i < data.length;
    i++
  ) {

    if (
      String(data[i][1] || '') ===
      String(certificateId)
    ) {

      rowNumber =
        i + 2;

      break;

    }

  }


  if (rowNumber === -1) {

    return {

      success: false,

      message:
        'Certificate ID tidak ditemukan.'

    };

  }


  sheet
    .getRange(
      rowNumber,
      8
    )
    .setValue(
      WIN_CERTIFICATE.STATUS.REVOKED
    );


  sheet
    .getRange(
      rowNumber,
      15
    )
    .setValue(
      alasan ||
      'Sertifikat dicabut.'
    );


  return {

    success: true,

    message:
      'Sertifikat berhasil dicabut.',

    certificateId:
      certificateId

  };

}


/* ============================================================
 * 16. DASHBOARD CERTIFICATE
 * ============================================================
 */

function WIN_CERTIFICATE_getDashboardData(
  episodeId,
  noRM
) {

  const eligibility =
    WIN_CERTIFICATE_checkEligibility(
      episodeId,
      noRM
    );


  const certificate =
    WIN_CERTIFICATE_getByEpisode(
      episodeId,
      noRM
    );


  return {

    success: true,

    episodeId:
      episodeId,

    noRM:
      noRM,

    eligible:
      eligibility.eligible,

    requirement:
      eligibility.requirement,

    certificate:
      certificate.success
        ? certificate.certificate
        : null

  };

}


/* ============================================================
 * 17. VERIFIKASI CERTIFICATE
 *
 * Fungsi publik untuk mengecek keaslian sertifikat.
 * ============================================================
 */

function WIN_CERTIFICATE_verify(
  certificateId
) {

  const result =
    WIN_CERTIFICATE_getById(
      certificateId
    );


  if (!result.success) {

    return {

      success: false,

      valid: false,

      message:
        'Sertifikat tidak ditemukan.'

    };

  }


  const certificate =
    result.certificate;


  if (
    certificate.status !==
    WIN_CERTIFICATE.STATUS.ISSUED
  ) {

    return {

      success: true,

      valid: false,

      certificate:
        certificate,

      message:
        'Sertifikat tidak aktif.'

    };

  }


  return {

    success: true,

    valid: true,

    certificate:
      certificate,

    message:
      'Sertifikat valid dan aktif.'

  };

}


/* ============================================================
 * 18. TEST MANUAL
 * ============================================================
 */

function WIN_CERTIFICATE_TEST() {

  const sheet =
    WIN_CERTIFICATE_ensureSheet();


  Logger.log(
    'WIN_CERTIFICATE aktif: ' +
    sheet.getName()
  );


  Logger.log(
    'Program: ' +
    WIN_CERTIFICATE.PROGRAM
  );


  Logger.log(
    'Status: ' +
    JSON.stringify(
      WIN_CERTIFICATE.STATUS
    )
  );

}
