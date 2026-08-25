/**
 * ============================================================
 * WIN_06_EVALUASI.gs
 * WIN — Discharge Planning Perinatologi
 *
 * MODULE : EVALUASI / POST TEST
 *
 * ALUR :
 *   LMS selesai
 *      ↓
 *   PRAKTIK selesai + verifikasi perawat
 *      ↓
 *   EVALUASI TERBUKA
 *      ↓
 *   IBU MENGERJAKAN SOAL
 *      ↓
 *   SISTEM MENGHITUNG NILAI
 *      ↓
 *   LULUS / TIDAK LULUS
 *      ↓
 *   JIKA LULUS → CERTIFICATE
 *
 * DEPENDENCY :
 *   WIN_01_CONFIG.gs
 *   WIN_02_EPISODE.gs
 *   WIN_04_LMS.gs
 *   WIN_05_PRAKTIK.gs
 *
 * NEXT :
 *   WIN_07_CERTIFICATE.gs
 * ============================================================
 */


/* ============================================================
 * 1. KONFIGURASI EVALUASI
 * ============================================================
 */

const WIN_EVALUASI = {

  SHEET_NAME: 'WIN_EVALUASI',

  HEADERS: [
    'TIMESTAMP',
    'EPISODE_ID',
    'NO_RM',
    'NAMA_IBU',
    'EVALUASI_ID',
    'URUTAN',
    'SOAL',
    'OPSI_A',
    'OPSI_B',
    'OPSI_C',
    'OPSI_D',
    'JAWABAN_BENAR',
    'JAWABAN_IBU',
    'BENAR',
    'NILAI_SOAL',
    'STATUS'
  ],

  RESULT_SHEET_NAME: 'WIN_EVALUASI_HASIL',

  RESULT_HEADERS: [
    'TIMESTAMP',
    'EPISODE_ID',
    'NO_RM',
    'NAMA_IBU',
    'JUMLAH_SOAL',
    'JUMLAH_BENAR',
    'NILAI',
    'BATAS_LULUS',
    'STATUS',
    'TANGGAL_EVALUASI'
  ],

  STATUS: {
    LOCKED: 'LOCKED',
    AVAILABLE: 'AVAILABLE',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED'
  },

  HASIL: {
    LULUS: 'LULUS',
    TIDAK_LULUS: 'TIDAK LULUS'
  },

  BATAS_LULUS: 80

};


/* ============================================================
 * 2. MASTER SOAL
 *
 * SOAL DI SINI ADALAH CONTOH AWAL.
 *
 * NANTI SOAL FINAL DAPAT DIGANTI SESUAI INSTRUMEN WIN.
 * ============================================================
 */

function WIN_EVALUASI_getMasterSoal() {

  return [

    {
      evaluasiId: 'EVAL_001',
      urutan: 1,
      soal:
        'Kapan bayi sebaiknya mulai mendapatkan ASI setelah lahir?',
      opsiA:
        'Sesegera mungkin sesuai kondisi ibu dan bayi',
      opsiB:
        'Setelah 12 jam',
      opsiC:
        'Setelah 24 jam',
      opsiD:
        'Setelah bayi diberi makanan tambahan',
      benar: 'A'
    },

    {
      evaluasiId: 'EVAL_002',
      urutan: 2,
      soal:
        'Apa salah satu tanda pelekatan menyusui yang baik?',
      opsiA:
        'Bayi hanya mengisap puting',
      opsiB:
        'Mulut bayi terbuka lebar dan sebagian besar areola masuk',
      opsiC:
        'Bayi selalu menangis saat menyusu',
      opsiD:
        'Ibu merasakan nyeri berat sepanjang menyusui',
      benar: 'B'
    },

    {
      evaluasiId: 'EVAL_003',
      urutan: 3,
      soal:
        'Bagaimana prinsip perawatan tali pusat bayi?',
      opsiA:
        'Selalu ditutup rapat dengan bedak',
      opsiB:
        'Diberi berbagai ramuan',
      opsiC:
        'Dijaga tetap bersih dan kering',
      opsiD:
        'Direndam setiap hari',
      benar: 'C'
    },

    {
      evaluasiId: 'EVAL_004',
      urutan: 4,
      soal:
        'Manakah yang termasuk tanda bahaya pada bayi?',
      opsiA:
        'Bayi menyusu dengan baik',
      opsiB:
        'Bayi aktif bergerak',
      opsiC:
        'Bayi sulit bernapas atau tampak sesak',
      opsiD:
        'Bayi tidur setelah menyusu',
      benar: 'C'
    },

    {
      evaluasiId: 'EVAL_005',
      urutan: 5,
      soal:
        'Apa yang harus dilakukan jika ibu mengalami perdarahan banyak setelah persalinan?',
      opsiA:
        'Menunggu sampai berhenti sendiri',
      opsiB:
        'Segera mencari pertolongan tenaga kesehatan',
      opsiC:
        'Tidur terlebih dahulu',
      opsiD:
        'Mengurangi minum',
      benar: 'B'
    },

    {
      evaluasiId: 'EVAL_006',
      urutan: 6,
      soal:
        'Apa tujuan utama menjaga kebersihan tangan sebelum merawat bayi?',
      opsiA:
        'Agar tangan terasa dingin',
      opsiB:
        'Mengurangi risiko penularan infeksi',
      opsiC:
        'Agar bayi cepat tidur',
      opsiD:
        'Agar kulit bayi lebih putih',
      benar: 'B'
    },

    {
      evaluasiId: 'EVAL_007',
      urutan: 7,
      soal:
        'Jika bayi tampak sangat lemas dan tidak mau menyusu, apa tindakan yang tepat?',
      opsiA:
        'Menunggu sampai esok hari',
      opsiB:
        'Memberikan makanan padat',
      opsiC:
        'Segera mencari pertolongan tenaga kesehatan',
      opsiD:
        'Memandikan bayi',
      benar: 'C'
    },

    {
      evaluasiId: 'EVAL_008',
      urutan: 8,
      soal:
        'Mengapa ibu perlu mengetahui tanda bahaya setelah pulang?',
      opsiA:
        'Agar dapat mengenali kondisi yang membutuhkan pertolongan',
      opsiB:
        'Agar tidak perlu kontrol',
      opsiC:
        'Agar tidak perlu bertanya kepada tenaga kesehatan',
      opsiD:
        'Agar dapat menghentikan semua obat',
      benar: 'A'
    },

    {
      evaluasiId: 'EVAL_009',
      urutan: 9,
      soal:
        'Apa yang sebaiknya dilakukan bila ibu atau bayi mengalami kondisi yang mengkhawatirkan setelah pulang?',
      opsiA:
        'Mengabaikannya',
      opsiB:
        'Mencari pertolongan sesuai arahan tenaga kesehatan',
      opsiC:
        'Menunggu satu minggu',
      opsiD:
        'Menghentikan ASI',
      benar: 'B'
    },

    {
      evaluasiId: 'EVAL_010',
      urutan: 10,
      soal:
        'Apa tujuan utama discharge planning?',
      opsiA:
        'Memastikan ibu dan keluarga siap melanjutkan perawatan di rumah',
      opsiB:
        'Mengurangi komunikasi dengan tenaga kesehatan',
      opsiC:
        'Menggantikan seluruh peran tenaga kesehatan',
      opsiD:
        'Menghilangkan kebutuhan kontrol',
      benar: 'A'
    }

  ];

}


/* ============================================================
 * 3. MEMBUAT SHEET EVALUASI
 * ============================================================
 */

function WIN_EVALUASI_ensureSheet() {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  let sheet =
    ss.getSheetByName(
      WIN_EVALUASI.SHEET_NAME
    );

  if (!sheet) {

    sheet =
      ss.insertSheet(
        WIN_EVALUASI.SHEET_NAME
      );

    sheet
      .getRange(
        1,
        1,
        1,
        WIN_EVALUASI.HEADERS.length
      )
      .setValues([
        WIN_EVALUASI.HEADERS
      ]);

    sheet.setFrozenRows(1);

  }

  return sheet;

}


/* ============================================================
 * 4. MEMBUAT SHEET HASIL
 * ============================================================
 */

function WIN_EVALUASI_ensureResultSheet() {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  let sheet =
    ss.getSheetByName(
      WIN_EVALUASI.RESULT_SHEET_NAME
    );

  if (!sheet) {

    sheet =
      ss.insertSheet(
        WIN_EVALUASI.RESULT_SHEET_NAME
      );

    sheet
      .getRange(
        1,
        1,
        1,
        WIN_EVALUASI.RESULT_HEADERS.length
      )
      .setValues([
        WIN_EVALUASI.RESULT_HEADERS
      ]);

    sheet.setFrozenRows(1);

  }

  return sheet;

}


/* ============================================================
 * 5. MENGAMBIL DATA EVALUASI
 * ============================================================
 */

function WIN_EVALUASI_getAllData() {

  const sheet =
    WIN_EVALUASI_ensureSheet();

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
      WIN_EVALUASI.HEADERS.length
    )
    .getValues();

}


/* ============================================================
 * 6. CEK APAKAH PRAKTIK SUDAH SELESAI
 * ============================================================
 */

function WIN_EVALUASI_isPraktikComplete(
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
      'Gagal mengecek praktik: ' +
      error.message
    );

  }

  return false;

}


/* ============================================================
 * 7. INISIALISASI EVALUASI
 * ============================================================
 */

function WIN_EVALUASI_initializeEpisode(
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


  /*
   * Evaluasi hanya dibuka apabila praktik
   * telah selesai dan diverifikasi.
   */

  if (
    !WIN_EVALUASI_isPraktikComplete(
      episodeId,
      noRM
    )
  ) {

    return {

      success: false,

      locked: true,

      message:
        'Evaluasi belum terbuka. Selesaikan seluruh praktik dan verifikasi perawat terlebih dahulu.'

    };

  }


  const sheet =
    WIN_EVALUASI_ensureSheet();

  const master =
    WIN_EVALUASI_getMasterSoal();

  const existing =
    WIN_EVALUASI_getAllData();


  const existingSoal =
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


  master.forEach(function(soal) {

    if (
      existingSoal.indexOf(
        soal.evaluasiId
      ) !== -1
    ) {

      return;

    }


    rows.push([

      new Date(),

      episodeId,

      noRM,

      namaIbu || '',

      soal.evaluasiId,

      soal.urutan,

      soal.soal,

      soal.opsiA,

      soal.opsiB,

      soal.opsiC,

      soal.opsiD,

      soal.benar,

      '',

      '',

      0,

      WIN_EVALUASI.STATUS.AVAILABLE

    ]);

  });


  if (rows.length > 0) {

    sheet
      .getRange(
        sheet.getLastRow() + 1,
        1,
        rows.length,
        WIN_EVALUASI.HEADERS.length
      )
      .setValues(rows);

  }


  return {

    success: true,

    message:
      'Evaluasi berhasil diinisialisasi.',

    episodeId:
      episodeId,

    noRM:
      noRM,

    jumlahSoal:
      master.length

  };

}


/* ============================================================
 * 8. MENGAMBIL SOAL UNTUK IBU
 *
 * JAWABAN BENAR TIDAK DIKIRIM KE FRONT END.
 * ============================================================
 */

function WIN_EVALUASI_getQuestions(
  episodeId,
  noRM
) {

  if (!episodeId || !noRM) {

    return {

      success: false,

      message:
        'Episode ID dan No. RM wajib diisi.',

      questions: []

    };

  }


  const master =
    WIN_EVALUASI_getMasterSoal();

  const data =
    WIN_EVALUASI_getAllData();


  const questions = [];


  master.forEach(function(soal) {

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
          String(soal.evaluasiId)

      ) {

        found =
          data[i];

        break;

      }

    }


    questions.push({

      evaluasiId:
        soal.evaluasiId,

      urutan:
        soal.urutan,

      soal:
        soal.soal,

      opsiA:
        soal.opsiA,

      opsiB:
        soal.opsiB,

      opsiC:
        soal.opsiC,

      opsiD:
        soal.opsiD,

      jawabanIbu:
        found
          ? found[12]
          : '',

      status:
        found
          ? found[15]
          : WIN_EVALUASI.STATUS.LOCKED

    });

  });


  return {

    success: true,

    episodeId:
      episodeId,

    noRM:
      noRM,

    totalSoal:
      questions.length,

    questions:
      questions

  };

}


/* ============================================================
 * 9. MENYIMPAN JAWABAN IBU
 * ============================================================
 */

function WIN_EVALUASI_saveAnswer(
  episodeId,
  noRM,
  evaluasiId,
  jawaban
) {

  if (
    !episodeId ||
    !noRM ||
    !evaluasiId
  ) {

    return {

      success: false,

      message:
        'Data evaluasi belum lengkap.'

    };

  }


  jawaban =
    String(jawaban || '')
      .trim()
      .toUpperCase();


  if (
    ['A', 'B', 'C', 'D']
      .indexOf(jawaban) === -1
  ) {

    return {

      success: false,

      message:
        'Jawaban harus A, B, C, atau D.'

    };

  }


  const sheet =
    WIN_EVALUASI_ensureSheet();

  const data =
    WIN_EVALUASI_getAllData();


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
        String(evaluasiId)

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
        'Soal evaluasi tidak ditemukan.'

    };

  }


  sheet
    .getRange(
      rowNumber,
      13
    )
    .setValue(jawaban);


  sheet
    .getRange(
      rowNumber,
      16
    )
    .setValue(
      WIN_EVALUASI.STATUS.IN_PROGRESS
    );


  return {

    success: true,

    evaluasiId:
      evaluasiId,

    jawaban:
      jawaban

  };

}


/* ============================================================
 * 10. SUBMIT EVALUASI
 *
 * SISTEM MENGHITUNG NILAI DI SERVER.
 * ============================================================
 */

function WIN_EVALUASI_submit(
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
    WIN_EVALUASI_ensureSheet();

  const resultSheet =
    WIN_EVALUASI_ensureResultSheet();

  const data =
    WIN_EVALUASI_getAllData();


  const rows = data.filter(function(row) {

    return (

      String(row[1] || '') ===
        String(episodeId) &&

      String(row[2] || '') ===
        String(noRM)

    );

  });


  if (rows.length === 0) {

    return {

      success: false,

      message:
        'Belum ada soal evaluasi.'

    };

  }


  /*
   * Pastikan semua soal sudah dijawab.
   */

  const belumDijawab =
    rows.filter(function(row) {

      return !String(
        row[12] || ''
      ).trim();

    });


  if (belumDijawab.length > 0) {

    return {

      success: false,

      belumLengkap: true,

      jumlahBelumDijawab:
        belumDijawab.length,

      message:
        'Semua soal harus dijawab sebelum evaluasi dikirim.'

    };

  }


  let jumlahBenar = 0;


  rows.forEach(function(row) {

    const jawabanBenar =
      String(
        row[11] || ''
      )
      .trim()
      .toUpperCase();


    const jawabanIbu =
      String(
        row[12] || ''
      )
      .trim()
      .toUpperCase();


    const benar =
      jawabanBenar ===
      jawabanIbu;


    if (benar) {
      jumlahBenar++;
    }


    const rowNumber =
      data.indexOf(row) + 2;


    sheet
      .getRange(
        rowNumber,
        14
      )
      .setValue(
        benar
          ? 'YA'
          : 'TIDAK'
      );


    sheet
      .getRange(
        rowNumber,
        15
      )
      .setValue(
        benar
          ? 100 / rows.length
          : 0
      );


    sheet
      .getRange(
        rowNumber,
        16
      )
      .setValue(
        WIN_EVALUASI.STATUS.COMPLETED
      );

  });


  const jumlahSoal =
    rows.length;


  const nilai =
    Math.round(
      (jumlahBenar / jumlahSoal) * 100
    );


  const status =
    nilai >=
    WIN_EVALUASI.BATAS_LULUS

      ? WIN_EVALUASI.HASIL.LULUS
      : WIN_EVALUASI.HASIL.TIDAK_LULUS;


  const now =
    new Date();


  resultSheet
    .appendRow([

      now,

      episodeId,

      noRM,

      namaIbu || rows[0][3] || '',

      jumlahSoal,

      jumlahBenar,

      nilai,

      WIN_EVALUASI.BATAS_LULUS,

      status,

      now

    ]);


  return {

    success: true,

    episodeId:
      episodeId,

    noRM:
      noRM,

    jumlahSoal:
      jumlahSoal,

    jumlahBenar:
      jumlahBenar,

    nilai:
      nilai,

    batasLulus:
      WIN_EVALUASI.BATAS_LULUS,

    status:
      status,

    dapatCertificate:
      status ===
      WIN_EVALUASI.HASIL.LULUS

  };

}


/* ============================================================
 * 11. MENGAMBIL HASIL TERAKHIR
 * ============================================================
 */

function WIN_EVALUASI_getLatestResult(
  episodeId,
  noRM
) {

  const sheet =
    WIN_EVALUASI_ensureResultSheet();

  const lastRow =
    sheet.getLastRow();


  if (lastRow < 2) {

    return {

      success: false,

      message:
        'Belum ada hasil evaluasi.'

    };

  }


  const data =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        WIN_EVALUASI.RESULT_HEADERS.length
      )
      .getValues();


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

    return {

      success: false,

      message:
        'Belum ada hasil evaluasi.'

    };

  }


  const row =
    rows[rows.length - 1];


  return {

    success: true,

    timestamp:
      row[0],

    episodeId:
      row[1],

    noRM:
      row[2],

    namaIbu:
      row[3],

    jumlahSoal:
      row[4],

    jumlahBenar:
      row[5],

    nilai:
      row[6],

    batasLulus:
      row[7],

    status:
      row[8],

    tanggal:
      row[9]

  };

}


/* ============================================================
 * 12. CEK KELULUSAN EVALUASI
 * ============================================================
 */

function WIN_EVALUASI_isPassed(
  episodeId,
  noRM
) {

  const result =
    WIN_EVALUASI_getLatestResult(
      episodeId,
      noRM
    );


  if (!result.success) {
    return false;
  }


  return (
    result.status ===
    WIN_EVALUASI.HASIL.LULUS
  );

}


/* ============================================================
 * 13. DASHBOARD EVALUASI
 * ============================================================
 */

function WIN_EVALUASI_getDashboardData(
  episodeId,
  noRM
) {

  const questions =
    WIN_EVALUASI_getQuestions(
      episodeId,
      noRM
    );


  const result =
    WIN_EVALUASI_getLatestResult(
      episodeId,
      noRM
    );


  return {

    success: true,

    episodeId:
      episodeId,

    noRM:
      noRM,

    totalSoal:
      questions.totalSoal || 0,

    sudahDikerjakan:
      questions.questions
        ? questions.questions.filter(
            function(item) {
              return !!item.jawabanIbu;
            }
          ).length
        : 0,

    hasil:
      result.success
        ? result
        : null,

    lulus:
      result.success
        ? result.status ===
          WIN_EVALUASI.HASIL.LULUS
        : false

  };

}


/* ============================================================
 * 14. RESET EVALUASI
 *
 * Digunakan jika nanti kebijakan WIN mengizinkan
 * ibu mengulang evaluasi.
 * ============================================================
 */

function WIN_EVALUASI_reset(
  episodeId,
  noRM
) {

  const sheet =
    WIN_EVALUASI_ensureSheet();

  const data =
    WIN_EVALUASI_getAllData();


  let count = 0;


  data.forEach(function(row, index) {

    if (

      String(row[1] || '') ===
        String(episodeId) &&

      String(row[2] || '') ===
        String(noRM)

    ) {

      const rowNumber =
        index + 2;


      sheet
        .getRange(
          rowNumber,
          13,
          1,
          4
        )
        .setValues([[
          '',
          '',
          0,
          WIN_EVALUASI.STATUS.AVAILABLE
        ]]);


      count++;

    }

  });


  return {

    success: true,

    message:
      'Evaluasi berhasil direset.',

    jumlahSoal:
      count

  };

}


/* ============================================================
 * 15. TEST MANUAL
 * ============================================================
 */

function WIN_EVALUASI_TEST() {

  const sheet =
    WIN_EVALUASI_ensureSheet();

  const resultSheet =
    WIN_EVALUASI_ensureResultSheet();


  Logger.log(
    'WIN_EVALUASI aktif: ' +
    sheet.getName()
  );

  Logger.log(
    'WIN_EVALUASI_HASIL aktif: ' +
    resultSheet.getName()
  );

  Logger.log(
    WIN_EVALUASI_getMasterSoal()
  );

}
