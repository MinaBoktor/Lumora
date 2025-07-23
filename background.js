// Enhanced background.js with improved context menu and features

chrome.runtime.onInstalled.addListener(() => {
  // Create context menu items for highlighting
  chrome.contextMenus.create({
    id: "highlightText",
    title: "🖍️ Highlight Selection",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "clearHighlights",
    title: "🧹 Clear All Highlights",
    contexts: ["page"]
  });

  chrome.contextMenus.create({
    id: "removeHighlight",
    title: "❌ Remove This Highlight",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "separator1",
    type: "separator",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "copyHighlight",
    title: "📋 Copy Highlight",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "exportHighlights",
    title: "💾 Export All Highlights",
    contexts: ["page"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
      if (!chrome.runtime?.id) {
        // Extension context invalidated
        return;
      }
    switch (info.menuItemId) {
      case "highlightText":
        // Get current color setting
        const settings = await chrome.storage.local.get(['highlighterSettings']);
        const currentColor = settings.highlighterSettings?.currentColor || 'yellow';
        
        chrome.tabs.sendMessage(tab.id, { 
          action: "highlightSelectedText", 
          color: currentColor 
        });
        break;

      case "clearHighlights":
        if (await showConfirmDialog("Clear all highlights on this page?")) {
          chrome.tabs.sendMessage(tab.id, { action: "clearAllHighlights" });
        }
        break;

      case "removeHighlight":
        chrome.tabs.sendMessage(tab.id, { action: "removeHighlightAtSelection" });
        break;

      case "copyHighlight":
        chrome.tabs.sendMessage(tab.id, { action: "copySelectedHighlight" });
        break;

      case "exportHighlights":
        chrome.tabs.sendMessage(tab.id, { action: "exportAllHighlights" });
        break;
    }
  } catch (error) {
    console.error('Context menu action failed:', error);
  }
});

// Utility function to show confirmation dialog
async function showConfirmDialog(message) {
  return new Promise((resolve) => {
    // Since we can't use confirm() in service worker, we'll send message to content script
    resolve(true); // For now, always confirm. Content script will handle the actual confirmation
  });
}

// Handle installation and updates
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default settings on first install
    chrome.storage.local.set({
      highlighterSettings: {
        currentColor: 'yellow',
        autoSave: true,
        showNotifications: true,
        highlightStyle: 'modern'
      }
    });
  }
});

// Background message handling for cross-tab communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTabInfo') {
    sendResponse({
      tabId: sender.tab?.id,
      url: sender.tab?.url
    });
  }
  
  if (request.action === 'showNotification') {
    // Could implement chrome.notifications API here if needed
    console.log('Notification:', request.message);
  }
});

// Clean up old data periodically (run once per day)
chrome.alarms.create('cleanup', { periodInMinutes: 1440 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'cleanup') {
    await cleanupOldHighlights();
  }
});

async function cleanupOldHighlights() {
  try {
    if (!chrome.storage?.local) return;
    const result = await chrome.storage.local.get();
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    for (const [key, value] of Object.entries(result)) {
      if (key.startsWith('http') && Array.isArray(value)) {
        // Filter out highlights older than 30 days
        const recentHighlights = value.filter(h => 
          h.timestamp && h.timestamp > thirtyDaysAgo
        );
        
        if (recentHighlights.length !== value.length) {
          if (recentHighlights.length === 0) {
            await chrome.storage.local.remove(key);
          } else {
            await chrome.storage.local.set({ [key]: recentHighlights });
          }
        }
      }
    }
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
}