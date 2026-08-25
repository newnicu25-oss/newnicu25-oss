/**
 * ============================================================
 * WIN_04_LMS.gs
 * WIN — Discharge Planning Bayi Risiko Tinggi
 *
 * MODULE : LEARNING MANAGEMENT SYSTEM
 *
 * ALUR:
 *
 * ASSESSMENT
 *     ↓
 * MATERI PENGANTAR WAJIB
 *     ↓
 * MATERI WAJIB SESUAI KEBUTUHAN BAYI
 *     ↓
 * MATERI TAMBAHAN
 *     ↓
 * PRAKTIK
 *
 * KONSEP:
 * 1. "Mengenal Bayi Risiko Tinggi" selalu menjadi materi pertama.
 * 2. Materi hasil assessment menjadi materi wajib berikutnya.
 * 3. Materi wajib dikerjakan berurutan.
 * 4. Materi tambahan bebas diakses.
 * 5. Reset episode tersedia untuk testing / perbaikan LMS.
 * ============================================================
 */

const WIN_LMS = {

  SHEET_NAME: 'WIN_LMS',

  HEADERS: [

    'TIMESTAMP',
    'EPISODE_ID',
    'NO_RM',
    'NAMA_IBU',
    'MATERI_ID',
    'URUTAN',
    'KEBUTUHAN_ID',
    'JUDUL_MATERI',
    'JENIS_MATERI',
    'URL_MATERI',
    'DURASI',
    'WAJIB',
    'STATUS',
    'TGL_MULAI',
    'TGL_SELESAI',
    'LAST_ACCESS',
    'PERSENTASE'

  ],

  STATUS: {

    LOCKED: 'LOCKED',

    AVAILABLE: 'AVAILABLE',

    OPENED: 'OPENED',

    COMPLETED: 'COMPLETED'

  }

};


/* ============================================================
 * MASTER MATERI
 * ============================================================
 */

function WIN_LMS_getMasterMateri() {

  return [

    /* ========================================================
     * MATERI PENGANTAR WAJIB
     * SELALU MENJADI MATERI PERTAMA
     * ========================================================
     */

    {
      materiId: 'LMS_BAYI_RISIKO_TINGGI',
      urutan: 1,
      kebutuhanId: 'UMUM',
      judul: 'Mengenal Bayi Risiko Tinggi',
      jenis: 'VIDEO',
      url: '',
      durasi: 8,
      selaluWajib: true
    },


    /* ========================================================
     * MATERI WAJIB SESUAI ASSESSMENT
     * ========================================================
     */

    {
      materiId: 'LMS_ASI',
      urutan: 2,
      kebutuhanId: 'ASI',
      judul: 'Pemberian ASI dan Teknik Menyusui',
      jenis: 'VIDEO',
      url: '',
      durasi: 10,
      selaluWajib: false
    },

    {
      materiId: 'LMS_PERAWATAN_BAYI',
      urutan: 3,
      kebutuhanId: 'PERAWATAN_BAYI',
      judul: 'Perawatan Bayi Baru Lahir',
      jenis: 'VIDEO',
      url: '',
      durasi: 8,
      selaluWajib: false
    },

    {
      materiId: 'LMS_SUHU',
      urutan: 4,
      kebutuhanId: 'SUHU',
      judul: 'Menjaga Suhu Tubuh Bayi',
      jenis: 'VIDEO',
      url: '',
      durasi: 8,
      selaluWajib: false
    },

    {
      materiId: 'LMS_TANDA_BAHAYA',
      urutan: 5,
      kebutuhanId: 'TANDA_BAHAYA',
      judul: 'Mengenali Tanda Bahaya Bayi',
      jenis: 'VIDEO',
      url: '',
      durasi: 8,
      selaluWajib: false
    },

    {
      materiId: 'LMS_BBLR',
      urutan: 6,
      kebutuhanId: 'BBLR',
      judul: 'Perawatan Bayi BBLR',
      jenis: 'VIDEO',
      url: '',
      durasi: 10,
      selaluWajib: false
    },


    /* ========================================================
     * MATERI TAMBAHAN
     * BEBAS DIAKSES
     * ========================================================
     */

    {
      materiId: 'LMS_CUCI_TANGAN',
      urutan: 101,
      kebutuhanId: 'UMUM',
      judul: 'Cuci Tangan yang Benar',
      jenis: 'VIDEO',
      url: '',
      durasi: 5,
      selaluWajib: false
    },

    {
      materiId: 'LMS_TALI_PUSAT',
      urutan: 102,
      kebutuhanId: 'UMUM',
      judul: 'Perawatan Tali Pusat',
      jenis: 'VIDEO',
      url: '',
      durasi: 5,
      selaluWajib: false
    },

    {
      materiId: 'LMS_PERSIAPAN_PULANG',
      urutan: 103,
      kebutuhanId: 'UMUM',
      judul: 'Persiapan Pulang dan Perawatan di Rumah',
      jenis: 'PPT',
      url: '',
      durasi: 7,
      selaluWajib: false
    }

  ];

}


/* ============================================================
 * SHEET
 * ============================================================
 */

function WIN_LMS_ensureSheet() {

  const ss = WIN_getSpreadsheet();

  let sheet =
    ss.getSheetByName(
      WIN_LMS.SHEET_NAME
    );

  if (!sheet) {

    sheet =
      ss.insertSheet(
        WIN_LMS.SHEET_NAME
      );

    sheet
      .getRange(
        1,
        1,
        1,
        WIN_LMS.HEADERS.length
      )
      .setValues([
        WIN_LMS.HEADERS
      ]);

    sheet.setFrozenRows(1);

  }

  return sheet;

}


/* ============================================================
 * AMBIL DATA
 * ============================================================
 */

function WIN_LMS_getAllData() {

  const sheet =
    WIN_LMS_ensureSheet();

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
      WIN_LMS.HEADERS.length
    )
    .getValues();

}


/* ============================================================
 * AMBIL LEARNING PLAN DARI ASSESSMENT
 * ============================================================
 */

function WIN_LMS_getRequiredMateri(
  episodeId,
  noRM
) {

  const assessment =
    WIN_03_GET_LATEST_ASSESSMENT(
      episodeId,
      noRM
    );

  if (!assessment.success) {

    return {

      success: false,

      message:
        'Assessment belum selesai.',

      materiWajib: []

    };

  }

  const plan =
    assessment.learningPlan || {};

  return {

    success: true,

    materiWajib:
      plan.materiWajib || []

  };

}


/* ============================================================
 * BUAT DAFTAR MATERI WAJIB FINAL
 *
 * Materi pertama selalu:
 * LMS_BAYI_RISIKO_TINGGI
 *
 * kemudian materi hasil assessment.
 * ============================================================
 */

function WIN_LMS_buildRequiredMateri(
  materiAssessment
) {

  const result = [];

  const INTRO =
    'LMS_BAYI_RISIKO_TINGGI';

  result.push(INTRO);

  if (Array.isArray(materiAssessment)) {

    materiAssessment.forEach(function(id) {

      if (
        id &&
        result.indexOf(id) === -1
      ) {

        result.push(id);

      }

    });

  }

  return result;

}


/* ============================================================
 * CEK APAKAH MATERI WAJIB
 * ============================================================
 */

function WIN_LMS_isMateriWajib(
  materiId,
  materiWajib
) {

  return (

    Array.isArray(materiWajib) &&

    materiWajib.indexOf(
      materiId
    ) !== -1

  );

}


/* ============================================================
 * INITIALIZE EPISODE
 * ============================================================
 */

function WIN_LMS_initializeEpisode(
  episodeId,
  noRM,
  namaIbu
) {

  if (!episodeId || !noRM) {

    return {

      success: false,

      message:
        'Episode ID dan No. RM wajib diisi.'

    };

  }


  const requiredAssessment =
    WIN_LMS_getRequiredMateri(
      episodeId,
      noRM
    );


  if (!requiredAssessment.success) {

    return requiredAssessment;

  }


  const materiWajib =
    WIN_LMS_buildRequiredMateri(
      requiredAssessment.materiWajib
    );


  const master =
    WIN_LMS_getMasterMateri();


  const sheet =
    WIN_LMS_ensureSheet();


  const existing =
    WIN_LMS_getAllData();


  const existingMateri =
    existing
      .filter(function(row) {

        return (

          String(row[1] || '') ===
            String(episodeId) &&

          String(row[2] || '') ===
            String(noRM)

        );

      })
      .map(function(row) {

        return String(
          row[4] || ''
        );

      });


  const rows = [];


  master.forEach(function(materi) {

    if (
      existingMateri.indexOf(
        materi.materiId
      ) !== -1
    ) {

      return;

    }


    const wajib =
      WIN_LMS_isMateriWajib(
        materi.materiId,
        materiWajib
      );


    const posisiWajib =
      materiWajib.indexOf(
        materi.materiId
      );


    let status =
      WIN_LMS.STATUS.AVAILABLE;


    if (wajib) {

      status =
        posisiWajib === 0

          ? WIN_LMS.STATUS.AVAILABLE

          : WIN_LMS.STATUS.LOCKED;

    }


    rows.push([

      new Date(),

      episodeId,

      noRM,

      namaIbu || '',

      materi.materiId,

      materi.urutan,

      materi.kebutuhanId,

      materi.judul,

      materi.jenis,

      materi.url,

      materi.durasi,

      wajib,

      status,

      '',

      '',

      '',

      0

    ]);

  });


  if (rows.length > 0) {

    sheet
      .getRange(
        sheet.getLastRow() + 1,
        1,
        rows.length,
        WIN_LMS.HEADERS.length
      )
      .setValues(rows);

  }


  return {

    success: true,

    message:
      'LMS berhasil diinisialisasi.',

    episodeId:
      episodeId,

    noRM:
      noRM,

    materiWajib:
      materiWajib,

    jumlahMateriWajib:
      materiWajib.length,

    jumlahMateri:
      master.length

  };

}


/* ============================================================
 * RESET / REINITIALIZE EPISODE
 *
 * KHUSUS TESTING / PERUBAHAN STRUKTUR LMS
 *
 * Menghapus data LMS episode tersebut lalu membuat ulang.
 * Tidak menghapus episode maupun assessment.
 * ============================================================
 */

function WIN_LMS_resetEpisode(
  episodeId,
  noRM,
  namaIbu
) {

  if (!episodeId || !noRM) {

    return {

      success: false,

      message:
        'Episode ID dan No. RM wajib diisi.'

    };

  }


  const sheet =
    WIN_LMS_ensureSheet();


  const lastRow =
    sheet.getLastRow();


  if (lastRow >= 2) {

    const data =
      sheet.getRange(
        2,
        1,
        lastRow - 1,
        WIN_LMS.HEADERS.length
      ).getValues();


    for (
      let i = data.length - 1;
      i >= 0;
      i--
    ) {

      if (

        String(data[i][1] || '') ===
          String(episodeId) &&

        String(data[i][2] || '') ===
          String(noRM)

      ) {

        sheet.deleteRow(
          i + 2
        );

      }

    }

  }


  return WIN_LMS_initializeEpisode(
    episodeId,
    noRM,
    namaIbu
  );

}


/* ============================================================
 * GET PROGRESS
 * ============================================================
 */

function WIN_LMS_getProgress(
  episodeId,
  noRM
) {

  const master =
    WIN_LMS_getMasterMateri();

  const data =
    WIN_LMS_getAllData();


  const result = [];


  master.forEach(function(materi) {

    let found = null;


    for (
      let i = 0;
      i < data.length;
      i++
    ) {

      if (

        String(data[i][1] || '') ===
          String(episodeId) &&

        String(data[i][2] || '') ===
          String(noRM) &&

        String(data[i][4] || '') ===
          String(materi.materiId)

      ) {

        found = data[i];

        break;

      }

    }


    result.push({

      materiId:
        materi.materiId,

      urutan:
        materi.urutan,

      kebutuhanId:
        materi.kebutuhanId,

      judul:
        materi.judul,

      jenis:
        materi.jenis,

      url:
        materi.url,

      durasi:
        materi.durasi,

      wajib:
        found
          ? Boolean(found[11])
          : false,

      status:
        found
          ? found[12]
          : WIN_LMS.STATUS.AVAILABLE,

      mulai:
        found
          ? found[13]
          : '',

      selesai:
        found
          ? found[14]
          : '',

      lastAccess:
        found
          ? found[15]
          : '',

      persentase:
        found
          ? Number(found[16] || 0)
          : 0

    });

  });


  const wajib =
    result.filter(function(item) {

      return item.wajib;

    });


  const selesaiWajib =
    wajib.filter(function(item) {

      return (

        item.status ===
        WIN_LMS.STATUS.COMPLETED

      );

    });


  return {

    success: true,

    episodeId:
      episodeId,

    noRM:
      noRM,

    totalMateri:
      result.length,

    totalMateriWajib:
      wajib.length,

    materiWajibSelesai:
      selesaiWajib.length,

    persentaseWajib:
      wajib.length > 0

        ? Math.round(

            (
              selesaiWajib.length /
              wajib.length
            ) * 100

          )

        : 0,

    materi:
      result

  };

}


/* ============================================================
 * OPEN MATERI
 * ============================================================
 */

function WIN_LMS_openMateri(
  episodeId,
  noRM,
  namaIbu,
  materiId
) {

  const sheet =
    WIN_LMS_ensureSheet();

  const data =
    WIN_LMS_getAllData();


  let rowNumber = -1;


  for (
    let i = 0;
    i < data.length;
    i++
  ) {

    if (

      String(data[i][1] || '') ===
        String(episodeId) &&

      String(data[i][2] || '') ===
        String(noRM) &&

      String(data[i][4] || '') ===
        String(materiId)

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
        'Materi belum diinisialisasi.'

    };

  }


  const row =
    data[rowNumber - 2];


  const wajib =
    Boolean(row[11]);


  const status =
    row[12];


  if (

    wajib &&

    status ===
      WIN_LMS.STATUS.LOCKED

  ) {

    return {

      success: false,

      locked: true,

      message:
        'Materi ini masih terkunci. Selesaikan materi wajib sebelumnya.'

    };

  }


  const now =
    new Date();


  sheet
    .getRange(
      rowNumber,
      13
    )
    .setValue(
      WIN_LMS.STATUS.OPENED
    );


  if (!row[13]) {

    sheet
      .getRange(
        rowNumber,
        14
      )
      .setValue(now);

  }


  sheet
    .getRange(
      rowNumber,
      16
    )
    .setValue(now);


  return {

    success: true,

    materiId:
      materiId,

    wajib:
      wajib,

    message:
      'Materi berhasil dibuka.',

    url:
      row[9],

    jenis:
      row[8]

  };

}


/* ============================================================
 * COMPLETE MATERI
 * ============================================================
 */

function WIN_LMS_completeMateri(
  episodeId,
  noRM,
  materiId
) {

  const sheet =
    WIN_LMS_ensureSheet();

  const data =
    WIN_LMS_getAllData();


  let rowNumber = -1;


  for (
    let i = 0;
    i < data.length;
    i++
  ) {

    if (

      String(data[i][1] || '') ===
        String(episodeId) &&

      String(data[i][2] || '') ===
        String(noRM) &&

      String(data[i][4] || '') ===
        String(materiId)

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
        'Materi tidak ditemukan.'

    };

  }


  const row =
    data[rowNumber - 2];


  const wajib =
    Boolean(row[11]);


  if (

    wajib &&

    row[12] ===
      WIN_LMS.STATUS.LOCKED

  ) {

    return {

      success: false,

      message:
        'Materi masih terkunci.'

    };

  }


  const now =
    new Date();


  sheet
    .getRange(
      rowNumber,
      13
    )
    .setValue(
      WIN_LMS.STATUS.COMPLETED
    );


  sheet
    .getRange(
      rowNumber,
      15
    )
    .setValue(now);


  sheet
    .getRange(
      rowNumber,
      16
    )
    .setValue(now);


  sheet
    .getRange(
      rowNumber,
      17
    )
    .setValue(100);


  WIN_LMS_unlockNextRequiredMateri(
    episodeId,
    noRM,
    materiId
  );


  return {

    success: true,

    message:
      'Materi berhasil diselesaikan.',

    progress:
      WIN_LMS_getProgress(
        episodeId,
        noRM
      )

  };

}


/* ============================================================
 * UNLOCK MATERI WAJIB BERIKUTNYA
 * ============================================================
 */

function WIN_LMS_unlockNextRequiredMateri(
  episodeId,
  noRM,
  currentMateriId
) {

  const progress =
    WIN_LMS_getProgress(
      episodeId,
      noRM
    );


  if (!progress.success) {
    return;
  }


  const required =
    progress.materi

      .filter(function(item) {

        return item.wajib;

      })

      .sort(function(a, b) {

        return a.urutan - b.urutan;

      });


  const currentIndex =
    required.findIndex(function(item) {

      return (

        item.materiId ===
        currentMateriId

      );

    });


  if (currentIndex === -1) {
    return;
  }


  const next =
    required[currentIndex + 1];


  if (!next) {
    return;
  }


  const sheet =
    WIN_LMS_ensureSheet();

  const data =
    WIN_LMS_getAllData();


  for (
    let i = 0;
    i < data.length;
    i++
  ) {

    if (

      String(data[i][1] || '') ===
        String(episodeId) &&

      String(data[i][2] || '') ===
        String(noRM) &&

      String(data[i][4] || '') ===
        String(next.materiId)

    ) {

      sheet
        .getRange(
          i + 2,
          13
        )
        .setValue(
          WIN_LMS.STATUS.AVAILABLE
        );

      return;

    }

  }

}


/* ============================================================
 * CEK SEMUA MATERI WAJIB SELESAI
 * ============================================================
 */

function WIN_LMS_isComplete(
  episodeId,
  noRM
) {

  const progress =
    WIN_LMS_getProgress(
      episodeId,
      noRM
    );


  if (!progress.success) {
    return false;
  }


  return (

    progress.totalMateriWajib > 0 &&

    progress.materiWajibSelesai ===
      progress.totalMateriWajib

  );

}


/* ============================================================
 * NEXT MATERI WAJIB
 * ============================================================
 */

function WIN_LMS_getNextMateri(
  episodeId,
  noRM
) {

  const progress =
    WIN_LMS_getProgress(
      episodeId,
      noRM
    );


  if (!progress.success) {
    return progress;
  }


  const next =
    progress.materi

      .filter(function(item) {

        return item.wajib;

      })

      .sort(function(a, b) {

        return a.urutan - b.urutan;

      })

      .find(function(item) {

        return (

          item.status ===
            WIN_LMS.STATUS.AVAILABLE ||

          item.status ===
            WIN_LMS.STATUS.OPENED

        );

      });


  if (!next) {

    return {

      success: true,

      selesai: true,

      message:
        'Seluruh materi wajib telah selesai.'

    };

  }


  return {

    success: true,

    selesai: false,

    materi: next

  };

}


/* ============================================================
 * DASHBOARD
 * ============================================================
 */

function WIN_LMS_getDashboardData(
  episodeId,
  noRM
) {

  const progress =
    WIN_LMS_getProgress(
      episodeId,
      noRM
    );


  if (!progress.success) {
    return progress;
  }


  const next =
    WIN_LMS_getNextMateri(
      episodeId,
      noRM
    );


  return {

    success: true,

    episodeId:
      episodeId,

    noRM:
      noRM,

    totalMateri:
      progress.totalMateri,

    totalMateriWajib:
      progress.totalMateriWajib,

    materiWajibSelesai:
      progress.materiWajibSelesai,

    persentaseWajib:
      progress.persentaseWajib,

    selesaiSemua:
      WIN_LMS_isComplete(
        episodeId,
        noRM
      ),

    nextMateri:
      next.materi || null,

    materi:
      progress.materi

  };

}


/* ============================================================
 * TEST RESET EPISODE NYATA
 * ============================================================
 */

function WIN_LMS_TEST_RESET_EPISODE() {

  const result =
    WIN_LMS_resetEpisode(
      'WIN-20260824122053',
      '923672',
      'Ny. Fatma Fadiyah'
    );


  Logger.log(
    '======================================'
  );

  Logger.log(
    'RESET LMS EPISODE NYATA'
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

}


/* ============================================================
 * TEST PROGRESS EPISODE NYATA
 * ============================================================
 */

function WIN_LMS_TEST_PROGRESS_EPISODE() {

  const result =
    WIN_LMS_getProgress(
      'WIN-20260824122053',
      '923672'
    );


  Logger.log(
    '======================================'
  );

  Logger.log(
    'PROGRESS LMS EPISODE NYATA'
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

}
/* ============================================================
 * TEST OPEN MATERI PERTAMA
 * ============================================================
 */

/* ============================================================
 * TEST OPEN MATERI PERTAMA
 * ============================================================
 */

function WIN_LMS_TEST_OPEN_PERTAMA() {

  Logger.log('======================================');
  Logger.log('TEST OPEN MATERI PERTAMA');
  Logger.log('======================================');

  const result = WIN_LMS_openMateri(
    'WIN-20260824122053',
    '923672',
    'Ny. Fatma Fadiyah',
    'LMS_BAYI_RISIKO_TINGGI'
  );

  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );

  Logger.log('======================================');
  Logger.log('TEST SELESAI');
  Logger.log('======================================');

}
/* ============================================================
 * TEST MATERI TERKUNCI
 * ============================================================
 */

function WIN_LMS_TEST_MATERI_LOCKED() {

  Logger.log('======================================');
  Logger.log('TEST MATERI WAJIB TERKUNCI');
  Logger.log('======================================');

  const result = WIN_LMS_openMateri(
    'WIN-20260824122053',
    '923672',
    'Ny. Fatma Fadiyah',
    'LMS_ASI'
  );

  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );

  Logger.log('======================================');
  Logger.log('TEST SELESAI');
  Logger.log('======================================');

}
/* ============================================================
 * TEST COMPLETE MATERI PERTAMA
 * ============================================================
 */

function WIN_LMS_TEST_COMPLETE_PERTAMA() {

  Logger.log('======================================');
  Logger.log('TEST COMPLETE MATERI PERTAMA');
  Logger.log('======================================');

  const result = WIN_LMS_completeMateri(
    'WIN-20260824122053',
    '923672',
    'LMS_BAYI_RISIKO_TINGGI'
  );

  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );

  Logger.log('======================================');
  Logger.log('TEST SELESAI');
  Logger.log('======================================');

}
