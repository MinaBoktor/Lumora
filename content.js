// Enhanced content.js with modern highlighting features

let pageHighlights = [];
const pageURL = window.location.href.split('#')[0];
let highlightCounter = 0;
let currentSettings = {
  currentColor: 'yellow',
  autoSave: true,
  showNotifications: true,
  highlightStyle: 'modern'
};

// Color mapping for highlights
const HIGHLIGHT_COLORS = {
  yellow: { bg: '#fff3cd', border: '#ffd700', text: '#856404' },
  green: { bg: '#d1f2eb', border: '#10b981', text: '#0d5744' },
  blue: { bg: '#cce7ff', border: '#3b82f6', text: '#1e3a8a' },
  pink: { bg: '#fce7f3', border: '#ec4899', text: '#831843' },
  orange: { bg: '#fed7aa', border: '#f97316', text: '#9a3412' },
  purple: { bg: '#e9d5ff', border: '#8b5cf6', text: '#5b21b6' }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeHighlighter);
} else {
  initializeHighlighter();
}

async function initializeHighlighter() {
  await loadSettings();
  await restoreHighlightsFromStorage();
  setupEventListeners();
  injectStyles();
}

function setupEventListeners() {
  // Listen for selection changes to update context menu
  document.addEventListener('selectionchange', handleSelectionChange);
  
  // Listen for clicks on highlights
  document.addEventListener('click', handleHighlightClick);
  
  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboardShortcuts);
}

function handleSelectionChange() {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  
  // Update context menu availability based on selection
  if (selectedText.length > 0) {
    // Enable highlight-related context menu items
    document.body.classList.add('has-selection');
  } else {
    document.body.classList.remove('has-selection');
  }
}

function handleHighlightClick(event) {
  const highlight = event.target.closest('.modern-highlight');
  if (highlight && event.ctrlKey) {
    // Ctrl+click to quickly remove highlight
    removeHighlightById(highlight.dataset.highlightId);
    event.preventDefault();
  }
}

function handleKeyboardShortcuts(event) {
  // Ctrl+Shift+H to highlight selection
  if (event.ctrlKey && event.shiftKey && event.key === 'H') {
    event.preventDefault();
    highlightSelection();
  }
  
  // Ctrl+Shift+C to clear all highlights
  if (event.ctrlKey && event.shiftKey && event.key === 'C') {
    event.preventDefault();
    if (confirm('Clear all highlights on this page?')) {
      clearAllHighlights();
    }
  }
}

// Listen for messages from popup and background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "highlightSelectedText":
      highlightSelection(request.color);
      sendResponse({ success: true, highlights: pageHighlights });
      break;
      
    case "clearAllHighlights":
      clearAllHighlights();
      sendResponse({ success: true });
      break;
      
    case "removeHighlightAtSelection":
      removeHighlightAtSelection();
      sendResponse({ success: true });
      break;
      
    case "copySelectedHighlight":
      copySelectedHighlight();
      sendResponse({ success: true });
      break;
      
    case "exportAllHighlights":
      exportAllHighlights();
      sendResponse({ success: true });
      break;
      
    case "getHighlights":
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
  }
});

async function highlightSelection(color = null) {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) {
    showNotification('Please select some text to highlight', 'warning');
    return;
  }

  const selectedText = selection.toString().trim();
  if (selectedText.length === 0) return;

  const range = selection.getRangeAt(0);
  const highlightColor = color || currentSettings.currentColor;
  
  try {
    // Create unique highlight ID
    const highlightId = `highlight_${Date.now()}_${++highlightCounter}`;
    
    // Create highlight element
    const highlightElement = document.createElement('span');
    highlightElement.className = 'modern-highlight';
    highlightElement.dataset.highlightId = highlightId;
    highlightElement.dataset.color = highlightColor;
    highlightElement.style.setProperty('--highlight-bg', HIGHLIGHT_COLORS[highlightColor].bg);
    highlightElement.style.setProperty('--highlight-border', HIGHLIGHT_COLORS[highlightColor].border);
    highlightElement.style.setProperty('--highlight-text', HIGHLIGHT_COLORS[highlightColor].text);
    
    // Add tooltip
    highlightElement.title = `Highlighted on ${new Date().toLocaleString()}\nCtrl+Click to remove`;
    
    // Wrap the selected content
    try {
      range.surroundContents(highlightElement);
    } catch (e) {
      // Fallback for complex selections
      const contents = range.extractContents();
      highlightElement.appendChild(contents);
      range.insertNode(highlightElement);
    }

    // Store highlight data
    const highlightData = {
      id: highlightId,
      text: selectedText,
      color: highlightColor,
      timestamp: Date.now(),
      xpath: getXPathForElement(highlightElement),
      url: pageURL
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
      showNotification(`Text highlighted with ${highlightColor} color`, 'success');
    }
    
    // Notify popup of update
    notifyHighlightsUpdated();
    
  } catch (error) {
    console.error('Failed to highlight text:', error);
    showNotification('Failed to highlight text', 'error');
  }
}

function clearAllHighlights() {
  // Remove all highlight elements from DOM
  document.querySelectorAll('.modern-highlight').forEach(element => {
    const parent = element.parentNode;
    while (element.firstChild) {
      parent.insertBefore(element.firstChild, element);
    }
    parent.removeChild(element);
  });
  
  // Clear data
  pageHighlights = [];
  
  // Remove from storage
  chrome.storage.local.remove([pageURL]);
  
  showNotification('All highlights cleared', 'info');
  notifyHighlightsUpdated();
}

function removeHighlightAtSelection() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  const element = range.startContainer.nodeType === Node.TEXT_NODE 
    ? range.startContainer.parentElement 
    : range.startContainer;

  const highlight = element.closest('.modern-highlight');
  if (highlight) {
    removeHighlightById(highlight.dataset.highlightId);
  }
}

function removeHighlightById(highlightId) {
  const element = document.querySelector(`[data-highlight-id="${highlightId}"]`);
  if (element) {
    // Replace highlight with its text content
    const parent = element.parentNode;
    while (element.firstChild) {
      parent.insertBefore(element.firstChild, element);
    }
    parent.removeChild(element);
    
    // Remove from data
    pageHighlights = pageHighlights.filter(h => h.id !== highlightId);
    saveHighlightsToStorage();
    notifyHighlightsUpdated();
    
    showNotification('Highlight removed', 'info');
  }
}

function copySelectedHighlight() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const selectedText = selection.toString().trim();
  if (selectedText) {
    navigator.clipboard.writeText(selectedText).then(() => {
      showNotification('Highlight copied to clipboard', 'success');
    }).catch(() => {
      showNotification('Failed to copy highlight', 'error');
    });
  }
}

function jumpToHighlight(highlightId) {
  const element = document.querySelector(`[data-highlight-id="${highlightId}"]`);
  if (element) {
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
    
    // Briefly flash the highlight
    element.classList.add('flash-highlight');
    setTimeout(() => {
      element.classList.remove('flash-highlight');
    }, 2000);
  }
}

function exportAllHighlights() {
  if (pageHighlights.length === 0) {
    showNotification('No highlights to export', 'warning');
    return;
  }

  const exportData = {
    url: pageURL,
    title: document.title,
    timestamp: new Date().toISOString(),
    totalHighlights: pageHighlights.length,
    highlights: pageHighlights.map(h => ({
      text: h.text,
      color: h.color,
      timestamp: new Date(h.timestamp).toISOString(),
      note: h.note || ''
    }))
  };

  // Create and download file
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
    type: 'application/json' 
  });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `highlights-${document.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showNotification('Highlights exported successfully', 'success');
}

// Utility functions
function getXPathForElement(element) {
  const parts = [];
  let current = element;
  
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let index = 1;
    let sibling = current.previousSibling;
    
    while (sibling) {
      if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === current.nodeName) {
        index++;
      }
      sibling = sibling.previousSibling;
    }
    
    parts.unshift(`${current.nodeName}[${index}]`);
    current = current.parentNode;
  }
  
  return '/' + parts.join('/');
}

function getElementByXPath(xpath) {
  return document.evaluate(
    xpath, 
    document, 
    null, 
    XPathResult.FIRST_ORDERED_NODE_TYPE, 
    null
  ).singleNodeValue;
}

async function saveHighlightsToStorage() {
  try {
    const data = { [pageURL]: pageHighlights };
    await chrome.storage.local.set(data);
  } catch (error) {
    console.error('Failed to save highlights:', error);
  }
}

async function restoreHighlightsFromStorage() {
  try {
    const result = await chrome.storage.local.get([pageURL]);
    const savedHighlights = result[pageURL];
    
    if (!savedHighlights || savedHighlights.length === 0) return;

    // Wait a bit for page to fully load
    setTimeout(() => {
      savedHighlights.forEach(highlight => {
        restoreHighlight(highlight);
      });
      pageHighlights = savedHighlights;
      notifyHighlightsUpdated();
    }, 500);
    
  } catch (error) {
    console.error('Failed to restore highlights:', error);
  }
}

function restoreHighlight(highlightData) {
  try {
    // Find the text nodes that contain our highlighted text
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    while (node = walker.nextNode()) {
      const text = node.textContent;
      const index = text.indexOf(highlightData.text);
      
      if (index !== -1) {
        // Create range for the found text
        const range = document.createRange();
        range.setStart(node, index);
        range.setEnd(node, index + highlightData.text.length);
        
        // Create highlight element
        const highlightElement = document.createElement('span');
        highlightElement.className = 'modern-highlight';
        highlightElement.dataset.highlightId = highlightData.id;
        highlightElement.dataset.color = highlightData.color;
        highlightElement.style.setProperty('--highlight-bg', HIGHLIGHT_COLORS[highlightData.color].bg);
        highlightElement.style.setProperty('--highlight-border', HIGHLIGHT_COLORS[highlightData.color].border);
        highlightElement.style.setProperty('--highlight-text', HIGHLIGHT_COLORS[highlightData.color].text);
        highlightElement.title = `Highlighted on ${new Date(highlightData.timestamp).toLocaleString()}\nCtrl+Click to remove`;
        
        try {
          range.surroundContents(highlightElement);
          break; // Found and restored, exit loop
        } catch (e) {
          // If surroundContents fails, try extraction method
          const contents = range.extractContents();
          highlightElement.appendChild(contents);
          range.insertNode(highlightElement);
          break;
        }
      }
    }
  } catch (error) {
    console.error('Failed to restore highlight:', error);
  }
}

async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(['highlighterSettings']);
    if (result.highlighterSettings) {
      currentSettings = { ...currentSettings, ...result.highlighterSettings };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

function showNotification(message, type = 'info') {
  if (!currentSettings.showNotifications) return;
  
  // Remove existing notifications
  document.querySelectorAll('.highlight-notification').forEach(n => n.remove());
  
  const notification = document.createElement('div');
  notification.className = `highlight-notification ${type}`;
  notification.textContent = message;
  
  const styles = {
    info: { bg: '#3b82f6', icon: 'ℹ️' },
    success: { bg: '#10b981', icon: '✅' },
    warning: { bg: '#f59e0b', icon: '⚠️' },
    error: { bg: '#ef4444', icon: '❌' }
  };
  
  const style = styles[type] || styles.info;
  notification.innerHTML = `${style.icon} ${message}`;
  
  Object.assign(notification.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    background: style.bg,
    color: 'white',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    zIndex: '999999',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    animation: 'slideInRight 0.3s ease',
    maxWidth: '300px',
    wordWrap: 'break-word'
  });
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function notifyHighlightsUpdated() {
  // Notify popup of highlights update
  chrome.runtime.sendMessage({
    action: 'highlightsUpdated',
    highlights: pageHighlights
  }).catch(() => {
    // Popup might not be open, ignore error
  });
}

function injectStyles() {
  if (document.getElementById('modern-highlighter-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'modern-highlighter-styles';
  style.textContent = `
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    
    @keyframes flashHighlight {
      0%, 100% { background-color: var(--highlight-bg); }
      50% { background-color: var(--highlight-border); }
    }
    
    .flash-highlight {
      animation: flashHighlight 0.5s ease 4;
    }
  `;
  
  document.head.appendChild(style);
}

async function saveHighlightsToStorage() {
  try {
    if (!chrome.storage?.local) {
      console.warn('chrome.storage.local not available');
      return;
    }
    const data = { [pageURL]: pageHighlights };
    await chrome.storage.local.set(data);
  } catch (error) {
    console.error('Failed to save highlights:', error);
  }
}

function notifyHighlightsUpdated() {
  if (!chrome.runtime?.id) {
    // Extension context invalidated
    return;
  }
  chrome.runtime.sendMessage({
    action: 'highlightsUpdated',
    highlights: pageHighlights
  }).catch(() => {});
}