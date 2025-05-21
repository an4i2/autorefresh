// Initialize default settings if they don't exist
browser.storage.local.get(['enabled', 'refreshTime', 'inputId'], function(result) {
  if (result.enabled === undefined) {
    browser.storage.local.set({
      enabled: false,
      refreshTime: 5,
      inputId: 'badgeno'
    });
  }
});

// Handle refresh countdown
let refreshTimers = new Map();

browser.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.type === 'startRefresh') {
    const tabId = sender.tab.id;
    const url = message.url;
    const refreshTime = message.refreshTime;

    // Clear any existing timer for this tab
    if (refreshTimers.has(tabId)) {
      clearTimeout(refreshTimers.get(tabId));
    }

    // Set new timer
    const timer = setTimeout(() => {
      browser.tabs.update(tabId, { url: url });
      refreshTimers.delete(tabId);
    }, refreshTime * 1000);

    refreshTimers.set(tabId, timer);
  }
  else if (message.type === 'cancelRefresh') {
    const tabId = sender.tab.id;
    if (refreshTimers.has(tabId)) {
      clearTimeout(refreshTimers.get(tabId));
      refreshTimers.delete(tabId);
    }
  }
}); 