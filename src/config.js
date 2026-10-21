require('dotenv').config();
const path = require('path');
const os = require('os');
const fs = require('fs');

function getChromePath() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  if (process.platform === 'win32') {
    const candidates = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
      path.join(process.env.PROGRAMFILES || '', 'Google\\Chrome\\Application\\chrome.exe'),
      path.join(process.env['PROGRAMFILES(X86)'] || '', 'Google\\Chrome\\Application\\chrome.exe')
    ];
    for (const p of candidates) {
      if (p && fs.existsSync(p)) return p;
    }
    return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  }
  const linuxCandidates = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium'
  ];
  for (const p of linuxCandidates) {
    if (fs.existsSync(p)) return p;
  }
  return '/usr/bin/google-chrome';
}

const USER_DATA_DIR = path.resolve(__dirname, '../.chrome_session');

module.exports = {
  getChromePath,
  USER_DATA_DIR,
  BASE_URL: process.env.ECM_BASE_URL || 'https://ecm-uat-k2.eigerindo.co.id',
  FORM_URL: process.env.K2_FORM_URL || 'https://ecm-uat-k2.eigerindo.co.id/Workspace/Form/f.25.GAServiceTicketing',
  USERNAME: process.env.ECM_USERNAME,
  PASSWORD: process.env.ECM_PASSWORD,
  CDP_ENDPOINT: process.env.CDP_WS_ENDPOINT
};
