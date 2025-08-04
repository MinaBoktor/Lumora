// Enhanced background.js with improved context menu and features

chrome.runtime.onInstalled.addListener(() => {
  console.log("Lumora extension installed");
  
  // Create simple context menu for highlighting
  chrome.contextMenus.create({
    id: "highlightText",
    title: "✨ Highlight Selection",
    contexts: ["selection"],
    documentUrlPatterns: ["http://*/*", "https://*/*"]
  });

  // Set default settings on first install
  chrome.storage.local.set({
    highlighterSettings: {
      currentColor: 'yellow',
      autoSave: true,
      showNotifications: true,
      highlightStyle: 'modern'
    }
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log("Context menu clicked:", info.menuItemId);
  
  try {
    if (!chrome.runtime?.id) {
      console.error("Extension context invalidated");
      return;
    }
    
    if (info.menuItemId === "highlightText") {
      console.log("Highlighting text via context menu");
      
      // Get current color setting
      try {
        const settings = await chrome.storage.local.get(['highlighterSettings']);
        const currentColor = settings.highlighterSettings?.currentColor || 'yellow';
        
        console.log("Using color:", currentColor);
        
        chrome.tabs.sendMessage(tab.id, { 
          action: "highlightSelection", 
          color: currentColor 
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error("Failed to send message to content script:", chrome.runtime.lastError);
          } else {
            console.log("Context menu highlight response:", response);
          }
        });
      } catch (error) {
        console.error('Failed to get settings:', error);
        chrome.tabs.sendMessage(tab.id, { 
          action: "highlightSelection", 
          color: 'yellow' 
        });
      }
    }
  } catch (error) {
    console.error('Context menu action failed:', error);
  }
});

// Background message handling for cross-tab communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background received message:", request.action);
  
  if (request.action === 'getTabInfo') {
    sendResponse({
      tabId: sender.tab?.id,
      url: sender.tab?.url
    });
  }
  
  if (request.action === 'highlightsUpdated') {
    console.log("Forwarding highlights update");
    // Forward to popup if it's open
    try {
      chrome.runtime.sendMessage(request).catch(() => {
        // Popup might not be open, ignore error
      });
    } catch (error) {
      // Popup might not be open, ignore error
    }
  }
  
  return true;
});

console.log("Lumora background script loaded");

