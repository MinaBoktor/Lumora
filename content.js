// Lumora Content Script - Simple and Functional Text Highlighter
console.log("Lumora content script loaded");

// State management
let highlights = [];
let highlightCounter = 0;
const STORAGE_KEY = `lumora_highlights_${window.location.hostname}`;

// Configuration
const COLORS = {
  yellow: { bg: '#fff3cd', border: '#ffd700', text: '#856404' },
  green: { bg: '#d1f2eb', border: '#10b981', text: '#0d5744' },
  blue: { bg: '#cce7ff', border: '#3b82f6', text: '#1e3a8a' },
  pink: { bg: '#fce7f3', border: '#ec4899', text: '#831843' },
  orange: { bg: '#fed7aa', border: '#f97316', text: '#9a3412' },
  purple: { bg: '#e9d5ff', border: '#8b5cf6', text: '#5b21b6' }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {

  

  console.log("Initializing Lumora highlighter");
  loadHighlights();
  setupMessageListener();
  setupKeyboardShortcuts(); // Add this line
  
  // Auto-save highlights when page unloads
  window.addEventListener('beforeunload', saveHighlights);
}

// Message listener for communication with popup and background
function setupMessageListener() {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Content script received message:", request.action);
    
    switch (request.action) {
      case 'ping':
        sendResponse({ status: 'ready' });
        break;
        
      case 'highlightSelection':
        const result = highlightSelectedText(request.color || 'yellow');
        sendResponse({ success: result.success, message: result.message });
        break;
        
      case 'getHighlights':
        sendResponse({ highlights: highlights });
        break;
        
      case 'jumpToHighlight':
        jumpToHighlight(request.id);
        sendResponse({ success: true });
        break;
        
      case 'removeHighlight':
        removeHighlight(request.id);
        sendResponse({ success: true });
        break;
        
      case 'clearAllHighlights':
        clearAllHighlights();
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ error: 'Unknown action' });
    }
    
    return true; // Keep message channel open
  });
}

// Main highlighting function
function highlightSelectedText(color = 'yellow') {
  const selection = window.getSelection();
  
  if (!selection.rangeCount || selection.toString().trim() === '') {
    return { success: false, message: 'No text selected' };
  }
  
  try {
    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();
    
    // Validate selection
    if (selectedText.length < 1) {
      return { success: false, message: 'Selected text too short' };
    }
    
    // Always use the robust highlighting method for complex selections
    return highlightComplexSelection(range, selectedText, color);
    
  } catch (error) {
    console.error('Error creating highlight:', error);
    return { success: false, message: 'Failed to create highlight' };
  }
}

// Robust highlighting that handles links and complex DOM structures
function highlightComplexSelection(range, selectedText, color) {
  try {
    const highlightId = `lumora-highlight-${++highlightCounter}-${Date.now()}`;
    
    // Create a document fragment to hold the highlighted content
    const fragment = document.createDocumentFragment();
    
    // Extract the contents of the range
    const contents = range.extractContents();
    
    // Create the highlight wrapper
    const highlight = document.createElement('span');
    highlight.className = 'modern-highlight';
    highlight.setAttribute('data-color', color);
    highlight.setAttribute('data-highlight-id', highlightId);
    highlight.style.cssText = `
      background: ${COLORS[color].bg} !important;
      border-bottom: 2px solid ${COLORS[color].border} !important;
      color: ${COLORS[color].text} !important;
      padding: 2px 4px !important;
      border-radius: 3px !important;
      position: relative !important;
      display: inline !important;
    `;
    
    // Process the contents to preserve links and other elements
    processNodeForHighlight(contents, highlight, color);
    
    // Insert the highlighted content back into the range
    range.insertNode(highlight);
    
    // Store highlight data with DOM structure
    const highlightData = {
      id: highlightId,
      text: selectedText,
      color: color,
      timestamp: Date.now(),
      url: window.location.href,
      xpath: getXPath(highlight),
      htmlContent: highlight.innerHTML, // Store the actual HTML content
      parentXPath: getXPath(highlight.parentElement),
      textBefore: getPreviousText(highlight),
      textAfter: getNextText(highlight)
    };
    
    highlights.push(highlightData);
    saveHighlights();
    
    // Clear selection
    window.getSelection().removeAllRanges();
    
    // Add click handler for future interactions
    highlight.addEventListener('click', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        selectHighlight(highlightId);
      }
    });
    
    // Notify popup about update
    notifyHighlightsUpdated();
    
    // Show success notification
    showNotification(`Text highlighted with ${color}!`, 'success');
    
    console.log("Complex highlight created:", highlightData);
    return { success: true, message: 'Text highlighted successfully' };
    
  } catch (error) {
    console.error('Error in complex highlighting:', error);
    return { success: false, message: 'Failed to create highlight' };
  }
}

// Process nodes to preserve links and formatting while applying highlight
function processNodeForHighlight(node, targetElement, color) {
  if (node.nodeType === Node.TEXT_NODE) {
    // For text nodes, just append them
    targetElement.appendChild(node.cloneNode(true));
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    // For element nodes (like links), preserve them but apply highlight background
    const clone = node.cloneNode(false);
    
    // Apply highlight styling to links and other elements
    if (node.tagName === 'A') {
      // Preserve link functionality while applying highlight
      clone.style.cssText += `
        background: ${COLORS[color].bg} !important;
        color: ${COLORS[color].text} !important;
        text-decoration: underline !important;
      `;
    } else {
      // Apply highlight to other elements
      clone.style.cssText += `
        background: ${COLORS[color].bg} !important;
        color: ${COLORS[color].text} !important;
      `;
    }
    
    // Process child nodes recursively
    Array.from(node.childNodes).forEach(child => {
      processNodeForHighlight(child, clone, color);
    });
    
    targetElement.appendChild(clone);
  } else {
    // For other node types, just clone them
    targetElement.appendChild(node.cloneNode(true));
  }
}

// Remove a specific highlight
function removeHighlight(id) {
  const highlight = document.querySelector(`[data-highlight-id="${id}"]`);
  if (highlight) {
    // Preserve the original content structure when removing highlight
    const parent = highlight.parentElement;
    
    // Move all child nodes out of the highlight wrapper
    while (highlight.firstChild) {
      parent.insertBefore(highlight.firstChild, highlight);
    }
    
    // Remove the empty highlight wrapper
    parent.removeChild(highlight);
    
    // Clean up any empty text nodes and normalize
    parent.normalize();
    
    // Remove from storage
    highlights = highlights.filter(h => h.id !== id);
    saveHighlights();
    notifyHighlightsUpdated();
    
    showNotification('Highlight removed', 'info');
    console.log("Removed highlight:", id);
  }
}

// Helper function to check if node is already in a highlight
function isInHighlight(node) {
  let parent = node.parentElement;
  while (parent) {
    if (parent.classList.contains('modern-highlight')) {
      return true;
    }
    parent = parent.parentElement;
  }
  return false;
}

// Jump to and flash a highlight
function jumpToHighlight(id) {
  const highlight = document.querySelector(`[data-highlight-id="${id}"]`);
  if (highlight) {
    highlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Flash effect
    highlight.style.animation = 'flashHighlight 0.6s ease 3';
    setTimeout(() => {
      highlight.style.animation = '';
    }, 1800);
    
    console.log("Jumped to highlight:", id);
  }
}

// Clear all highlights
function clearAllHighlights() {
  document.querySelectorAll('.modern-highlight').forEach(highlight => {
    const parent = highlight.parentElement;
    
    // Move all child nodes out of the highlight wrapper
    while (highlight.firstChild) {
      parent.insertBefore(highlight.firstChild, highlight);
    }
    
    // Remove the empty highlight wrapper
    parent.removeChild(highlight);
    
    // Normalize to clean up text nodes
    parent.normalize();
  });
  
  highlights = [];
  saveHighlights();
  notifyHighlightsUpdated();
  
  showNotification('All highlights cleared', 'info');
  console.log("Cleared all highlights");
}

// Select/highlight a specific highlight element
function selectHighlight(id) {
  // Remove previous selection
  document.querySelectorAll('.lumora-selected').forEach(el => {
    el.classList.remove('lumora-selected');
  });
  
  const highlight = document.querySelector(`[data-highlight-id="${id}"]`);
  if (highlight) {
    highlight.classList.add('lumora-selected');
    highlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Remove selection after 3 seconds
    setTimeout(() => {
      highlight.classList.remove('lumora-selected');
    }, 3000);
  }
}

// Save highlights to chrome storage
function saveHighlights() {
  try {
    chrome.storage.local.set({
      [STORAGE_KEY]: highlights
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error saving highlights:', chrome.runtime.lastError);
      } else {
        console.log(`Saved ${highlights.length} highlights`);
      }
    });
  } catch (error) {
    console.error('Storage error:', error);
  }
}

// Load highlights from chrome storage
function loadHighlights() {
  try {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      if (chrome.runtime.lastError) {
        console.error('Error loading highlights:', chrome.runtime.lastError);
        return;
      }
      
      if (result[STORAGE_KEY]) {
        highlights = result[STORAGE_KEY];
        restoreHighlights();
        console.log(`Loaded ${highlights.length} highlights`);
      }
    });
  } catch (error) {
    console.error('Load error:', error);
  }
}

// Restore highlights on page load
function restoreHighlights() {
  console.log(`Attempting to restore ${highlights.length} highlights`);
  
  highlights.forEach(highlightData => {
    const { id, text, color, htmlContent, parentXPath, textBefore, textAfter } = highlightData;
    
    // Skip if highlight element already exists
    if (document.querySelector(`[data-highlight-id="${id}"]`)) {
      console.log(`Highlight ${id} already exists, skipping`);
      return;
    }
    
    // Try different restoration strategies
    if (!restoreByContext(highlightData) && 
        !restoreByXPath(highlightData) && 
        !restoreByTextSearch(text, color, id)) {
      console.log(`Could not restore highlight: ${id}`);
      // Keep the highlight in storage even if we can't restore it
      // It might be restorable on a different page load
    }
  });
}

// Strategy 1: Restore using surrounding context
function restoreByContext(highlightData) {
  const { id, text, color, htmlContent, textBefore, textAfter } = highlightData;
  
  if (!textBefore && !textAfter) return false;
  
  try {
    // Find text nodes that match the before/after context
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let node;
    while (node = walker.nextNode()) {
      if (isInHighlight(node)) continue;
      
      const nodeText = node.textContent;
      
      // Look for the context pattern
      if (textBefore && textAfter) {
        const beforeIndex = nodeText.indexOf(textBefore);
        const afterIndex = nodeText.indexOf(textAfter);
        
        if (beforeIndex !== -1 && afterIndex > beforeIndex) {
          const startPos = beforeIndex + textBefore.length;
          const endPos = afterIndex;
          const foundText = nodeText.substring(startPos, endPos);
          
          if (foundText.includes(text.substring(0, Math.min(20, text.length)))) {
            return restoreAtPosition(node, startPos, endPos, color, id, htmlContent);
          }
        }
      } else if (textBefore) {
        const beforeIndex = nodeText.indexOf(textBefore);
        if (beforeIndex !== -1) {
          const startPos = beforeIndex + textBefore.length;
          const remainingText = nodeText.substring(startPos);
          
          if (remainingText.startsWith(text.substring(0, Math.min(10, text.length)))) {
            return restoreAtPosition(node, startPos, startPos + text.length, color, id, htmlContent);
          }
        }
      } else if (textAfter) {
        const afterIndex = nodeText.indexOf(textAfter);
        if (afterIndex !== -1) {
          const endPos = afterIndex;
          const precedingText = nodeText.substring(0, endPos);
          
          if (precedingText.endsWith(text.substring(Math.max(0, text.length - 10)))) {
            const startPos = endPos - text.length;
            return restoreAtPosition(node, startPos, endPos, color, id, htmlContent);
          }
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error in context restoration:', error);
    return false;
  }
}

// Strategy 2: Restore using XPath (if available)
function restoreByXPath(highlightData) {
  const { xpath, id, color, htmlContent } = highlightData;
  
  if (!xpath) return false;
  
  try {
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    const element = result.singleNodeValue;
    
    if (element && !element.querySelector('.modern-highlight')) {
      // The element exists and doesn't already have highlights
      element.innerHTML = htmlContent || element.innerHTML;
      
      // Find the highlight within and update its ID
      const highlight = element.querySelector('.modern-highlight') || 
                      element.querySelector(`[data-highlight-id="${id}"]`);
      
      if (highlight) {
        highlight.setAttribute('data-highlight-id', id);
        addHighlightClickHandler(highlight, id);
        console.log(`Restored highlight by XPath: ${id}`);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error in XPath restoration:', error);
    return false;
  }
}

// Strategy 3: Simple text search fallback
function restoreByTextSearch(text, color, id) {
  try {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let node;
    while (node = walker.nextNode()) {
      if (isInHighlight(node)) continue;
      
      const nodeText = node.textContent;
      const index = nodeText.indexOf(text);
      
      if (index !== -1) {
        return restoreAtPosition(node, index, index + text.length, color, id);
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error in text search restoration:', error);
    return false;
  }
}

// Restore highlight at a specific position in a text node
function restoreAtPosition(node, startPos, endPos, color, id, htmlContent = null) {
  try {
    const parent = node.parentElement;
    const nodeText = node.textContent;
    
    const before = nodeText.substring(0, startPos);
    const highlightText = nodeText.substring(startPos, endPos);
    const after = nodeText.substring(endPos);
    
    // Create highlight element
    const highlight = createHighlightElement(id, color, highlightText);
    
    // If we have stored HTML content, try to use it
    if (htmlContent && htmlContent !== highlightText) {
      try {
        highlight.innerHTML = htmlContent;
      } catch (e) {
        // Fallback to text content if HTML parsing fails
        highlight.textContent = highlightText;
      }
    }
    
    // Replace the node
    parent.removeChild(node);
    if (before) parent.appendChild(document.createTextNode(before));
    parent.appendChild(highlight);
    if (after) parent.appendChild(document.createTextNode(after));
    
    addHighlightClickHandler(highlight, id);
    console.log(`Restored highlight at position: ${id}`);
    return true;
    
  } catch (error) {
    console.error('Error restoring at position:', error);
    return false;
  }
}

// Get text that appears before an element
function getPreviousText(element) {
  try {
    const prev = element.previousSibling;
    if (prev && prev.nodeType === Node.TEXT_NODE) {
      return prev.textContent.slice(-20); // Last 20 characters
    }
    
    const prevElement = element.previousElementSibling;
    if (prevElement) {
      return prevElement.textContent.slice(-20);
    }
    
    return '';
  } catch (error) {
    return '';
  }
}

// Get text that appears after an element
function getNextText(element) {
  try {
    const next = element.nextSibling;
    if (next && next.nodeType === Node.TEXT_NODE) {
      return next.textContent.slice(0, 20); // First 20 characters
    }
    
    const nextElement = element.nextElementSibling;
    if (nextElement) {
      return nextElement.textContent.slice(0, 20);
    }
    
    return '';
  } catch (error) {
    return '';
  }
}

// Helper to create highlight element
function createHighlightElement(id, color, text) {
  const highlight = document.createElement('span');
  highlight.className = 'modern-highlight';
  highlight.setAttribute('data-color', color);
  highlight.setAttribute('data-highlight-id', id);
  highlight.style.cssText = `
    background: ${COLORS[color].bg} !important;
    border-bottom: 2px solid ${COLORS[color].border} !important;
    color: ${COLORS[color].text} !important;
    padding: 2px 4px !important;
    border-radius: 3px !important;
    position: relative !important;
    display: inline !important;
  `;
  highlight.textContent = text;
  return highlight;
}

// Helper to add click handler to highlight
function addHighlightClickHandler(highlight, id) {
  highlight.addEventListener('click', (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      selectHighlight(id);
    }
  });
}

// Get XPath for an element (simple version)
function getXPath(element) {
  if (!element) return '';
  
  if (element.id) return `//*[@id="${element.id}"]`;
  
  const parts = [];
  while (element && element.nodeType === Node.ELEMENT_NODE) {
    let sibling = element;
    let siblingIndex = 1;
    
    while (sibling = sibling.previousElementSibling) {
      if (sibling.nodeName === element.nodeName) siblingIndex++;
    }
    
    parts.unshift(`${element.nodeName.toLowerCase()}[${siblingIndex}]`);
    element = element.parentElement;
  }
  
  return '/' + parts.join('/');
}

// Show notification to user
function showNotification(message, type = 'info') {
  // Remove existing notifications
  document.querySelectorAll('.highlight-notification').forEach(n => n.remove());
  
  const notification = document.createElement('div');
  notification.className = `highlight-notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed !important;
    top: 20px !important;
    right: 20px !important;
    z-index: 999999 !important;
    background: #3b82f6 !important;
    color: white !important;
    padding: 12px 16px !important;
    border-radius: 8px !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
    animation: slideInRight 0.3s ease !important;
    pointer-events: none !important;
  `;
  
  // Set color based on type
  switch (type) {
    case 'success': notification.style.background = '#10b981 !important'; break;
    case 'warning': notification.style.background = '#f59e0b !important'; break;
    case 'error': notification.style.background = '#ef4444 !important'; break;
  }
  
  document.body.appendChild(notification);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Notify popup about highlights update
function notifyHighlightsUpdated() {
  try {
    chrome.runtime.sendMessage({
      action: 'highlightsUpdated',
      highlights: highlights
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('Could not notify popup (likely closed):', chrome.runtime.lastError);
      } else {
        console.log('Notified popup of highlights update');
      }
    });
  } catch (error) {
    console.log('Failed to notify popup:', error);
  }
}

// CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes flashHighlight {
    0%, 100% { 
      background: var(--highlight-bg) !important;
      box-shadow: 0 0 0 0 var(--highlight-border);
    }
    50% { 
      background: var(--highlight-border) !important;
      box-shadow: 0 0 0 4px rgba(255, 215, 0, 0.3);
    }
  }
  
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  
  .lumora-selected {
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.4) !important;
    outline: 2px solid #6366f1 !important;
    outline-offset: 1px !important;
  }
`;
document.head.appendChild(style);

console.log("Lumora content script initialized successfully");

// Add this new function to handle keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl+X: Highlight selected text with default color
    if (e.ctrlKey && e.key === 'x' && !e.shiftKey) {
      e.preventDefault();
      
      const selection = window.getSelection();
      if (selection.toString().trim()) {
        const result = highlightSelectedText('yellow'); // Default color
        if (result.success) {
          showNotification('Text highlighted!', 'success');
        } else {
          showNotification(result.message || 'Could not highlight text', 'error');
        }
      } else {
        showNotification('No text selected', 'warning');
      }
    }
    
    // Ctrl+Shift+X: Copy all highlights to clipboard
    else if (e.ctrlKey && e.shiftKey && e.key === 'X') {
      e.preventDefault();
      copyAllHighlights();
    }
  });
}

// Add this new function to copy all highlights
function copyAllHighlights() {
  if (highlights.length === 0) {
    showNotification('No highlights to copy', 'warning');
    return;
  }
  
  try {
    // Simple plain text - just the highlighted text separated by double line breaks
    const plainText = highlights.map(highlight => highlight.text.trim()).join('\n\n');
    
    // Copy to clipboard using the modern API
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(plainText).then(() => {
        showNotification(`Copied ${highlights.length} highlights to clipboard`, 'success');
      }).catch(err => {
        console.error('Failed to copy to clipboard:', err);
        fallbackCopyToClipboard(plainText);
      });
    } else {
      // Fallback for older browsers or non-secure contexts
      fallbackCopyToClipboard(plainText);
    }
    
  } catch (error) {
    console.error('Error copying highlights:', error);
    showNotification('Failed to copy highlights', 'error');
  }
}

// Fallback clipboard copy method
function fallbackCopyToClipboard(text) {
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful) {
      showNotification(`Copied ${highlights.length} highlights to clipboard`, 'success');
    } else {
      showNotification('Failed to copy highlights', 'error');
    }
  } catch (err) {
    console.error('Fallback copy failed:', err);
    showNotification('Failed to copy highlights', 'error');
  }
}