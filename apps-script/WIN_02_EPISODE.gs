// =====================================================
// WIN DISCHARGE PLANNING
// WIN_02_EPISODE.gs
// Engine pengelolaan episode pasien
// =====================================================


// =====================================================
// TEST ENGINE
// =====================================================

function WIN_02_TEST_EPISODE() {

  Logger.log("================================");
  Logger.log("WIN_02_EPISODE TEST DIMULAI");

  const ss = WIN_getSpreadsheet();

  Logger.log(
    "Spreadsheet: " + ss.getName()
  );

  Logger.log(
    "Source: " +
    WIN_CONFIG.SOURCE_SHEET
  );

  Logger.log(
    "Episode: " +
    WIN_CONFIG.EPISODE_SHEET
  );

  // Pastikan semua sheet WIN tersedia
  WIN_checkSheets();

  Logger.log("Semua sheet WIN ditemukan.");

  Logger.log("================================");
  Logger.log("WIN_02_EPISODE BERHASIL");
  Logger.log("Lanjut WIN_03.");

  return "WIN_02_EPISODE OK";
}


// =====================================================
// MENGAMBIL SHEET SUMBER
// =====================================================

function WIN_02_GET_SOURCE_SHEET() {

  return WIN_getSheet(
    WIN_CONFIG.SOURCE_SHEET
  );

}


// =====================================================
// MENGAMBIL SHEET EPISODE
// =====================================================

function WIN_02_GET_EPISODE_SHEET() {

  return WIN_getSheet(
    WIN_CONFIG.EPISODE_SHEET
  );

}


// =====================================================
// MEMBUAT ID EPISODE
// =====================================================

function WIN_02_CREATE_EPISODE_ID() {

  const now = new Date();

  const timestamp =
    Utilities.formatDate(
      now,
      WIN_CONFIG.TIMEZONE,
      "yyyyMMddHHmmss"
    );

  return (
    WIN_CONFIG.EPISODE_PREFIX +
    "-" +
    timestamp
  );

}


// =====================================================
// MEMBUAT OBJECT EPISODE BARU
// =====================================================

function WIN_02_NEW_EPISODE(data) {

  data = data || {};

  const episode = {

    episodeId:
      WIN_02_CREATE_EPISODE_ID(),

    episodeName:
      WIN_CONFIG.EPISODE_SHEET,

    source:
      WIN_CONFIG.SOURCE_SHEET,

    status:
      WIN_CONFIG.STATUS_AUTO_CREATED,

    createdAt:
      new Date(),

    patientId:
      data.patientId || "",

    namaPasien:
      data.namaPasien || "",

    noRM:
      data.noRM || "",

    tanggalMRS:
      data.tanggalMRS || "",

    level:
      data.level || "",

    diagnosis:
      data.diagnosis || ""

  };

  Logger.log(
    "Episode baru dibuat:"
  );

  Logger.log(
    JSON.stringify(episode)
  );

  return episode;

}


// =====================================================
// MEMBUKA EPISODE
// =====================================================

function WIN_02_OPEN_EPISODE(data) {

  const episode =
    WIN_02_NEW_EPISODE(data);

  episode.status =
    WIN_CONFIG.STATUS_AUTO_CREATED;

  episode.openedAt =
    new Date();

  Logger.log(
    "Episode OPEN: " +
    episode.episodeId
  );

  return episode;

}


// =====================================================
// MENUTUP EPISODE
// =====================================================

function WIN_02_CLOSE_EPISODE(
  episode,
  statusAkhir
) {

  if (!episode) {

    throw new Error(
      "Object episode tidak ditemukan."
    );

  }

  episode.status =
    "CLOSED";

  episode.statusAkhir =
    statusAkhir || "SELESAI";

  episode.closedAt =
    new Date();

  Logger.log(
    "Episode CLOSED: " +
    episode.episodeId
  );

  Logger.log(
    "Status akhir: " +
    episode.statusAkhir
  );

  return episode;

}


// =====================================================
// MEMBUAT EPISODE LANJUTAN
// =====================================================
//
// Belum melakukan COPY BARIS ke NICU_LEVEL_2.
// Ini hanya menyiapkan struktur episode berikutnya.
//
// Proses COPY akan kita buat pada engine berikutnya
// setelah struktur episode dipastikan benar.
// =====================================================

function WIN_02_CREATE_NEXT_EPISODE(
  currentEpisode,
  nextLevel,
  nextDate
) {

  if (!currentEpisode) {

    throw new Error(
      "Episode sebelumnya tidak ditemukan."
    );

  }

  const nextEpisode = {

    episodeId:
      WIN_02_CREATE_EPISODE_ID(),

    previousEpisodeId:
      currentEpisode.episodeId || "",

    episodeName:
      WIN_CONFIG.EPISODE_SHEET,

    source:
      WIN_CONFIG.SOURCE_SHEET,

    status:
      WIN_CONFIG.STATUS_AUTO_CREATED,

    createdAt:
      new Date(),

    patientId:
      currentEpisode.patientId || "",

    namaPasien:
      currentEpisode.namaPasien || "",

    noRM:
      currentEpisode.noRM || "",

    tanggalMRS:
      nextDate || "",

    level:
      nextLevel || "",

    diagnosis:
      currentEpisode.diagnosis || ""

  };

  Logger.log(
    "================================"
  );

  Logger.log(
    "EPISODE LANJUTAN"
  );

  Logger.log(
    JSON.stringify(nextEpisode)
  );

  Logger.log(
    "================================"
  );

  return nextEpisode;

}


// =====================================================
// TEST OPEN EPISODE
// =====================================================

function WIN_02_TEST_OPEN_EPISODE() {

  const episode =
    WIN_02_OPEN_EPISODE({

      patientId: "TEST-001",

      namaPasien:
        "PASIEN TEST",

      noRM:
        "000001",

      tanggalMRS:
        new Date(),

      level:
        "LEVEL 2",

      diagnosis:
        "TEST DIAGNOSIS"

    });

  Logger.log(
    JSON.stringify(episode)
  );

}


// =====================================================
// TEST CLOSE EPISODE
// =====================================================

function WIN_02_TEST_CLOSE_EPISODE() {

  const episode =
    WIN_02_OPEN_EPISODE({

      patientId: "TEST-001",

      namaPasien:
        "PASIEN TEST",

      noRM:
        "000001",

      level:
        "LEVEL 2"

    });

  const closed =
    WIN_02_CLOSE_EPISODE(
      episode,
      "LANJUT LEVEL 3"
    );

  Logger.log(
    JSON.stringify(closed)
  );

}


// =====================================================
// TEST EPISODE LANJUTAN
// =====================================================

function WIN_02_TEST_NEXT_EPISODE() {

  const episode =
    WIN_02_OPEN_EPISODE({

      patientId:
        "TEST-001",

      namaPasien:
        "PASIEN TEST",

      noRM:
        "000001",

      level:
        "LEVEL 2",

      diagnosis:
        "TEST DIAGNOSIS"

    });


  const closed =
    WIN_02_CLOSE_EPISODE(
      episode,
      "LANJUT LEVEL 3"
    );


  const next =
    WIN_02_CREATE_NEXT_EPISODE(
      closed,
      "LEVEL 3",
      new Date()
    );


  Logger.log(
    "EPISODE BERIKUTNYA:"
  );

  Logger.log(
    JSON.stringify(next)
  );
}


// =====================================================
// WIN AUTO CREATE EPISODE
// Tambahan untuk menghubungkan NICU_LEVEL_2
// ke WIN_DISCHARGE_PLANNING
// =====================================================


// =====================================================
// AUTO CREATE DARI 1 BARIS NICU_LEVEL_2
// =====================================================

function WIN_02_AUTO_CREATE_FROM_NICU2(sheet, row) {

  try {

    if (!sheet) {
      throw new Error("Sheet sumber tidak ditemukan.");
    }

    if (
      sheet.getName() !==
      WIN_CONFIG.SOURCE_SHEET
    ) {

      return {
        ok: false,
        created: false,
        message:
          "Sheet bukan " +
          WIN_CONFIG.SOURCE_SHEET
      };

    }

    if (
      row <
      WIN_CONFIG.SOURCE_DATA_START_ROW
    ) {

      return {
        ok: false,
        created: false,
        message: "Baris data tidak valid."
      };

    }


    // =================================================
    // BACA DATA NICU LEVEL 2
    // =================================================

    const data =
      WIN_02_READ_NICU2_ROW(
        sheet,
        row
      );


    // =================================================
    // VALIDASI ID BAYI
    // =================================================

    if (!data.idBayi) {

      return {
        ok: false,
        created: false,
        message:
          "ID_BAYI kosong."
      };

    }


    // =================================================
    // CEK DUPLIKASI
    // =================================================

    const existing =
      WIN_02_FIND_EPISODE(
        data.idBayi
      );


    if (existing) {

      WIN_02_TOUCH_EPISODE(
        existing.row
      );

      return {
        ok: true,
        created: false,
        duplicate: true,
        idDP: existing.idDP,
        row: existing.row,
        message:
          "Episode WIN sudah ada untuk ID_BAYI " +
          data.idBayi
      };

    }


    // =================================================
    // BUAT EPISODE OBJECT
    // =================================================

    const episode =
      WIN_02_NEW_EPISODE({

        patientId:
          data.idBayi,

        namaPasien:
          data.namaBayi,

        noRM:
          data.noRM,

        tanggalMRS:
          data.tglMrs,

        level:
          "LEVEL 2",

        diagnosis:
          data.diagnosaPerawatan ||
          data.diagnosaAwal ||
          ""

      });


    // =================================================
    // SIMPAN KE SHEET
    // =================================================

    WIN_02_SAVE_EPISODE(
      episode,
      data
    );


    return {
      ok: true,
      created: true,
      duplicate: false,
      idDP: episode.episodeId,
      message:
        "Episode WIN berhasil dibuat."
    };


  } catch (err) {

    Logger.log(
      "WIN_02_AUTO_CREATE_FROM_NICU2 ERROR: " +
      err.message
    );

    throw err;

  }

}



// =====================================================
// BACA SATU BARIS NICU_LEVEL_2
// BERDASARKAN NAMA HEADER
// =====================================================

function WIN_02_READ_NICU2_ROW(
  sheet,
  row
) {

  const headers =
    WIN_getHeaders(
      sheet,
      WIN_CONFIG.HEADER_ROW
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


  function getValue(names) {

    if (!Array.isArray(names)) {
      names = [names];
    }


    for (
      let i = 0;
      i < names.length;
      i++
    ) {

      const target =
        String(names[i])
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "_");


      for (
        let j = 0;
        j < headers.length;
        j++
      ) {

        const current =
          String(headers[j] || "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "_");


        if (current === target) {

          return values[j];

        }

      }

    }

    return "";

  }


  return {

    idBayi:
      WIN_cleanText(
        getValue([
          "id_bayi",
          "id bayi",
          "kode_bayi",
          "kode bayi"
        ])
      ),


    noRM:
      WIN_cleanText(
        getValue([
          "no_rm",
          "no rm",
          "nomor_rm",
          "nomor rm"
        ])
      ),


    namaBayi:
      WIN_cleanText(
        getValue([
          "nama_bayi",
          "nama bayi"
        ])
      ),


    namaIbu:
      WIN_cleanText(
        getValue([
          "nama_ibu",
          "nama ibu"
        ])
      ),


    namaAyah:
      WIN_cleanText(
        getValue([
          "nama_ayah",
          "nama ayah"
        ])
      ),


    email:
      WIN_cleanText(
        getValue([
          "email"
        ])
      ),


    telp:
      WIN_cleanText(
        getValue([
          "telp",
          "no_telp",
          "no hp",
          "telepon"
        ])
      ),


    tglLahir:
      getValue([
        "tgl_lahir",
        "tgl lahir",
        "tanggal_lahir"
      ]),


    tglMrs:
      getValue([
        "tgl_mrs",
        "tanggal_mrs"
      ]),


    jenisKelamin:
      WIN_cleanText(
        getValue([
          "jk",
          "jenis_kelamin",
          "jenis kelamin"
        ])
      ),


    diagnosaAwal:
      WIN_cleanText(
        getValue([
          "diagnosa_awal",
          "diagnosa awal"
        ])
      ),


    diagnosaPerawatan:
      WIN_cleanText(
        getValue([
          "diagnosa_perawatan",
          "diagnosa perawatan"
        ])
      )

  };

}



// =====================================================
// CARI EPISODE BERDASARKAN ID BAYI
// =====================================================

function WIN_02_FIND_EPISODE(
  idBayi
) {

  const sheet =
    WIN_getSheet(
      WIN_CONFIG.EPISODE_SHEET
    );


  const lastRow =
    sheet.getLastRow();


  if (
    lastRow <
    WIN_CONFIG.WIN_DATA_START_ROW
  ) {

    return null;

  }


  const idCol =
    WIN_findColumn(
      sheet,
      "ID_BAYI",
      WIN_CONFIG.WIN_HEADER_ROW
    );


  const episodeCol =
    WIN_findColumn(
      sheet,
      "NO_EPISODE",
      WIN_CONFIG.WIN_HEADER_ROW
    );


  if (idCol < 1) {

    throw new Error(
      "Kolom ID_BAYI tidak ditemukan."
    );

  }


  const rows =
    sheet
      .getRange(
        WIN_CONFIG.WIN_DATA_START_ROW,
        1,
        lastRow -
        WIN_CONFIG.WIN_DATA_START_ROW +
        1,
        sheet.getLastColumn()
      )
      .getValues();


  const target =
    String(idBayi)
      .trim()
      .toUpperCase();


  for (
    let i = 0;
    i < rows.length;
    i++
  ) {

    const current =
      String(
        rows[i][idCol - 1] || ""
      )
      .trim()
      .toUpperCase();


    if (
      current &&
      current === target
    ) {

      return {

        row:
          WIN_CONFIG.WIN_DATA_START_ROW + i,

        idDP:
          episodeCol > 0
            ? String(
                rows[i][episodeCol - 1] || ""
              )
            : "",

        idBayi:
          current

      };

    }

  }


  return null;

}



// =====================================================
// SIMPAN EPISODE KE WIN_DISCHARGE_PLANNING
// =====================================================

function WIN_02_SAVE_EPISODE(
  episode,
  sourceData
) {

  const sheet =
    WIN_getSheet(
      WIN_CONFIG.EPISODE_SHEET
    );


  const headers =
    WIN_getHeaders(
      sheet,
      WIN_CONFIG.WIN_HEADER_ROW
    );


  const lastColumn =
    sheet.getLastColumn();


  const output =
    new Array(lastColumn)
      .fill("");


  function setValue(
    headerName,
    value
  ) {

    const col =
      WIN_findColumn(
        sheet,
        headerName,
        WIN_CONFIG.WIN_HEADER_ROW
      );


    if (col > 0) {

      output[col - 1] =
        value;

    }

  }


  // ---------------------------------------------------
  // DATA UTAMA
  // ---------------------------------------------------

  setValue(
    "NO_EPISODE",
    episode.episodeId
  );


  setValue(
    "ID_BAYI",
    sourceData.idBayi
  );


  setValue(
    "NO_RM",
    sourceData.noRM
  );


  setValue(
    "NAMA_BAYI",
    sourceData.namaBayi
  );


  setValue(
    "NAMA_IBU",
    sourceData.namaIbu
  );


  setValue(
    "NAMA_AYAH",
    sourceData.namaAyah
  );


  setValue(
    "EMAIL",
    sourceData.email
  );


  setValue(
    "TELP",
    sourceData.telp
  );


  setValue(
    "TGL_MRS_NICU2",
    sourceData.tglMrs
  );


  // ---------------------------------------------------
  // STATUS
  // ---------------------------------------------------

  setValue(
    "STATUS_EPISODE",
    WIN_CONFIG.STATUS_AUTO_CREATED
  );


  setValue(
    "TAHAP_TERAKHIR",
    WIN_CONFIG.STATUS_AUTO_CREATED
  );


  setValue(
    "READINESS_SCORE",
    0
  );


  setValue(
    "MATERI_REKOMENDASI",
    ""
  );


  setValue(
    "VIDEO_PROGRESS",
    0
  );


  setValue(
    "PRAKTIK_STATUS",
    "BELUM"
  );


  setValue(
    "EVALUASI_STATUS",
    "BELUM"
  );


  setValue(
    "ACTION_PLAN_STATUS",
    "BELUM"
  );


  setValue(
    "SERTIFIKAT_STATUS",
    "BELUM"
  );


  setValue(
    "CREATED_AT",
    new Date()
  );


  setValue(
    "UPDATED_AT",
    new Date()
  );


  setValue(
    "CATATAN",
    "Episode otomatis dibuat dari NICU_LEVEL_2."
  );


  // ---------------------------------------------------
  // KODE AKSES ORANG TUA
  // ---------------------------------------------------

  const accessCol =
    WIN_findColumn(
      sheet,
      "ACCESS_CODE",
      WIN_CONFIG.WIN_HEADER_ROW
    );


  if (accessCol > 0) {

    output[accessCol - 1] =
      WIN_02_CREATE_ACCESS_CODE();

  }


  // ---------------------------------------------------
  // MODE IBU
  // ---------------------------------------------------

  const ibuCol =
    WIN_findColumn(
      sheet,
      "MODE_IBU",
      WIN_CONFIG.WIN_HEADER_ROW
    );


  if (ibuCol > 0) {

    output[ibuCol - 1] =
      "AKTIF";

  }


  // ---------------------------------------------------
  // MODE PERAWAT
  // ---------------------------------------------------

  const perawatCol =
    WIN_findColumn(
      sheet,
      "MODE_PERAWAT",
      WIN_CONFIG.WIN_HEADER_ROW
    );


  if (perawatCol > 0) {

    output[perawatCol - 1] =
      "AKTIF";

  }


  // ---------------------------------------------------
  // SUMBER
  // ---------------------------------------------------

  const sourceCol =
    WIN_findColumn(
      sheet,
      "SOURCE",
      WIN_CONFIG.WIN_HEADER_ROW
    );


  if (sourceCol > 0) {

    output[sourceCol - 1] =
      "NICU_LEVEL_2";

  }


  // ---------------------------------------------------
  // APPEND
  // ---------------------------------------------------

  const targetRow =
    Math.max(
      sheet.getLastRow() + 1,
      WIN_CONFIG.WIN_DATA_START_ROW
    );


  sheet
    .getRange(
      targetRow,
      1,
      1,
      lastColumn
    )
    .setValues([
      output
    ]);


  // ---------------------------------------------------
  // FORMAT DATE
  // ---------------------------------------------------

  [
    "CREATED_AT",
    "UPDATED_AT"
  ].forEach(function(header) {

    const col =
      WIN_findColumn(
        sheet,
        header,
        WIN_CONFIG.WIN_HEADER_ROW
      );


    if (col > 0) {

      sheet
        .getRange(
          targetRow,
          col
        )
        .setNumberFormat(
          "dd/MM/yyyy HH:mm:ss"
        );

    }

  });


  // ---------------------------------------------------
  // LOG
  // ---------------------------------------------------

  if (
    typeof WIN_log === "function"
  ) {

    WIN_log(
      episode.episodeId,
      sourceData.idBayi,
      "CREATE_EPISODE",
      "NICU_LEVEL_2",
      "Episode WIN berhasil dibuat."
    );

  }


  Logger.log(
    "WIN EPISODE BERHASIL:"
  );

  Logger.log(
    episode.episodeId
  );

  return targetRow;

}



// =====================================================
// UPDATE TIMESTAMP EPISODE
// =====================================================

function WIN_02_TOUCH_EPISODE(
  row
) {

  const sheet =
    WIN_getSheet(
      WIN_CONFIG.EPISODE_SHEET
    );


  const col =
    WIN_findColumn(
      sheet,
      "UPDATED_AT",
      WIN_CONFIG.WIN_HEADER_ROW
    );


  if (col > 0) {

    sheet
      .getRange(
        row,
        col
      )
      .setValue(
        new Date()
      );

  }

}



// =====================================================
// ACCESS CODE ORANG TUA
// =====================================================

function WIN_02_CREATE_ACCESS_CODE() {

  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";


  let code = "";


  for (
    let i = 0;
    i < 8;
    i++
  ) {

    code +=
      chars.charAt(
        Math.floor(
          Math.random() *
          chars.length
        )
      );

  }


  return code;

}


// =====================================================
// TEST AUTO CREATE
// GANTI ANGKA row DENGAN NOMOR BARIS BAYI
// =====================================================

function WIN_02_TEST_AUTO_CREATE() {

  const ss =
    SpreadsheetApp
      .getActiveSpreadsheet();


  const sheet =
    ss.getSheetByName(
      WIN_CONFIG.SOURCE_SHEET
    );


  if (!sheet) {

    throw new Error(
      "Sheet NICU_LEVEL_2 tidak ditemukan."
    );

  }


  // ==========================================
  // GANTI ANGKA INI DENGAN BARIS BAYI
  // ==========================================

  const row = 7;


  // ==========================================
  // VALIDASI BARIS
  // ==========================================

  if (
    row <
    WIN_CONFIG.SOURCE_DATA_START_ROW
  ) {

    throw new Error(
      "Nomor baris bayi tidak valid."
    );

  }


  // ==========================================
  // JALANKAN AUTO CREATE
  // ==========================================

  const result =
    WIN_02_AUTO_CREATE_FROM_NICU2(
      sheet,
      row
    );


  Logger.log(
    "HASIL TEST:"
  );

  Logger.log(
    JSON.stringify(result)
  );


  return result;

}

// =====================================================
// WIN EPISODE API COMPATIBILITY
// Untuk koneksi dengan WIN_08_WEBAPP.gs
// =====================================================


/**
 * =====================================================
 * MENCARI EPISODE BERDASARKAN NO_EPISODE
 * =====================================================
 *
 * Dipakai oleh:
 * WIN_08_WEBAPP.gs
 * WIN_Login
 * Dashboard
 * Certificate
 * Follow Up
 *
 * =====================================================
 */

function WIN_EPISODE_getById(
  episodeId
) {

  episodeId =
    String(
      episodeId || ""
    ).trim();


  if (!episodeId) {

    return {

      success: false,

      message:
        "Episode ID wajib diisi."

    };

  }


  try {

    const sheet =
      WIN_getSheet(
        WIN_CONFIG.EPISODE_SHEET
      );


    const lastRow =
      sheet.getLastRow();


    if (
      lastRow <
      WIN_CONFIG.WIN_DATA_START_ROW
    ) {

      return {

        success: false,

        message:
          "Belum ada data episode."

      };

    }


    const episodeCol =
      WIN_findColumn(
        sheet,
        "NO_EPISODE",
        WIN_CONFIG.WIN_HEADER_ROW
      );


    if (episodeCol < 1) {

      throw new Error(
        "Kolom NO_EPISODE tidak ditemukan."
      );

    }


    const lastColumn =
      sheet.getLastColumn();


    const rows =
      sheet
        .getRange(
          WIN_CONFIG.WIN_DATA_START_ROW,
          1,
          lastRow -
            WIN_CONFIG.WIN_DATA_START_ROW +
            1,
          lastColumn
        )
        .getValues();


    const target =
      episodeId
        .trim()
        .toUpperCase();


    for (
      let i = 0;
      i < rows.length;
      i++
    ) {

      const current =
        String(
          rows[i][episodeCol - 1] || ""
        )
        .trim()
        .toUpperCase();


      if (
        current === target
      ) {

        const rowNumber =
          WIN_CONFIG.WIN_DATA_START_ROW +
          i;


        const episode =
          WIN_02_READ_EPISODE_ROW(
            sheet,
            rowNumber
          );


        return {

          success: true,

          found: true,

          row:
            rowNumber,

          episode:
            episode,

          data:
            episode

        };

      }

    }


    return {

      success: false,

      found: false,

      message:
        "Episode tidak ditemukan: " +
        episodeId

    };


  }

  catch (error) {

    Logger.log(
      "WIN_EPISODE_getById ERROR: " +
      error.message
    );


    return {

      success: false,

      found: false,

      message:
        error.message

    };

  }

}



/**
 * =====================================================
 * MEMBACA SATU BARIS EPISODE
 * =====================================================
 */

function WIN_02_READ_EPISODE_ROW(
  sheet,
  row
) {

  const headers =
    WIN_getHeaders(
      sheet,
      WIN_CONFIG.WIN_HEADER_ROW
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


  function getValue(
    names
  ) {

    if (
      !Array.isArray(names)
    ) {

      names = [names];

    }


    for (
      let i = 0;
      i < names.length;
      i++
    ) {

      const target =
        String(
          names[i] || ""
        )
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");


      for (
        let j = 0;
        j < headers.length;
        j++
      ) {

        const current =
          String(
            headers[j] || ""
          )
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "_");


        if (
          current === target
        ) {

          return values[j];

        }

      }

    }


    return "";

  }


  return {

    episodeId:
      WIN_cleanText(
        getValue([
          "NO_EPISODE",
          "episode_id",
          "episodeid"
        ])
      ),


    idBayi:
      WIN_cleanText(
        getValue([
          "ID_BAYI",
          "id_bayi"
        ])
      ),


    noRM:
      WIN_cleanText(
        getValue([
          "NO_RM",
          "no_rm",
          "nomor_rm"
        ])
      ),


    namaBayi:
      WIN_cleanText(
        getValue([
          "NAMA_BAYI",
          "nama_bayi"
        ])
      ),


    namaIbu:
      WIN_cleanText(
        getValue([
          "NAMA_IBU",
          "nama_ibu"
        ])
      ),


    namaAyah:
      WIN_cleanText(
        getValue([
          "NAMA_AYAH",
          "nama_ayah"
        ])
      ),


    email:
      WIN_cleanText(
        getValue([
          "EMAIL",
          "email"
        ])
      ),


    telp:
      WIN_cleanText(
        getValue([
          "TELP",
          "NO_TELP",
          "TELEPON"
        ])
      ),


    tanggalMRS:
      getValue([
        "TGL_MRS_NICU2",
        "TGL_MRS",
        "TANGGAL_MRS"
      ]),


    status:
      WIN_cleanText(
        getValue([
          "STATUS_EPISODE",
          "STATUS"
        ])
      ),


    tahapTerakhir:
      WIN_cleanText(
        getValue([
          "TAHAP_TERAKHIR"
        ])
      ),


    readinessScore:
      getValue([
        "READINESS_SCORE"
      ]),


    materiRekomendasi:
      WIN_cleanText(
        getValue([
          "MATERI_REKOMENDASI"
        ])
      ),


    videoProgress:
      getValue([
        "VIDEO_PROGRESS"
      ]),


    praktikStatus:
      WIN_cleanText(
        getValue([
          "PRAKTIK_STATUS"
        ])
      ),


    evaluasiStatus:
      WIN_cleanText(
        getValue([
          "EVALUASI_STATUS"
        ])
      ),


    actionPlanStatus:
      WIN_cleanText(
        getValue([
          "ACTION_PLAN_STATUS"
        ])
      ),


    sertifikatStatus:
      WIN_cleanText(
        getValue([
          "SERTIFIKAT_STATUS"
        ])
      ),


    accessCode:
      WIN_cleanText(
        getValue([
          "ACCESS_CODE"
        ])
      ),


    modeIbu:
      WIN_cleanText(
        getValue([
          "MODE_IBU"
        ])
      ),


    modePerawat:
      WIN_cleanText(
        getValue([
          "MODE_PERAWAT"
        ])
      ),


    source:
      WIN_cleanText(
        getValue([
          "SOURCE"
        ])
      ),


    createdAt:
      getValue([
        "CREATED_AT"
      ]),


    updatedAt:
      getValue([
        "UPDATED_AT"
      ]),


    catatan:
      WIN_cleanText(
        getValue([
          "CATATAN"
        ])
      )

  };

}



/**
 * =====================================================
 * CARI EPISODE BERDASARKAN NO RM
 * =====================================================
 */

function WIN_EPISODE_getByNoRM(
  noRM
) {

  noRM =
    String(
      noRM || ""
    ).trim();


  if (!noRM) {

    return {

      success: false,

      message:
        "No. RM wajib diisi."

    };

  }


  try {

    const sheet =
      WIN_getSheet(
        WIN_CONFIG.EPISODE_SHEET
      );


    const lastRow =
      sheet.getLastRow();


    if (
      lastRow <
      WIN_CONFIG.WIN_DATA_START_ROW
    ) {

      return {

        success: false,

        found: false,

        message:
          "Belum ada episode."

      };

    }


    const noRMCol =
      WIN_findColumn(
        sheet,
        "NO_RM",
        WIN_CONFIG.WIN_HEADER_ROW
      );


    if (noRMCol < 1) {

      throw new Error(
        "Kolom NO_RM tidak ditemukan."
      );

    }


    const rows =
      sheet
        .getRange(
          WIN_CONFIG.WIN_DATA_START_ROW,
          1,
          lastRow -
            WIN_CONFIG.WIN_DATA_START_ROW +
            1,
          sheet.getLastColumn()
        )
        .getValues();


    const target =
      noRM
        .trim()
        .toUpperCase();


    for (
      let i = rows.length - 1;
      i >= 0;
      i--
    ) {

      const current =
        String(
          rows[i][noRMCol - 1] || ""
        )
        .trim()
        .toUpperCase();


      if (
        current === target
      ) {

        const row =
          WIN_CONFIG.WIN_DATA_START_ROW +
          i;


        return {

          success: true,

          found: true,

          row: row,

          episode:
            WIN_02_READ_EPISODE_ROW(
              sheet,
              row
            )

        };

      }

    }


    return {

      success: false,

      found: false,

      message:
        "Episode dengan No. RM " +
        noRM +
        " tidak ditemukan."

    };


  }

  catch (error) {

    return {

      success: false,

      found: false,

      message:
        error.message

    };

  }

}



/**
 * =====================================================
 * TEST API EPISODE
 * =====================================================
 */

function WIN_EPISODE_TEST_API() {

  Logger.log(
    "======================================"
  );

  Logger.log(
    "WIN EPISODE API TEST"
  );

  Logger.log(
    "======================================"
  );


  Logger.log(
    "WIN_EPISODE_getById: " +
    (
      typeof WIN_EPISODE_getById ===
      "function"
    )
  );


  Logger.log(
    "WIN_EPISODE_getByNoRM: " +
    (
      typeof WIN_EPISODE_getByNoRM ===
      "function"
    )
  );


  Logger.log(
    "WIN_02_FIND_EPISODE: " +
    (
      typeof WIN_02_FIND_EPISODE ===
      "function"
    )
  );


  Logger.log(
    "WIN_02_AUTO_CREATE_FROM_NICU2: " +
    (
      typeof WIN_02_AUTO_CREATE_FROM_NICU2 ===
      "function"
    )
  );


  Logger.log(
    "======================================"
  );


  return {

    success: true,

    getById:
      typeof WIN_EPISODE_getById ===
      "function",

    getByNoRM:
      typeof WIN_EPISODE_getByNoRM ===
      "function",

    autoCreate:
      typeof WIN_02_AUTO_CREATE_FROM_NICU2 ===
      "function"

  };

}
function WIN_TEST_CARI_EPISODE_ASSESSMENT() {

  // =====================================================
  // GANTI DENGAN NO RM BAYI LEVEL 2 YANG SUDAH ADA
  // =====================================================

  const noRM = "923672";


  // =====================================================
  // CARI EPISODE
  // =====================================================

  const result =
    WIN_EPISODE_getByNoRM(noRM);


  // =====================================================
  // TAMPILKAN HASIL
  // =====================================================

  Logger.log(
    "======================================"
  );

  Logger.log(
    "TEST CARI EPISODE UNTUK ASSESSMENT"
  );

  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );

  Logger.log(
    "======================================"
  );


  return result;

}
function WIN_02_TEST_CEK_DATA_EPISODE() {

  const episodeId =
    "WIN-20260824122053";

  const result =
    WIN_EPISODE_getById(
      episodeId
    );

  Logger.log(
    "======================================"
  );

  Logger.log(
    "CEK DATA EPISODE"
  );

  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );

  Logger.log(
    "======================================"
  );

  return result;

}
function WIN_02_TEST_CEK_HEADER_WIN() {

  const sheet =
    WIN_getSheet(
      WIN_CONFIG.EPISODE_SHEET
    );

  const headers =
    WIN_getHeaders(
      sheet,
      WIN_CONFIG.WIN_HEADER_ROW
    );

  Logger.log(
    "======================================"
  );

  Logger.log(
    "HEADER WIN_DISCHARGE_PLANNING"
  );

  headers.forEach(function(header, index) {

    Logger.log(
      (index + 1) +
      " = [" +
      header +
      "]"
    );

  });

  Logger.log(
    "======================================"
  );

  return headers;

}
function WIN_02_TEST_UPDATE_ACCESS_EPISODE_LAMA() {

  const episodeId =
    "WIN-20260824122053";

  const sheet =
    WIN_getSheet(
      WIN_CONFIG.EPISODE_SHEET
    );

  const lastRow =
    sheet.getLastRow();

  const episodeCol =
    WIN_findColumn(
      sheet,
      "NO_EPISODE",
      WIN_CONFIG.WIN_HEADER_ROW
    );

  if (episodeCol < 1) {
    throw new Error(
      "Kolom NO_EPISODE tidak ditemukan."
    );
  }

  let targetRow = -1;

  for (
    let row = WIN_CONFIG.WIN_DATA_START_ROW;
    row <= lastRow;
    row++
  ) {

    const value =
      sheet
        .getRange(
          row,
          episodeCol
        )
        .getValue();

    if (
      String(value)
        .trim()
        .toUpperCase() ===
      episodeId
        .trim()
        .toUpperCase()
    ) {

      targetRow = row;
      break;

    }

  }

  if (targetRow < 0) {

    throw new Error(
      "Episode tidak ditemukan: " +
      episodeId
    );

  }


  // ==========================================
  // ACCESS CODE
  // ==========================================

  const accessCol =
    WIN_findColumn(
      sheet,
      "ACCESS_CODE",
      WIN_CONFIG.WIN_HEADER_ROW
    );

  if (accessCol < 1) {
    throw new Error(
      "Kolom ACCESS_CODE tidak ditemukan."
    );
  }


  // ==========================================
  // MODE IBU
  // ==========================================

  const ibuCol =
    WIN_findColumn(
      sheet,
      "MODE_IBU",
      WIN_CONFIG.WIN_HEADER_ROW
    );

  if (ibuCol < 1) {
    throw new Error(
      "Kolom MODE_IBU tidak ditemukan."
    );
  }


  // ==========================================
  // MODE PERAWAT
  // ==========================================

  const perawatCol =
    WIN_findColumn(
      sheet,
      "MODE_PERAWAT",
      WIN_CONFIG.WIN_HEADER_ROW
    );

  if (perawatCol < 1) {
    throw new Error(
      "Kolom MODE_PERAWAT tidak ditemukan."
    );
  }


  // ==========================================
  // SOURCE
  // ==========================================

  const sourceCol =
    WIN_findColumn(
      sheet,
      "SOURCE",
      WIN_CONFIG.WIN_HEADER_ROW
    );

  if (sourceCol < 1) {
    throw new Error(
      "Kolom SOURCE tidak ditemukan."
    );
  }


  // ==========================================
  // BUAT ACCESS CODE
  // ==========================================

  const accessCode =
    WIN_02_CREATE_ACCESS_CODE();


  // ==========================================
  // SIMPAN
  // ==========================================

  sheet
    .getRange(
      targetRow,
      accessCol
    )
    .setValue(
      accessCode
    );

  sheet
    .getRange(
      targetRow,
      ibuCol
    )
    .setValue(
      "AKTIF"
    );

  sheet
    .getRange(
      targetRow,
      perawatCol
    )
    .setValue(
      "AKTIF"
    );

  sheet
    .getRange(
      targetRow,
      sourceCol
    )
    .setValue(
      "NICU_LEVEL_2"
    );


  // ==========================================
  // UPDATE TIMESTAMP
  // ==========================================

  WIN_02_TOUCH_EPISODE(
    targetRow
  );


  // ==========================================
  // HASIL
  // ==========================================

  const result = {

    success: true,

    row:
      targetRow,

    episodeId:
      episodeId,

    accessCode:
      accessCode,

    modeIbu:
      "AKTIF",

    modePerawat:
      "AKTIF",

    source:
      "NICU_LEVEL_2"

  };


  Logger.log(
    "======================================"
  );

  Logger.log(
    "UPDATE EPISODE LAMA BERHASIL"
  );

  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );

  Logger.log(
    "======================================"
  );


  return result;

}
function WIN_03_TEST_ASSESSMENT_EPISODE_NYATA() {

  const episodeId =
    "WIN-20260824122053";

  const patientId =
    "NIC22605200001";

  const noRM =
    "923672";


  // ==========================================
  // BUAT ASSESSMENT
  // ==========================================

  const assessment =
    WIN_03_NEW_ASSESSMENT({

      episodeId:
        episodeId,

      patientId:
        patientId,

      noRM:
        noRM,

      kebutuhan: [

        "ASI",
        "PERAWATAN_BAYI",
        "SUHU",
        "TANDA_BAHAYA",
        "BBLR"

      ],

      pengalaman:
        "Belum pernah",

      dukungan:
        "Dukungan baik",

      hambatan: [

        "Kecemasan"

      ],

      catatan:
        "TEST Assessment WIN Level 2."

    });


  // ==========================================
  // SELESAIKAN ASSESSMENT
  // ==========================================

  const completed =
    WIN_03_COMPLETE_ASSESSMENT(
      assessment
    );


  // ==========================================
  // SIMPAN
  // ==========================================

  const result =
    WIN_03_SAVE_ASSESSMENT(
      completed
    );


  // ==========================================
  // LOG
  // ==========================================

  Logger.log(
    "======================================"
  );

  Logger.log(
    "TEST ASSESSMENT EPISODE NYATA"
  );

  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );

  Logger.log(
    "======================================"
  );


  return result;

}
