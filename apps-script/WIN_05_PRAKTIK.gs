/**
 * ============================================================
 * WIN_05_PRAKTIK.gs
 * WIN — Discharge Planning Perinatologi
 *
 * MODULE :
 * CHECKLIST PRAKTIK TERKAIT MATERI
 *
 * KONSEP :
 *
 * LMS MATERI
 *     ↓
 * CHECKLIST PRAKTIK
 *     ↓
 * IBU MENANDAI SUDAH PRAKTIK
 *     ↓
 * PERAWAT VERIFIKASI
 *
 * PRAKTIK BUKAN TAHAP TERPISAH.
 * ============================================================
 */

const WIN_PRAKTIK = {

  SHEET_NAME: 'WIN_PRAKTIK',

  HEADERS: [

    'TIMESTAMP',
    'EPISODE_ID',
    'NO_RM',
    'NAMA_IBU',
    'MATERI_ID',
    'PRAKTIK_ID',
    'URUTAN',
    'KATEGORI',
    'ITEM_PRAKTIK',
    'INSTRUKSI',
    'STATUS_IBU',
    'STATUS_PERAWAT',
    'CATATAN_IBU',
    'CATATAN_PERAWAT',
    'PERAWAT_ID',
    'NAMA_PERAWAT',
    'TGL_MULAI',
    'TGL_VERIFIKASI',
    'LAST_ACCESS'

  ],

  STATUS_IBU: {

    LOCKED: 'LOCKED',

    AVAILABLE: 'AVAILABLE',

    IN_PROGRESS: 'IN_PROGRESS',

    COMPLETED: 'COMPLETED'

  },

  STATUS_PERAWAT: {

    PENDING: 'PENDING',

    VERIFIED: 'VERIFIED',

    REVISION: 'REVISION'

  }

};


/* ============================================================
 * MASTER PRAKTIK
 * ============================================================
 */

function WIN_PRAKTIK_getMaster() {

  return [

    {
      praktikId: 'PRAK_ASI_001',
      materiId: 'LMS_ASI',
      urutan: 1,
      kategori: 'MENYUSUI',
      item: 'Mempraktikkan posisi menyusui yang benar',
      instruksi:
        'Ibu menunjukkan posisi tubuh dan bayi yang nyaman serta benar saat menyusui.'
    },

    {
      praktikId: 'PRAK_ASI_002',
      materiId: 'LMS_ASI',
      urutan: 2,
      kategori: 'MENYUSUI',
      item: 'Mempraktikkan pelekatan bayi yang benar',
      instruksi:
        'Ibu menunjukkan pelekatan bayi pada payudara dengan benar.'
    },

    {
      praktikId: 'PRAK_BAYI_001',
      materiId: 'LMS_PERAWATAN_BAYI',
      urutan: 1,
      kategori: 'PERAWATAN_BAYI',
      item: 'Mempraktikkan perawatan bayi baru lahir',
      instruksi:
        'Ibu menunjukkan langkah dasar perawatan bayi baru lahir.'
    },

    {
      praktikId: 'PRAK_SUHU_001',
      materiId: 'LMS_SUHU',
      urutan: 1,
      kategori: 'SUHU',
      item: 'Mempraktikkan cara menjaga suhu bayi',
      instruksi:
        'Ibu menunjukkan cara menjaga bayi tetap hangat sesuai edukasi.'
    },

    {
      praktikId: 'PRAK_TANDA_001',
      materiId: 'LMS_TANDA_BAHAYA',
      urutan: 1,
      kategori: 'TANDA_BAHAYA',
      item: 'Mengidentifikasi tanda bahaya pada bayi',
      instruksi:
        'Ibu dapat menyebutkan tanda bahaya bayi yang membutuhkan pertolongan.'
    },

    {
      praktikId: 'PRAK_BBLR_001',
      materiId: 'LMS_BBLR',
      urutan: 1,
      kategori: 'BBLR',
      item: 'Mempraktikkan perawatan bayi BBLR',
      instruksi:
        'Ibu menunjukkan perawatan bayi BBLR sesuai edukasi yang diberikan.'
    }

  ];

}


/* ============================================================
 * SHEET
 * ============================================================
 */

function WIN_PRAKTIK_ensureSheet() {

  const ss =
    WIN_getSpreadsheet();

  let sheet =
    ss.getSheetByName(
      WIN_PRAKTIK.SHEET_NAME
    );

  if (!sheet) {

    sheet =
      ss.insertSheet(
        WIN_PRAKTIK.SHEET_NAME
      );

    sheet
      .getRange(
        1,
        1,
        1,
        WIN_PRAKTIK.HEADERS.length
      )
      .setValues([
        WIN_PRAKTIK.HEADERS
      ]);

    sheet.setFrozenRows(1);

  }

  return sheet;

}


/* ============================================================
 * DATA
 * ============================================================
 */

function WIN_PRAKTIK_getAllData() {

  const sheet =
    WIN_PRAKTIK_ensureSheet();

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
      WIN_PRAKTIK.HEADERS.length
    )
    .getValues();

}


/* ============================================================
 * INITIALIZE PRAKTIK BERDASARKAN LMS
 * ============================================================
 */

function WIN_PRAKTIK_initializeEpisode(
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


  const progress =
    WIN_LMS_getProgress(
      episodeId,
      noRM
    );


  if (!progress.success) {

    return progress;

  }


  const master =
    WIN_PRAKTIK_getMaster();


  const sheet =
    WIN_PRAKTIK_ensureSheet();


  const existing =
    WIN_PRAKTIK_getAllData();


  const rows = [];


  master.forEach(function(item) {

    const materi =
      progress.materi.find(function(m) {

        return (
          m.materiId ===
          item.materiId
        );

      });


    /*
     * Praktik hanya dibuat jika
     * materi tersebut merupakan materi WAJIB.
     */

    if (
      !materi ||
      !materi.wajib
    ) {

      return;

    }


    const already =
      existing.some(function(row) {

        return (

          String(row[1] || '') ===
            String(episodeId) &&

          String(row[2] || '') ===
            String(noRM) &&

          String(row[5] || '') ===
            String(item.praktikId)

        );

      });


    if (already) {
      return;
    }


    rows.push([

      new Date(),

      episodeId,

      noRM,

      namaIbu || '',

      item.materiId,

      item.praktikId,

      item.urutan,

      item.kategori,

      item.item,

      item.instruksi,

      WIN_PRAKTIK.STATUS_IBU.AVAILABLE,

      WIN_PRAKTIK.STATUS_PERAWAT.PENDING,

      '',

      '',

      '',

      '',

      '',

      '',

      ''

    ]);

  });


  if (rows.length > 0) {

    sheet
      .getRange(
        sheet.getLastRow() + 1,
        1,
        rows.length,
        WIN_PRAKTIK.HEADERS.length
      )
      .setValues(rows);

  }


  return {

    success: true,

    message:
      'Checklist praktik berhasil diinisialisasi.',

    episodeId:
      episodeId,

    noRM:
      noRM,

    jumlahItem:
      rows.length

  };

}


/* ============================================================
 * GET PRAKTIK BERDASARKAN MATERI
 * ============================================================
 */

function WIN_PRAKTIK_getByMateri(
  episodeId,
  noRM,
  materiId
) {

  const data =
    WIN_PRAKTIK_getAllData();


  return {

    success: true,

    praktik:
      data
        .filter(function(row) {

          return (

            String(row[1] || '') ===
              String(episodeId) &&

            String(row[2] || '') ===
              String(noRM) &&

            String(row[4] || '') ===
              String(materiId)

          );

        })
        .map(function(row) {

          return {

            materiId:
              row[4],

            praktikId:
              row[5],

            urutan:
              row[6],

            kategori:
              row[7],

            item:
              row[8],

            instruksi:
              row[9],

            statusIbu:
              row[10],

            statusPerawat:
              row[11],

            catatanIbu:
              row[12],

            catatanPerawat:
              row[13],

            perawatId:
              row[14],

            namaPerawat:
              row[15],

            mulai:
              row[16],

            verifikasi:
              row[17],

            lastAccess:
              row[18]

          };

        })

  };

}


/* ============================================================
 * IBU MULAI PRAKTIK
 * ============================================================
 */

function WIN_PRAKTIK_start(
  episodeId,
  noRM,
  praktikId
) {

  const sheet =
    WIN_PRAKTIK_ensureSheet();

  const data =
    WIN_PRAKTIK_getAllData();


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

      String(data[i][5] || '') ===
        String(praktikId)

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
        'Praktik tidak ditemukan.'

    };

  }


  const now =
    new Date();


  sheet
    .getRange(
      rowNumber,
      11
    )
    .setValue(
      WIN_PRAKTIK.STATUS_IBU.IN_PROGRESS
    );


  sheet
    .getRange(
      rowNumber,
      17
    )
    .setValue(now);


  sheet
    .getRange(
      rowNumber,
      19
    )
    .setValue(now);


  return {

    success: true,

    praktikId:
      praktikId

  };

}


/* ============================================================
 * IBU MENYELESAIKAN PRAKTIK
 * ============================================================
 */

function WIN_PRAKTIK_complete(
  episodeId,
  noRM,
  praktikId,
  catatanIbu
) {

  const sheet =
    WIN_PRAKTIK_ensureSheet();

  const data =
    WIN_PRAKTIK_getAllData();


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

      String(data[i][5] || '') ===
        String(praktikId)

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
        'Praktik tidak ditemukan.'

    };

  }


  const now =
    new Date();


  sheet
    .getRange(
      rowNumber,
      11
    )
    .setValue(
      WIN_PRAKTIK.STATUS_IBU.COMPLETED
    );


  sheet
    .getRange(
      rowNumber,
      13
    )
    .setValue(
      catatanIbu || ''
    );


  sheet
    .getRange(
      rowNumber,
      19
    )
    .setValue(now);


  return {

    success: true,

    message:
      'Checklist praktik berhasil disimpan.',

    praktikId:
      praktikId

  };

}


/* ============================================================
 * VERIFIKASI PERAWAT
 * ============================================================
 */

function WIN_PRAKTIK_verify(
  episodeId,
  noRM,
  praktikId,
  perawatId,
  namaPerawat,
  hasil,
  catatanPerawat
) {

  hasil =
    String(hasil || '')
      .trim()
      .toUpperCase();


  if (

    hasil !==
      WIN_PRAKTIK.STATUS_PERAWAT.VERIFIED &&

    hasil !==
      WIN_PRAKTIK.STATUS_PERAWAT.REVISION

  ) {

    return {

      success: false,

      message:
        'Hasil verifikasi tidak valid.'

    };

  }


  const sheet =
    WIN_PRAKTIK_ensureSheet();

  const data =
    WIN_PRAKTIK_getAllData();


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

      String(data[i][5] || '') ===
        String(praktikId)

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
        'Praktik tidak ditemukan.'

    };

  }


  const now =
    new Date();


  sheet
    .getRange(
      rowNumber,
      12
    )
    .setValue(hasil);


  sheet
    .getRange(
      rowNumber,
      14
    )
    .setValue(
      catatanPerawat || ''
    );


  sheet
    .getRange(
      rowNumber,
      15
    )
    .setValue(
      perawatId
    );


  sheet
    .getRange(
      rowNumber,
      16
    )
    .setValue(
      namaPerawat || ''
    );


  sheet
    .getRange(
      rowNumber,
      18
    )
    .setValue(now);


  sheet
    .getRange(
      rowNumber,
      19
    )
    .setValue(now);


  if (

    hasil ===
    WIN_PRAKTIK.STATUS_PERAWAT.REVISION

  ) {

    sheet
      .getRange(
        rowNumber,
        11
      )
      .setValue(
        WIN_PRAKTIK.STATUS_IBU.IN_PROGRESS
      );

  }


  return {

    success: true,

    praktikId:
      praktikId,

    hasil:
      hasil

  };

}


/* ============================================================
 * CEK PRAKTIK SELESAI
 * ============================================================
 */

function WIN_PRAKTIK_isComplete(
  episodeId,
  noRM
) {

  const data =
    WIN_PRAKTIK_getAllData();


  const rows =
    data.filter(function(row) {

      return (

        String(row[1] || '') ===
          String(episodeId) &&

        String(row[2] || '') ===
          String(noRM)

      );

    });


  if (rows.length === 0) {
    return true;
  }


  return rows.every(function(row) {

    return (

      row[10] ===
        WIN_PRAKTIK.STATUS_IBU.COMPLETED &&

      row[11] ===
        WIN_PRAKTIK.STATUS_PERAWAT.VERIFIED

    );

  });

}


/* ============================================================
 * DASHBOARD PRAKTIK
 * ============================================================
 */

function WIN_PRAKTIK_getDashboardData(
  episodeId,
  noRM
) {

  const data =
    WIN_PRAKTIK_getAllData();


  const praktik =
    data
      .filter(function(row) {

        return (

          String(row[1] || '') ===
            String(episodeId) &&

          String(row[2] || '') ===
            String(noRM)

        );

      })
      .map(function(row) {

        return {

          materiId:
            row[4],

          praktikId:
            row[5],

          kategori:
            row[7],

          item:
            row[8],

          instruksi:
            row[9],

          statusIbu:
            row[10],

          statusPerawat:
            row[11],

          catatanIbu:
            row[12],

          catatanPerawat:
            row[13]

        };

      });


  const selesai =
    praktik.filter(function(item) {

      return (

        item.statusIbu ===
          WIN_PRAKTIK.STATUS_IBU.COMPLETED &&

        item.statusPerawat ===
          WIN_PRAKTIK.STATUS_PERAWAT.VERIFIED

      );

    });


  return {

    success: true,

    episodeId:
      episodeId,

    noRM:
      noRM,

    total:
      praktik.length,

    selesai:
      selesai.length,

    persentase:
      praktik.length > 0
        ? Math.round(
            (
              selesai.length /
              praktik.length
            ) * 100
          )
        : 100,

    selesaiSemua:
      WIN_PRAKTIK_isComplete(
        episodeId,
        noRM
      ),

    praktik:
      praktik

  };

}


/* ============================================================
 * TEST
 * ============================================================
 */

function WIN_PRAKTIK_TEST() {

  const sheet =
    WIN_PRAKTIK_ensureSheet();

  Logger.log(
    'WIN_PRAKTIK aktif: ' +
    sheet.getName()
  );

  Logger.log(
    JSON.stringify(
      WIN_PRAKTIK_getMaster(),
      null,
      2
    )
  );

}
