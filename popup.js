// popup.js - Stabilized version to prevent flickering

let currentColor = 'yellow';
let highlights = [];
let isLoading = false;
let isInitialized = false;

// Initialize popup with better stability
document.addEventListener('DOMContentLoaded', async () => {
  if (isInitialized) return; // Prevent double initialization
  
  try {
    isLoading = true;
    
    // Load settings and highlights concurrently
    const [settingsResult, highlightsResult] = await Promise.allSettled([
      loadSettings(),
      loadHighlights()
    ]);
    
    // Setup event listeners once
    setupEventListeners();
    
    // Single UI update
    updateUI();
    
    isLoading = false;
    isInitialized = true;
    
  } catch (error) {
    console.error('Popup initialization error:', error);
    isLoading = false;
  }
});

function setupEventListeners() {
  // Color selection - prevent rapid changes
  let colorChangeTimeout;
  document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', (e) => {
      if (isLoading) return;
      
      // Clear any pending color changes
      clearTimeout(colorChangeTimeout);
      
      // Remove active class from all options
      document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
      
      // Add active class to clicked option
      e.target.classList.add('active');
      currentColor = e.target.dataset.color;
      
      // Debounce saving settings
      colorChangeTimeout = setTimeout(() => {
        saveSettings().catch(console.error);
      }, 300);
    });
  });

  // Action buttons with single-click protection
  const highlightBtn = document.getElementById('highlightBtn');
  if (highlightBtn) {
    let highlightInProgress = false;
    
    highlightBtn.addEventListener('click', async () => {
      if (isLoading || highlightInProgress) return;
      
      highlightInProgress = true;
      highlightBtn.disabled = true;
      
      const originalText = highlightBtn.innerHTML;
      highlightBtn.innerHTML = '<span class="btn-icon">⏳</span>Processing...';
      
      try {
        await sendMessageToActiveTab({ action: 'highlightSelectedText', color: currentColor });
        
        // Wait a bit then reload highlights
        await new Promise(resolve => setTimeout(resolve, 300));
        await loadHighlights();
        updateUI();
        
      } catch (error) {
        console.error('Highlight action failed:', error);
      } finally {
        highlightBtn.disabled = false;
        highlightBtn.innerHTML = originalText;
        highlightInProgress = false;
      }
    });
  }

  const clearBtn = document.getElementById('clearBtn');
  if (clearBtn) {
    let clearInProgress = false;
    
    clearBtn.addEventListener('click', async () => {
      if (isLoading || clearInProgress || highlights.length === 0) return;
      
      const shouldClear = confirm('Are you sure you want to clear all highlights?');
      if (!shouldClear) return;
      
      clearInProgress = true;
      clearBtn.disabled = true;
      
      const originalText = clearBtn.innerHTML;
      clearBtn.innerHTML = '<span class="btn-icon">⏳</span>Clearing...';
      
      try {
        await sendMessageToActiveTab({ action: 'clearAllHighlights' });
        
        // Clear local data and update UI
        highlights = [];
        updateUI();
        
      } catch (error) {
        console.error('Clear action failed:', error);
        // Reload highlights to get current state
        await loadHighlights();
        updateUI();
      } finally {
        clearBtn.disabled = false;
        clearBtn.innerHTML = originalText;
        clearInProgress = false;
      }
    });
  }

  const copyBtn = document.getElementById('copyBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (isLoading) return;
      copyAllHighlights();
    });
  }

  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      if (isLoading) return;
      exportHighlights();
    });
  }
}

async function loadHighlights() {
  try {
    if (!chrome.storage?.local) {
      highlights = [];
      return;
    }
    
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
      highlights = [];
      return;
    }
    
    const tab = tabs[0];
    
    // Skip invalid URLs
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      highlights = [];
      return;
    }
    
    const url = tab.url.split('#')[0];
    const result = await chrome.storage.local.get([url]);
    highlights = result[url] || [];
    
  } catch (error) {
    console.error('Error loading highlights:', error);
    highlights = [];
  }
}

// Throttled UI update to prevent rapid changes
let updateUITimeout;
function updateUI() {
  if (updateUITimeout) return;
  
  updateUITimeout = setTimeout(() => {
    try {
      updateHighlightCount();
      updateHighlightsList();
    } catch (error) {
      console.error('Error updating UI:', error);
    } finally {
      updateUITimeout = null;
    }
  }, 100); // Increased delay
}

function updateHighlightCount() {
  const countElement = document.getElementById('highlightCount');
  if (countElement && countElement.textContent !== highlights.length.toString()) {
    countElement.textContent = highlights.length;
  }
}

function updateHighlightsList() {
  const container = document.getElementById('highlights');
  if (!container) return;
  
  // Only update if content actually changed
  const newContent = generateHighlightsHTML();
  if (container.innerHTML !== newContent) {
    container.innerHTML = newContent;
  }
}

function generateHighlightsHTML() {
  if (highlights.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-icon">💡</div>
        <p>No highlights yet</p>
        <small>Select text and click highlight to get started</small>
      </div>
    `;
  }

  // Sort highlights by timestamp (newest first)
  const sortedHighlights = [...highlights].sort((a, b) => b.timestamp - a.timestamp);

  return sortedHighlights.map((highlight) => `
    <div class="highlight-item" style="--highlight-color: ${getHighlightColor(highlight.color)}">
      <div class="highlight-text">${escapeHtml(highlight.text)}</div>
      <div class="highlight-meta">
        <span>${formatTime(highlight.timestamp)}</span>
        <div class="highlight-actions">
          <button class="highlight-action" onclick="jumpToHighlight('${highlight.id}')" title="Jump to highlight">🔍</button>
          <button class="highlight-action" onclick="copyHighlight('${escapeHtml(highlight.text)}')" title="Copy text">📋</button>
          <button class="highlight-action" onclick="removeHighlight('${highlight.id}')" title="Remove highlight">🗑️</button>
        </div>
      </div>
    </div>
  `).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getHighlightColor(color) {
  const colors = {
    yellow: '#fbbf24',
    green: '#10b981',
    blue: '#3b82f6',
    pink: '#ec4899',
    orange: '#f97316',
    purple: '#8b5cf6'
  };
  return colors[color] || colors.yellow;
}

function formatTime(timestamp) {
  try {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return time.toLocaleDateString();
  } catch (error) {
    return 'Unknown';
  }
}

function sendMessageToActiveTab(message) {
  return new Promise((resolve, reject) => {
    if (!chrome.tabs) {
      reject(new Error('chrome.tabs not available'));
      return;
    }
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      
      if (tabs.length === 0) {
        reject(new Error('No active tab found'));
        return;
      }
      
      const tab = tabs[0];
      
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        reject(new Error('Cannot access chrome:// or extension pages'));
        return;
      }
      
      chrome.tabs.sendMessage(tab.id, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    });
  });
}

function copyAllHighlights() {
  if (highlights.length === 0) {
    return;
  }

  const text = highlights.map(h => `• ${h.text}`).join('\n\n');
  
  navigator.clipboard.writeText(text).then(() => {
    // Simple success feedback without animations
    console.log('Highlights copied');
  }).catch(() => {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      console.log('Highlights copied (fallback)');
    } catch (err) {
      console.error('Failed to copy highlights');
    }
    document.body.removeChild(textArea);
  });
}

function exportHighlights() {
  if (highlights.length === 0) {
    return;
  }

  try {
    const data = {
      timestamp: new Date().toISOString(),
      totalHighlights: highlights.length,
      highlights: highlights.map(h => ({
        text: h.text,
        color: h.color,
        timestamp: h.timestamp
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `highlights-${new Date().toISOString().split('T')[0]}.json`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Export failed:', error);
  }
}

// Global functions for onclick handlers
window.removeHighlight = async function(id) {
  if (isLoading) return;
  
  try {
    await sendMessageToActiveTab({ action: 'removeHighlight', id });
    // Update local data immediately
    highlights = highlights.filter(h => h.id !== id);
    updateUI();
  } catch (error) {
    console.error('Remove highlight failed:', error);
  }
};

window.jumpToHighlight = async function(id) {
  if (isLoading) return;
  
  try {
    await sendMessageToActiveTab({ action: 'jumpToHighlight', id });
    window.close();
  } catch (error) {
    console.error('Jump to highlight failed:', error);
  }
};

window.copyHighlight = function(text) {
  navigator.clipboard.writeText(text).catch(() => {
    console.error('Failed to copy highlight');
  });
};

async function saveSettings() {
  try {
    await chrome.storage.local.set({ 
      highlighterSettings: { 
        currentColor,
        lastUpdated: Date.now()
      } 
    });
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(['highlighterSettings']);
    if (result.highlighterSettings && result.highlighterSettings.currentColor) {
      currentColor = result.highlighterSettings.currentColor;
      
      // Update UI to reflect loaded settings
      setTimeout(() => {
        document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
        const targetOption = document.querySelector(`[data-color="${currentColor}"]`);
        if (targetOption) {
          targetOption.classList.add('active');
        }
      }, 0);
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'highlightsUpdated' && !isLoading) {
    highlights = message.highlights || [];
    updateUI();
  }
});