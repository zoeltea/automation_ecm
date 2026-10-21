require('dotenv').config();
const { getChromePath, FORM_URL, CDP_ENDPOINT, USER_DATA_DIR } = require('./config');

/**
 * K2 SmartForms GA Service Ticket Automation Module
 * Target: https://ecm-uat-k2.eigerindo.co.id/Workspace/Form/f.25.GAServiceTicketing
 */

/**
 * Client-side script injected into K2 SmartForms (DOM/browser context)
 */
function createTicketWorkflow(ticketData = {}) {
  const {
    ticketType = "GA HO",
    description = "Automated Test GA Service Ticket " + new Date().toLocaleString("id-ID"),
    detailService = "Layanan Fasilitas Ruang Meeting (kebersihan dan kerapihan)"
  } = ticketData;

  let doc = document;
  const iframe = document.querySelector('iframe[src*="f.25.GAServiceTicketing"]');
  if (iframe) {
    doc = iframe.contentDocument || iframe.contentWindow.document;
  }

  return new Promise(async (resolve, reject) => {
    try {
      console.log("[K2 Auto] Memulai pengisian form tiket...");

      // 1. Set Request Description
      const descBox = Array.from(doc.querySelectorAll('textarea, input[type="text"]')).find(el => {
        const row = el.closest('tr') || el.parentElement;
        return row && (row.innerText.includes('Request Description') || el.name?.includes('Description'));
      });
      if (descBox) {
        descBox.value = description;
        descBox.dispatchEvent(new Event('input', { bubbles: true }));
        descBox.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // 2. Klik Add Detail Service
      const addBtn = Array.from(doc.querySelectorAll('a')).find(a => 
        a.innerText.trim() === 'Add' && (a.className.includes('toolbar-button') || a.closest('div[name*="Detail"], div[id*="Detail"]'))
      );
      if (addBtn && !addBtn.className.includes('disabled')) {
        addBtn.click();
        await new Promise(r => setTimeout(r, 800));
      }

      // 3. Load E-Sign
      const loadSignBtn = Array.from(doc.querySelectorAll('a')).find(a => a.innerText.trim() === 'LOAD E-SIGN');
      if (loadSignBtn) {
        loadSignBtn.click();
        await new Promise(r => setTimeout(r, 800));
      }

      // 4. Submit Ticket
      const submitBtn = Array.from(doc.querySelectorAll('a')).find(a => a.innerText.trim() === 'Submit');
      if (submitBtn) {
        submitBtn.click();
        await new Promise(r => setTimeout(r, 1200));
      }

      // 5. Handle Confirmation Modal "Are you sure ?"
      const okButtons = Array.from(doc.querySelectorAll('a, button')).filter(el => el.innerText.trim() === 'OK');
      if (okButtons.length > 0) {
        okButtons[okButtons.length - 1].click();
        await new Promise(r => setTimeout(r, 2000));
      }

      // 6. Capture Result Notification (Doc Number / Workflow ID)
      let resultText = "Submitted";
      const resultModal = Array.from(doc.querySelectorAll('div, p, span')).find(el => el.innerText && el.innerText.includes('Workflow ID :'));
      if (resultModal) {
        resultText = resultModal.innerText.trim();
        const closeOk = Array.from(doc.querySelectorAll('a, button')).find(el => el.innerText.trim() === 'OK' && el.offsetParent !== null);
        if (closeOk) closeOk.click();
      }

      resolve({ success: true, result: resultText });
    } catch (err) {
      reject({ success: false, error: err.message });
    }
  });
}

// Auto-run if executed directly via node src/create_ticket.js
if (require.main === module) {
  const puppeteer = require('puppeteer-core');

  (async () => {
    try {
      console.log('🚀 Menjalankan create_ticket automation...');
      let browser;

      if (CDP_ENDPOINT) {
        console.log(`📡 Menghubungkan ke browser via CDP: ${CDP_ENDPOINT}`);
        browser = await puppeteer.connect({ browserWSEndpoint: CDP_ENDPOINT });
      } else {
        const executablePath = getChromePath();
        console.log(`🌐 Membuka Chrome browser (${executablePath})...`);
        browser = await puppeteer.launch({
          headless: false,
          executablePath,
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
      let page = pages.find(p => p.url().includes('GAServiceTicketing'));
      if (!page) {
        page = pages[0] || (await browser.newPage());
        console.log(`⏳ Membuka form tiket: ${FORM_URL}`);
        await page.goto(FORM_URL, { waitUntil: 'networkidle2', timeout: 60000 });
      }

      console.log('📄 Mengeksekusi workflow createTicket di halaman K2 SmartForms...');
      const res = await page.evaluate(createTicketWorkflow);
      console.log('🎉 Hasil eksekusi:', res);

      console.log('✨ Tiket berhasil dibuat.');
    } catch (err) {
      console.error('❌ Terjadi kesalahan saat create_ticket:', err.message);
      process.exit(1);
    }
  })();
}

module.exports = {
  createTicketWorkflow,
  FORM_URL
};
