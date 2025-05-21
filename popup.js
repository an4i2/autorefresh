document.addEventListener('DOMContentLoaded', function() {
  const enableCheckbox = document.getElementById('enableRefresh');
  const refreshTimeInput = document.getElementById('refreshTime');
  const inputIdInput = document.getElementById('inputId');
  const statusDiv = document.getElementById('status');
  const validationStatusDiv = document.getElementById('validationStatus');
  const testButton = document.getElementById('testInput');

  // Load saved settings
  browser.storage.local.get(['enabled', 'refreshTime', 'inputId'], function(result) {
    enableCheckbox.checked = result.enabled || false;
    refreshTimeInput.value = result.refreshTime || 5;
    inputIdInput.value = result.inputId || 'badgeno';
    updateStatus();
    validateInputField();
  });

  // Save settings when changed
  enableCheckbox.addEventListener('change', saveSettings);
  refreshTimeInput.addEventListener('change', saveSettings);
  inputIdInput.addEventListener('change', saveSettings);
  testButton.addEventListener('click', validateInputField);

  function validateInputField() {
    const inputId = inputIdInput.value.trim();
    if (!inputId) {
      validationStatusDiv.textContent = 'Bitte geben Sie eine Input-ID ein';
      validationStatusDiv.className = 'validation-status invalid';
      return;
    }

    browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
      browser.tabs.sendMessage(tabs[0].id, {
        type: 'validateInput',
        inputId: inputId
      }, function(response) {
        if (response && response.exists) {
          validationStatusDiv.textContent = 'Input-Feld gefunden ✓';
          validationStatusDiv.className = 'validation-status valid';
        } else {
          validationStatusDiv.textContent = 'Input-Feld nicht gefunden ✗';
          validationStatusDiv.className = 'validation-status invalid';
        }
      });
    });
  }

  function saveSettings() {
    const settings = {
      enabled: enableCheckbox.checked,
      refreshTime: parseInt(refreshTimeInput.value) || 5,
      inputId: inputIdInput.value || 'badgeno'
    };

    browser.storage.local.set(settings, function() {
      updateStatus();
      validateInputField();
      // Notify content script about settings change
      browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
        browser.tabs.sendMessage(tabs[0].id, {
          type: 'settingsUpdated',
          settings: settings
        });
      });
    });
  }

  function updateStatus() {
    statusDiv.textContent = enableCheckbox.checked 
      ? `AutoRefresh Aktiv (nach ${refreshTimeInput.value} Sekunden) für Inputfeld #${inputIdInput.value}`
      : 'AutoRefresh Inaktiv';
    statusDiv.className = 'status ' + (enableCheckbox.checked ? 'enabled' : 'disabled');
  }
}); 