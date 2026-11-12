// Load current window open tabs count
if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({ currentWindow: true }, function (tabs) {
    var count = tabs ? tabs.length : 0;
    var badge = document.getElementById('tabs-count-badge');
    if (badge) {
      badge.textContent = count + (count === 1 ? ' tab open' : ' tabs open');
    }
  });
}

// Handle Open Full Dashboard button click
var btn = document.getElementById('btn-open-dashboard');
if (btn) {
  btn.addEventListener('click', function () {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      var dashboardUrl = chrome.runtime.getURL('index.html');
      chrome.tabs.query({ currentWindow: true }, function (tabs) {
        var existing = tabs && tabs.find(function (t) {
          return t.url && (t.url.indexOf('index.html') !== -1 || t.url.indexOf('dashboard.html') !== -1);
        });
        if (existing && existing.id) {
          chrome.tabs.update(existing.id, { active: true }, function () {
            window.close();
          });
        } else {
          chrome.tabs.create({ url: dashboardUrl, active: true }, function () {
            window.close();
          });
        }
      });
    } else {
      window.open('index.html', '_blank');
    }
  });
}

