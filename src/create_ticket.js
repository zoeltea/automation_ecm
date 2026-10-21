require('dotenv').config();

/**
 * K2 SmartForms GA Service Ticket Automation Module
 * Target: https://ecm-uat-k2.eigerindo.co.id/Workspace/Form/f.25.GAServiceTicketing
 */

const FORM_URL = process.env.K2_FORM_URL || "https://ecm-uat-k2.eigerindo.co.id/Workspace/Form/f.25.GAServiceTicketing";

/**
 * Client-side script injected into K2 SmartForms (DOM/browser context)
 */
function createTicketWorkflow(ticketData = {}) {
  const {
    ticketType = "GA HO",
    serviceType = "Layanan Kantor (Office Service)",
    description = "Automated Test GA Service Ticket " + new Date().toLocaleString("id-ID"),
    detailServiceIndex = 1
  } = ticketData;

  let doc = document;
  const iframe = document.querySelector('iframe[src*="f.25.GAServiceTicketing"]');
  if (iframe) {
    doc = iframe.contentDocument || iframe.contentWindow.document;
  }

  return new Promise(async (resolve, reject) => {
    try {
      console.log("[K2 Auto] Memulai pengisian form tiket...");

      // 1. Pilih Type of Ticket jika perlu
      const ticketTypeBtn = doc.querySelector('a[id*="Type of Ticket"], div[name*="Type of Ticket"] a.drop-menu, a.drop-menu');
      
      // 2. Set Request Description
      const descBox = Array.from(doc.querySelectorAll('textarea, input[type="text"]')).find(el => {
        const row = el.closest('tr') || el.parentElement;
        return row && (row.innerText.includes('Request Description') || el.name?.includes('Description'));
      });
      if (descBox) {
        descBox.value = description;
        descBox.dispatchEvent(new Event('input', { bubbles: true }));
        descBox.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // 3. Tambahkan Detail Service (Add)
      const addBtn = Array.from(doc.querySelectorAll('a')).find(a => 
        a.innerText.trim() === 'Add' && a.closest('div[name*="Detail"], div[id*="Detail"]')
      );
      if (addBtn) {
        addBtn.click();
        await new Promise(r => setTimeout(r, 800));
      }

      // 4. Simpan baris Detail Service (Save)
      const saveBtn = Array.from(doc.querySelectorAll('a')).find(a => 
        a.innerText.trim() === 'Save' && a.closest('div[name*="Detail"], div[id*="Detail"]')
      );
      if (saveBtn) {
        saveBtn.click();
        await new Promise(r => setTimeout(r, 800));
      }

      // 5. Load E-Sign
      const loadSignBtn = Array.from(doc.querySelectorAll('a')).find(a => a.innerText.trim() === 'LOAD E-SIGN');
      if (loadSignBtn) {
        loadSignBtn.click();
        await new Promise(r => setTimeout(r, 800));
      }

      // 6. Submit Ticket
      const submitBtn = Array.from(doc.querySelectorAll('a')).find(a => a.innerText.trim() === 'Submit');
      if (submitBtn) {
        submitBtn.click();
        await new Promise(r => setTimeout(r, 1200));
      }

      // 7. Handle Confirmation Modal "Are you sure ?"
      const okButtons = Array.from(doc.querySelectorAll('a, button')).filter(el => el.innerText.trim() === 'OK');
      if (okButtons.length > 0) {
        okButtons[okButtons.length - 1].click();
        await new Promise(r => setTimeout(r, 2000));
      }

      // 8. Capture Result Notification (Doc Number / Workflow ID)
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
  const CDP_ENDPOINT = process.env.CDP_WS_ENDPOINT;

  (async () => {
    try {
      console.log('🚀 Menjalankan script create_ticket via Puppeteer...');
      let browser;
      if (CDP_ENDPOINT) {
        browser = await puppeteer.connect({ browserWSEndpoint: CDP_ENDPOINT });
      } else {
        const executablePath = process.env.CHROME_PATH || 
          (process.platform === 'win32' 
            ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' 
            : '/usr/bin/google-chrome' || '/usr/bin/chromium-browser');
        browser = await puppeteer.launch({
          headless: false,
          executablePath,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
      }

      const pages = await browser.pages();
      let page = pages.find(p => p.url().includes('GAServiceTicketing'));
      if (!page) {
        page = await browser.newPage();
        await page.goto(FORM_URL, { waitUntil: 'networkidle2' });
      }

      console.log('📄 Mengeksekusi workflow createTicket di halaman browser...');
      const res = await page.evaluate(createTicketWorkflow);
      console.log('✅ Hasil:', res);
    } catch (err) {
      console.error('❌ Gagal menjalankan create_ticket:', err.message);
    }
  })();
}

module.exports = {
  createTicketWorkflow,
  FORM_URL
};
