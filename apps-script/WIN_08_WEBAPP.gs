/**
 * ============================================================
 * WIN_08_WEBAPP.gs
 * WIN — Discharge Planning Perinatologi
 *
 * MODULE:
 * WEB APP / ROUTER / CONTROLLER
 *
 * VERSION:
 * 3.2.0
 *
 * OPTIMIZATION:
 * - Menghindari recursive dashboard/status call
 * - Menghindari pembacaan engine berulang
 * - Centralized safeCall
 * - Nurse Dashboard optimized
 * - Mother Dashboard optimized
 * - Episode Status dihitung dari data yang sudah tersedia
 * - Follow Up menggunakan WIN_FOLLOWUP_get / WIN_FOLLOWUP_save
 * - Health check lengkap
 *
 * ============================================================
 *
 * ALUR:
 *
 * LOGIN
 *   ↓
 * DATA IBU & BAYI
 *   ↓
 * LMS
 *   ↓
 * PRAKTIK
 *   ↓
 * VERIFIKASI PERAWAT
 *   ↓
 * EVALUASI
 *   ↓
 * FOLLOW UP
 *   ↓
 * CERTIFICATE
 *
 * ============================================================
 */


/* ============================================================
 * 1. KONFIGURASI
 * ============================================================
 */

const WIN_WEBAPP = {

  APP_NAME:
    'WIN — Discharge Planning Perinatologi',

  VERSION:
    '3.2.0',

  DEFAULT_PAGE:
    'WIN_Login',

  PAGES: {

    LOGIN:
      'WIN_Login',

    DASHBOARD:
      'WIN_Dashboard',

    DATA:
      'WIN_Data',

    LMS:
      'WIN_LMS',

    PRAKTIK:
      'WIN_Praktik',

    EVALUASI:
      'WIN_Evaluasi',

    FOLLOWUP:
      'WIN_FollowUp',

    CERTIFICATE:
      'WIN_Certificate',

    NURSE:
      'WIN_NurseDashboard'

  }

};


/* ============================================================
 * 2. INTERNAL HELPER
 * ============================================================
 *
 * Helper ini digunakan agar satu error pada satu engine
 * tidak membuat seluruh dashboard gagal.
 *
 * ============================================================
 */

function WIN_WEBAPP_safeCall(
  functionName,
  args,
  fallback
) {

  const started =
    new Date().getTime();

  try {

    if (
      typeof globalThis[functionName] !==
      'function'
    ) {

      return {

        success:
          false,

        available:
          false,

        message:
          'Function tidak tersedia: ' +
          functionName

      };

    }


    const result =
      globalThis[functionName].apply(
        null,
        args || []
      );


    const elapsed =
      new Date().getTime() -
      started;


    return {

      success:
        true,

      available:
        true,

      elapsedMs:
        elapsed,

      data:
        result

    };

  }

  catch (error) {

    const elapsed =
      new Date().getTime() -
      started;


    if (
      fallback !== undefined
    ) {

      return {

        success:
          false,

        available:
          true,

        elapsedMs:
          elapsed,

        data:
          fallback,

        message:
          error.message

      };

    }


    return {

      success:
        false,

      available:
        true,

      elapsedMs:
        elapsed,

      data:
        null,

      message:
        error.message

    };

  }

}


/* ============================================================
 * 3. NORMALIZE RESULT
 * ============================================================
 */

function WIN_WEBAPP_unwrap(
  safeResult,
  defaultValue
) {

  if (
    safeResult &&
    safeResult.success === true
  ) {

    return safeResult.data;

  }


  if (
    defaultValue !== undefined
  ) {

    return defaultValue;

  }


  return {

    success:
      false,

    message:
      safeResult &&
      safeResult.message
        ? safeResult.message
        : 'Data tidak tersedia.'

  };

}


/* ============================================================
 * 4. NORMALIZE ID
 * ============================================================
 */

function WIN_WEBAPP_normalizeId(
  value
) {

  return String(
    value || ''
  ).trim();

}


/* ============================================================
 * 5. VALIDATE EPISODE
 * ============================================================
 */

function WIN_WEBAPP_validateEpisode(
  episodeId,
  noRM
) {

  episodeId =
    WIN_WEBAPP_normalizeId(
      episodeId
    );


  noRM =
    WIN_WEBAPP_normalizeId(
      noRM
    );


  if (
    !episodeId ||
    !noRM
  ) {

    return {

      success:
        false,

      episodeId:
        episodeId,

      noRM:
        noRM,

      message:
        'Episode ID dan No. RM wajib diisi.'

    };

  }


  return {

    success:
      true,

    episodeId:
      episodeId,

    noRM:
      noRM

  };

}


/* ============================================================
 * 6. DO GET
 * ============================================================
 */

function doGet(e) {

  const page =
    WIN_WEBAPP_getPage(e);


  const allowedPages = [

    WIN_WEBAPP.PAGES.LOGIN,

    WIN_WEBAPP.PAGES.DASHBOARD,

    WIN_WEBAPP.PAGES.DATA,

    WIN_WEBAPP.PAGES.LMS,

    WIN_WEBAPP.PAGES.PRAKTIK,

    WIN_WEBAPP.PAGES.EVALUASI,

    WIN_WEBAPP.PAGES.FOLLOWUP,

    WIN_WEBAPP.PAGES.CERTIFICATE,

    WIN_WEBAPP.PAGES.NURSE

  ];


  const selectedPage =
    allowedPages.indexOf(page) !== -1
      ? page
      : WIN_WEBAPP.DEFAULT_PAGE;


  try {

    return HtmlService

      .createTemplateFromFile(
        selectedPage
      )

      .evaluate()

      .setTitle(
        WIN_WEBAPP.APP_NAME
      )

      .setXFrameOptionsMode(
        HtmlService.XFrameOptionsMode.ALLOWALL
      )

      .addMetaTag(
        'viewport',
        'width=device-width, initial-scale=1'
      );

  }

  catch (error) {

    return HtmlService

      .createHtmlOutput(

        '<!DOCTYPE html>' +

        '<html>' +

        '<head>' +

        '<meta name="viewport" content="width=device-width, initial-scale=1">' +

        '<title>WIN Error</title>' +

        '</head>' +

        '<body style="font-family:Arial;padding:30px">' +

        '<h2>WIN — Discharge Planning Perinatologi</h2>' +

        '<p>Terjadi kesalahan saat membuka halaman.</p>' +

        '<p><strong>Halaman:</strong> ' +

        selectedPage +

        '</p>' +

        '<p><strong>Error:</strong> ' +

        error.message +

        '</p>' +

        '</body>' +

        '</html>'

      )

      .setTitle(
        'WIN Error'
      );

  }

}


/* ============================================================
 * 7. ROUTER HALAMAN
 * ============================================================
 */

function WIN_WEBAPP_getPage(e) {

  try {

    if (
      e &&
      e.parameter &&
      e.parameter.page
    ) {

      const page =
        String(
          e.parameter.page
        )
        .trim()
        .toLowerCase();


      switch (page) {

        case 'login':
          return WIN_WEBAPP.PAGES.LOGIN;

        case 'dashboard':
          return WIN_WEBAPP.PAGES.DASHBOARD;

        case 'data':
          return WIN_WEBAPP.PAGES.DATA;

        case 'lms':
          return WIN_WEBAPP.PAGES.LMS;

        case 'praktik':
          return WIN_WEBAPP.PAGES.PRAKTIK;

        case 'evaluasi':
          return WIN_WEBAPP.PAGES.EVALUASI;

        case 'followup':
        case 'follow-up':
        case 'follow_up':
          return WIN_WEBAPP.PAGES.FOLLOWUP;

        case 'certificate':
        case 'sertifikat':
          return WIN_WEBAPP.PAGES.CERTIFICATE;

        case 'nurse':
        case 'perawat':
          return WIN_WEBAPP.PAGES.NURSE;

        default:
          return WIN_WEBAPP.DEFAULT_PAGE;

      }

    }

  }

  catch (error) {

    Logger.log(
      'WIN_WEBAPP_getPage ERROR: ' +
      error.message
    );

  }


  return WIN_WEBAPP.DEFAULT_PAGE;

}


/* ============================================================
 * 8. INCLUDE HTML
 * ============================================================
 */

function include(
  filename
) {

  return HtmlService

    .createHtmlOutputFromFile(
      filename
    )

    .getContent();

}


/* ============================================================
 * 9. APP INFO
 * ============================================================
 */

function WIN_WEBAPP_getAppInfo() {

  return {

    success:
      true,

    appName:
      WIN_WEBAPP.APP_NAME,

    version:
      WIN_WEBAPP.VERSION,

    timestamp:
      new Date()

  };

}


/* ============================================================
 * 10. LOGIN IBU
 * ============================================================
 */

function WIN_WEBAPP_loginIbu(
  noRM,
  episodeId
) {

  noRM =
    WIN_WEBAPP_normalizeId(
      noRM
    );


  episodeId =
    WIN_WEBAPP_normalizeId(
      episodeId
    );


  if (
    !noRM ||
    !episodeId
  ) {

    return {

      success:
        false,

      message:
        'No. RM dan Episode ID wajib diisi.'

    };

  }


  let episode =
    null;


  const episodeCall =
    WIN_WEBAPP_safeCall(
      'WIN_EPISODE_getById',
      [episodeId]
    );


  if (
    episodeCall.success
  ) {

    const result =
      episodeCall.data;


    if (
      result &&
      result.success
    ) {

      episode =
        result.episode ||
        result.data ||
        result;

    }

  }


  const motherCall =
    WIN_WEBAPP_safeCall(
      'WIN_DATA_IBU_BAYI_getByEpisode',
      [episodeId]
    );


  const motherData =
    WIN_WEBAPP_unwrap(
      motherCall,
      {
        success:
          false,

        message:
          'Data ibu/bayi belum tersedia.'

      }
    );


  return {

    success:
      true,

    role:
      'IBU',

    noRM:
      noRM,

    episodeId:
      episodeId,

    episode:
      episode,

    motherData:
      motherData,

    message:
      'Login berhasil.'

  };

}


/* ============================================================
 * 11. LOGIN PERAWAT
 * ============================================================
 */

function WIN_WEBAPP_loginPerawat(
  userId,
  namaPerawat
) {

  userId =
    WIN_WEBAPP_normalizeId(
      userId
    );


  namaPerawat =
    WIN_WEBAPP_normalizeId(
      namaPerawat
    );


  if (!userId) {

    return {

      success:
        false,

      message:
        'ID perawat wajib diisi.'

    };

  }


  return {

    success:
      true,

    role:
      'PERAWAT',

    userId:
      userId,

    namaPerawat:
      namaPerawat,

    message:
      'Login perawat berhasil.'

  };

}


/* ============================================================
 * 12. DATA IBU / BAYI
 * ============================================================
 */

function WIN_WEBAPP_saveMotherData(
  data
) {

  data =
    data || {};


  const call =
    WIN_WEBAPP_safeCall(
      'WIN_DATA_IBU_BAYI_save',
      [data]
    );


  if (
    call.success
  ) {

    return call.data;

  }


  return {

    success:
      false,

    message:
      call.message

  };

}


/* ------------------------------------------------------------
 * GET DATA IBU / BAYI
 * ------------------------------------------------------------
 */

function WIN_WEBAPP_getMotherData(
  episodeId,
  noRM
) {

  episodeId =
    WIN_WEBAPP_normalizeId(
      episodeId
    );


  noRM =
    WIN_WEBAPP_normalizeId(
      noRM
    );


  if (!episodeId) {

    return {

      success:
        false,

      message:
        'Episode ID wajib diisi.'

    };

  }


  const call =
    WIN_WEBAPP_safeCall(
      'WIN_DATA_IBU_BAYI_getByEpisode',
      [episodeId]
    );


  if (
    !call.success
  ) {

    return {

      success:
        false,

      message:
        call.message

    };

  }


  const result =
    call.data;


  /*
   * CEK NO RM
   */

  if (
    result &&
    result.found &&
    noRM &&
    result.data
  ) {

    const storedRM =
      String(
        result.data.NO_RM || ''
      ).trim();


    if (
      storedRM &&
      storedRM !== noRM
    ) {

      return {

        success:
          false,

        found:
          false,

        message:
          'No. RM tidak sesuai dengan Episode ID.'

      };

    }

  }


  return result;

}


/* ------------------------------------------------------------
 * RESEARCH DATA
 * ------------------------------------------------------------
 */

function WIN_WEBAPP_getResearchData(
  episodeId
) {

  const call =
    WIN_WEBAPP_safeCall(
      'WIN_DATA_IBU_BAYI_getResearchData',
      [episodeId]
    );


  return WIN_WEBAPP_unwrap(
    call
  );

}


/* ============================================================
 * 13. INTERNAL LOAD MOTHER DASHBOARD
 * ============================================================
 *
 * Semua modul dibaca SATU KALI.
 *
 * ============================================================
 */

function WIN_WEBAPP_loadMotherModules(
  episodeId,
  noRM
) {

  const started =
    new Date().getTime();


  const result = {

    data:
      null,

    lms:
      null,

    praktik:
      null,

    evaluasi:
      null,

    followup:
      null,

    certificate:
      null,

    timing: {}

  };


  /* ----------------------------------------------------------
   * DATA
   * ----------------------------------------------------------
   */

  let t =
    new Date().getTime();


  const dataCall =
    WIN_WEBAPP_safeCall(
      'WIN_WEBAPP_getMotherData',
      [
        episodeId,
        noRM
      ]
    );


  result.data =
    WIN_WEBAPP_unwrap(
      dataCall
    );


  result.timing.data =
    new Date().getTime() -
    t;


  /* ----------------------------------------------------------
   * LMS
   * ----------------------------------------------------------
   */

  t =
    new Date().getTime();


  const lmsCall =
    WIN_WEBAPP_safeCall(
      'WIN_LMS_getDashboardData',
      [
        episodeId,
        noRM
      ]
    );


  result.lms =
    WIN_WEBAPP_unwrap(
      lmsCall
    );


  result.timing.lms =
    new Date().getTime() -
    t;


  /* ----------------------------------------------------------
   * PRAKTIK
   * ----------------------------------------------------------
   */

  t =
    new Date().getTime();


  const praktikCall =
    WIN_WEBAPP_safeCall(
      'WIN_PRAKTIK_getDashboardData',
      [
        episodeId,
        noRM
      ]
    );


  result.praktik =
    WIN_WEBAPP_unwrap(
      praktikCall
    );


  result.timing.praktik =
    new Date().getTime() -
    t;


  /* ----------------------------------------------------------
   * EVALUASI
   * ----------------------------------------------------------
   */

  t =
    new Date().getTime();


  const evaluasiCall =
    WIN_WEBAPP_safeCall(
      'WIN_EVALUASI_getDashboardData',
      [
        episodeId,
        noRM
      ]
    );


  result.evaluasi =
    WIN_WEBAPP_unwrap(
      evaluasiCall
    );


  result.timing.evaluasi =
    new Date().getTime() -
    t;


  /* ----------------------------------------------------------
   * FOLLOW UP
   * ----------------------------------------------------------
   */

  t =
    new Date().getTime();


  const followupCall =
    WIN_WEBAPP_safeCall(
      'WIN_FOLLOWUP_get',
      [
        episodeId,
        noRM
      ]
    );


  result.followup =
    WIN_WEBAPP_unwrap(
      followupCall
    );


  result.timing.followup =
    new Date().getTime() -
    t;


  /* ----------------------------------------------------------
   * CERTIFICATE
   * ----------------------------------------------------------
   */

  t =
    new Date().getTime();


  const certificateCall =
    WIN_WEBAPP_safeCall(
      'WIN_CERTIFICATE_getDashboardData',
      [
        episodeId,
        noRM
      ]
    );


  result.certificate =
    WIN_WEBAPP_unwrap(
      certificateCall
    );


  result.timing.certificate =
    new Date().getTime() -
    t;


  result.timing.total =
    new Date().getTime() -
    started;


  return result;

}


/* ============================================================
 * 14. STATUS CALCULATOR
 * ============================================================
 *
 * PENTING:
 *
 * Fungsi ini TIDAK memanggil getMotherDashboard().
 *
 * Jadi tidak ada recursive call.
 *
 * ============================================================
 */

function WIN_WEBAPP_calculateStatus(
  modules,
  episodeId,
  noRM
) {

  modules =
    modules || {};


  const lms =
    modules.lms || {};


  const praktik =
    modules.praktik || {};


  const evaluasi =
    modules.evaluasi || {};


  const followup =
    modules.followup || {};


  const certificate =
    modules.certificate || {};


  /* ----------------------------------------------------------
   * LMS
   * ----------------------------------------------------------
   */

  const lmsComplete =

    lms.persentase === 100 ||

    lms.progress === 100 ||

    lms.selesaiSemua === true ||

    lms.complete === true ||

    lms.status === 'SELESAI' ||

    lms.status === 'COMPLETED';


  /* ----------------------------------------------------------
   * PRAKTIK
   * ----------------------------------------------------------
   */

  const praktikComplete =

    praktik.selesaiSemua === true ||

    praktik.complete === true ||

    praktik.verified === true ||

    praktik.status === 'SELESAI' ||

    praktik.status === 'COMPLETED';


  /* ----------------------------------------------------------
   * EVALUASI
   * ----------------------------------------------------------
   */

  const evaluasiPassed =

    evaluasi.lulus === true ||

    evaluasi.passed === true ||

    evaluasi.status === 'LULUS' ||

    evaluasi.status === 'PASSED';


  /* ----------------------------------------------------------
   * FOLLOW UP
   * ----------------------------------------------------------
   */

  const followupComplete =

    followup.selesai === true ||

    followup.complete === true ||

    followup.selesaiSemua === true ||

    followup.status === 'SELESAI' ||

    followup.status === 'COMPLETED';


  /* ----------------------------------------------------------
   * CERTIFICATE
   * ----------------------------------------------------------
   */

  const certificateObject =
    certificate.certificate ||
    certificate.data ||
    null;


  const certificateStatus =
    certificateObject &&
    certificateObject.status
      ? String(
          certificateObject.status
        ).toUpperCase()
      : '';


  const certificateIssued =

    certificateStatus ===
    'ISSUED' ||

    certificateStatus ===
    'TERBIT' ||

    certificateIssuedFallback(
      certificate
    );


  /* ----------------------------------------------------------
   * CURRENT STAGE
   * ----------------------------------------------------------
   */

  let currentStage =
    'LMS';


  if (!lmsComplete) {

    currentStage =
      'LMS';

  }

  else if (!praktikComplete) {

    currentStage =
      'PRAKTIK';

  }

  else if (!evaluasiPassed) {

    currentStage =
      'EVALUASI';

  }

  else if (!followupComplete) {

    currentStage =
      'FOLLOWUP';

  }

  else if (!certificateIssued) {

    currentStage =
      'CERTIFICATE';

  }

  else {

    currentStage =
      'SELESAI';

  }


  const completedCount = [

    lmsComplete,

    praktikComplete,

    evaluasiPassed,

    followupComplete,

    certificateIssued

  ].filter(
    function(value) {

      return value === true;

    }
  ).length;


  const progress =
    Math.round(
      completedCount /
      5 *
      100
    );


  return {

    success:
      true,

    episodeId:
      episodeId,

    noRM:
      noRM,

    stage:
      currentStage,

    progress:
      progress,

    progressDetail: {

      lms:
        !!lmsComplete,

      praktik:
        !!praktikComplete,

      evaluasi:
        !!evaluasiPassed,

      followup:
        !!followupComplete,

      certificate:
        !!certificateIssued

    },

    requirement: {

      lms:
        !!lmsComplete,

      praktik:
        !!praktikComplete,

      evaluasi:
        !!evaluasiPassed,

      followup:
        !!followupComplete,

      certificate:
        !!certificateIssued

    }

  };

}


/* ------------------------------------------------------------
 * CERTIFICATE FALLBACK
 * ------------------------------------------------------------
 */

function certificateIssuedFallback(
  certificate
) {

  if (!certificate) {

    return false;

  }


  if (
    certificate.issued === true
  ) {

    return true;

  }


  if (
    certificate.status ===
    'ISSUED'
  ) {

    return true;

  }


  if (
    certificate.status ===
    'TERBIT'
  ) {

    return true;

  }


  return false;

}


/* ============================================================
 * 15. DASHBOARD IBU
 * ============================================================
 */

function WIN_WEBAPP_getMotherDashboard(
  episodeId,
  noRM
) {

  const validation =
    WIN_WEBAPP_validateEpisode(
      episodeId,
      noRM
    );


  if (
    !validation.success
  ) {

    return validation;

  }


  episodeId =
    validation.episodeId;

  noRM =
    validation.noRM;


  const started =
    new Date().getTime();


  const modules =
    WIN_WEBAPP_loadMotherModules(
      episodeId,
      noRM
    );


  const status =
    WIN_WEBAPP_calculateStatus(
      modules,
      episodeId,
      noRM
    );


  const totalTime =
    new Date().getTime() -
    started;


  Logger.log(
    'WIN MOTHER DASHBOARD [' +
    episodeId +
    '] total=' +
    totalTime +
    'ms ' +
    JSON.stringify(
      modules.timing
    )
  );


  return {

    success:
      true,

    episodeId:
      episodeId,

    noRM:
      noRM,

    data:
      modules.data,

    lms:
      modules.lms,

    praktik:
      modules.praktik,

    evaluasi:
      modules.evaluasi,

    followup:
      modules.followup,

    certificate:
      modules.certificate,

    status:
      status,

    performance: {

      totalMs:
        totalTime,

      modules:
        modules.timing

    }

  };

}


/* ============================================================
 * 16. INITIALIZE MOTHER
 * ============================================================
 */

function WIN_WEBAPP_initializeMother(
  episodeId,
  noRM,
  namaIbu
) {

  episodeId =
    WIN_WEBAPP_normalizeId(
      episodeId
    );


  noRM =
    WIN_WEBAPP_normalizeId(
      noRM
    );


  namaIbu =
    WIN_WEBAPP_normalizeId(
      namaIbu
    );


  if (
    !episodeId ||
    !noRM
  ) {

    return {

      success:
        false,

      message:
        'Data episode belum lengkap.'

    };

  }


  const call =
    WIN_WEBAPP_safeCall(
      'WIN_LMS_initializeEpisode',
      [
        episodeId,
        noRM,
        namaIbu
      ]
    );


  return {

    success:
      true,

    episodeId:
      episodeId,

    noRM:
      noRM,

    namaIbu:
      namaIbu,

    lms:
      WIN_WEBAPP_unwrap(
        call
      )

  };

}


/* ============================================================
 * 17. LMS
 * ============================================================
 */

function WIN_WEBAPP_getLMS(
  episodeId,
  noRM
) {

  return WIN_LMS_getDashboardData(
    episodeId,
    noRM
  );

}


function WIN_WEBAPP_openLMS(
  episodeId,
  noRM,
  namaIbu,
  materiId
) {

  return WIN_LMS_openMateri(
    episodeId,
    noRM,
    namaIbu,
    materiId
  );

}


function WIN_WEBAPP_updateLMSProgress(
  episodeId,
  noRM,
  materiId,
  persentase
) {

  return WIN_LMS_updateProgress(
    episodeId,
    noRM,
    materiId,
    persentase
  );

}


function WIN_WEBAPP_completeLMS(
  episodeId,
  noRM,
  materiId
) {

  return WIN_LMS_completeMateri(
    episodeId,
    noRM,
    materiId
  );

}


/* ============================================================
 * 18. PRAKTIK
 * ============================================================
 */

function WIN_WEBAPP_getPraktik(
  episodeId,
  noRM
) {

  return WIN_PRAKTIK_getDashboardData(
    episodeId,
    noRM
  );

}


function WIN_WEBAPP_startPraktik(
  episodeId,
  noRM,
  praktikId
) {

  return WIN_PRAKTIK_start(
    episodeId,
    noRM,
    praktikId
  );

}


function WIN_WEBAPP_completePraktik(
  episodeId,
  noRM,
  praktikId,
  catatanIbu
) {

  return WIN_PRAKTIK_complete(
    episodeId,
    noRM,
    praktikId,
    catatanIbu
  );

}


function WIN_WEBAPP_getNursePraktik(
  episodeId,
  noRM
) {

  return WIN_PRAKTIK_getNurseSummary(
    episodeId,
    noRM
  );

}


function WIN_WEBAPP_verifyPraktik(
  episodeId,
  noRM,
  praktikId,
  perawatId,
  namaPerawat,
  hasil,
  catatanPerawat
) {

  return WIN_PRAKTIK_verify(
    episodeId,
    noRM,
    praktikId,
    perawatId,
    namaPerawat,
    hasil,
    catatanPerawat
  );

}


/* ============================================================
 * 19. EVALUASI
 * ============================================================
 */

function WIN_WEBAPP_getEvaluasi(
  episodeId,
  noRM
) {

  return WIN_EVALUASI_getDashboardData(
    episodeId,
    noRM
  );

}


function WIN_WEBAPP_getQuestions(
  episodeId,
  noRM
) {

  return WIN_EVALUASI_getQuestions(
    episodeId,
    noRM
  );

}


function WIN_WEBAPP_saveAnswer(
  episodeId,
  noRM,
  evaluasiId,
  jawaban
) {

  return WIN_EVALUASI_saveAnswer(
    episodeId,
    noRM,
    evaluasiId,
    jawaban
  );

}


function WIN_WEBAPP_submitEvaluasi(
  episodeId,
  noRM,
  namaIbu
) {

  return WIN_EVALUASI_submit(
    episodeId,
    noRM,
    namaIbu
  );

}


/* ============================================================
 * 20. FOLLOW UP
 * ============================================================
 *
 * ENGINE RESMI:
 *
 * WIN_FOLLOWUP_get
 * WIN_FOLLOWUP_save
 *
 * ============================================================
 */

function WIN_WEBAPP_getFollowUp(
  episodeId,
  noRM
) {

  episodeId =
    WIN_WEBAPP_normalizeId(
      episodeId
    );


  noRM =
    WIN_WEBAPP_normalizeId(
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


  const call =
    WIN_WEBAPP_safeCall(
      'WIN_FOLLOWUP_get',
      [
        episodeId,
        noRM
      ]
    );


  if (
    call.success
  ) {

    return call.data;

  }


  return {

    success:
      false,

    episodeId:
      episodeId,

    noRM:
      noRM,

    message:
      call.message

  };

}


/* ------------------------------------------------------------
 * SAVE FOLLOW UP
 * ------------------------------------------------------------
 */

function WIN_WEBAPP_saveFollowUp(
  episodeId,
  noRM,
  data
) {

  episodeId =
    WIN_WEBAPP_normalizeId(
      episodeId
    );


  noRM =
    WIN_WEBAPP_normalizeId(
      noRM
    );


  data =
    data || {};


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


  const call =
    WIN_WEBAPP_safeCall(
      'WIN_FOLLOWUP_save',
      [
        episodeId,
        noRM,
        data
      ]
    );


  if (
    call.success
  ) {

    return call.data;

  }


  return {

    success:
      false,

    episodeId:
      episodeId,

    noRM:
      noRM,

    message:
      call.message

  };

}


/* ------------------------------------------------------------
 * COMPLETE FOLLOW UP
 * ------------------------------------------------------------
 *
 * Karena engine saat ini hanya mempunyai GET dan SAVE,
 * COMPLETE menggunakan SAVE.
 *
 * ============================================================
 */

function WIN_WEBAPP_completeFollowUp(
  episodeId,
  noRM,
  data
) {

  data =
    data || {};


  /*
   * Tandai selesai bila belum ada status.
   */

  if (
    data.selesai === undefined
  ) {

    data.selesai =
      true;

  }


  if (
    data.status === undefined
  ) {

    data.status =
      'SELESAI';

  }


  return WIN_WEBAPP_saveFollowUp(
    episodeId,
    noRM,
    data
  );

}


/* ============================================================
 * 21. CERTIFICATE
 * ============================================================
 */

function WIN_WEBAPP_getCertificate(
  episodeId,
  noRM
) {

  return WIN_CERTIFICATE_getDashboardData(
    episodeId,
    noRM
  );

}


function WIN_WEBAPP_issueCertificate(
  episodeId,
  noRM,
  namaIbu,
  verifiedBy,
  verifiedName
) {

  return WIN_CERTIFICATE_issue(
    episodeId,
    noRM,
    namaIbu,
    verifiedBy,
    verifiedName
  );

}


function WIN_WEBAPP_verifyCertificate(
  certificateId
) {

  return WIN_CERTIFICATE_verify(
    certificateId
  );

}


function WIN_WEBAPP_updateCertificateUrl(
  certificateId,
  certificateUrl,
  pdfUrl
) {

  return WIN_CERTIFICATE_updateUrl(
    certificateId,
    certificateUrl,
    pdfUrl
  );

}


function WIN_WEBAPP_revokeCertificate(
  certificateId,
  alasan
) {

  return WIN_CERTIFICATE_revoke(
    certificateId,
    alasan
  );

}


function WIN_WEBAPP_getCertificateById(
  certificateId
) {

  return WIN_CERTIFICATE_getById(
    certificateId
  );

}


/* ============================================================
 * 22. NURSE DASHBOARD — OPTIMIZED
 * ============================================================
 *
 * VERSI LAMA:
 *
 * Nurse
 *   ↓
 * Data
 * Praktik
 * Evaluasi
 * Certificate
 * Status
 *   ↓
 * Mother Dashboard
 *   ↓
 * Data
 * LMS
 * Praktik
 * Evaluasi
 * Follow Up
 * Certificate
 *
 * Banyak pemanggilan berulang.
 *
 *
 * VERSI 3.2:
 *
 * Nurse
 *   ↓
 * Data
 * LMS
 * Praktik
 * Evaluasi
 * Follow Up
 * Certificate
 *   ↓
 * Calculate Status
 *
 * ============================================================
 */

function WIN_WEBAPP_getNurseDashboard(
  episodeId,
  noRM
) {

  const validation =
    WIN_WEBAPP_validateEpisode(
      episodeId,
      noRM
    );


  if (
    !validation.success
  ) {

    return validation;

  }


  episodeId =
    validation.episodeId;

  noRM =
    validation.noRM;


  const started =
    new Date().getTime();


  const modules =
    WIN_WEBAPP_loadMotherModules(
      episodeId,
      noRM
    );


  const status =
    WIN_WEBAPP_calculateStatus(
      modules,
      episodeId,
      noRM
    );


  const totalTime =
    new Date().getTime() -
    started;


  Logger.log(
    'WIN NURSE DASHBOARD [' +
    episodeId +
    '] total=' +
    totalTime +
    'ms ' +
    JSON.stringify(
      modules.timing
    )
  );


  return {

    success:
      true,

    episodeId:
      episodeId,

    noRM:
      noRM,

    data:
      modules.data,

    lms:
      modules.lms,

    praktik:
      modules.praktik,

    evaluasi:
      modules.evaluasi,

    followup:
      modules.followup,

    certificate:
      modules.certificate,

    status:
      status,

    performance: {

      totalMs:
        totalTime,

      modules:
        modules.timing

    }

  };

}


/* ============================================================
 * 23. EPISODE STATUS — OPTIMIZED
 * ============================================================
 *
 * TIDAK BOLEH:
 *
 * getEpisodeStatus()
 *     ↓
 * getMotherDashboard()
 *     ↓
 * getEpisodeStatus()
 *
 * Sekarang:
 *
 * getEpisodeStatus()
 *     ↓
 * load modules sekali
 *     ↓
 * calculateStatus()
 *
 * ============================================================
 */

function WIN_WEBAPP_getEpisodeStatus(
  episodeId,
  noRM
) {

  const validation =
    WIN_WEBAPP_validateEpisode(
      episodeId,
      noRM
    );


  if (
    !validation.success
  ) {

    return validation;

  }


  episodeId =
    validation.episodeId;

  noRM =
    validation.noRM;


  const started =
    new Date().getTime();


  const modules =
    WIN_WEBAPP_loadMotherModules(
      episodeId,
      noRM
    );


  const status =
    WIN_WEBAPP_calculateStatus(
      modules,
      episodeId,
      noRM
    );


  const totalTime =
    new Date().getTime() -
    started;


  status.performance = {

    totalMs:
      totalTime,

    modules:
      modules.timing

  };


  Logger.log(
    'WIN EPISODE STATUS [' +
    episodeId +
    '] total=' +
    totalTime +
    'ms'
  );


  return status;

}


/* ============================================================
 * 24. ROUTER ACTION
 * ============================================================
 */

function WIN_WEBAPP_action(
  action,
  params
) {

  params =
    params || {};


  const actionName =
    String(
      action || ''
    ).trim();


  switch (actionName) {


    /* ========================================================
     * LOGIN
     * ========================================================
     */

    case 'loginIbu':

      return WIN_WEBAPP_loginIbu(
        params.noRM,
        params.episodeId
      );


    case 'loginPerawat':

      return WIN_WEBAPP_loginPerawat(
        params.userId,
        params.namaPerawat
      );


    /* ========================================================
     * DASHBOARD
     * ========================================================
     */

    case 'getDashboard':

      return WIN_WEBAPP_getMotherDashboard(
        params.episodeId,
        params.noRM
      );


    case 'getStatus':

      return WIN_WEBAPP_getEpisodeStatus(
        params.episodeId,
        params.noRM
      );


    case 'getNurseDashboard':

      return WIN_WEBAPP_getNurseDashboard(
        params.episodeId,
        params.noRM
      );


    /* ========================================================
     * DATA
     * ========================================================
     */

    case 'getData':

      return WIN_WEBAPP_getMotherData(
        params.episodeId,
        params.noRM
      );


    case 'saveData':

      return WIN_WEBAPP_saveMotherData(
        params.data
      );


    case 'saveMotherData':

      return WIN_WEBAPP_saveMotherData(
        params.data
      );


    case 'getResearchData':

      return WIN_WEBAPP_getResearchData(
        params.episodeId
      );


    /* ========================================================
     * INITIALIZE
     * ========================================================
     */

    case 'initializeMother':

      return WIN_WEBAPP_initializeMother(
        params.episodeId,
        params.noRM,
        params.namaIbu
      );


    /* ========================================================
     * LMS
     * ========================================================
     */

    case 'getLMS':

      return WIN_WEBAPP_getLMS(
        params.episodeId,
        params.noRM
      );


    case 'openLMS':

      return WIN_WEBAPP_openLMS(
        params.episodeId,
        params.noRM,
        params.namaIbu,
        params.materiId
      );


    case 'updateLMSProgress':

      return WIN_WEBAPP_updateLMSProgress(
        params.episodeId,
        params.noRM,
        params.materiId,
        params.persentase
      );


    case 'completeLMS':

      return WIN_WEBAPP_completeLMS(
        params.episodeId,
        params.noRM,
        params.materiId
      );


    /* ========================================================
     * PRAKTIK
     * ========================================================
     */

    case 'getPraktik':

      return WIN_WEBAPP_getPraktik(
        params.episodeId,
        params.noRM
      );


    case 'startPraktik':

      return WIN_WEBAPP_startPraktik(
        params.episodeId,
        params.noRM,
        params.praktikId
      );


    case 'completePraktik':

      return WIN_WEBAPP_completePraktik(
        params.episodeId,
        params.noRM,
        params.praktikId,
        params.catatanIbu
      );


    case 'verifyPraktik':

      return WIN_WEBAPP_verifyPraktik(
        params.episodeId,
        params.noRM,
        params.praktikId,
        params.perawatId,
        params.namaPerawat,
        params.hasil,
        params.catatanPerawat
      );


    case 'getNursePraktik':

      return WIN_WEBAPP_getNursePraktik(
        params.episodeId,
        params.noRM
      );


    /* ========================================================
     * EVALUASI
     * ========================================================
     */

    case 'getEvaluasi':

      return WIN_WEBAPP_getEvaluasi(
        params.episodeId,
        params.noRM
      );


    case 'getQuestions':

      return WIN_WEBAPP_getQuestions(
        params.episodeId,
        params.noRM
      );


    case 'saveAnswer':

      return WIN_WEBAPP_saveAnswer(
        params.episodeId,
        params.noRM,
        params.evaluasiId,
        params.jawaban
      );


    case 'submitEvaluasi':

      return WIN_WEBAPP_submitEvaluasi(
        params.episodeId,
        params.noRM,
        params.namaIbu
      );


    /* ========================================================
     * FOLLOW UP
     * ========================================================
     */

    case 'getFollowUp':

      return WIN_WEBAPP_getFollowUp(
        params.episodeId,
        params.noRM
      );


    case 'saveFollowUp':

      return WIN_WEBAPP_saveFollowUp(
        params.episodeId,
        params.noRM,
        params.data
      );


    case 'completeFollowUp':

      return WIN_WEBAPP_completeFollowUp(
        params.episodeId,
        params.noRM,
        params.data
      );


    /* ========================================================
     * CERTIFICATE
     * ========================================================
     */

    case 'getCertificate':

      return WIN_WEBAPP_getCertificate(
        params.episodeId,
        params.noRM
      );


    case 'getCertificateById':

      return WIN_WEBAPP_getCertificateById(
        params.certificateId
      );


    case 'issueCertificate':

      return WIN_WEBAPP_issueCertificate(
        params.episodeId,
        params.noRM,
        params.namaIbu,
        params.verifiedBy,
        params.verifiedName
      );


    case 'verifyCertificate':

      return WIN_WEBAPP_verifyCertificate(
        params.certificateId
      );


    case 'updateCertificateUrl':

      return WIN_WEBAPP_updateCertificateUrl(
        params.certificateId,
        params.certificateUrl,
        params.pdfUrl
      );


    case 'revokeCertificate':

      return WIN_WEBAPP_revokeCertificate(
        params.certificateId,
        params.alasan
      );


    /* ========================================================
     * APP INFO
     * ========================================================
     */

    case 'getAppInfo':

      return WIN_WEBAPP_getAppInfo();


    case 'getUrl':

      return {

        success:
          true,

        url:
          WIN_WEBAPP_getUrl()

      };


    /* ========================================================
     * DEFAULT
     * ========================================================
     */

    default:

      return {

        success:
          false,

        message:
          'Action tidak dikenali: ' +
          actionName

      };

  }

}


/* ============================================================
 * 25. WEB APP URL
 * ============================================================
 */

function WIN_WEBAPP_getUrl() {

  try {

    return ScriptApp
      .getService()
      .getUrl();

  }

  catch (error) {

    return '';

  }

}


/* ============================================================
 * 26. HEALTH CHECK
 * ============================================================
 */

function WIN_WEBAPP_HEALTH_CHECK() {

  const result = {

    success:
      true,

    appName:
      WIN_WEBAPP.APP_NAME,

    version:
      WIN_WEBAPP.VERSION,

    webAppUrl:
      WIN_WEBAPP_getUrl(),

    pages: {

      login:
        WIN_WEBAPP.PAGES.LOGIN,

      dashboard:
        WIN_WEBAPP.PAGES.DASHBOARD,

      data:
        WIN_WEBAPP.PAGES.DATA,

      lms:
        WIN_WEBAPP.PAGES.LMS,

      praktik:
        WIN_WEBAPP.PAGES.PRAKTIK,

      evaluasi:
        WIN_WEBAPP.PAGES.EVALUASI,

      followup:
        WIN_WEBAPP.PAGES.FOLLOWUP,

      certificate:
        WIN_WEBAPP.PAGES.CERTIFICATE,

      nurse:
        WIN_WEBAPP.PAGES.NURSE

    },

    engine: {

      episode:
        typeof WIN_EPISODE_getById ===
        'function',

      dataIbuBayi:
        typeof WIN_DATA_IBU_BAYI_save ===
        'function',

      dataIbuBayiGet:
        typeof WIN_DATA_IBU_BAYI_getByEpisode ===
        'function',

      lms:
        typeof WIN_LMS_getDashboardData ===
        'function',

      praktik:
        typeof WIN_PRAKTIK_getDashboardData ===
        'function',

      praktikNurse:
        typeof WIN_PRAKTIK_getNurseSummary ===
        'function',

      evaluasi:
        typeof WIN_EVALUASI_getDashboardData ===
        'function',

      evaluasiLatest:
        typeof WIN_EVALUASI_getLatestResult ===
        'function',

      certificate:
        typeof WIN_CERTIFICATE_getDashboardData ===
        'function',

      certificateEpisode:
        typeof WIN_CERTIFICATE_getByEpisode ===
        'function',

      followup:
        typeof WIN_FOLLOWUP_get ===
        'function',

      followupSave:
        typeof WIN_FOLLOWUP_save ===
        'function'

    },

    timestamp:
      new Date()

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


/* ============================================================
 * 27. HEALTH CHECK FOLLOW UP
 * ============================================================
 */

function WIN_WEBAPP_HEALTH_CHECK_FOLLOWUP() {

  const result = {

    success:
      true,

    page:
      WIN_WEBAPP.PAGES.FOLLOWUP,

    route:
      WIN_WEBAPP_getPage({

        parameter: {

          page:
            'followup'

        }

      }),

    functions: {

      get:
        typeof WIN_FOLLOWUP_get ===
        'function',

      save:
        typeof WIN_FOLLOWUP_save ===
        'function'

    },

    note:
      'Engine Follow Up saat ini menggunakan WIN_FOLLOWUP_get dan WIN_FOLLOWUP_save.'

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


/* ============================================================
 * 28. TEST ROUTER
 * ============================================================
 */

function WIN_WEBAPP_TEST() {

  Logger.log(
    '======================================'
  );

  Logger.log(
    'WIN WEBAPP 3.2.0'
  );

  Logger.log(
    '======================================'
  );


  Logger.log(
    JSON.stringify(
      WIN_WEBAPP_getAppInfo(),
      null,
      2
    )
  );


  Logger.log(
    'Default page: ' +
    WIN_WEBAPP.DEFAULT_PAGE
  );


  Logger.log(
    'Login page: ' +
    WIN_WEBAPP.PAGES.LOGIN
  );


  Logger.log(
    'Dashboard page: ' +
    WIN_WEBAPP.PAGES.DASHBOARD
  );


  Logger.log(
    'Data page: ' +
    WIN_WEBAPP.PAGES.DATA
  );


  Logger.log(
    'LMS page: ' +
    WIN_WEBAPP.PAGES.LMS
  );


  Logger.log(
    'Praktik page: ' +
    WIN_WEBAPP.PAGES.PRAKTIK
  );


  Logger.log(
    'Evaluasi page: ' +
    WIN_WEBAPP.PAGES.EVALUASI
  );


  Logger.log(
    'Follow Up page: ' +
    WIN_WEBAPP.PAGES.FOLLOWUP
  );


  Logger.log(
    'Certificate page: ' +
    WIN_WEBAPP.PAGES.CERTIFICATE
  );


  Logger.log(
    'Nurse page: ' +
    WIN_WEBAPP.PAGES.NURSE
  );

}


/* ============================================================
 * 29. TEST ROUTING
 * ============================================================
 */

function WIN_WEBAPP_TEST_ROUTING() {

  const pages = [

    'login',

    'dashboard',

    'data',

    'lms',

    'praktik',

    'evaluasi',

    'followup',

    'follow-up',

    'follow_up',

    'certificate',

    'sertifikat',

    'nurse',

    'perawat'

  ];


  pages.forEach(
    function(page) {

      const fakeEvent = {

        parameter: {

          page:
            page

        }

      };


      Logger.log(

        page +
        ' → ' +
        WIN_WEBAPP_getPage(
          fakeEvent
        )

      );

    }
  );

}


/* ============================================================
 * 30. TEST FOLLOW UP ROUTER
 * ============================================================
 */

function WIN_WEBAPP_TEST_FOLLOWUP_ROUTER() {

  Logger.log(
    '======================================'
  );

  Logger.log(
    'WIN FOLLOW UP ROUTER TEST'
  );

  Logger.log(
    '======================================'
  );


  Logger.log(
    'Page followup: ' +
    WIN_WEBAPP_getPage({

      parameter: {

        page:
          'followup'

      }

    })
  );


  Logger.log(
    'Page follow-up: ' +
    WIN_WEBAPP_getPage({

      parameter: {

        page:
          'follow-up'

      }

    })
  );


  Logger.log(
    'Page follow_up: ' +
    WIN_WEBAPP_getPage({

      parameter: {

        page:
          'follow_up'

      }

    })
  );


  Logger.log(
    'FOLLOWUP PAGE: ' +
    WIN_WEBAPP.PAGES.FOLLOWUP
  );


  Logger.log(
    '======================================'
  );

}


/* ============================================================
 * 31. TEST DATA IBU BAYI
 * ============================================================
 */

function WIN_WEBAPP_TEST_DATA_IBU_BAYI() {

  Logger.log(
    '======================================'
  );

  Logger.log(
    'WIN DATA IBU & BAYI TEST'
  );

  Logger.log(
    '======================================'
  );


  try {

    const result =
      WIN_DATA_IBU_BAYI_SETUP();


    Logger.log(
      JSON.stringify(
        result,
        null,
        2
      )
    );

  }

  catch (error) {

    Logger.log(
      'ERROR: ' +
      error.message
    );

  }

}


/* ============================================================
 * 32. TEST CERTIFICATE
 * ============================================================
 */

function WIN_WEBAPP_TEST_CERTIFICATE() {

  Logger.log(
    '======================================'
  );

  Logger.log(
    'WIN CERTIFICATE TEST'
  );

  Logger.log(
    '======================================'
  );


  try {

    const result =
      WIN_CERTIFICATE_ensureSheet();


    Logger.log(
      'Sheet: ' +
      result.getName()
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

  catch (error) {

    Logger.log(
      'ERROR: ' +
      error.message
    );

  }

}


/* ============================================================
 * 33. PERFORMANCE TEST
 * ============================================================
 *
 * Gunakan setelah mempunyai Episode ID dan No. RM nyata.
 *
 * CONTOH:
 *
 * WIN_WEBAPP_TEST_PERFORMANCE(
 *   'EPISODE-001',
 *   '123456'
 * );
 *
 * ============================================================
 */

function WIN_WEBAPP_TEST_PERFORMANCE(
  episodeId,
  noRM
) {

  episodeId =
    WIN_WEBAPP_normalizeId(
      episodeId
    );


  noRM =
    WIN_WEBAPP_normalizeId(
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
        'Episode ID dan No. RM wajib diisi untuk performance test.'

    };

  }


  Logger.log(
    '======================================'
  );

  Logger.log(
    'WIN PERFORMANCE TEST'
  );

  Logger.log(
    'Episode: ' +
    episodeId
  );

  Logger.log(
    'No RM: ' +
    noRM
  );

  Logger.log(
    '======================================'
  );


  const started =
    new Date().getTime();


  const result =
    WIN_WEBAPP_getNurseDashboard(
      episodeId,
      noRM
    );


  const total =
    new Date().getTime() -
    started;


  Logger.log(
    'TOTAL: ' +
    total +
    ' ms'
  );


  if (
    result &&
    result.performance
  ) {

    Logger.log(
      JSON.stringify(
        result.performance,
        null,
        2
      )
    );

  }


  Logger.log(
    '======================================'
  );


  return result;

}


/* ============================================================
 * 34. FULL HEALTH CHECK
 * ============================================================
 */

function WIN_WEBAPP_FULL_HEALTH_CHECK() {

  const result = {

    app:
      WIN_WEBAPP_getAppInfo(),

    webapp:
      WIN_WEBAPP_HEALTH_CHECK(),

    followup:
      WIN_WEBAPP_HEALTH_CHECK_FOLLOWUP(),

    timestamp:
      new Date()

  };


  Logger.log(
    '======================================'
  );

  Logger.log(
    'WIN FULL HEALTH CHECK'
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
