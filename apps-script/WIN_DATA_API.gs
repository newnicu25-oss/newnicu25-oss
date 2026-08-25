/**
 * ============================================================
 * WIN_DATA_API.gs
 * WIN — Discharge Planning Perinatologi
 *
 * MODULE:
 * DATA API / PREFILL DATA IBU & BAYI
 *
 * VERSION:
 * 2.0.3 FINAL
 *
 * ============================================================
 *
 * SUMBER UTAMA:
 *
 * NICU_LEVEL_2
 *
 * HEADER ROW     : 3
 * DATA START ROW : 4
 *
 * SUMBER:
 *
 * gxpx_uk
 *   -> PARITAS
 *
 * uk_ballard
 *   -> USIA GESTASI
 *
 * ∑ TOTAL HARI RAWAT
 *   -> LAMA PERAWATAN
 *
 * ============================================================
 */


/* ============================================================
 * 1. KONFIGURASI
 * ============================================================
 */

const WIN_DATA_API_CONFIG = {

  SOURCE_SHEET:
    'NICU_LEVEL_2',

  HEADER_ROW:
    3,

  DATA_START_ROW:
    4,

  PARITAS_HEADER:
    'gxpx_uk',

  GESTASI_HEADER:
    'uk_ballard',

  TOTAL_RAWAT_HEADER:
    '∑ TOTAL HARI RAWAT'

};


/* ============================================================
 * 2. NORMALISASI HEADER
 * ============================================================
 */

function WIN_DATA_API_normalizeHeader(
  value
) {

  return String(
    value || ''
  )
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

}


/* ============================================================
 * 3. AMBIL HEADER
 * ============================================================
 */

function WIN_DATA_API_getHeaders(
  sheet
) {

  const lastColumn =
    sheet.getLastColumn();


  if (
    lastColumn < 1
  ) {

    return [];

  }


  return sheet
    .getRange(
      WIN_DATA_API_CONFIG.HEADER_ROW,
      1,
      1,
      lastColumn
    )
    .getValues()[0];

}


/* ============================================================
 * 4. CARI KOLOM BERDASARKAN HEADER
 * ============================================================
 */

function WIN_DATA_API_findColumn(
  sheet,
  names
) {

  if (
    !Array.isArray(names)
  ) {

    names = [
      names
    ];

  }


  const headers =
    WIN_DATA_API_getHeaders(
      sheet
    );


  for (
    let i = 0;
    i < names.length;
    i++
  ) {

    const target =
      WIN_DATA_API_normalizeHeader(
        names[i]
      );


    for (
      let j = 0;
      j < headers.length;
      j++
    ) {

      const current =
        WIN_DATA_API_normalizeHeader(
          headers[j]
        );


      if (
        current === target
      ) {

        return j + 1;

      }

    }

  }


  return -1;

}


/* ============================================================
 * 5. CARI KOLOM EXACT HEADER RAWAT
 * ============================================================
 */

function WIN_DATA_API_findTotalRawatColumn(
  sheet
) {

  const headers =
    WIN_DATA_API_getHeaders(
      sheet
    );


  const target =
    WIN_DATA_API_normalizeHeader(
      WIN_DATA_API_CONFIG.TOTAL_RAWAT_HEADER
    );


  for (
    let i = 0;
    i < headers.length;
    i++
  ) {

    const current =
      WIN_DATA_API_normalizeHeader(
        headers[i]
      );


    if (
      current === target
    ) {

      return i + 1;

    }

  }


  return -1;

}


/* ============================================================
 * 6. AMBIL VALUE BERDASARKAN HEADER
 * ============================================================
 */

function WIN_DATA_API_getValueByHeaders(
  sheet,
  row,
  names
) {

  if (
    !Array.isArray(names)
  ) {

    names = [
      names
    ];

  }


  const headers =
    WIN_DATA_API_getHeaders(
      sheet
    );


  const values =
    sheet
      .getRange(
        row,
        1,
        1,
        sheet.getLastColumn()
      )
      .getValues()[0];


  for (
    let i = 0;
    i < names.length;
    i++
  ) {

    const target =
      WIN_DATA_API_normalizeHeader(
        names[i]
      );


    for (
      let j = 0;
      j < headers.length;
      j++
    ) {

      const current =
        WIN_DATA_API_normalizeHeader(
          headers[j]
        );


      if (
        current === target
      ) {

        return values[j];

      }

    }

  }


  return '';

}


/* ============================================================
 * 7. CARI BARIS BERDASARKAN HEADER + NILAI
 * ============================================================
 */

function WIN_DATA_API_findRow(
  sheet,
  headerNames,
  targetValue
) {

  if (!sheet) {

    return -1;

  }


  targetValue =
    String(
      targetValue || ''
    )
      .trim()
      .toUpperCase();


  if (!targetValue) {

    return -1;

  }


  const targetColumn =
    WIN_DATA_API_findColumn(
      sheet,
      headerNames
    );


  if (
    targetColumn < 1
  ) {

    return -1;

  }


  const lastRow =
    sheet.getLastRow();


  if (
    lastRow <
    WIN_DATA_API_CONFIG.DATA_START_ROW
  ) {

    return -1;

  }


  const values =
    sheet
      .getRange(
        WIN_DATA_API_CONFIG.DATA_START_ROW,
        targetColumn,
        lastRow -
          WIN_DATA_API_CONFIG.DATA_START_ROW +
          1,
        1
      )
      .getValues();


  for (
    let i = 0;
    i < values.length;
    i++
  ) {

    const current =
      String(
        values[i][0] || ''
      )
        .trim()
        .toUpperCase();


    if (
      current ===
      targetValue
    ) {

      return (
        WIN_DATA_API_CONFIG.DATA_START_ROW +
        i
      );

    }

  }


  return -1;

}


/* ============================================================
 * 8. AMBIL DATA NICU_LEVEL_2
 * ============================================================
 */

function WIN_DATA_API_getNICU2Data(
  idBayi,
  noRM
) {

  const ss =
    SpreadsheetApp
      .getActiveSpreadsheet();


  const sheet =
    ss.getSheetByName(
      WIN_DATA_API_CONFIG.SOURCE_SHEET
    );


  if (!sheet) {

    throw new Error(
      'Sheet "' +
      WIN_DATA_API_CONFIG.SOURCE_SHEET +
      '" tidak ditemukan.'
    );

  }


  idBayi =
    String(
      idBayi || ''
    )
      .trim();


  noRM =
    String(
      noRM || ''
    )
      .trim();


  let row =
    -1;


  /* ----------------------------------------------------------
     CARI ID BAYI
     ---------------------------------------------------------- */

  if (
    idBayi
  ) {

    row =
      WIN_DATA_API_findRow(

        sheet,

        [
          'ID_BAYI',
          'ID BAYI',
          'id_bayi',
          'kode_bayi',
          'kode bayi'
        ],

        idBayi

      );

  }


  /* ----------------------------------------------------------
     CARI NO RM JIKA ID TIDAK KETEMU
     ---------------------------------------------------------- */

  if (
    row < 1 &&
    noRM
  ) {

    row =
      WIN_DATA_API_findRow(

        sheet,

        [
          'NO_RM',
          'NO RM',
          'no_rm',
          'nomor_rm',
          'nomor rm'
        ],

        noRM

      );

  }


  /* ----------------------------------------------------------
     TIDAK DITEMUKAN
     ---------------------------------------------------------- */

  if (
    row < 1
  ) {

    return null;

  }


  /* ----------------------------------------------------------
     BACA BARIS
     ---------------------------------------------------------- */

  const values =
    sheet
      .getRange(
        row,
        1,
        1,
        sheet.getLastColumn()
      )
      .getValues()[0];


  /* ----------------------------------------------------------
     CARI POSISI TOTAL HARI RAWAT BERDASARKAN HEADER
     ---------------------------------------------------------- */

  const totalRawatColumn =
    WIN_DATA_API_findTotalRawatColumn(
      sheet
    );


  let lamaPerawatan =
    '';


  if (
    totalRawatColumn > 0
  ) {

    lamaPerawatan =
      values[
        totalRawatColumn - 1
      ];

  }


  /* ----------------------------------------------------------
     DATA UTAMA
     ---------------------------------------------------------- */

  const result = {

    row:
      row,


    idBayi:
      WIN_cleanText(
        WIN_DATA_API_getValueByHeaders(
          sheet,
          row,
          [
            'ID_BAYI',
            'ID BAYI',
            'id_bayi',
            'kode_bayi'
          ]
        )
      ),


    noRM:
      WIN_cleanText(
        WIN_DATA_API_getValueByHeaders(
          sheet,
          row,
          [
            'NO_RM',
            'NO RM',
            'no_rm',
            'nomor_rm'
          ]
        )
      ),


    namaBayi:
      WIN_cleanText(
        WIN_DATA_API_getValueByHeaders(
          sheet,
          row,
          [
            'NAMA_BAYI',
            'NAMA BAYI',
            'nama_bayi'
          ]
        )
      ),


    namaIbu:
      WIN_cleanText(
        WIN_DATA_API_getValueByHeaders(
          sheet,
          row,
          [
            'NAMA_IBU',
            'NAMA IBU',
            'nama_ibu'
          ]
        )
      ),


    namaAyah:
      WIN_cleanText(
        WIN_DATA_API_getValueByHeaders(
          sheet,
          row,
          [
            'NAMA_AYAH',
            'NAMA AYAH',
            'nama_ayah'
          ]
        )
      ),


    jenisKelamin:
      WIN_cleanText(
        WIN_DATA_API_getValueByHeaders(
          sheet,
          row,
          [
            'JK',
            'JENIS_KELAMIN',
            'JENIS KELAMIN',
            'jenis_kelamin'
          ]
        )
      ),


    email:
      WIN_cleanText(
        WIN_DATA_API_getValueByHeaders(
          sheet,
          row,
          [
            'EMAIL',
            'email'
          ]
        )
      ),


    telp:
      WIN_cleanText(
        WIN_DATA_API_getValueByHeaders(
          sheet,
          row,
          [
            'TELP',
            'telp',
            'NO_TELP',
            'NO HP',
            'NO_HP',
            'TELEPON'
          ]
        )
      ),


    tanggalLahir:
      WIN_DATA_API_getValueByHeaders(
        sheet,
        row,
        [
          'TGL_LAHIR',
          'TGL LAHIR',
          'tgl_lahir',
          'TANGGAL_LAHIR'
        ]
      ),


    tanggalMRS:
      WIN_DATA_API_getValueByHeaders(
        sheet,
        row,
        [
          'TGL_MRS',
          'TGL MRS',
          'tgl_mrs',
          'TANGGAL_MRS'
        ]
      ),


    diagnosis:
      WIN_cleanText(
        WIN_DATA_API_getValueByHeaders(
          sheet,
          row,
          [
            'DIAGNOSA_PERAWATAN',
            'DIAGNOSA PERAWATAN',
            'diagnosa_perawatan',
            'DIAGNOSA_AWAL',
            'DIAGNOSA AWAL',
            'diagnosa_awal'
          ]
        )
      ),


    /* ========================================================
       PARITAS
       SUMBER: gxpx_uk
       ======================================================== */

    paritas:
      WIN_cleanText(
        WIN_DATA_API_getValueByHeaders(
          sheet,
          row,
          [
            'gxpx_uk',
            'GXPX_UK'
          ]
        )
      ),


    /* ========================================================
       USIA GESTASI
       SUMBER: uk_ballard
       ======================================================== */

    usiaGestasi:
      WIN_cleanText(
        WIN_DATA_API_getValueByHeaders(
          sheet,
          row,
          [
            'uk_ballard',
            'UK_BALLARD'
          ]
        )
      ),


    /* ========================================================
       LAMA PERAWATAN
       SUMBER:
       ∑ TOTAL HARI RAWAT
       ======================================================== */

    lamaPerawatan:
      lamaPerawatan,


    /* --------------------------------------------------------
       INFORMASI KOLOM UNTUK DEBUG
       -------------------------------------------------------- */

    sumberLamaPerawatanKolom:
      totalRawatColumn,

    sumberLamaPerawatanHeader:
      totalRawatColumn > 0
        ? sheet
            .getRange(
              WIN_DATA_API_CONFIG.HEADER_ROW,
              totalRawatColumn
            )
            .getValue()
        : ''

  };


  Logger.log(
    '======================================'
  );

  Logger.log(
    'WIN DATA API PASIEN'
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
 * 9. GET DATA IBU & BAYI
 * ============================================================
 */

function WIN_WEBAPP_getDataIbuBayi(
  episodeId
) {

  episodeId =
    String(
      episodeId || ''
    )
      .trim();


  if (!episodeId) {

    return {

      success:
        false,

      found:
        false,

      message:
        'Episode ID wajib diisi.'

    };

  }


  try {

    const episodeResult =
      WIN_EPISODE_getById(
        episodeId
      );


    if (
      !episodeResult ||
      episodeResult.success !== true
    ) {

      return {

        success:
          false,

        found:
          false,

        message:
          'Episode WIN tidak ditemukan.'

      };

    }


    const episode =
      episodeResult.episode ||
      episodeResult.data ||
      {};


    const existing =
      WIN_DATA_IBU_BAYI_getByEpisode(
        episodeId
      );


    const nicu =
      WIN_DATA_API_getNICU2Data(

        episode.idBayi ||
        episode.ID_BAYI ||
        '',

        episode.noRM ||
        episode.NO_RM ||
        ''

      );


    /* ----------------------------------------------------------
       SUDAH ADA DATA WIN
       ---------------------------------------------------------- */

    if (
      existing &&
      existing.found &&
      existing.data
    ) {

      const data =
        Object.assign(
          {},
          existing.data
        );


      if (
        !data.PARA &&
        nicu &&
        nicu.paritas
      ) {

        data.PARA =
          nicu.paritas;

      }


      if (
        !data.USIA_GESTASI_BAYI &&
        nicu &&
        nicu.usiaGestasi
      ) {

        data.USIA_GESTASI_BAYI =
          nicu.usiaGestasi;

      }


      if (
        (
          data.LAMA_PERAWATAN ===
          undefined
        ) ||
        data.LAMA_PERAWATAN === ''
      ) {

        data.LAMA_PERAWATAN =
          nicu
            ? nicu.lamaPerawatan
            : '';

      }


      return {

        success:
          true,

        found:
          true,

        source:
          'WIN_DATA_IBU_BAYI',

        data:
          data

      };

    }


    /* ----------------------------------------------------------
       DATA BELUM ADA
       → PREFILL
       ---------------------------------------------------------- */

    const data = {

      EPISODE_ID:
        episode.episodeId ||
        episodeId,


      SUBJECT_ID:
        '',


      NO_RM:
        episode.noRM ||
        episode.NO_RM ||
        (
          nicu
            ? nicu.noRM
            : ''
        ),


      NAMA_IBU:
        episode.namaIbu ||
        episode.NAMA_IBU ||
        (
          nicu
            ? nicu.namaIbu
            : ''
        ),


      USIA_IBU:
        '',


      PENDIDIKAN:
        '',


      PEKERJAAN:
        '',


      GRAVIDA:
        '',


      PARA:
        nicu &&
        nicu.paritas
          ? nicu.paritas
          : '',


      ABORTUS:
        '',


      USIA_KEHAMILAN:
        nicu &&
        nicu.usiaGestasi
          ? nicu.usiaGestasi
          : '',


      JENIS_PERSALINAN:
        '',


      TANGGAL_PERSALINAN:
        '',


      DIAGNOSIS_IBU:
        '',


      KONDISI_IBU:
        '',


      BABY_ID:
        episode.idBayi ||
        episode.ID_BAYI ||
        (
          nicu
            ? nicu.idBayi
            : ''
        ),


      NAMA_BAYI:
        episode.namaBayi ||
        episode.NAMA_BAYI ||
        (
          nicu
            ? nicu.namaBayi
            : ''
        ),


      JENIS_KELAMIN_BAYI:
        nicu &&
        nicu.jenisKelamin
          ? nicu.jenisKelamin
          : '',


      TANGGAL_LAHIR_BAYI:
        nicu &&
        nicu.tanggalLahir
          ? nicu.tanggalLahir
          : '',


      JAM_LAHIR_BAYI:
        '',


      USIA_GESTASI_BAYI:
        nicu &&
        nicu.usiaGestasi
          ? nicu.usiaGestasi
          : '',


      BB_LAHIR:
        '',


      PB_LAHIR:
        '',


      APGAR_1:
        '',


      APGAR_5:
        '',


      DIAGNOSIS_BAYI:
        episode.diagnosis ||
        episode.DIAGNOSIS ||
        (
          nicu
            ? nicu.diagnosis
            : ''
        ),


      BB_SAAT_KRS:
        '',


      KONDISI_BAYI:
        '',


      STATUS_ASI:
        '',


      KESIAPAN_PULANG:
        '',


      CATATAN_IBU_BAYI:
        '',


      DIISI_OLEH:
        'PERAWAT',


      LAMA_PERAWATAN:
        nicu &&
        nicu.lamaPerawatan !==
        undefined
          ? nicu.lamaPerawatan
          : ''

    };


    return {

      success:
        true,

      found:
        false,

      source:
        'AUTO_MASTER_REGISTER_NICU2',

      data:
        data,

      message:
        'Data awal berhasil diambil dari NICU_LEVEL_2.'

    };

  }

  catch(error) {

    Logger.log(
      'WIN_WEBAPP_getDataIbuBayi ERROR: ' +
      error.message
    );


    return {

      success:
        false,

      found:
        false,

      message:
        error.message

    };

  }

}


/* ============================================================
 * 10. SIMPAN DATA IBU & BAYI
 * ============================================================
 */

function WIN_WEBAPP_saveDataIbuBayi(
  data
) {

  data =
    data || {};


  try {

    if (
      !data.diisiOleh
    ) {

      data.diisiOleh =
        'PERAWAT';

    }


    return WIN_DATA_IBU_BAYI_save(
      data
    );

  }

  catch(error) {

    return {

      success:
        false,

      message:
        error.message

    };

  }

}


/* ============================================================
 * 11. TEST API
 * ============================================================
 */

function WIN_DATA_API_TEST() {

  const result = {

    success:
      true,

    getData:
      typeof WIN_WEBAPP_getDataIbuBayi ===
      'function',

    saveData:
      typeof WIN_WEBAPP_saveDataIbuBayi ===
      'function',

    getNICU:
      typeof WIN_DATA_API_getNICU2Data ===
      'function',

    source: {

      sheet:
        WIN_DATA_API_CONFIG.SOURCE_SHEET,

      headerRow:
        WIN_DATA_API_CONFIG.HEADER_ROW,

      dataStartRow:
        WIN_DATA_API_CONFIG.DATA_START_ROW,

      paritas:
        'gxpx_uk',

      usiaGestasi:
        'uk_ballard',

      lamaPerawatan:
        '∑ TOTAL HARI RAWAT'

    }

  };


  Logger.log(
    '======================================'
  );

  Logger.log(
    'WIN DATA API TEST'
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
 * 12. TEST PASIEN FATMA
 * ============================================================
 */

function WIN_DATA_API_TEST_FATMA() {

  const result =
    WIN_DATA_API_getNICU2Data(

      'NIC22605200001',

      '923672'

    );


  Logger.log(
    '======================================'
  );

  Logger.log(
    'WIN DATA API TEST PASIEN FATMA'
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
 * 13. TEST HEADER
 * ============================================================
 */

function WIN_DATA_API_TEST_HEADERS() {

  const ss =
    SpreadsheetApp
      .getActiveSpreadsheet();


  const sheet =
    ss.getSheetByName(
      WIN_DATA_API_CONFIG.SOURCE_SHEET
    );


  if (!sheet) {

    throw new Error(
      'Sheet NICU_LEVEL_2 tidak ditemukan.'
    );

  }


  const headers =
    WIN_DATA_API_getHeaders(
      sheet
    );


  const totalRawatColumn =
    WIN_DATA_API_findTotalRawatColumn(
      sheet
    );


  const result = {

    headerRow:
      WIN_DATA_API_CONFIG.HEADER_ROW,

    dataStartRow:
      WIN_DATA_API_CONFIG.DATA_START_ROW,

    kolom18:
      headers[17],

    kolom24:
      headers[23],

    exactTotalRawatColumn:
      totalRawatColumn,

    exactTotalRawatHeader:
      totalRawatColumn > 0
        ? headers[
            totalRawatColumn - 1
          ]
        : ''

  };


  Logger.log(
    '======================================'
  );

  Logger.log(
    'WIN DATA API HEADER TEST'
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
function WIN_TEST_GET_DATA_IBU_BAYI() {

  const episodeId =
    'WIN-20260824122053';

  const result =
    WIN_WEBAPP_getDataIbuBayi(
      episodeId
    );

  Logger.log(
    '======================================'
  );

  Logger.log(
    'TEST GET DATA IBU BAYI'
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
