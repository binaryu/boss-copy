document.addEventListener('DOMContentLoaded', () => {
  const enabledToggle = document.getElementById('enabled-toggle');
  const floatToggle = document.getElementById('float-toggle');

  if (chrome && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get(['enabled', 'showFloatButton'], (items) => {
      if (items.enabled !== undefined) {
        enabledToggle.checked = items.enabled;
      }
      if (items.showFloatButton !== undefined) {
        floatToggle.checked = items.showFloatButton;
      }
    });

    enabledToggle.addEventListener('change', () => {
      chrome.storage.sync.set({ enabled: enabledToggle.checked });
    });

    floatToggle.addEventListener('change', () => {
      chrome.storage.sync.set({ showFloatButton: floatToggle.checked });
    });
  }
});
