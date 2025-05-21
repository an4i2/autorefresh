let isRefreshing = false;
let settings = {
  enabled: false,
  refreshTime: 5,
  inputId: 'badgeno'
};

// Create notification overlay
function createNotificationOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'autorefresh-notification';
  overlay.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 9999;
    display: none;
    transition: opacity 0.3s ease-in-out;
  `;
  document.body.appendChild(overlay);
  return overlay;
}

// Show notification with countdown
function showNotification(seconds) {
  let overlay = document.getElementById('autorefresh-notification');
  if (!overlay) {
    overlay = createNotificationOverlay();
  }

  overlay.style.display = 'block';
  overlay.style.opacity = '1';
  
  const updateCountdown = () => {
    overlay.textContent = `Seite wird in ${seconds} Sekunden neu geladen...`;
    seconds--;
    
    if (seconds >= 0) {
      setTimeout(updateCountdown, 1000);
    } else {
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 300);
    }
  };
  
  updateCountdown();
}

// Load settings when content script is initialized
browser.storage.local.get(['enabled', 'refreshTime', 'inputId'], function(result) {
  settings.enabled = result.enabled || false;
  settings.refreshTime = result.refreshTime || 5;
  settings.inputId = result.inputId || 'badgeno';
});

// Listen for messages from popup
browser.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.type === 'settingsUpdated') {
    settings = message.settings;
    if (!settings.enabled && isRefreshing) {
      browser.runtime.sendMessage({ type: 'cancelRefresh' });
      isRefreshing = false;
    }
  } else if (message.type === 'validateInput') {
    const inputField = document.getElementById(message.inputId);
    sendResponse({ exists: !!inputField });
  }
  return true; // Keep the message channel open for async response
});

// Function to schedule page refresh
function scheduleRefresh() {
  if (!settings.enabled || isRefreshing) return;
  
  isRefreshing = true;
  showNotification(settings.refreshTime);
  
  // Send message to background script to handle the refresh
  browser.runtime.sendMessage({
    type: 'startRefresh',
    url: window.location.href,
    refreshTime: settings.refreshTime
  });
}

// Monitor the input field
function monitorInputField() {
  const inputField = document.getElementById(settings.inputId);
  if (inputField) {
    // Remove any existing listeners to prevent duplicates
    inputField.removeEventListener('input', handleInput);
    // Add new listener
    inputField.addEventListener('input', handleInput);
  }
}

// Handle input event
function handleInput() {
  if (settings.enabled && !isRefreshing) {
    scheduleRefresh();
  }
}

// Initial check for input field
monitorInputField();

// Check for input field periodically in case it's added dynamically
setInterval(monitorInputField, 1000); 