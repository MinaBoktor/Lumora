document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const highlightBtn = document.getElementById("highlightBtn");
  const colorIndicator = document.getElementById("colorIndicator");
  const highlightsList = document.getElementById("highlightsList");
  const emptyState = document.getElementById("emptyState");
  const highlightCount = document.getElementById("highlightCount");
  const selectAllBtn = document.getElementById("selectAllBtn");
  const exportBtn = document.getElementById("exportBtn");
  const clearAllBtn = document.getElementById("clearAllBtn");
  const settingsToggle = document.getElementById("settingsToggle");
  const settingsContent = document.getElementById("settingsContent");
  const colorOptions = document.querySelectorAll(".color-option");
  const toggleSwitches = document.querySelectorAll(".toggle-switch");

  // State
  let selectedColor = "yellow";
  let highlights = [];
  let settingsOpen = false;
  let autoSaveEnabled = true;
  let notificationsEnabled = true;
  let currentTabId = null;

  // Initialize
  loadSettings();
  setupEventListeners();
  checkContentScriptReady();
  getCurrentTabHighlights();

  // Event Listeners
  function setupEventListeners() {
    // Color picker
    colorOptions.forEach((option) => {
      option.addEventListener("click", handleColorSelection);
    });

    // Settings toggle
    settingsToggle.addEventListener("click", toggleSettings);

    // Toggle switches
    toggleSwitches.forEach((toggle) => {
      toggle.addEventListener("click", handleToggleSwitch);
    });

    // Highlight button
    highlightBtn.addEventListener("click", captureHighlight);

    // Bottom action buttons
    selectAllBtn.addEventListener("click", copyAllHighlights);
    exportBtn.addEventListener("click", exportHighlights);
    clearAllBtn.addEventListener("click", clearAllHighlights);
  }

  // Color selection handler
  function handleColorSelection(e) {
    colorOptions.forEach((opt) => opt.classList.remove("active"));
    e.target.classList.add("active");
    selectedColor = e.target.dataset.color;
    colorIndicator.className = `current-color-indicator color-${selectedColor}`;
    saveSettings();
  }

  // Settings toggle handler
  function toggleSettings() {
    settingsOpen = !settingsOpen;
    settingsContent.classList.toggle("open", settingsOpen);
  }

  // Toggle switch handler
  function handleToggleSwitch(e) {
    const toggle = e.currentTarget;
    toggle.classList.toggle("active");

    if (toggle.id === "autoSaveToggle") {
      autoSaveEnabled = toggle.classList.contains("active");
    } else if (toggle.id === "notificationsToggle") {
      notificationsEnabled = toggle.classList.contains("active");
    }

    saveSettings();
  }

  // Capture highlight from active tab
  function captureHighlight() {
    const highlightBtn = document.getElementById("highlightBtn");
    highlightBtn.disabled = true; // Disable while processing

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs.length) {
        showNotification("No active tab found");
        highlightBtn.disabled = false;
        return;
      }

      chrome.tabs.sendMessage(
        tabs[0].id,
        {
          action: "highlightSelection",
          color: selectedColor,
        },
        function (response) {
          highlightBtn.disabled = false; // Re-enable button

          if (chrome.runtime.lastError) {
            console.error("Highlight error:", chrome.runtime.lastError);
            showNotification(
              "Could not highlight. Please refresh the page and try again."
            );
            return;
          }

          if (response && response.success) {
            // Highlights are now updated via the highlightsUpdated message
            showNotification("Highlight saved!");
          } else {
            showNotification("Please select text to highlight first.");
          }
        }
      );
    });
  }

  // Update the highlights list UI
  function updateHighlightsList() {
    highlightCount.textContent = highlights.length;

    if (highlights.length === 0) {
      emptyState.style.display = "flex";
      highlightsList.innerHTML = "";
      [selectAllBtn, exportBtn, clearAllBtn].forEach((btn) => {
        btn.disabled = true;
      });
    } else {
      emptyState.style.display = "none";
      [selectAllBtn, exportBtn, clearAllBtn].forEach((btn) => {
        btn.disabled = false;
      });

      highlightsList.innerHTML = highlights
        .map(
          (highlight, index) => `
                <div class="highlight-item fade-in color-${
            highlight.color
          }" style="animation-delay: ${index * 0.05}s">
                    <div class="highlight-text">${escapeHtml(
            highlight.text
          )}</div>
                    <div class="highlight-meta">
                        <span>${
            highlight.timestamp
              ? new Date(highlight.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "N/A"
          }</span>
                        <div class="highlight-actions">
                            <button class="action-icon jump-to-highlight" data-id="${
            highlight.id
          }" title="Jump to Highlight">🔗</button>
                            <button class="action-icon remove-highlight" data-id="${
            highlight.id
          }" title="Remove Highlight">🗑️</button>
                        </div>
                    </div>
                </div>
            `
        )
        .join("");

      // Add event listeners to action buttons
      document.querySelectorAll(".jump-to-highlight").forEach((btn) => {
        btn.addEventListener("click", () => jumpToHighlight(btn.dataset.id));
      });
      document.querySelectorAll(".remove-highlight").forEach((btn) => {
        btn.addEventListener("click", () => removeHighlight(btn.dataset.id));
      });
    }
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Jump to a highlight on the page
  function jumpToHighlight(id) {
    if (currentTabId) {
      chrome.tabs.sendMessage(currentTabId, {
        action: "jumpToHighlight",
        id: id,
      });
      window.close(); // Close popup after jumping
    }
  }

  // Remove a highlight
  function removeHighlight(id) {
    if (currentTabId) {
      chrome.tabs.sendMessage(currentTabId, {
        action: "removeHighlight",
        id: id,
      });
      // The highlightsUpdated message will refresh the list
    }
  }

  // Copy all highlights to clipboard
  function copyAllHighlights() {
    const textToCopy = highlights.map((h) => h.text).join("\n\n");
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        selectAllBtn.innerHTML = "<span>✓</span>Copied!";
        setTimeout(() => {
          selectAllBtn.innerHTML = "<span>📋</span>Select All";
        }, 2000);
        showNotification("All highlights copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
        showNotification("Failed to copy highlights.");
      });
  }

  // Export highlights to file
  function exportHighlights() {
    const data = highlights
      .map(
        (h) =>
          `[${h.color.toUpperCase()}] ${h.text} (${
            h.timestamp
              ? new Date(h.timestamp).toLocaleString()
              : "N/A"
          })${h.url ? `\nURL: ${h.url}` : ""}`
      )
      .join("\n\n");

    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lumora-highlights-${new Date()
      .toISOString()
      .split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification("Highlights exported!");
  }

  // Clear all highlights
  function clearAllHighlights() {
    if (
      confirm("Are you sure you want to clear all highlights? This cannot be undone.")
    ) {
      // Clear from content script
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs.length) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: "clearAllHighlights",
          });
        }
      });

      highlights = [];
      updateHighlightsList();
      // No need to saveHighlights() here, content script will handle storage update
      showNotification("All highlights cleared.");
    }
  }

  // Show notification
  function showNotification(message) {
    if (!notificationsEnabled) return;

    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;
    notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #343A40;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 1000;
            animation: fadeIn 0.3s ease-in-out;
            font-size: 12px;
        `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = "fadeOut 0.3s ease-in-out";
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Save settings to chrome.storage
  function saveSettings() {
    const settings = {
      selectedColor,
      autoSaveEnabled,
      notificationsEnabled,
    };

    chrome.storage.local.set({ lumoraSettings: settings }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error saving settings:", chrome.runtime.lastError);
      }
    });

    // Also save to highlighterSettings for content script compatibility
    chrome.storage.local.set({
      highlighterSettings: {
        currentColor: selectedColor,
        autoSave: autoSaveEnabled,
        showNotifications: notificationsEnabled,
        highlightStyle: "modern",
      },
    });
  }

  // Load settings from chrome.storage
  function loadSettings() {
    chrome.storage.local.get(["lumoraSettings"], (result) => {
      if (chrome.runtime.lastError) {
        console.error("Error loading settings:", chrome.runtime.lastError);
        return;
      }

      if (result.lumoraSettings) {
        selectedColor = result.lumoraSettings.selectedColor || "yellow";
        autoSaveEnabled = result.lumoraSettings.autoSaveEnabled !== false;
        notificationsEnabled = result.lumoraSettings.notificationsEnabled !== false;

        colorOptions.forEach((opt) => {
          opt.classList.toggle("active", opt.dataset.color === selectedColor);
        });
        colorIndicator.className = `current-color-indicator color-${selectedColor}`;

        document
          .getElementById("autoSaveToggle")
          .classList.toggle("active", autoSaveEnabled);
        document
          .getElementById("notificationsToggle")
          .classList.toggle("active", notificationsEnabled);
      }
    });
  }

  // Check if content script is ready and get current highlights
  function checkContentScriptReady() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs.length) {
        console.log("No active tab found");
        return;
      }

      currentTabId = tabs[0].id; // Store current tab ID
      const highlightBtn = document.getElementById("highlightBtn");

      // First try sending a ping
      chrome.tabs.sendMessage(tabs[0].id, { action: "ping" }, function (response) {
        if (chrome.runtime.lastError) {
          console.log("Content script not ready:", chrome.runtime.lastError);
          highlightBtn.disabled = true;
          highlightBtn.title = "Content script not loaded. Refresh the page and try again.";

          // Fallback: try injecting the content script manually
          if (chrome.scripting && chrome.scripting.executeScript) {
            chrome.scripting
              .executeScript({
                target: { tabId: tabs[0].id },
                files: ["content.js"],
              })
              .then(() => {
                console.log("Content script injected manually");
                highlightBtn.disabled = false;
                highlightBtn.title = "";
                getCurrentTabHighlights(); // Get highlights after injection
              })
              .catch((err) => {
                console.error("Failed to inject content script:", err);
              });
          }
        } else {
          console.log("Content script is ready");
          highlightBtn.disabled = false;
          highlightBtn.title = "";
          getCurrentTabHighlights(); // Get highlights if already ready
        }
      });
    });
  }

  // Request highlights from the current tab's content script
  function getCurrentTabHighlights() {
    if (currentTabId) {
      chrome.tabs.sendMessage(currentTabId, { action: "getHighlights" }, function (response) {
        if (chrome.runtime.lastError) {
          console.error("Error getting highlights from content script:", chrome.runtime.lastError);
          return;
        }
        if (response && response.highlights) {
          highlights = response.highlights;
          updateHighlightsList();
        }
      });
    }
  }

  // Listen for messages from content script
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log("Popup received message:", request.action);
    
    if (request.action === "highlightsUpdated") {
      console.log("Updating highlights in popup:", request.highlights?.length || 0);
      // Update popup with latest highlights from content script
      if (request.highlights) {
        highlights = request.highlights;
        updateHighlightsList();
      }
      sendResponse({ received: true });
    } else if (request.action === "ping") {
      // Respond to ping to indicate popup is active
      sendResponse({ status: "ready" });
    }
    
    return true; // Keep message channel open
  });
});


