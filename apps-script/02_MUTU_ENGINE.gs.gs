// =====================================================
// BUILDER PACK 2 - FIX PRECISION
// FILE 02 : MUTU ENGINE
// =====================================================

function hitungMutuNICU(data, jumlahTT, tahun, bulan) {
  const hariDalamBulan = new Date(tahun, bulan + 1, 0).getDate();

  // Pasien Keluar Total (Hidup + Meninggal) sesuai Standar Kemenkes
  const pasienKeluar = (data.krs || 0) + (data.rujuk || 0) + (data.pp || 0) + (data.meninggal || 0);
  const hariRawat = data.hariRawat || 0;

  const bor = (jumlahTT > 0 && hariDalamBulan > 0) ? (hariRawat / (jumlahTT * hariDalamBulan)) * 100 : 0;
  const alos = pasienKeluar > 0 ? hariRawat / pasienKeluar : 0;
  const toi = pasienKeluar > 0 ? ((jumlahTT * hariDalamBulan) - hariRawat) / pasienKeluar : 0;
  const bto = jumlahTT > 0 ? pasienKeluar / jumlahTT : 0;
  
  // Pembagi GDR & NDR WAJIB pasienKeluar
  const gdr = pasienKeluar > 0 ? ((data.meninggal || 0) / pasienKeluar) * 1000 : 0;
  const ndr = pasienKeluar > 0 ? ((data.lebih48 || 0) / pasienKeluar) * 1000 : 0;

  return {
    BOR: bor,
    ALOS: alos,
    TOI: toi,
    BTO: bto,
    GDR: gdr,
    NDR: ndr
  };
}

function updateMutuRekapNICU() {
  // Panggil fungsi utama agar seluruh tabel dan mutu diperbarui secara sinkron & presisi
  if (typeof PAKSA_GENERATE_REKAP === "function") {
    PAKSA_GENERATE_REKAP(true);
  } else {
    SpreadsheetApp.getActive().toast("Fungsi PAKSA_GENERATE_REKAP tidak ditemukan!", "Error", 5);
  }
}
