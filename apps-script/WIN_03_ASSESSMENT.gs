/**
 * ============================================================
 * WIN_03_ASSESSMENT.gs
 * WIN — Discharge Planning Perinatologi
 *
 * MODULE :
 * Assessment Kebutuhan & Readiness Ibu
 *
 * FUNGSI :
 * 1. Menyimpan assessment ibu
 * 2. Memilih kebutuhan pembelajaran
 * 3. Menghitung readiness
 * 4. Membuat learning plan
 * 5. Menentukan materi WAJIB
 * 6. Menjadi sumber WIN_04_LMS
 *
 * DEPENDENCY :
 * WIN_01_CONFIG.gs
 * WIN_02_EPISODE.gs
 *
 * ALUR :
 *
 * WIN EPISODE
 *      ↓
 * DATA IBU & BAYI
 *      ↓
 * ASSESSMENT
 *      ↓
 * PILIH KEBUTUHAN
 *      ↓
 * LEARNING PLAN
 *      ↓
 * WIN_04_LMS
 * ============================================================
 */


/* ============================================================
 * 1. KONFIGURASI
 * ============================================================
 */

const WIN_ASSESSMENT = {

  SHEET_NAME: 'WIN_ASSESSMENT',

  HEADERS: [

    'TIMESTAMP',
    'ASSESSMENT_ID',
    'EPISODE_ID',
    'PATIENT_ID',
    'NO_RM',
    'TANGGAL',
    'KEBUTUHAN',
    'PENGALAMAN',
    'DUKUNGAN',
    'HAMBATAN',
    'CATATAN',
    'READINESS',
    'READINESS_SCORE',
    'LEARNING_PLAN',
    'STATUS',
    'COMPLETED_AT',
    'UPDATED_AT'

  ]

};


/* ============================================================
 * 2. MASTER PILIHAN ASSESSMENT
 *
 * PENTING:
 * Nilai ID dibuat konsisten dengan WIN_04_LMS.
 * ============================================================
 */

function WIN_03_GET_ASSESSMENT_OPTIONS() {

  return {

    kebutuhan: [

      {
        id: 'ASI',
        label: 'Memberikan ASI'
      },

      {
        id: 'PERAWATAN_BAYI',
        label: 'Merawat bayi'
      },

      {
        id: 'SUHU',
        label: 'Menjaga suhu bayi'
      },

      {
        id: 'TANDA_BAHAYA',
        label: 'Mengenali tanda bahaya'
      },

      {
        id: 'BBLR',
        label: 'Merawat bayi BBLR'
      }

    ],

    pengalaman: [

      'Belum pernah',

      'Pernah tetapi belum yakin',

      'Cukup berpengalaman',

      'Sangat berpengalaman'

    ],

    dukungan: [

      'Tidak ada dukungan',

      'Dukungan terbatas',

      'Dukungan cukup',

      'Dukungan baik'

    ],

    hambatan: [

      'Tidak ada hambatan',

      'Kesulitan memahami informasi',

      'Kecemasan',

      'Bahasa',

      'Keterbatasan waktu',

      'Keterbatasan dukungan keluarga',

      'Keterbatasan fasilitas',

      'Hambatan lainnya'

    ]

  };

}


/* ============================================================
 * 3. MEMBUAT SHEET
 * ============================================================
 */

function WIN_03_ENSURE_SHEET() {

  const ss = WIN_getSpreadsheet();

  let sheet =
    ss.getSheetByName(
      WIN_ASSESSMENT.SHEET_NAME
    );

  if (!sheet) {

    sheet =
      ss.insertSheet(
        WIN_ASSESSMENT.SHEET_NAME
      );

    sheet
      .getRange(
        1,
        1,
        1,
        WIN_ASSESSMENT.HEADERS.length
      )
      .setValues([
        WIN_ASSESSMENT.HEADERS
      ]);

    sheet.setFrozenRows(1);

  }

  return sheet;

}


/* ============================================================
 * 4. MEMBUAT ID ASSESSMENT
 * ============================================================
 */

function WIN_03_CREATE_ASSESSMENT_ID() {

  const now = new Date();

  const timestamp =
    Utilities.formatDate(
      now,
      WIN_CONFIG.TIMEZONE,
      'yyyyMMddHHmmss'
    );

  return (
    WIN_CONFIG.EPISODE_PREFIX +
    '-ASM-' +
    timestamp
  );

}


/* ============================================================
 * 5. MEMBUAT OBJECT ASSESSMENT
 * ============================================================
 */

function WIN_03_NEW_ASSESSMENT(data) {

  data = data || {};


  // ==========================================================
  // VALIDASI SUMBER
  // ASSESSMENT HANYA BOLEH UNTUK PASIEN NICU LEVEL 2
  // ==========================================================

  const source =
    WIN_03_VALIDATE_ASSESSMENT_SOURCE(data);


  if (!source.allowed) {

    throw new Error(
      source.message
    );

  }


  return {

    assessmentId:
      data.assessmentId ||
      WIN_03_CREATE_ASSESSMENT_ID(),

    episodeId:
      data.episodeId || '',

    patientId:
      source.patientId,

    noRM:
      source.noRM,

    sourceLevel:
      'NICU_LEVEL_2',

    namaBayi:
      source.namaBayi,

    nicuLevel2Row:
      source.rowNumber,

    tanggal:
      data.tanggal || new Date(),

    kebutuhan:
      Array.isArray(data.kebutuhan)
        ? data.kebutuhan
        : [],

    pengalaman:
      data.pengalaman || '',

    dukungan:
      data.dukungan || '',

    hambatan:
      Array.isArray(data.hambatan)
        ? data.hambatan
        : [],

    catatan:
      data.catatan || '',

    readiness:
      '',

    readinessScore:
      0,

    learningPlan:
      [],

    status:
      'DRAFT',

    createdAt:
      new Date(),

    updatedAt:
      new Date(),

    completedAt:
      ''

  };

}


/* ============================================================
 * 6. NORMALISASI KEBUTUHAN
 *
 * Mendukung input lama:
 * "ASI"
 * "Memberikan ASI"
 *
 * sehingga frontend lama tidak langsung rusak.
 * ============================================================
 */

function WIN_03_NORMALIZE_KEBUTUHAN(value) {

  if (!value) {
    return '';
  }

  const text =
    WIN_cleanText(value);

  const mapping = {

    'ASI':
      'ASI',

    'Memberikan ASI':
      'ASI',

    'PERAWATAN BAYI':
      'PERAWATAN_BAYI',

    'Perawatan bayi':
      'PERAWATAN_BAYI',

    'Merawat bayi':
      'PERAWATAN_BAYI',

    'SUHU':
      'SUHU',

    'Menjaga suhu':
      'SUHU',

    'Menjaga suhu bayi':
      'SUHU',

    'TANDA BAHAYA':
      'TANDA_BAHAYA',

    'TANDA_BAHAYA':
      'TANDA_BAHAYA',

    'Mengenali tanda bahaya':
      'TANDA_BAHAYA',

    'BBLR':
      'BBLR',

    'Merawat bayi BBLR':
      'BBLR'

  };

  return (
    mapping[text] ||
    mapping[String(value).trim()] ||
    ''
  );

}


/* ============================================================
 * 7. NORMALISASI ARRAY KEBUTUHAN
 * ============================================================
 */

function WIN_03_NORMALIZE_KEBUTUHAN_ARRAY(
  kebutuhan
) {

  if (!Array.isArray(kebutuhan)) {
    return [];
  }

  const result = [];

  kebutuhan.forEach(function(item) {

    const normalized =
      WIN_03_NORMALIZE_KEBUTUHAN(item);

    if (
      normalized &&
      result.indexOf(normalized) === -1
    ) {

      result.push(normalized);

    }

  });

  return result;

}


/* ============================================================
 * 8. HITUNG READINESS
 * ============================================================
 */

function WIN_03_CALCULATE_READINESS(
  assessment
) {

  if (!assessment) {

    throw new Error(
      'Assessment tidak ditemukan.'
    );

  }

  let score = 0;

  const kebutuhan =
    WIN_03_NORMALIZE_KEBUTUHAN_ARRAY(
      assessment.kebutuhan
    );

  assessment.kebutuhan =
    kebutuhan;


  /* ----------------------------------------------------------
   * KEBUTUHAN
   * ----------------------------------------------------------
   */

  if (kebutuhan.length > 0) {

    score += 1;

  }


  /* ----------------------------------------------------------
   * PENGALAMAN
   * ----------------------------------------------------------
   */

  switch (
    WIN_cleanText(
      assessment.pengalaman
    )
  ) {

    case 'Belum pernah':
      score += 0;
      break;

    case 'Pernah tetapi belum yakin':
      score += 1;
      break;

    case 'Cukup berpengalaman':
      score += 2;
      break;

    case 'Sangat berpengalaman':
      score += 3;
      break;

  }


  /* ----------------------------------------------------------
   * DUKUNGAN
   * ----------------------------------------------------------
   */

  switch (
    WIN_cleanText(
      assessment.dukungan
    )
  ) {

    case 'Tidak ada dukungan':
      score += 0;
      break;

    case 'Dukungan terbatas':
      score += 1;
      break;

    case 'Dukungan cukup':
      score += 2;
      break;

    case 'Dukungan baik':
      score += 3;
      break;

  }


  /* ----------------------------------------------------------
   * HAMBATAN
   * ----------------------------------------------------------
   */

  const hambatan =
    Array.isArray(
      assessment.hambatan
    )
      ? assessment.hambatan
      : [];


  if (
    hambatan.indexOf(
      'Tidak ada hambatan'
    ) !== -1
  ) {

    score += 2;

  } else {

    score -= hambatan.length;

  }


  /* ----------------------------------------------------------
   * KATEGORI
   * ----------------------------------------------------------
   */

  let readiness = '';

  if (score <= 1) {

    readiness = 'RENDAH';

  } else if (score <= 4) {

    readiness = 'SEDANG';

  } else {

    readiness = 'TINGGI';

  }


  assessment.readiness =
    readiness;

  assessment.readinessScore =
    score;

  return assessment;

}


/* ============================================================
 * 9. MASTER LEARNING PLAN
 *
 * INILAH JEMBATAN UTAMA KE WIN_04_LMS.
 *
 * Setiap kebutuhan mempunyai materi yang wajib.
 * ============================================================
 */

function WIN_03_GET_LEARNING_MAPPING() {

  return {

    ASI: [

      'LMS_ASI'

    ],

    PERAWATAN_BAYI: [

      'LMS_PERAWATAN_BAYI'

    ],

    SUHU: [

      'LMS_SUHU'

    ],

    TANDA_BAHAYA: [

      'LMS_TANDA_BAHAYA'

    ],

    BBLR: [

      'LMS_BBLR'

    ]

  };

}


/* ============================================================
 * 10. GENERATE LEARNING PLAN
 * ============================================================
 */

function WIN_03_GENERATE_LEARNING_PLAN(
  assessment
) {

  if (!assessment) {

    throw new Error(
      'Assessment tidak ditemukan.'
    );

  }

  const mapping =
    WIN_03_GET_LEARNING_MAPPING();

  const kebutuhan =
    WIN_03_NORMALIZE_KEBUTUHAN_ARRAY(
      assessment.kebutuhan
    );


  const materiWajib = [];


  kebutuhan.forEach(function(kebutuhanId) {

    const daftarMateri =
      mapping[kebutuhanId] || [];


    daftarMateri.forEach(function(materiId) {

      if (
        materiWajib.indexOf(materiId) === -1
      ) {

        materiWajib.push(
          materiId
        );

      }

    });

  });


  return {

    episodeId:
      assessment.episodeId || '',

    assessmentId:
      assessment.assessmentId || '',

    readiness:
      assessment.readiness || '',

    readinessScore:
      assessment.readinessScore || 0,

    kebutuhan:
      kebutuhan,

    materiWajib:
      materiWajib,

    jumlahMateriWajib:
      materiWajib.length,

    createdAt:
      new Date()

  };

}


/* ============================================================
 * 11. COMPLETE ASSESSMENT
 * ============================================================
 */

function WIN_03_COMPLETE_ASSESSMENT(
  assessment
) {

  if (!assessment) {

    throw new Error(
      'Assessment tidak ditemukan.'
    );

  }


  assessment =
    WIN_03_CALCULATE_READINESS(
      assessment
    );


  const learningPlan =
    WIN_03_GENERATE_LEARNING_PLAN(
      assessment
    );


  assessment.learningPlan =
    learningPlan.materiWajib;


  assessment.learningPlanDetail =
    learningPlan;


  assessment.status =
    'COMPLETED';

  assessment.completedAt =
    new Date();

  assessment.updatedAt =
    new Date();


  return assessment;

}


/* ============================================================
 * 12. SIMPAN ASSESSMENT
 * ============================================================
 */

function WIN_03_SAVE_ASSESSMENT(
  assessment
) {

  if (!assessment) {

    return {

      success: false,

      message:
        'Assessment tidak ditemukan.'

    };

  }


  const completed =
    assessment.status === 'COMPLETED'
      ? assessment
      : WIN_03_COMPLETE_ASSESSMENT(
          assessment
        );


  const sheet =
    WIN_03_ENSURE_SHEET();


  const data =
    sheet.getDataRange()
      .getValues();


  let rowNumber = -1;


  for (
    let i = 1;
    i < data.length;
    i++
  ) {

    if (
      String(data[i][1] || '') ===
      String(completed.assessmentId || '')
    ) {

      rowNumber =
        i + 1;

      break;

    }

  }


  const row = [

    new Date(),

    completed.assessmentId,

    completed.episodeId,

    completed.patientId,

    completed.noRM,

    completed.tanggal,

    JSON.stringify(
      completed.kebutuhan || []
    ),

    completed.pengalaman,

    completed.dukungan,

    JSON.stringify(
      completed.hambatan || []
    ),

    completed.catatan,

    completed.readiness,

    completed.readinessScore,

    JSON.stringify(
      completed.learningPlanDetail || {}
    ),

    completed.status,

    completed.completedAt,

    completed.updatedAt

  ];


  if (rowNumber > 0) {

    sheet
      .getRange(
        rowNumber,
        1,
        1,
        row.length
      )
      .setValues([row]);

  } else {

    sheet
      .getRange(
        sheet.getLastRow() + 1,
        1,
        1,
        row.length
      )
      .setValues([row]);

  }


  return {

    success: true,

    message:
      'Assessment berhasil disimpan.',

    assessment:
      completed

  };

}


/* ============================================================
 * 13. AMBIL ASSESSMENT TERAKHIR
 * ============================================================
 */

function WIN_03_GET_LATEST_ASSESSMENT(
  episodeId,
  noRM
) {

  const sheet =
    WIN_03_ENSURE_SHEET();

  const data =
    sheet.getDataRange()
      .getValues();


  for (
    let i = data.length - 1;
    i >= 1;
    i--
  ) {

    const row =
      data[i];


    if (

      String(row[2] || '') ===
        String(episodeId || '') &&

      String(row[4] || '') ===
        String(noRM || '')

    ) {

      let kebutuhan = [];

      let learningPlan = {};


      try {

        kebutuhan =
          JSON.parse(
            row[6] || '[]'
          );

      } catch (e) {}


      try {

        learningPlan =
          JSON.parse(
            row[13] || '{}'
          );

      } catch (e) {}


      return {

        success: true,

        assessmentId:
          row[1],

        episodeId:
          row[2],

        patientId:
          row[3],

        noRM:
          row[4],

        tanggal:
          row[5],

        kebutuhan:
          kebutuhan,

        pengalaman:
          row[7],

        dukungan:
          row[8],

        hambatan:
          JSON.parse(
            row[9] || '[]'
          ),

        catatan:
          row[10],

        readiness:
          row[11],

        readinessScore:
          Number(row[12] || 0),

        learningPlan:
          learningPlan,

        status:
          row[14],

        completedAt:
          row[15],

        updatedAt:
          row[16]

      };

    }

  }


  return {

    success: false,

    message:
      'Assessment belum ditemukan.',

    assessment:
      null

  };

}


/* ============================================================
 * 14. TEST ASSESSMENT
 * ============================================================
 */

function WIN_03_TEST_CREATE_ASSESSMENT() {

  const assessment =
    WIN_03_NEW_ASSESSMENT({

      episodeId:
        'WIN-TEST-001',

      patientId:
        'TEST-001',

      noRM:
        '000001',

      kebutuhan: [

        'Memberikan ASI',

        'Menjaga suhu bayi',

        'Merawat bayi BBLR',

        'Mengenali tanda bahaya'

      ],

      pengalaman:
        'Belum pernah',

      dukungan:
        'Dukungan baik',

      hambatan: [

        'Kecemasan'

      ],

      catatan:
        'Ibu membutuhkan pendampingan.'

    });


  const result =
    WIN_03_COMPLETE_ASSESSMENT(
      assessment
    );


  Logger.log(
    '================================'
  );

  Logger.log(
    'HASIL TEST ASSESSMENT'
  );

  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );

  Logger.log(
    '================================'
  );


  return result;

}


/* ============================================================
 * 15. TEST SAVE
 * ============================================================
 */

function WIN_03_TEST_SAVE_ASSESSMENT() {

  const assessment =
    WIN_03_NEW_ASSESSMENT({

      episodeId:
        'WIN-TEST-002',

      patientId:
        'TEST-002',

      noRM:
        '000002',

      kebutuhan: [

        'Memberikan ASI',

        'Merawat bayi'

      ],

      pengalaman:
        'Pernah tetapi belum yakin',

      dukungan:
        'Dukungan cukup',

      hambatan: [

        'Tidak ada hambatan'

      ]

    });


  const result =
    WIN_03_SAVE_ASSESSMENT(
      assessment
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
 * WIN 03 — SUMBER PASIEN WAJIB NICU LEVEL 2
 *
 * ATURAN:
 *
 * MASTER → LEVEL 2 → WIN
 * MASTER → LEVEL 3 → LEVEL 2 → WIN
 *
 * MASTER → WIN       ❌
 * LEVEL 3 → WIN      ❌
 * ============================================================
 */

function WIN_03_GET_L2_PATIENT_CONTEXT(patientId, noRM) {

  const ss = WIN_getSpreadsheet();
  const sheet = ss.getSheetByName('NICU_LEVEL_2');

  if (!sheet) {
    return {
      success: false,
      allowed: false,
      message: 'Sheet NICU_LEVEL_2 tidak ditemukan.'
    };
  }

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  if (lastRow < 4) {
    return {
      success: false,
      allowed: false,
      message: 'Belum ada pasien di NICU_LEVEL_2.'
    };
  }

  const headers = sheet
    .getRange(3, 1, 1, lastCol)
    .getValues()[0];

  const data = sheet
    .getRange(4, 1, lastRow - 3, lastCol)
    .getValues();

  const findCol = function(names) {

    for (let i = 0; i < headers.length; i++) {

      const h = String(headers[i] || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_');

      if (names.indexOf(h) !== -1) {
        return i;
      }

    }

    return -1;

  };


  const idxId = findCol([
    'id_bayi',
    'patient_id',
    'id_pasien'
  ]);

  const idxRM = findCol([
    'no_rm',
    'norm',
    'no_rm_bayi'
  ]);

  const idxNama = findCol([
    'nama_bayi',
    'nama_bayi'
  ]);


  for (let i = 0; i < data.length; i++) {

    const row = data[i];

    const rowId =
      idxId >= 0
        ? String(row[idxId] || '').trim()
        : '';

    const rowRM =
      idxRM >= 0
        ? String(row[idxRM] || '').trim()
        : '';

    const matchId =
      patientId &&
      rowId &&
      rowId === String(patientId).trim();

    const matchRM =
      noRM &&
      rowRM &&
      rowRM === String(noRM).trim();


    if (matchId || matchRM) {

      return {

        success: true,

        allowed: true,

        sourceLevel: 'NICU_LEVEL_2',

        patientId: rowId,

        noRM: rowRM,

        namaBayi:
          idxNama >= 0
            ? row[idxNama]
            : '',

        rowNumber: i + 4

      };

    }

  }


  return {

    success: false,

    allowed: false,

    sourceLevel: '',

    message:
      'Pasien belum ditemukan di NICU_LEVEL_2. ' +
      'Discharge Planning hanya dapat dibuat setelah pasien masuk Level 2.'

  };

}
/* ============================================================
 * VALIDASI ASSESSMENT
 * ============================================================
 */

function WIN_03_VALIDATE_ASSESSMENT_SOURCE(data) {

  data = data || {};

  const patientId =
    String(data.patientId || '').trim();

  const noRM =
    String(data.noRM || '').trim();


  if (!patientId && !noRM) {

    return {

      success: false,

      allowed: false,

      message:
        'Patient ID atau No RM wajib diisi.'

    };

  }


  const context =
    WIN_03_GET_L2_PATIENT_CONTEXT(
      patientId,
      noRM
    );


  if (!context.allowed) {

    return {

      success: false,

      allowed: false,

      message: context.message

    };

  }


  return {

    success: true,

    allowed: true,

    sourceLevel: 'NICU_LEVEL_2',

    patientId:
      context.patientId || patientId,

    noRM:
      context.noRM || noRM,

    namaBayi:
      context.namaBayi || '',

    rowNumber:
      context.rowNumber || 0

  };

}
