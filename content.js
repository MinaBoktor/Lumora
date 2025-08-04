// Enhanced content.js with precise highlighting logic

let pageHighlights = [];
const pageURL = window.location.href.split("#")[0];
let highlightCounter = 0;
let currentSettings = {
  currentColor: "yellow",
  autoSave: true,
  showNotifications: true,
  highlightStyle: "modern",
};

// Color mapping for highlights
const HIGHLIGHT_COLORS = {
  yellow: { bg: "#fff3cd", border: "#ffd700", text: "#856404" },
  green: { bg: "#d1f2eb", border: "#10b981", text: "#0d5744" },
  blue: { bg: "#cce7ff", border: "#3b82f6", text: "#1e3a8a" },
  pink: { bg: "#fce7f3", border: "#ec4899", text: "#831843" },
  orange: { bg: "#fed7aa", border: "#f97316", text: "#9a3412" },
  purple: { bg: "#e9d5ff", border: "#8b5cf6", text: "#5b21b6" },
};

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeHighlighter);
} else {
  initializeHighlighter();
}

async function initializeHighlighter() {
  try {
    await loadSettings();
    await restoreHighlightsFromStorage();
    setupEventListeners();
    injectStyles();
    console.log("Lumora highlighter initialized successfully");
  } catch (error) {
    console.error("Failed to initialize highlighter:", error);
  }
}

function setupEventListeners() {
  // Listen for clicks on highlights
  document.addEventListener("click", handleHighlightClick);

  // Keyboard shortcuts
  document.addEventListener("keydown", handleKeyboardShortcuts);
}

function handleHighlightClick(event) {
  const highlight = event.target.closest(".lumora-highlight");
  if (highlight && event.ctrlKey) {
    // Ctrl+click to quickly remove highlight
    removeHighlightById(highlight.dataset.highlightId);
    event.preventDefault();
  }
}

function handleKeyboardShortcuts(event) {
  // Ctrl+Shift+H to highlight selection
  if (event.ctrlKey && event.shiftKey && event.key === "H") {
    event.preventDefault();
    highlightSelection();
  }

  // Ctrl+Shift+C to clear all highlights
  if (event.ctrlKey && event.shiftKey && event.key === "C") {
    event.preventDefault();
    if (confirm("Clear all highlights on this page?")) {
      clearAllHighlights();
    }
  }
}

// Listen for messages from popup and background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Content script received message:", request.action);
  
  if (request.action === "ping") {
    console.log("Received ping from popup");
    sendResponse({ status: "ready" });
    return true;
  }

  switch (request.action) {
    case "highlightSelectedText":
    case "highlightSelection":
      console.log("Highlighting selection with color:", request.color);
      highlightSelection(request.color)
        .then((result) => {
          console.log("Highlight result:", result);
          sendResponse({ success: true, highlights: pageHighlights, highlight: result });
        })
        .catch((error) => {
          console.error("Highlight error:", error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Keep message channel open for async response

    case "clearAllHighlights":
      clearAllHighlights();
      sendResponse({ success: true });
      break;

    case "getHighlights":
      console.log("Sending highlights to popup:", pageHighlights.length);
      sendResponse({ highlights: pageHighlights });
      break;

    case "jumpToHighlight":
      jumpToHighlight(request.id);
      sendResponse({ success: true });
      break;

    case "removeHighlight":
      removeHighlightById(request.id);
      sendResponse({ success: true, highlights: pageHighlights });
      break;

    default:
      console.log("Unknown action:", request.action);
      sendResponse({ success: false, error: "Unknown action" });
  }
});

async function highlightSelection(color = null) {
  try {
    console.log("highlightSelection called with color:", color);
    
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      showNotification("Please select some text to highlight", "warning");
      return { success: false, message: "No selection" };
    }

    const selectedText = selection.toString();
    if (!selectedText || selectedText.trim().length === 0) {
      showNotification("Cannot highlight empty selection", "warning");
      return { success: false, message: "Empty selection" };
    }

    console.log("Selected text:", selectedText);
    console.log("Selection range count:", selection.rangeCount);

    const range = selection.getRangeAt(0);
    const highlightColor = color || currentSettings.currentColor;

    // Create unique highlight ID
    const highlightId = `highlight_${Date.now()}_${++highlightCounter}`;

    // Use a more precise highlighting method
    const success = await highlightRange(range, highlightId, highlightColor, selectedText.trim());
    
    if (success) {
      // Store highlight data
      const highlightData = {
        id: highlightId,
        text: selectedText.trim(),
        color: highlightColor,
        timestamp: Date.now(),
        url: pageURL,
      };

      pageHighlights.push(highlightData);

      // Save to storage
      if (currentSettings.autoSave) {
        await saveHighlightsToStorage();
      }

      // Clear selection
      selection.removeAllRanges();

      // Show notification
      if (currentSettings.showNotifications) {
        showNotification(`Text highlighted with ${highlightColor} color`, "success");
      }

      // Notify popup of update immediately
      notifyHighlightsUpdated();

      console.log("Highlight successful:", highlightData);
      return { success: true, highlight: highlightData };
    } else {
      showNotification("Failed to highlight text", "error");
      return { success: false, message: "Highlight failed" };
    }
  } catch (error) {
    console.error("Failed to highlight text:", error);
    showNotification("Failed to highlight text", "error");
    return { success: false, error: error.message };
  }
}

async function highlightRange(range, highlightId, color, text) {
  try {
    // Create highlight wrapper element
    const highlightElement = document.createElement("span");
    highlightElement.className = "lumora-highlight";
    highlightElement.dataset.highlightId = highlightId;
    highlightElement.dataset.color = color;
    highlightElement.title = `Highlighted on ${new Date().toLocaleString()}\nCtrl+Click to remove`;
    
    // Apply only background styling - preserve all text properties
    const colorConfig = HIGHLIGHT_COLORS[color];
    highlightElement.style.backgroundColor = colorConfig.bg;
    highlightElement.style.boxShadow = `0 0 0 1px ${colorConfig.border}`;
    highlightElement.style.borderRadius = "2px";
    
    // Explicitly preserve text properties
    highlightElement.style.color = "inherit";
    highlightElement.style.fontSize = "inherit";
    highlightElement.style.fontFamily = "inherit";
    highlightElement.style.fontWeight = "inherit";
    highlightElement.style.fontStyle = "inherit";
    highlightElement.style.textDecoration = "inherit";
    highlightElement.style.lineHeight = "inherit";
    highlightElement.style.letterSpacing = "inherit";
    highlightElement.style.wordSpacing = "inherit";
    
    // Minimal layout impact
    highlightElement.style.display = "inline";
    highlightElement.style.padding = "0";
    highlightElement.style.margin = "0";
    highlightElement.style.border = "none";

    // Check if the range spans multiple elements or text nodes
    const startContainer = range.startContainer;
    const endContainer = range.endContainer;

    if (startContainer === endContainer && startContainer.nodeType === Node.TEXT_NODE) {
      // Simple case: single text node
      try {
        range.surroundContents(highlightElement);
        console.log("Successfully highlighted single text node");
        return true;
      } catch (e) {
        console.log("surroundContents failed, trying extraction method");
        const contents = range.extractContents();
        highlightElement.appendChild(contents);
        range.insertNode(highlightElement);
        return true;
      }
    } else {
      // Complex case: multiple nodes - use extraction method
      try {
        const contents = range.extractContents();
        highlightElement.appendChild(contents);
        range.insertNode(highlightElement);
        console.log("Successfully highlighted multiple nodes");
        return true;
      } catch (e) {
        console.error("Failed to highlight complex selection:", e);
        return false;
      }
    }
  } catch (error) {
    console.error("Error in highlightRange:", error);
    return false;
  }
}

function clearAllHighlights() {
  // Remove all highlight elements from DOM
  document.querySelectorAll(".lumora-highlight").forEach((element) => {
    const parent = element.parentNode;
    if (parent) {
      while (element.firstChild) {
        parent.insertBefore(element.firstChild, element);
      }
      parent.removeChild(element);
    }
  });

  // Clear data
  pageHighlights = [];

  // Remove from storage
  chrome.storage.local.remove([pageURL]);

  showNotification("All highlights cleared", "info");
  notifyHighlightsUpdated();
}

function removeHighlightById(highlightId) {
  const element = document.querySelector(`[data-highlight-id="${highlightId}"]`);
  if (element) {
    // Replace highlight with its text content
    const parent = element.parentNode;
    if (parent) {
      while (element.firstChild) {
        parent.insertBefore(element.firstChild, element);
      }
      parent.removeChild(element);
    }

    // Remove from data
    pageHighlights = pageHighlights.filter((h) => h.id !== highlightId);
    saveHighlightsToStorage();
    notifyHighlightsUpdated();

    showNotification("Highlight removed", "info");
  }
}

function jumpToHighlight(highlightId) {
  const element = document.querySelector(`[data-highlight-id="${highlightId}"]`);
  if (element) {
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    // Briefly flash the highlight
    element.style.animation = "flash 1s ease-in-out";
    setTimeout(() => {
      element.style.animation = "";
    }, 1000);
  }
}

async function saveHighlightsToStorage() {
  try {
    if (!chrome.storage?.local) {
      console.warn("chrome.storage.local not available");
      return;
    }
    const data = { [pageURL]: pageHighlights };
    await chrome.storage.local.set(data);
    console.log("Highlights saved to storage:", pageHighlights.length);
  } catch (error) {
    console.error("Failed to save highlights:", error);
  }
}

async function restoreHighlightsFromStorage() {
  try {
    const result = await chrome.storage.local.get([pageURL]);
    const savedHighlights = result[pageURL];

    if (!savedHighlights || savedHighlights.length === 0) {
      console.log("No saved highlights found");
      return;
    }

    console.log("Restoring highlights:", savedHighlights.length);

    // Wait a bit for page to fully load
    setTimeout(() => {
      savedHighlights.forEach((highlight) => {
        restoreHighlight(highlight);
      });
      pageHighlights = savedHighlights;
      notifyHighlightsUpdated();
    }, 500);
  } catch (error) {
    console.error("Failed to restore highlights:", error);
  }
}

function restoreHighlight(highlightData) {
  try {
    console.log("Restoring highlight:", highlightData.text);
    
    // Find the text nodes that contain our highlighted text
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent;
      const index = text.indexOf(highlightData.text);

      if (index !== -1) {
        console.log("Found text to restore highlight:", highlightData.text);
        
        // Create range for the found text
        const range = document.createRange();
        range.setStart(node, index);
        range.setEnd(node, index + highlightData.text.length);

        // Create highlight element with proper styling
        const highlightElement = document.createElement("span");
        highlightElement.className = "lumora-highlight";
        highlightElement.dataset.highlightId = highlightData.id;
        highlightElement.dataset.color = highlightData.color;
        highlightElement.title = `Highlighted on ${new Date(highlightData.timestamp).toLocaleString()}\nCtrl+Click to remove`;
        
        // Apply the same styling as in highlightRange
        const colorConfig = HIGHLIGHT_COLORS[highlightData.color];
        highlightElement.style.backgroundColor = colorConfig.bg;
        highlightElement.style.boxShadow = `0 0 0 1px ${colorConfig.border}`;
        highlightElement.style.borderRadius = "2px";
        
        // Explicitly preserve text properties
        highlightElement.style.color = "inherit";
        highlightElement.style.fontSize = "inherit";
        highlightElement.style.fontFamily = "inherit";
        highlightElement.style.fontWeight = "inherit";
        highlightElement.style.fontStyle = "inherit";
        highlightElement.style.textDecoration = "inherit";
        highlightElement.style.lineHeight = "inherit";
        highlightElement.style.letterSpacing = "inherit";
        highlightElement.style.wordSpacing = "inherit";
        
        // Minimal layout impact
        highlightElement.style.display = "inline";
        highlightElement.style.padding = "0";
        highlightElement.style.margin = "0";
        highlightElement.style.border = "none";

        try {
          range.surroundContents(highlightElement);
          console.log("Successfully restored highlight:", highlightData.id);
        } catch (e) {
          // Fallback method
          const contents = range.extractContents();
          highlightElement.appendChild(contents);
          range.insertNode(highlightElement);
          console.log("Successfully restored highlight using fallback method:", highlightData.id);
        }
        
        break; // Found and restored, exit loop
      }
    }
  } catch (error) {
    console.error("Failed to restore highlight:", error);
  }
}

async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(["highlighterSettings"]);
    if (result.highlighterSettings) {
      currentSettings = { ...currentSettings, ...result.highlighterSettings };
    }
    console.log("Settings loaded:", currentSettings);
  } catch (error) {
    console.error("Failed to load settings:", error);
  }
}

function showNotification(message, type = "info") {
  if (!currentSettings.showNotifications) return;

  console.log("Showing notification:", message, type);

  // Remove existing notifications
  document.querySelectorAll(".lumora-notification").forEach((n) => n.remove());

  const notification = document.createElement("div");
  notification.className = `lumora-notification ${type}`;
  
  const styles = {
    info: { bg: "#3b82f6", icon: "ℹ️" },
    success: { bg: "#10b981", icon: "✅" },
    warning: { bg: "#f59e0b", icon: "⚠️" },
    error: { bg: "#ef4444", icon: "❌" },
  };

  const style = styles[type] || styles.info;
  notification.innerHTML = `${style.icon} ${message}`;

  Object.assign(notification.style, {
    position: "fixed",
    bottom: "20px",
    left: "20px",
    background: style.bg,
    color: "white",
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    zIndex: "999999",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    maxWidth: "300px",
    wordWrap: "break-word",
  });

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function notifyHighlightsUpdated() {
  console.log("Notifying highlights updated:", pageHighlights.length);
  
  if (!chrome.runtime?.id) {
    console.warn("Extension context invalidated");
    return;
  }

  // Send message to popup immediately
  try {
    chrome.runtime.sendMessage({
      action: "highlightsUpdated",
      highlights: pageHighlights,
    }).then(() => {
      console.log("Highlights update message sent successfully");
    }).catch((error) => {
      console.log("Failed to send highlights update (popup might be closed):", error.message);
    });
  } catch (error) {
    console.log("Failed to send highlights update:", error.message);
  }
}

function injectStyles() {
  if (document.getElementById("lumora-highlighter-styles")) return;

  const style = document.createElement("style");
  style.id = "lumora-highlighter-styles";
  style.textContent = `
    .lumora-highlight {
      cursor: pointer;
      transition: opacity 0.2s ease;
    }
    
    .lumora-highlight:hover {
      opacity: 0.8;
    }
    
    @keyframes flash {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `;

  document.head.appendChild(style);
}

console.log("Lumora content script loaded");

