const params = new URLSearchParams(location.search);
let urls = [];
try { urls = JSON.parse(decodeURIComponent(params.get('urls') || '[]')); } catch(e) {}
const name = decodeURIComponent(params.get('name') || 'Workspace');
const icon = decodeURIComponent(params.get('icon') || '📁');
const desc = decodeURIComponent(params.get('desc') || '');

document.getElementById('ws-name').textContent = name;
document.getElementById('ws-icon').textContent = icon;
document.getElementById('ws-desc').textContent = desc;
document.title = icon + ' ' + name;

const listEl        = document.getElementById('url-list');
const progressBar   = document.getElementById('progress-bar');
const progressCount = document.getElementById('progress-count');
const startBtn      = document.getElementById('start-btn');
const statusBanner  = document.getElementById('status-banner');
const statusText    = document.getElementById('status-text');
const blockedBanner = document.getElementById('blocked-banner');
const doneBanner    = document.getElementById('done-banner');

const rows = [];
let currentIndex = 0;
let isRunning = false;
let countdownTimer = null;

// True when running as an installed Chrome/Opera extension
const isExtension = typeof chrome !== 'undefined'
                 && typeof chrome.tabs !== 'undefined'
                 && location.protocol === 'chrome-extension:';

function hostname(url) {
  try { return new URL(url).hostname; } catch(e) { return url; }
}

// Render URL list
urls.forEach((url, i) => {
  const row = document.createElement('div');
  row.className = 'url-row' + (i === 0 ? ' current' : '');

  const fav = document.createElement('img');
  fav.className = 'favicon';
  fav.src = 'https://www.google.com/s2/favicons?domain=' + hostname(url) + '&sz=32';
  fav.onerror = () => { fav.style.display = 'none'; };

  const text = document.createElement('span');
  text.className = 'url-text';
  text.textContent = url;
  text.title = url;

  const status = document.createElement('span');
  status.className = 'row-status';
  status.textContent = i === 0 ? '▶' : '·';

  row.appendChild(fav);
  row.appendChild(text);
  row.appendChild(status);
  listEl.appendChild(row);
  rows.push({ row, status });
});

progressCount.textContent = '0 / ' + urls.length;

function markRowDone(i) {
  if (rows[i]) {
    rows[i].row.classList.remove('current');
    rows[i].row.classList.add('done');
    rows[i].status.textContent = '✓';
  }
}

function markRowCurrent(i) {
  if (i < rows.length) {
    rows[i].row.classList.add('current');
    rows[i].status.textContent = '▶';
    rows[i].row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function updateProgress(opened) {
  progressBar.style.width = (opened / urls.length * 100) + '%';
  progressCount.textContent = opened + ' / ' + urls.length;
}

function showDone() {
  isRunning = false;
  startBtn.classList.add('hidden');
  statusBanner.classList.remove('visible');
  blockedBanner.classList.remove('visible');
  doneBanner.classList.add('visible');
}

// ── Open a single tab in the background while keeping THIS page active ──
function openTabAndKeepFocus(url) {
  const win = window.open(url, '_blank');
  
  window.focus();
  if (win) {
    try {
      win.blur();
    } catch(e) {}
  }
  setTimeout(() => {
    window.focus();
  }, 20);
  setTimeout(() => {
    window.focus();
  }, 100);

  return win;
}

// ── Automatic Sequential Opener (Wait then open) ──
async function runAutoOpen(startIndex = 0) {
  if (isRunning) return;
  isRunning = true;

  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }

  startBtn.classList.add('hidden');
  blockedBanner.classList.remove('visible');
  statusBanner.classList.add('visible');

  // Extension mode
  if (isExtension) {
    for (let i = startIndex; i < urls.length; i++) {
      currentIndex = i;
      markRowCurrent(i);
      statusText.textContent = `Opening tab ${i + 1} of ${urls.length}...`;
      await chrome.tabs.create({ url: urls[i], active: false });
      markRowDone(i);
      updateProgress(i + 1);
      await new Promise(r => setTimeout(r, 100));
    }
    showDone();
    return;
  }

  // Web / Localhost mode: open sequentially with wait
  for (let i = startIndex; i < urls.length; i++) {
    currentIndex = i;
    markRowCurrent(i);
    statusText.textContent = `Auto-opening tab ${i + 1} of ${urls.length}...`;

    const win = openTabAndKeepFocus(urls[i]);

    if (!win || win.closed || typeof win.closed === 'undefined') {
      isRunning = false;
      statusBanner.classList.remove('visible');
      blockedBanner.classList.add('visible');
      return;
    }

    markRowDone(i);
    updateProgress(i + 1);

    await new Promise(r => setTimeout(r, 650));
  }

  showDone();
}

function userTriggerStart() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  runAutoOpen(currentIndex);
}

function resumeAutoOpening() {
  blockedBanner.classList.remove('visible');
  runAutoOpen(currentIndex);
}

window.addEventListener('blur', () => {
  if (isRunning) {
    setTimeout(() => { window.focus(); }, 30);
  }
});

// Event listeners
document.getElementById('resume-btn')?.addEventListener('click', resumeAutoOpening);
document.getElementById('start-btn')?.addEventListener('click', userTriggerStart);
document.querySelectorAll('.close-btn').forEach(btn => btn.addEventListener('click', () => window.close()));

window.addEventListener('DOMContentLoaded', () => {
  let secondsLeft = 1;
  startBtn.textContent = `🚀 Auto-Opening in ${secondsLeft}s (or click now)`;

  countdownTimer = setInterval(() => {
    secondsLeft--;
    if (secondsLeft <= 0) {
      clearInterval(countdownTimer);
      countdownTimer = null;
      runAutoOpen(0);
    } else {
      startBtn.textContent = `🚀 Auto-Opening in ${secondsLeft}s (or click now)`;
    }
  }, 1000);
});

