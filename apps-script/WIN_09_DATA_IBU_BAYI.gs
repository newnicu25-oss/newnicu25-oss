/**
 * ============================================================
 * WIN_09_DATA_IBU_BAYI.gs
 * WIN — Discharge Planning Perinatologi
 *
 * MODULE:
 * DATA IBU & BAYI
 *
 * VERSION:
 * 2.0.0 FINAL
 *
 * FUNGSI:
 * 1. Menyiapkan sheet WIN_DATA_IBU_BAYI
 * 2. Mempertahankan struktur lama
 * 3. Menambahkan field baru yang dibutuhkan WIN
 * 4. Mengambil data berdasarkan Episode ID
 * 5. Menyimpan / memperbarui data
 * 6. Mendukung data otomatis dari NICU_LEVEL_2
 * 7. Menyediakan data penelitian terstruktur
 *
 * ============================================================
 *
 * PRINSIP:
 *
 * DATA OTOMATIS SISTEM
 *      ↓
 * WIN_DATA_IBU_BAYI
 *      ↓
 * DATA YANG BELUM ADA
 *      ↓
 * DILENGKAPI PERAWAT
 *      ↓
 * ASSESSMENT IBU
 *
 * ============================================================
 */


/* ============================================================
 * 1. KONFIGURASI
 * ============================================================
 */

const WIN_DATA_IBU_BAYI = {

  SHEET_NAME:
    'WIN_DATA_IBU_BAYI',


  /*
   * Struktur final.
   *
   * Field lama tetap dipertahankan.
   * Field baru akan ditambahkan otomatis
   * jika belum ada di sheet.
   */

  HEADERS: [

    /* --------------------------------------------------------
       SISTEM
       -------------------------------------------------------- */

    'TIMESTAMP',

    'EPISODE_ID',

    'SUBJECT_ID',

    'NO_RM',


    /* --------------------------------------------------------
       DATA IBU
       -------------------------------------------------------- */

    'NAMA_IBU',

    'NIK_IBU',

    'TANGGAL_LAHIR_IBU',

    'USIA_IBU',

    'PENDIDIKAN',

    'PEKERJAAN',

    'GRAVIDA',

    'PARA',

    'ABORTUS',

    'PARITAS_RAW',

    'PENGALAMAN_MERAWAT_BAYI',

    'PENGALAMAN_MENYUSUI',

    'DUKUNGAN_KELUARGA',

    'USIA_KEHAMILAN',

    'JENIS_PERSALINAN',

    'TANGGAL_PERSALINAN',

    'DIAGNOSIS_IBU',

    'KONDISI_IBU',

    'KEBUTUHAN_EDUKASI_IBU',


    /* --------------------------------------------------------
       DATA BAYI
       -------------------------------------------------------- */

    'BABY_ID',

    'NAMA_BAYI',

    'JENIS_KELAMIN_BAYI',

    'TANGGAL_LAHIR_BAYI',

    'JAM_LAHIR_BAYI',

    'USIA_GESTASI_BAYI',

    'BB_LAHIR',

    'PB_LAHIR',

    'LINGKAR_KEPALA',

    'APGAR_1',

    'APGAR_5',

    'BB_SAAT_KRS',

    'LAMA_PERAWATAN',

    'DIAGNOSIS_BAYI',

    'KONDISI_BAYI',

    'KONDISI_KHUSUS',

    'STATUS_ASI',

    'RENCANA_NUTRISI_PULANG',

    'KEBUTUHAN_EDUKASI_BAYI',


    /* --------------------------------------------------------
       DISCHARGE PLANNING
       -------------------------------------------------------- */

    'KESIAPAN_PULANG',

    'TOPIK_PRIORITAS',

    'CATATAN_IBU_BAYI',

    'DIISI_OLEH',

    'UPDATED_AT'

  ]

};


/* ============================================================
 * 2. NORMALISASI HEADER
 * ============================================================
 */

function WIN_DATA_IBU_BAYI_normalizeHeader(
  value
) {

  return String(
    value || ''
  )
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');

}


/* ============================================================
 * 3. MEMBUAT / MENGAMBIL SHEET
 * ============================================================
 */

function WIN_DATA_IBU_BAYI_getSheet() {

  const ss =
    SpreadsheetApp
      .getActiveSpreadsheet();


  let sheet =
    ss.getSheetByName(
      WIN_DATA_IBU_BAYI.SHEET_NAME
    );


  /*
   * Jika sheet belum ada,
   * buat baru.
   */

  if (!sheet) {

    sheet =
      ss.insertSheet(
        WIN_DATA_IBU_BAYI.SHEET_NAME
      );

  }


  /*
   * Jika sheet benar-benar kosong,
   * buat seluruh header.
   */

  if (
    sheet.getLastRow() === 0
  ) {

    sheet
      .getRange(
        1,
        1,
        1,
        WIN_DATA_IBU_BAYI.HEADERS.length
      )
      .setValues([
        WIN_DATA_IBU_BAYI.HEADERS
      ]);


    sheet
      .getRange(
        1,
        1,
        1,
        WIN_DATA_IBU_BAYI.HEADERS.length
      )
      .setFontWeight(
        'bold'
      );


    sheet.setFrozenRows(
      1
    );


    return sheet;

  }


  /*
   * Sheet sudah ada.
   *
   * Jangan overwrite header lama.
   * Cari field yang belum ada.
   * Jika belum ada → tambahkan di kanan.
   */

  WIN_DATA_IBU_BAYI_ensureHeaders(
    sheet
  );


  return sheet;

}


/* ============================================================
 * 4. MEMASTIKAN HEADER LENGKAP
 * ============================================================
 */

function WIN_DATA_IBU_BAYI_ensureHeaders(
  sheet
) {

  if (!sheet) {

    throw new Error(
      'Sheet WIN_DATA_IBU_BAYI tidak ditemukan.'
    );

  }


  const lastColumn =
    Math.max(
      sheet.getLastColumn(),
      1
    );


  const currentHeaders =
    sheet
      .getRange(
        1,
        1,
        1,
        lastColumn
      )
      .getValues()[0];


  const existing =
    {};


  currentHeaders.forEach(
    function(header, index) {

      const normalized =
        WIN_DATA_IBU_BAYI_normalizeHeader(
          header
        );


      if (
        normalized
      ) {

        existing[
          normalized
        ] =
          index + 1;

      }

    }
  );


  let nextColumn =
    Math.max(
      sheet.getLastColumn() + 1,
      1
    );


  const newHeaders =
    [];


  WIN_DATA_IBU_BAYI.HEADERS
    .forEach(
      function(header) {

        const normalized =
          WIN_DATA_IBU_BAYI_normalizeHeader(
            header
          );


        if (
          !existing[
            normalized
          ]
        ) {

          newHeaders.push(
            header
          );

          existing[
            normalized
          ] =
            nextColumn;

          nextColumn++;

        }

      }
    );


  if (
    newHeaders.length > 0
  ) {

    const startColumn =
      sheet.getLastColumn() + 1;


    sheet
      .getRange(
        1,
        startColumn,
        1,
        newHeaders.length
      )
      .setValues([
        newHeaders
      ]);


    sheet
      .getRange(
        1,
        startColumn,
        1,
        newHeaders.length
      )
      .setFontWeight(
        'bold'
      );

  }


  sheet.setFrozenRows(
    1
  );

}


/* ============================================================
 * 5. MENGAMBIL NOMOR KOLOM
 * ============================================================
 */

function WIN_DATA_IBU_BAYI_findColumn(
  sheet,
  headerName
) {

  const target =
    WIN_DATA_IBU_BAYI_normalizeHeader(
      headerName
    );


  const headers =
    sheet
      .getRange(
        1,
        1,
        1,
        sheet.getLastColumn()
      )
      .getValues()[0];


  for (
    let i = 0;
    i < headers.length;
    i++
  ) {

    const current =
      WIN_DATA_IBU_BAYI_normalizeHeader(
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
 * 6. MEMBACA BARIS MENJADI OBJECT
 * ============================================================
 */

function WIN_DATA_IBU_BAYI_rowToObject(
  headers,
  row
) {

  const data =
    {};


  headers.forEach(
    function(header, index) {

      if (
        header
      ) {

        data[
          String(
            header
          ).trim()
        ] =
          row[index];

      }

    }
  );


  return data;

}


/* ============================================================
 * 7. MENGAMBIL DATA BERDASARKAN EPISODE
 * ============================================================
 */

function WIN_DATA_IBU_BAYI_getByEpisode(
  episodeId
) {

  episodeId =
    String(
      episodeId || ''
    ).trim();


  if (
    !episodeId
  ) {

    return {

      success:
        false,

      found:
        false,

      data:
        null,

      message:
        'Episode ID wajib diisi.'

    };

  }


  const sheet =
    WIN_DATA_IBU_BAYI_getSheet();


  const values =
    sheet
      .getDataRange()
      .getValues();


  if (
    values.length <= 1
  ) {

    return {

      success:
        true,

      found:
        false,

      data:
        null

    };

  }


  const headers =
    values[0];


  const episodeIndex =
    headers.indexOf(
      'EPISODE_ID'
    );


  if (
    episodeIndex === -1
  ) {

    return {

      success:
        false,

      found:
        false,

      data:
        null,

      message:
        'Kolom EPISODE_ID tidak ditemukan.'

    };

  }


  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    const currentEpisode =
      String(
        values[i][episodeIndex] || ''
      )
        .trim();


    if (
      currentEpisode ===
      episodeId
    ) {

      const data =
        WIN_DATA_IBU_BAYI_rowToObject(
          headers,
          values[i]
        );


      return {

        success:
          true,

        found:
          true,

        row:
          i + 1,

        data:
          data

      };

    }

  }


  return {

    success:
      true,

    found:
      false,

    data:
      null

  };

}


/* ============================================================
 * 8. MENCARI BARIS EPISODE
 * ============================================================
 */

function WIN_DATA_IBU_BAYI_findRow(
  sheet,
  episodeId
) {

  const episodeColumn =
    WIN_DATA_IBU_BAYI_findColumn(
      sheet,
      'EPISODE_ID'
    );


  if (
    episodeColumn < 1
  ) {

    return -1;

  }


  const lastRow =
    sheet.getLastRow();


  if (
    lastRow < 2
  ) {

    return -1;

  }


  const values =
    sheet
      .getRange(
        2,
        episodeColumn,
        lastRow - 1,
        1
      )
      .getValues();


  const target =
    String(
      episodeId || ''
    )
      .trim();


  for (
    let i = 0;
    i < values.length;
    i++
  ) {

    const current =
      String(
        values[i][0] || ''
      )
        .trim();


    if (
      current ===
      target
    ) {

      return i + 2;

    }

  }


  return -1;

}


/* ============================================================
 * 9. SAVE / UPDATE DATA
 * ============================================================
 */

function WIN_DATA_IBU_BAYI_save(
  data
) {

  data =
    data || {};


  const episodeId =
    String(
      data.episodeId ||
      data.EPISODE_ID ||
      ''
    )
      .trim();


  const noRM =
    String(
      data.noRM ||
      data.NO_RM ||
      ''
    )
      .trim();


  const namaIbu =
    String(
      data.namaIbu ||
      data.NAMA_IBU ||
      ''
    )
      .trim();


  if (
    !episodeId
  ) {

    return {

      success:
        false,

      message:
        'Episode ID wajib diisi.'

    };

  }


  if (
    !noRM
  ) {

    return {

      success:
        false,

      message:
        'No. RM wajib diisi.'

    };

  }


  if (
    !namaIbu
  ) {

    return {

      success:
        false,

      message:
        'Nama Ibu wajib diisi.'

    };

  }


  const sheet =
    WIN_DATA_IBU_BAYI_getSheet();


  const headers =
    sheet
      .getRange(
        1,
        1,
        1,
        sheet.getLastColumn()
      )
      .getValues()[0];


  const existing =
    WIN_DATA_IBU_BAYI_getByEpisode(
      episodeId
    );


  const now =
    new Date();


  /*
   * Ambil timestamp lama bila update.
   */

  let timestamp =
    now;


  if (
    existing &&
    existing.found &&
    existing.data &&
    existing.data.TIMESTAMP
  ) {

    timestamp =
      existing.data.TIMESTAMP;

  }


  /* ==========================================================
     OBJECT DATA
     ========================================================== */

  const rowObject = {

    TIMESTAMP:
      timestamp,


    EPISODE_ID:
      episodeId,


    SUBJECT_ID:
      data.subjectId ||
      data.SUBJECT_ID ||
      '',


    NO_RM:
      noRM,


    /* --------------------------------------------------------
       DATA IBU
       -------------------------------------------------------- */

    NAMA_IBU:
      namaIbu,


    NIK_IBU:
      data.nik ||
      data.NIK_IBU ||
      '',


    TANGGAL_LAHIR_IBU:
      data.tanggalLahirIbu ||
      data.TANGGAL_LAHIR_IBU ||
      '',


    USIA_IBU:
      data.usiaIbu ||
      data.USIA_IBU ||
      '',


    PENDIDIKAN:
      data.pendidikan ||
      data.PENDIDIKAN ||
      '',


    PEKERJAAN:
      data.pekerjaan ||
      data.PEKERJAAN ||
      '',


    GRAVIDA:
      data.gravida ||
      data.GRAVIDA ||
      '',


    PARA:
      data.para ||
      data.PARA ||
      '',


    ABORTUS:
      data.abortus ||
      data.ABORTUS ||
      '',


    PARITAS_RAW:
      data.paritasRaw ||
      data.PARITAS_RAW ||
      '',


    PENGALAMAN_MERAWAT_BAYI:
      data.pengalamanMerawatBayi ||
      data.PENGALAMAN_MERAWAT_BAYI ||
      '',


    PENGALAMAN_MENYUSUI:
      data.pengalamanMenyusui ||
      data.PENGALAMAN_MENYUSUI ||
      '',


    DUKUNGAN_KELUARGA:
      data.dukunganKeluarga ||
      data.DUKUNGAN_KELUARGA ||
      '',


    USIA_KEHAMILAN:
      data.usiaKehamilan ||
      data.USIA_KEHAMILAN ||
      '',


    JENIS_PERSALINAN:
      data.jenisPersalinan ||
      data.JENIS_PERSALINAN ||
      '',


    TANGGAL_PERSALINAN:
      data.tanggalPersalinan ||
      data.TANGGAL_PERSALINAN ||
      '',


    DIAGNOSIS_IBU:
      data.diagnosisIbu ||
      data.DIAGNOSIS_IBU ||
      data.diagnosaIbu ||
      '',


    KONDISI_IBU:
      data.kondisiIbu ||
      data.KONDISI_IBU ||
      '',


    KEBUTUHAN_EDUKASI_IBU:
      data.kebutuhanIbu ||
      data.KEBUTUHAN_EDUKASI_IBU ||
      '',


    /* --------------------------------------------------------
       DATA BAYI
       -------------------------------------------------------- */

    BABY_ID:
      data.babyId ||
      data.BABY_ID ||
      '',


    NAMA_BAYI:
      data.namaBayi ||
      data.NAMA_BAYI ||
      '',


    JENIS_KELAMIN_BAYI:
      data.jenisKelaminBayi ||
      data.JENIS_KELAMIN_BAYI ||
      data.jenisKelamin ||
      data.JENIS_KELAMIN ||
      '',


    TANGGAL_LAHIR_BAYI:
      data.tanggalLahirBayi ||
      data.TANGGAL_LAHIR_BAYI ||
      '',


    JAM_LAHIR_BAYI:
      data.jamLahirBayi ||
      data.JAM_LAHIR_BAYI ||
      data.jamLahir ||
      '',


    USIA_GESTASI_BAYI:
      data.usiaGestasiBayi ||
      data.USIA_GESTASI_BAYI ||
      data.usiaGestasi ||
      '',


    BB_LAHIR:
      data.bbLahir ||
      data.BB_LAHIR ||
      data.beratLahir ||
      '',


    PB_LAHIR:
      data.pbLahir ||
      data.PB_LAHIR ||
      data.panjangBadan ||
      '',


    LINGKAR_KEPALA:
      data.lingkarKepala ||
      data.LINGKAR_KEPALA ||
      '',


    APGAR_1:
      data.apgar1 ||
      data.APGAR_1 ||
      '',


    APGAR_5:
      data.apgar5 ||
      data.APGAR_5 ||
      '',


    BB_SAAT_KRS:
      data.bbSaatKrs ||
      data.BB_SAAT_KRS ||
      '',


    LAMA_PERAWATAN:
      data.lamaPerawatan ||
      data.LAMA_PERAWATAN ||
      '',


    DIAGNOSIS_BAYI:
      data.diagnosisBayi ||
      data.DIAGNOSIS_BAYI ||
      data.diagnosaBayi ||
      '',


    KONDISI_BAYI:
      data.kondisiBayi ||
      data.KONDISI_BAYI ||
      '',


    KONDISI_KHUSUS:
      data.kondisiKhusus ||
      data.KONDISI_KHUSUS ||
      '',


    STATUS_ASI:
      data.statusAsi ||
      data.STATUS_ASI ||
      data.statusASI ||
      '',


    RENCANA_NUTRISI_PULANG:
      data.rencanaNutrisiPulang ||
      data.RENCANA_NUTRISI_PULANG ||
      '',


    KEBUTUHAN_EDUKASI_BAYI:
      data.kebutuhanBayi ||
      data.KEBUTUHAN_EDUKASI_BAYI ||
      '',


    /* --------------------------------------------------------
       DISCHARGE
       -------------------------------------------------------- */

    KESIAPAN_PULANG:
      data.kesiapanPulang ||
      data.KESIAPAN_PULANG ||
      '',


    TOPIK_PRIORITAS:
      WIN_DATA_IBU_BAYI_normalizeTopics(
        data.topikPrioritas ||
        data.TOPIK_PRIORITAS ||
        ''
      ),


    CATATAN_IBU_BAYI:
      data.catatanIbuBayi ||
      data.CATATAN_IBU_BAYI ||
      data.catatan ||
      '',


    DIISI_OLEH:
      data.diisiOleh ||
      data.DIISI_OLEH ||
      'PERAWAT',


    UPDATED_AT:
      now

  };


  /* ==========================================================
     SUSUN ROW BERDASARKAN HEADER SHEET
     ========================================================== */

  const row =
    headers.map(
      function(header) {

        if (
          rowObject[
            header
          ] !== undefined
        ) {

          return rowObject[
            header
          ];

        }


        /*
         * Jika header lama tidak ada
         * pada object baru, pertahankan
         * nilai lama saat UPDATE.
         */

        if (
          existing &&
          existing.found &&
          existing.data &&
          existing.data[
            header
          ] !== undefined
        ) {

          return existing.data[
            header
          ];

        }


        return '';

      }
    );


  /* ==========================================================
     UPDATE
     ========================================================== */

  if (
    existing &&
    existing.found
  ) {

    const rowNumber =
      existing.row;


    sheet
      .getRange(
        rowNumber,
        1,
        1,
        row.length
      )
      .setValues([
        row
      ]);


    WIN_DATA_IBU_BAYI_formatRow(
      sheet,
      rowNumber
    );


    return {

      success:
        true,

      action:
        'UPDATE',

      row:
        rowNumber,

      message:
        'Data Ibu & Bayi berhasil diperbarui.',

      data:
        rowObject

    };

  }


  /* ==========================================================
     INSERT
     ========================================================== */

  sheet.appendRow(
    row
  );


  const newRow =
    sheet.getLastRow();


  WIN_DATA_IBU_BAYI_formatRow(
    sheet,
    newRow
  );


  return {

    success:
      true,

    action:
      'INSERT',

    row:
      newRow,

    message:
      'Data Ibu & Bayi berhasil disimpan.',

    data:
      rowObject

  };

}


/* ============================================================
 * 10. NORMALISASI TOPIK
 * ============================================================
 */

function WIN_DATA_IBU_BAYI_normalizeTopics(
  value
) {

  if (
    Array.isArray(value)
  ) {

    return value
      .filter(
        function(item) {

          return String(
            item || ''
          ).trim();

        }
      )
      .join(
        ', '
      );

  }


  return String(
    value || ''
  ).trim();

}


/* ============================================================
 * 11. FORMAT BARIS
 * ============================================================
 */

function WIN_DATA_IBU_BAYI_formatRow(
  sheet,
  rowNumber
) {

  if (
    !sheet ||
    rowNumber < 2
  ) {

    return;

  }


  const dateHeaders = [

    'TIMESTAMP',

    'TANGGAL_LAHIR_IBU',

    'TANGGAL_PERSALINAN',

    'TANGGAL_LAHIR_BAYI',

    'UPDATED_AT'

  ];


  dateHeaders.forEach(
    function(header) {

      const col =
        WIN_DATA_IBU_BAYI_findColumn(
          sheet,
          header
        );


      if (
        col > 0
      ) {

        sheet
          .getRange(
            rowNumber,
            col
          )
          .setNumberFormat(
            header ===
              'TANGGAL_LAHIR_IBU' ||
            header ===
              'TANGGAL_PERSALINAN' ||
            header ===
              'TANGGAL_LAHIR_BAYI'

              ? 'dd/MM/yyyy'

              : 'dd/MM/yyyy HH:mm:ss'
          );

      }

    }
  );


  const numberHeaders = [

    'USIA_IBU',

    'GRAVIDA',

    'PARA',

    'ABORTUS',

    'BB_LAHIR',

    'PB_LAHIR',

    'LINGKAR_KEPALA',

    'APGAR_1',

    'APGAR_5',

    'BB_SAAT_KRS',

    'LAMA_PERAWATAN'

  ];


  numberHeaders.forEach(
    function(header) {

      const col =
        WIN_DATA_IBU_BAYI_findColumn(
          sheet,
          header
        );


      if (
        col > 0
      ) {

        sheet
          .getRange(
            rowNumber,
            col
          )
          .setNumberFormat(
            '0.##'
          );

      }

    }
  );

}


/* ============================================================
 * 12. DATA UNTUK PENELITIAN
 * ============================================================
 */

function WIN_DATA_IBU_BAYI_getResearchData(
  episodeId
) {

  const result =
    WIN_DATA_IBU_BAYI_getByEpisode(
      episodeId
    );


  if (
    !result.success ||
    !result.found
  ) {

    return result;

  }


  const d =
    result.data;


  return {

    success:
      true,

    episodeId:
      d.EPISODE_ID || '',

    subjectId:
      d.SUBJECT_ID || '',


    dataIbu: {

      usiaIbu:
        d.USIA_IBU || '',

      pendidikan:
        d.PENDIDIKAN || '',

      pekerjaan:
        d.PEKERJAAN || '',

      gravida:
        d.GRAVIDA || '',

      para:
        d.PARA || '',

      abortus:
        d.ABORTUS || '',

      paritasRaw:
        d.PARITAS_RAW || '',

      pengalamanMerawatBayi:
        d.PENGALAMAN_MERAWAT_BAYI || '',

      pengalamanMenyusui:
        d.PENGALAMAN_MENYUSUI || '',

      dukunganKeluarga:
        d.DUKUNGAN_KELUARGA || '',

      usiaKehamilan:
        d.USIA_KEHAMILAN || '',

      jenisPersalinan:
        d.JENIS_PERSALINAN || ''

    },


    dataBayi: {

      babyId:
        d.BABY_ID || '',

      namaBayi:
        d.NAMA_BAYI || '',

      jenisKelamin:
        d.JENIS_KELAMIN_BAYI || '',

      tanggalLahir:
        d.TANGGAL_LAHIR_BAYI || '',

      usiaGestasi:
        d.USIA_GESTASI_BAYI || '',

      bbLahir:
        d.BB_LAHIR || '',

      bbSaatKRS:
        d.BB_SAAT_KRS || '',

      pbLahir:
        d.PB_LAHIR || '',

      lingkarKepala:
        d.LINGKAR_KEPALA || '',

      apgar1:
        d.APGAR_1 || '',

      apgar5:
        d.APGAR_5 || '',

      lamaPerawatan:
        d.LAMA_PERAWATAN || '',

      diagnosis:
        d.DIAGNOSIS_BAYI || '',

      kondisiBayi:
        d.KONDISI_BAYI || '',

      kondisiKhusus:
        d.KONDISI_KHUSUS || '',

      statusASI:
        d.STATUS_ASI || '',

      rencanaNutrisiPulang:
        d.RENCANA_NUTRISI_PULANG || ''

    },


    dischargePlanning: {

      kesiapanPulang:
        d.KESIAPAN_PULANG || '',

      topikPrioritas:
        d.TOPIK_PRIORITAS || '',

      catatan:
        d.CATATAN_IBU_BAYI || '',

      diisiOleh:
        d.DIISI_OLEH || '',

      updatedAt:
        d.UPDATED_AT || ''

    }

  };

}


/* ============================================================
 * 13. SETUP
 * ============================================================
 */

function WIN_DATA_IBU_BAYI_SETUP() {

  try {

    const sheet =
      WIN_DATA_IBU_BAYI_getSheet();


    const headers =
      sheet
        .getRange(
          1,
          1,
          1,
          sheet.getLastColumn()
        )
        .getValues()[0];


    Logger.log(
      '======================================'
    );

    Logger.log(
      'WIN DATA IBU & BAYI SETUP'
    );

    Logger.log(
      'Sheet: ' +
      sheet.getName()
    );

    Logger.log(
      'Jumlah kolom: ' +
      sheet.getLastColumn()
    );

    Logger.log(
      'Jumlah header final: ' +
      headers.length
    );

    Logger.log(
      '======================================'
    );


    return {

      success:
        true,

      sheet:
        sheet.getName(),

      lastColumn:
        sheet.getLastColumn(),

      lastRow:
        sheet.getLastRow(),

      headers:
        headers

    };

  }

  catch(error) {

    Logger.log(
      'WIN_DATA_IBU_BAYI_SETUP ERROR: ' +
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
 * 14. TEST AMBIL DATA
 * ============================================================
 */

function WIN_DATA_IBU_BAYI_TEST_GET(
  episodeId
) {

  const result =
    WIN_DATA_IBU_BAYI_getByEpisode(
      episodeId
    );


  Logger.log(
    '======================================'
  );

  Logger.log(
    'WIN DATA IBU & BAYI TEST GET'
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
 * 15. TEST
 * ============================================================
 */

function WIN_DATA_IBU_BAYI_TEST() {

  const result =
    WIN_DATA_IBU_BAYI_SETUP();


  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  return result;

}
