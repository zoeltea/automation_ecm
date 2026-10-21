require('dotenv').config();
const puppeteer = require('puppeteer-core');
const { getChromePath, BASE_URL, USERNAME, PASSWORD, CDP_ENDPOINT, USER_DATA_DIR } = require('./config');

/**
 * Script Automasi Login ECM / K2 Workspace
 * Mengambil kredensial dari environment variable (.env)
 * 
 * Penggunaan:
 * npm run login
 */

const LOGIN_URL = `${BASE_URL}/Workspace/`;

async function login() {
  if (!USERNAME || !PASSWORD) {
    console.error('❌ Error: ECM_USERNAME atau ECM_PASSWORD belum diset di file .env!');
    console.error('Silakan buat file .env dari .env.example lalu isi:');
    console.error('ECM_USERNAME=username_anda');
    console.error('ECM_PASSWORD=password_anda');
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
      const executablePath = getChromePath();
      console.log(`🌐 Membuka Chrome browser (${executablePath})...`);
      browser = await puppeteer.launch({
        headless: false,
        executablePath: executablePath,
        userDataDir: USER_DATA_DIR,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--ignore-certificate-errors',
          '--start-maximized'
        ]
      });
    }

    const pages = await browser.pages();
    const page = pages[0] || (await browser.newPage());
    await page.setViewport({ width: 1366, height: 768 });

    console.log('⏳ Membuka halaman Workspace / Login...');
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 60000 });

    const currentUrl = page.url();
    console.log(`📍 Halaman saat ini: ${currentUrl}`);

    if (currentUrl.includes('/Account/Login') || currentUrl.includes('Identity/STS')) {
      console.log('🔑 Mengisi formulir kredensial...');
      await page.waitForSelector('#UserName', { timeout: 15000 });
      await page.type('#UserName', USERNAME, { delay: 50 });
      await page.type('#Password', PASSWORD, { delay: 50 });

      console.log('🔘 Klik tombol Sign In / Submit...');
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

    console.log(`🎉 URL Setelah Login: ${page.url()}`);
    console.log('✨ Sesi login K2 berhasil disimpan di .chrome_session.');

    return { success: true, page, browser };
  } catch (error) {
    console.error('❌ Terjadi kesalahan saat proses login:', error.message);
    throw error;
  }
}

if (require.main === module) {
  login().then(() => {
    console.log('Selesai.');
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { login };
