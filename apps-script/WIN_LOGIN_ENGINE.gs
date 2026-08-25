/**
 * ============================================================
 * WIN_LOGIN_ENGINE.gs
 * WIN — Login & Access Engine
 * ============================================================
 *
 * IBU:
 *   No. RM bayi
 *   atau QR -> ?page=login&rm=NO_RM
 *
 * PERAWAT:
 *   1 username
 *   1 password
 *   nama perawat wajib diisi
 *
 * ============================================================
 */


/* ============================================================
 * 1. KONFIGURASI LOGIN PERAWAT
 * ============================================================
 *
 * Untuk tahap awal kita gunakan satu akun bersama.
 *
 * GANTI nilai USERNAME dan PASSWORD di sini.
 *
 * ============================================================
 */

const WIN_LOGIN_CONFIG = {

  USERNAME:
    'perawat',

  PASSWORD:
    'WIN2026',

  ROLE:
    'PERAWAT'

};


/* ============================================================
 * 2. SHEET ACCESS LOG
 * ============================================================
 */

const WIN_ACCESS_LOG = {

  SHEET_NAME:
    'WIN_ACCESS_LOG',

  HEADERS: [

    'TIMESTAMP',

    'ROLE',

    'USERNAME',

    'NAMA_PENGGUNA',

    'NO_RM',

    'EPISODE_ID',

    'ID_BAYI',

    'AKSI',

    'STATUS',

    'USER_AGENT'

  ]

};


/* ============================================================
 * 3. SIAPKAN SHEET LOG
 * ============================================================
 */

function WIN_LOGIN_getAccessLogSheet() {

  const ss =
    SpreadsheetApp
      .getActiveSpreadsheet();


  let sheet =
    ss.getSheetByName(
      WIN_ACCESS_LOG.SHEET_NAME
    );


  if (!sheet) {

    sheet =
      ss.insertSheet(
        WIN_ACCESS_LOG.SHEET_NAME
      );

  }


  if (
    sheet.getLastRow() === 0
  ) {

    sheet
      .getRange(
        1,
        1,
        1,
        WIN_ACCESS_LOG.HEADERS.length
      )
      .setValues([
        WIN_ACCESS_LOG.HEADERS
      ]);

    sheet
      .getRange(
        1,
        1,
        1,
        WIN_ACCESS_LOG.HEADERS.length
      )
      .setFontWeight(
        'bold'
      );

    sheet.setFrozenRows(1);

  }


  return sheet;

}


/* ============================================================
 * 4. CATAT AKSES
 * ============================================================
 */

function WIN_LOGIN_logAccess(
  data
) {

  data =
    data || {};


  try {

    const sheet =
      WIN_LOGIN_getAccessLogSheet();


    sheet.appendRow([

      new Date(),

      data.role ||
        '',

      data.username ||
        '',

      data.namaPengguna ||
        '',

      data.noRM ||
        '',

      data.episodeId ||
        '',

      data.idBayi ||
        '',

      data.aksi ||
        '',

      data.status ||
        '',

      data.userAgent ||
        ''

    ]);


    return true;

  }

  catch(error) {

    Logger.log(
      'WIN_LOGIN_logAccess ERROR: ' +
      error.message
    );


    return false;

  }

}


/* ============================================================
 * 5. LOGIN IBU DENGAN NO RM
 * ============================================================
 */

function WIN_LOGIN_loginIbuByRM(
  noRM
) {

  noRM =
    String(
      noRM || ''
    ).trim();


  if (!noRM) {

    return {

      success:
        false,

      message:
        'Nomor RM bayi wajib diisi.'

    };

  }


  try {

    /*
     * Cari episode terbaru berdasarkan No RM.
     */

    const result =
      WIN_EPISODE_getByNoRM(
        noRM
      );


    if (
      !result ||
      result.success !== true ||
      result.found !== true ||
      !result.episode
    ) {

      WIN_LOGIN_logAccess({

        role:
          'IBU',

        username:
          'NO_RM',

        namaPengguna:
          '',

        noRM:
          noRM,

        episodeId:
          '',

        idBayi:
          '',

        aksi:
          'LOGIN',

        status:
          'GAGAL'

      });


      return {

        success:
          false,

        message:
          'Episode Discharge Planning untuk No. RM ' +
          noRM +
          ' belum ditemukan.'

      };

    }


    const episode =
      result.episode;


    /*
     * Ambil data tambahan dari
     * WIN_DISCHARGE_PLANNING.
     */

    let data =
      null;


    try {

      const episodeResult =
        WIN_EPISODE_getById(
          episode.episodeId
        );


      if (
        episodeResult &&
        episodeResult.success
      ) {

        data =
          episodeResult.episode ||
          episodeResult.data ||
          null;

      }

    }

    catch(error) {

      Logger.log(
        'Data episode tambahan: ' +
        error.message
      );

    }


    const finalData =
      data ||
      episode;


    WIN_LOGIN_logAccess({

      role:
        'IBU',

      username:
        'NO_RM',

      namaPengguna:
        finalData.namaIbu ||
        '',

      noRM:
        noRM,

      episodeId:
        finalData.episodeId ||
        '',

      idBayi:
        finalData.idBayi ||
        '',

      aksi:
        'LOGIN',

      status:
        'BERHASIL'

    });


    return {

      success:
        true,

      role:
        'IBU',

      noRM:
        noRM,

      episodeId:
        finalData.episodeId ||
        episode.episodeId ||
        '',

      namaIbu:
        finalData.namaIbu ||
        '',

      episode:
        finalData,

      data:
        finalData,

      message:
        'Login Ibu berhasil.'

    };

  }

  catch(error) {

    WIN_LOGIN_logAccess({

      role:
        'IBU',

      username:
        'NO_RM',

      namaPengguna:
        '',

      noRM:
        noRM,

      aksi:
        'LOGIN',

      status:
        'ERROR'

    });


    return {

      success:
        false,

      message:
        error.message

    };

  }

}


/* ============================================================
 * 6. LOGIN PERAWAT
 * ============================================================
 */

function WIN_LOGIN_loginPerawat(
  username,
  password,
  namaPerawat
) {

  username =
    String(
      username || ''
    ).trim();


  namaPerawat =
    String(
      namaPerawat || ''
    ).trim();


  if (!username) {

    return {

      success:
        false,

      message:
        'Username wajib diisi.'

    };

  }


  if (!password) {

    return {

      success:
        false,

      message:
        'Password wajib diisi.'

    };

  }


  if (!namaPerawat) {

    return {

      success:
        false,

      message:
        'Nama perawat wajib diisi.'

    };

  }


  const validUsername =
    username.toLowerCase() ===
    WIN_LOGIN_CONFIG.USERNAME.toLowerCase();


  const validPassword =
    password ===
    WIN_LOGIN_CONFIG.PASSWORD;


  if (
    !validUsername ||
    !validPassword
  ) {

    WIN_LOGIN_logAccess({

      role:
        'PERAWAT',

      username:
        username,

      namaPengguna:
        namaPerawat,

      aksi:
        'LOGIN',

      status:
        'GAGAL'

    });


    return {

      success:
        false,

      message:
        'Username atau password perawat salah.'

    };

  }


  WIN_LOGIN_logAccess({

    role:
      'PERAWAT',

    username:
      username,

    namaPengguna:
      namaPerawat,

    aksi:
      'LOGIN',

    status:
      'BERHASIL'

  });


  return {

    success:
      true,

    role:
      'PERAWAT',

    userId:
      username,

    username:
      username,

    namaPerawat:
      namaPerawat,

    message:
      'Login perawat berhasil.'

  };

}


/* ============================================================
 * 7. TEST LOGIN ENGINE
 * ============================================================
 */

function WIN_LOGIN_TEST_ENGINE() {

  const result = {

    config:
      {

        username:
          WIN_LOGIN_CONFIG.USERNAME,

        role:
          WIN_LOGIN_CONFIG.ROLE

      },

    sheet:
      WIN_LOGIN_getAccessLogSheet()
        .getName(),

    ibuFunction:
      typeof WIN_LOGIN_loginIbuByRM ===
      'function',

    perawatFunction:
      typeof WIN_LOGIN_loginPerawat ===
      'function',

    logFunction:
      typeof WIN_LOGIN_logAccess ===
      'function'

  };


  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  return result;

}
