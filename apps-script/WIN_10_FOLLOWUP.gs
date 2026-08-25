/**
 * ============================================================
 * WIN_10_FOLLOWUP.gs
 * WIN — Discharge Planning Perinatologi
 *
 * MODULE:
 * FOLLOW UP / RENCANA KONTROL
 *
 * ALUR:
 *
 * DATA IBU/BAYI
 *      ↓
 * FOLLOW UP
 *      ↓
 * KONTROL RS / PUSKESMAS
 *      ↓
 * NO. ANTREAN
 *      ↓
 * SERTIFIKAT
 *
 * ============================================================
 */


/* ============================================================
 * 1. KONFIGURASI MODULE
 * ============================================================
 */

const WIN_FOLLOWUP = {

  SHEET_NAME:
    WIN_CONFIG.FOLLOWUP_SHEET || 'WIN_FOLLOWUP',

  HEADER_ROW:
    1,

  DATA_START_ROW:
    2,

  STATUS_DRAFT:
    'DRAFT',

  STATUS_SELESAI:
    'SELESAI',

  JENIS_RS:
    'RS',

  JENIS_PUSKESMAS:
    'PUSKESMAS'

};


/* ============================================================
 * 2. HEADER DEFAULT
 * ============================================================
 *
 * SHEET: WIN_FOLLOWUP
 *
 * A  TIMESTAMP
 * B  EPISODE_ID
 * C  NO_RM
 * D  NAMA_IBU
 * E  JENIS_KONTROL
 * F  FASILITAS_KONTROL
 * G  NO_ANTREAN
 * H  STATUS
 * I  CREATED_AT
 * J  UPDATED_AT
 *
 * ============================================================
 */

const WIN_FOLLOWUP_HEADERS = [

  'TIMESTAMP',
  'EPISODE_ID',
  'NO_RM',
  'NAMA_IBU',
  'JENIS_KONTROL',
  'FASILITAS_KONTROL',
  'NO_ANTREAN',
  'STATUS',
  'CREATED_AT',
  'UPDATED_AT'

];


/* ============================================================
 * 3. AMBIL SHEET
 * ============================================================
 */

function WIN_FOLLOWUP_getSheet() {

  const ss =
    WIN_getSpreadsheet();

  const sheetName =
    WIN_FOLLOWUP.SHEET_NAME;

  let sheet =
    ss.getSheetByName(sheetName);

  if (!sheet) {

    throw new Error(
      'Sheet "' +
      sheetName +
      '" belum ditemukan.'
    );

  }

  return sheet;

}


/* ============================================================
 * 4. CEK / SIAPKAN HEADER
 * ============================================================
 */

function WIN_FOLLOWUP_ensureHeaders() {

  const sheet =
    WIN_FOLLOWUP_getSheet();

  const lastColumn =
    Math.max(
      sheet.getLastColumn(),
      WIN_FOLLOWUP_HEADERS.length
    );

  const currentHeaders =
    sheet
      .getRange(
        WIN_FOLLOWUP.HEADER_ROW,
        1,
        1,
        lastColumn
      )
      .getValues()[0];

  let needsHeader =
    false;

  for (
    let i = 0;
    i < WIN_FOLLOWUP_HEADERS.length;
    i++
  ) {

    if (
      WIN_cleanText(
        currentHeaders[i]
      ) !==
      WIN_FOLLOWUP_HEADERS[i]
    ) {

      needsHeader =
        true;

      break;

    }

  }

  if (needsHeader) {

    sheet
      .getRange(
        WIN_FOLLOWUP.HEADER_ROW,
        1,
        1,
        WIN_FOLLOWUP_HEADERS.length
      )
      .setValues([
        WIN_FOLLOWUP_HEADERS
      ]);

  }

  return true;

}


/* ============================================================
 * 5. NORMALISASI JENIS KONTROL
 * ============================================================
 */

function WIN_FOLLOWUP_normalizeJenis(
  jenis
) {

  jenis =
    WIN_cleanText(
      jenis
    )
    .toUpperCase();

  if (
    jenis === 'RS' ||
    jenis === 'RUMAH SAKIT'
  ) {

    return WIN_FOLLOWUP.JENIS_RS;

  }

  if (
    jenis === 'PUSKESMAS' ||
    jenis === 'PKM'
  ) {

    return WIN_FOLLOWUP.JENIS_PUSKESMAS;

  }

  return '';

}


/* ============================================================
 * 6. NORMALISASI DATA
 * ============================================================
 */

function WIN_FOLLOWUP_normalizeData(
  data
) {

  data =
    data || {};

  const episodeId =
    WIN_cleanText(
      data.episodeId
    );

  const noRM =
    WIN_cleanText(
      data.noRM
    );

  const namaIbu =
    WIN_cleanText(
      data.namaIbu
    );

  const jenisKontrol =
    WIN_FOLLOWUP_normalizeJenis(
      data.jenisKontrol
    );

  const fasilitasKontrol =
    WIN_cleanText(
      data.fasilitasKontrol
    );

  const noAntrean =
    WIN_cleanText(
      data.noAntrean
    );

  return {

    episodeId:
      episodeId,

    noRM:
      noRM,

    namaIbu:
      namaIbu,

    jenisKontrol:
      jenisKontrol,

    fasilitasKontrol:
      fasilitasKontrol,

    noAntrean:
      noAntrean

  };

}


/* ============================================================
 * 7. VALIDASI DATA
 * ============================================================
 */

function WIN_FOLLOWUP_validateData(
  data
) {

  const errors = [];


  if (!data.episodeId) {

    errors.push(
      'Episode ID belum tersedia.'
    );

  }


  if (!data.noRM) {

    errors.push(
      'No. RM belum tersedia.'
    );

  }


  if (!data.jenisKontrol) {

    errors.push(
      'Silakan pilih jenis kontrol: RS atau Puskesmas.'
    );

  }


  if (!data.fasilitasKontrol) {

    errors.push(
      'Nama fasilitas kontrol wajib diisi.'
    );

  }


  if (!data.noAntrean) {

    errors.push(
      'No. Antrean wajib diisi.'
    );

  }


  return errors;

}


/* ============================================================
 * 8. CARI BARIS FOLLOW UP
 * ============================================================
 */

function WIN_FOLLOWUP_findRow(
  episodeId,
  noRM
) {

  const sheet =
    WIN_FOLLOWUP_getSheet();

  const lastRow =
    sheet.getLastRow();

  if (
    lastRow <
    WIN_FOLLOWUP.DATA_START_ROW
  ) {

    return -1;

  }


  const values =
    sheet
      .getRange(
        WIN_FOLLOWUP.DATA_START_ROW,
        1,
        lastRow -
        WIN_FOLLOWUP.DATA_START_ROW +
        1,
        WIN_FOLLOWUP_HEADERS.length
      )
      .getValues();


  const targetEpisode =
    WIN_cleanText(
      episodeId
    );

  const targetRM =
    WIN_cleanText(
      noRM
    );


  for (
    let i = 0;
    i < values.length;
    i++
  ) {

    const rowEpisode =
      WIN_cleanText(
        values[i][1]
      );

    const rowRM =
      WIN_cleanText(
        values[i][2]
      );


    if (
      rowEpisode ===
      targetEpisode &&

      rowRM ===
      targetRM
    ) {

      return (
        WIN_FOLLOWUP.DATA_START_ROW +
        i
      );

    }

  }


  return -1;

}


/* ============================================================
 * 9. AMBIL FOLLOW UP
 * ============================================================
 */

function WIN_FOLLOWUP_get(
  episodeId,
  noRM
) {

  episodeId =
    WIN_cleanText(
      episodeId
    );

  noRM =
    WIN_cleanText(
      noRM
    );


  if (
    !episodeId ||
    !noRM
  ) {

    return {

      success:
        false,

      exists:
        false,

      message:
        'Episode ID dan No. RM wajib diisi.'

    };

  }


  try {

    WIN_FOLLOWUP_ensureHeaders();


    const sheet =
      WIN_FOLLOWUP_getSheet();


    const row =
      WIN_FOLLOWUP_findRow(
        episodeId,
        noRM
      );


    if (
      row === -1
    ) {

      return {

        success:
          true,

        exists:
          false,

        episodeId:
          episodeId,

        noRM:
          noRM,

        data:
          null,

        message:
          'Data follow-up belum tersedia.'

      };

    }


    const values =
      sheet
        .getRange(
          row,
          1,
          1,
          WIN_FOLLOWUP_HEADERS.length
        )
        .getValues()[0];


    const data = {

      timestamp:
        values[0],

      episodeId:
        values[1],

      noRM:
        values[2],

      namaIbu:
        values[3],

      jenisKontrol:
        values[4],

      fasilitasKontrol:
        values[5],

      noAntrean:
        values[6],

      status:
        values[7],

      createdAt:
        values[8],

      updatedAt:
        values[9]

    };


    return {

      success:
        true,

      exists:
        true,

      episodeId:
        episodeId,

      noRM:
        noRM,

      data:
        data,

      message:
        'Data follow-up berhasil ditemukan.'

    };

  }

  catch (error) {

    return {

      success:
        false,

      exists:
        false,

      message:
        error.message

    };

  }

}


/* ============================================================
 * 10. SIMPAN FOLLOW UP
 * ============================================================
 */

function WIN_FOLLOWUP_save(
  data
) {

  try {

    WIN_FOLLOWUP_ensureHeaders();


    data =
      WIN_FOLLOWUP_normalizeData(
        data
      );


    const errors =
      WIN_FOLLOWUP_validateData(
        data
      );


    if (
      errors.length > 0
    ) {

      return {

        success:
          false,

        message:
          errors.join('\n'),

        errors:
          errors

      };

    }


    const sheet =
      WIN_FOLLOWUP_getSheet();


    const now =
      new Date();


    const existingRow =
      WIN_FOLLOWUP_findRow(
        data.episodeId,
        data.noRM
      );


    /* --------------------------------------------------------
     * UPDATE DATA LAMA
     * --------------------------------------------------------
     */

    if (
      existingRow !== -1
    ) {

      const oldValues =
        sheet
          .getRange(
            existingRow,
            1,
            1,
            WIN_FOLLOWUP_HEADERS.length
          )
          .getValues()[0];


      const createdAt =
        oldValues[8] ||
        now;


      const rowData = [

        now,

        data.episodeId,

        data.noRM,

        data.namaIbu,

        data.jenisKontrol,

        data.fasilitasKontrol,

        data.noAntrean,

        WIN_FOLLOWUP.STATUS_SELESAI,

        createdAt,

        now

      ];


      sheet
        .getRange(
          existingRow,
          1,
          1,
          rowData.length
        )
        .setValues([
          rowData
        ]);


      return {

        success:
          true,

        action:
          'UPDATE',

        row:
          existingRow,

        episodeId:
          data.episodeId,

        noRM:
          data.noRM,

        data: {

          episodeId:
            data.episodeId,

          noRM:
            data.noRM,

          namaIbu:
            data.namaIbu,

          jenisKontrol:
            data.jenisKontrol,

          fasilitasKontrol:
            data.fasilitasKontrol,

          noAntrean:
            data.noAntrean,

          status:
            WIN_FOLLOWUP.STATUS_SELESAI

        },

        message:
          'Data follow-up berhasil diperbarui.'

      };

    }


    /* --------------------------------------------------------
     * INSERT DATA BARU
     * --------------------------------------------------------
     */

    const rowData = [

      now,

      data.episodeId,

      data.noRM,

      data.namaIbu,

      data.jenisKontrol,

      data.fasilitasKontrol,

      data.noAntrean,

      WIN_FOLLOWUP.STATUS_SELESAI,

      now,

      now

    ];


    sheet
      .appendRow(
        rowData
      );


    const newRow =
      sheet.getLastRow();


    return {

      success:
        true,

      action:
        'INSERT',

      row:
        newRow,

      episodeId:
        data.episodeId,

      noRM:
        data.noRM,

      data: {

        episodeId:
          data.episodeId,

        noRM:
          data.noRM,

        namaIbu:
          data.namaIbu,

        jenisKontrol:
          data.jenisKontrol,

        fasilitasKontrol:
          data.fasilitasKontrol,

        noAntrean:
          data.noAntrean,

        status:
          WIN_FOLLOWUP.STATUS_SELESAI

      },

      message:
        'Data follow-up berhasil disimpan.'

    };

  }

  catch (error) {

    return {

      success:
        false,

      message:
        'Gagal menyimpan follow-up: ' +
        error.message

    };

  }

}


/* ============================================================
 * 11. CEK STATUS FOLLOW UP
 * ============================================================
 */

function WIN_FOLLOWUP_getStatus(
  episodeId,
  noRM
) {

  const result =
    WIN_FOLLOWUP_get(
      episodeId,
      noRM
    );


  if (
    !result.success
  ) {

    return result;

  }


  /*
   * DATA BELUM ADA
   */

  if (
    !result.exists ||
    !result.data
  ) {

    return {

      success:
        true,

      complete:
        false,

      status:
        WIN_FOLLOWUP.STATUS_DRAFT,

      episodeId:
        episodeId,

      noRM:
        noRM,

      data:
        null,

      message:
        'Follow-up belum diisi.'

    };

  }


  const data =
    result.data;


  /*
   * FOLLOW UP DIANGGAP LENGKAP JIKA:
   *
   * 1. STATUS = SELESAI
   * 2. JENIS KONTROL ADA
   * 3. FASILITAS ADA
   * 4. NO ANTREAN ADA
   */

  const complete =

    data.status ===
      WIN_FOLLOWUP.STATUS_SELESAI &&

    !!data.jenisKontrol &&

    !!data.fasilitasKontrol &&

    !!data.noAntrean;


  return {

    success:
      true,

    complete:
      complete,

    status:
      data.status ||
      WIN_FOLLOWUP.STATUS_DRAFT,

    episodeId:
      episodeId,

    noRM:
      noRM,

    data:
      data,

    message:
      complete
        ? 'Follow-up sudah lengkap.'
        : 'Follow-up belum lengkap.'

  };

}


/* ============================================================
 * 12. DASHBOARD FOLLOW UP
 * ============================================================
 *
 * FUNGSI INI KHUSUS UNTUK:
 *
 * WIN_NurseDashboard.html
 *
 * Input:
 *   episodeId
 *   noRM
 *
 * Output:
 *
 * {
 *   success,
 *   exists,
 *   episodeId,
 *   noRM,
 *   complete,
 *   status,
 *   followUp,
 *   siapSertifikat,
 *   message
 * }
 *
 * ============================================================
 */

function WIN_FOLLOWUP_getDashboardData(
  episodeId,
  noRM
) {

  Logger.log(
    '======================================'
  );

  Logger.log(
    'WIN_FOLLOWUP_getDashboardData'
  );

  Logger.log(
    'episodeId = ' +
    episodeId
  );

  Logger.log(
    'noRM = ' +
    noRM
  );


  try {

    /*
     * NORMALISASI PARAMETER
     */

    episodeId =
      WIN_cleanText(
        episodeId
      );

    noRM =
      WIN_cleanText(
        noRM
      );


    /*
     * VALIDASI
     */

    if (
      !episodeId ||
      !noRM
    ) {

      const invalidResult = {

        success:
          false,

        exists:
          false,

        episodeId:
          episodeId,

        noRM:
          noRM,

        complete:
          false,

        status:
          WIN_FOLLOWUP.STATUS_DRAFT,

        followUp:
          null,

        siapSertifikat:
          false,

        message:
          'Episode ID dan No. RM wajib diisi.'

      };


      Logger.log(
        JSON.stringify(
          invalidResult,
          null,
          2
        )
      );


      return invalidResult;

    }


    /*
     * AMBIL STATUS FOLLOW UP
     */

    const result =
      WIN_FOLLOWUP_getStatus(
        episodeId,
        noRM
      );


    /*
     * ERROR DARI MODULE
     */

    if (
      !result.success
    ) {

      const errorResult = {

        success:
          false,

        exists:
          false,

        episodeId:
          episodeId,

        noRM:
          noRM,

        complete:
          false,

        status:
          WIN_FOLLOWUP.STATUS_DRAFT,

        followUp:
          null,

        siapSertifikat:
          false,

        message:
          result.message ||
          'Gagal mengambil data follow-up.'

      };


      Logger.log(
        JSON.stringify(
          errorResult,
          null,
          2
        )
      );


      return errorResult;

    }


    /*
     * DATA BERHASIL DIBACA
     */

    const dashboardResult = {

      success:
        true,

      exists:
        !!result.data,

      episodeId:
        episodeId,

      noRM:
        noRM,

      complete:
        result.complete === true,

      status:
        result.status ||
        WIN_FOLLOWUP.STATUS_DRAFT,

      followUp:
        result.data ||
        null,

      siapSertifikat:
        result.complete === true,

      message:
        result.message ||
        'Data follow-up berhasil diambil.'

    };


    Logger.log(
      JSON.stringify(
        dashboardResult,
        null,
        2
      )
    );


    Logger.log(
      '======================================'
    );


    return dashboardResult;

  }

  catch (error) {

    Logger.log(
      'ERROR WIN_FOLLOWUP_getDashboardData: ' +
      error.message
    );


    const errorResult = {

      success:
        false,

      exists:
        false,

      episodeId:
        episodeId,

      noRM:
        noRM,

      complete:
        false,

      status:
        WIN_FOLLOWUP.STATUS_DRAFT,

      followUp:
        null,

      siapSertifikat:
        false,

      message:
        error.message

    };


    Logger.log(
      JSON.stringify(
        errorResult,
        null,
        2
      )
    );


    Logger.log(
      '======================================'
    );


    return errorResult;

  }

}


/* ============================================================
 * 13. HAPUS FOLLOW UP
 * ============================================================
 *
 * Untuk kebutuhan admin/perawat.
 *
 * Tidak dipanggil dari halaman ibu.
 *
 * ============================================================
 */

function WIN_FOLLOWUP_delete(
  episodeId,
  noRM
) {

  episodeId =
    WIN_cleanText(
      episodeId
    );

  noRM =
    WIN_cleanText(
      noRM
    );


  if (
    !episodeId ||
    !noRM
  ) {

    return {

      success:
        false,

      message:
        'Episode ID dan No. RM wajib diisi.'

    };

  }


  try {

    const row =
      WIN_FOLLOWUP_findRow(
        episodeId,
        noRM
      );


    if (
      row === -1
    ) {

      return {

        success:
          false,

        message:
          'Data follow-up tidak ditemukan.'

      };

    }


    const sheet =
      WIN_FOLLOWUP_getSheet();


    sheet.deleteRow(
      row
    );


    return {

      success:
        true,

      message:
        'Data follow-up berhasil dihapus.'

    };

  }

  catch (error) {

    return {

      success:
        false,

      message:
        error.message

    };

  }

}


/* ============================================================
 * 14. TEST SHEET
 * ============================================================
 */

function WIN_FOLLOWUP_testSheet() {

  try {

    WIN_FOLLOWUP_ensureHeaders();


    const sheet =
      WIN_FOLLOWUP_getSheet();


    Logger.log(
      '======================================'
    );


    Logger.log(
      'WIN FOLLOW UP'
    );


    Logger.log(
      '======================================'
    );


    Logger.log(
      'Sheet: ' +
      sheet.getName()
    );


    Logger.log(
      'Last Row: ' +
      sheet.getLastRow()
    );


    Logger.log(
      'Last Column: ' +
      sheet.getLastColumn()
    );


    Logger.log(
      'STATUS: OK'
    );


    Logger.log(
      '======================================'
    );


    return {

      success:
        true,

      sheet:
        sheet.getName(),

      lastRow:
        sheet.getLastRow(),

      lastColumn:
        sheet.getLastColumn(),

      message:
        'WIN FOLLOW UP siap digunakan.'

    };

  }

  catch (error) {

    Logger.log(
      'ERROR: ' +
      error.message
    );


    return {

      success:
        false,

      message:
        error.message

    };

  }

}


/* ============================================================
 * 15. TEST SAVE
 * ============================================================
 *
 * HANYA UNTUK TESTING MANUAL
 *
 * Akan membuat / memperbarui:
 *
 * TEST-WIN-001
 * TEST-RM-001
 *
 * ============================================================
 */

function WIN_FOLLOWUP_testSave() {

  const data = {

    episodeId:
      'TEST-WIN-001',

    noRM:
      'TEST-RM-001',

    namaIbu:
      'TEST IBU',

    jenisKontrol:
      'RS',

    fasilitasKontrol:
      'Rumah Sakit Contoh',

    noAntrean:
      'A001'

  };


  const result =
    WIN_FOLLOWUP_save(
      data
    );


  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  return result;

}


/* ============================================================
 * 16. TEST GET
 * ============================================================
 */

function WIN_FOLLOWUP_testGet() {

  const episodeId =
    'TEST-WIN-001';

  const noRM =
    'TEST-RM-001';


  const result =
    WIN_FOLLOWUP_get(
      episodeId,
      noRM
    );


  Logger.log(
    '======================================'
  );


  Logger.log(
    'WIN FOLLOW UP TEST GET'
  );


  Logger.log(
    '======================================'
  );


  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  Logger.log(
    '======================================'
  );


  return result;

}


/* ============================================================
 * 17. TEST DASHBOARD DATA
 * ============================================================
 */

function WIN_FOLLOWUP_testDashboardData() {

  const episodeId =
    'TEST-WIN-001';

  const noRM =
    'TEST-RM-001';


  const result =
    WIN_FOLLOWUP_getDashboardData(
      episodeId,
      noRM
    );


  Logger.log(
    '======================================'
  );


  Logger.log(
    'WIN FOLLOW UP TEST DASHBOARD DATA'
  );


  Logger.log(
    '======================================'
  );


  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  Logger.log(
    '======================================'
  );


  return result;

}


/* ============================================================
 * 18. TEST NURSE FOLLOW UP
 * ============================================================
 *
 * TEST KHUSUS UNTUK:
 *
 * WIN_NurseDashboard.html
 *
 * ============================================================
 */

function WIN_TEST_NURSE_FOLLOWUP() {

  const episodeId =
    'TEST-WIN-001';

  const noRM =
    'TEST-RM-001';


  Logger.log(
    '======================================'
  );


  Logger.log(
    'WIN NURSE FOLLOW UP TEST'
  );


  Logger.log(
    'episodeId = ' +
    episodeId
  );


  Logger.log(
    'noRM = ' +
    noRM
  );


  Logger.log(
    '======================================'
  );


  const result =
    WIN_FOLLOWUP_getDashboardData(
      episodeId,
      noRM
    );


  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  Logger.log(
    '======================================'
  );


  return result;

}


/* ============================================================
 * 19. TEST FOLLOW UP GET DASHBOARD
 * ============================================================
 *
 * Nama fungsi ini sengaja dibuat berbeda dari fungsi utama
 * agar tidak terjadi duplikasi.
 *
 * ============================================================
 */

function WIN_TEST_FOLLOWUP_GET_DASHBOARD() {

  const episodeId =
    'TEST-WIN-001';

  const noRM =
    'TEST-RM-001';


  Logger.log(
    '======================================'
  );


  Logger.log(
    'WIN TEST FOLLOWUP GET DASHBOARD'
  );


  Logger.log(
    'episodeId = ' +
    episodeId
  );


  Logger.log(
    'noRM = ' +
    noRM
  );


  Logger.log(
    '======================================'
  );


  const result =
    WIN_FOLLOWUP_getDashboardData(
      episodeId,
      noRM
    );


  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  Logger.log(
    '======================================'
  );


  return result;

}
