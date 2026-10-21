require('dotenv').config();
const puppeteer = require('puppeteer-core');

/**
 * Script Automasi Login ECM / K2 Workspace
 * Mengambil kredensial dari environment variable (.env)
 * 
 * Penggunaan:
 * npm run login
 */

const BASE_URL = process.env.ECM_BASE_URL || 'https://ecm-uat-k2.eigerindo.co.id';
const LOGIN_URL = `${BASE_URL}/Workspace/`;
const USERNAME = process.env.ECM_USERNAME;
const PASSWORD = process.env.ECM_PASSWORD;
const CDP_ENDPOINT = process.env.CDP_WS_ENDPOINT;

async function login() {
  if (!USERNAME || !PASSWORD) {
    console.error('❌ Error: ECM_USERNAME atau ECM_PASSWORD belum diset!');
    console.error('Silakan salin .env.example menjadi .env lalu isi kredensial Anda.');
    process.exit(1);
  }

  console.log('🚀 Memulai proses login ECM K2...');
  console.log(`🔗 Target URL: ${LOGIN_URL}`);
  console.log(`👤 Akun: ${USERNAME}`);

  let browser;
  try {
    if (CDP_ENDPOINT) {
      console.log(`📡 Menghubungkan ke browser via CDP: ${CDP_ENDPOINT}`);
      browser = await puppeteer.connect({ browserWSEndpoint: CDP_ENDPOINT });
    } else {
      // Mencoba mencari executable Chrome lokal atau koneksi default
      const executablePath = process.env.CHROME_PATH || 
        (process.platform === 'win32' 
          ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' 
          : '/usr/bin/google-chrome' || '/usr/bin/chromium-browser');
          
      browser = await puppeteer.launch({
        headless: false,
        executablePath: executablePath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--ignore-certificate-errors'
        ]
      });
    }

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    console.log('⏳ Membuka halaman login...');
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 60000 });

    // Cek apakah halaman redirect ke Form STS Login
    const currentUrl = page.url();
    console.log(`📍 Halaman saat ini: ${currentUrl}`);

    if (currentUrl.includes('/Account/Login') || currentUrl.includes('Identity/STS')) {
      console.log('🔑 Mengisi formulir kredensial...');
      await page.waitForSelector('#UserName', { timeout: 15000 });
      await page.type('#UserName', USERNAME, { delay: 50 });
      await page.type('#Password', PASSWORD, { delay: 50 });

      console.log('🔘 Klik tombol Sign In / Submit...');
      // Form STS K2 biasanya menggunakan submit button atau input button
      const submitBtn = await page.$('input[type="submit"], button[type="submit"], a.button');
      if (submitBtn) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
          submitBtn.click()
        ]);
      } else {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
          page.keyboard.press('Enter')
        ]);
      }

      console.log('✅ Berhasil submit form login.');
    } else if (currentUrl.includes('/Workspace/')) {
      console.log('ℹ️ Sudah dalam status login (sesi aktif).');
    }

    // Verifikasi URL akhir
    console.log(`🎉 URL Setelah Login: ${page.url()}`);
    console.log('✨ Sesi login K2 berhasil.');

    return { success: true, page, browser };
  } catch (error) {
    console.error('❌ Terjadi kesalahan saat proses login:', error.message);
    if (browser && !CDP_ENDPOINT) {
      await browser.close();
    }
    throw error;
  }
}

if (require.main === module) {
  login().then(() => {
    console.log('Selesai.');
  }).catch(() => {
    process.exit(1);
  });
}

module.exports = { login };
