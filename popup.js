// Lumora Popup JavaScript - Modified to work with existing HTML structure

class LumoraPopup {
    constructor() {
        this.currentTab = null;
        this.highlights = [];
        this.settings = {
            currentColor: 'yellow',
            autoSave: true,
            showNotifications: true
        };
        
        this.init();
    }

    async init() {
        await this.getCurrentTab();
        await this.loadSettings();
        await this.loadHighlights();
        this.setupEventListeners();
        this.updateUI();
        this.checkSelection();
    }

    async getCurrentTab() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            this.currentTab = tab;
        } catch (error) {
            console.error('Failed to get current tab:', error);
        }
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.local.get(['highlighterSettings']);
            if (result.highlighterSettings) {
                this.settings = { ...this.settings, ...result.highlighterSettings };
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    async saveSettings() {
        try {
            await chrome.storage.local.set({ highlighterSettings: this.settings });
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    async loadHighlights() {
        if (!this.currentTab) return;
        
        try {
            const response = await chrome.tabs.sendMessage(this.currentTab.id, {
                action: 'getHighlights'
            });
            
            if (response && response.highlights) {
                this.highlights = response.highlights;
                this.updateHighlightsList();
                this.updateHighlightCount();
            }
        } catch (error) {
            console.error('Failed to load highlights:', error);
            this.highlights = [];
        }
    }

    setupEventListeners() {
        // Color palette
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectColor(e.target.dataset.color);
            });
        });

        // Main highlight button
        const highlightBtn = document.getElementById('highlightBtn');
        if (highlightBtn) {
            highlightBtn.addEventListener('click', () => {
                this.highlightSelection();
            });
        }

        // Action buttons
        const selectAllBtn = document.getElementById('selectAllBtn');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                this.selectAllHighlights();
            });
        }

        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportHighlights();
            });
        }

        const clearAllBtn = document.getElementById('clearAllBtn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                this.clearAllHighlights();
            });
        }

        // Settings toggle
        const settingsToggle = document.getElementById('settingsToggle');
        if (settingsToggle) {
            settingsToggle.addEventListener('click', () => {
                this.toggleSettings();
            });
        }

        // Settings controls
        const autoSaveToggle = document.getElementById('autoSaveToggle');
        if (autoSaveToggle) {
            autoSaveToggle.addEventListener('click', () => {
                this.settings.autoSave = !this.settings.autoSave;
                this.saveSettings();
                this.updateUI();
            });
        }

        const notificationsToggle = document.getElementById('notificationsToggle');
        if (notificationsToggle) {
            notificationsToggle.addEventListener('click', () => {
                this.settings.showNotifications = !this.settings.showNotifications;
                this.saveSettings();
                this.updateUI();
            });
        }

        // Listen for messages from content script
        if (chrome.runtime && chrome.runtime.onMessage) {
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                if (request.action === 'highlightsUpdated') {
                    this.highlights = request.highlights || [];
                    this.updateHighlightsList();
                    this.updateHighlightCount();
                }
            });
        }

        // Check for selection changes
        setInterval(() => {
            this.checkSelection();
        }, 500);
    }

    selectColor(color) {
        // Update active color
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('active');
        });
        const selectedOption = document.querySelector(`[data-color="${color}"]`);
        if (selectedOption) {
            selectedOption.classList.add('active');
        }
        
        // Update color indicator on button
        const indicator = document.getElementById('colorIndicator');
        if (indicator) {
            indicator.className = `current-color-indicator color-${color}`;
        }
        
        // Save setting
        this.settings.currentColor = color;
        this.saveSettings();
    }

    async checkSelection() {
        if (!this.currentTab) return;
        
        try {
            if (chrome.scripting) {
                const [result] = await chrome.scripting.executeScript({
                    target: { tabId: this.currentTab.id },
                    function: () => {
                        const selection = window.getSelection();
                        return selection && !selection.isCollapsed && selection.toString().trim().length > 0;
                    }
                });
                
                const hasSelection = result?.result || false;
                const highlightBtn = document.getElementById('highlightBtn');
                if (highlightBtn) {
                    highlightBtn.disabled = !hasSelection;
                }
            }
        } catch (error) {
            // Page might not support script injection or we're in demo mode
            const highlightBtn = document.getElementById('highlightBtn');
            if (highlightBtn) {
                highlightBtn.disabled = false;
            }
        }
    }

    async highlightSelection() {
        if (!this.currentTab) {
            // Demo mode - add a mock highlight
            this.addMockHighlight();
            return;
        }
        
        try {
            const response = await chrome.tabs.sendMessage(this.currentTab.id, {
                action: 'highlightSelectedText',
                color: this.settings.currentColor
            });
            
            if (response && response.success) {
                this.highlights = response.highlights || [];
                this.updateHighlightsList();
                this.updateHighlightCount();
                
                if (this.settings.showNotifications) {
                    this.showNotification('Text highlighted successfully!', 'success');
                }
            }
        } catch (error) {
            console.error('Failed to highlight text:', error);
            // Fallback to demo mode
            this.addMockHighlight();
        }
    }

    addMockHighlight() {
        const mockTexts = [
            "Revolutionary insights that will change how we think about productivity and creativity.",
            "The key to success lies in understanding fundamental principles of human behavior.",
            "This breakthrough discovery opens new possibilities for innovation and growth.",
            "Remember: the most powerful tool for change is consistent action with clear vision.",
            "Innovation happens when we combine existing ideas in unexpected ways.",
            "The future belongs to those who can adapt quickly to changing circumstances."
        ];
        
        const randomText = mockTexts[Math.floor(Math.random() * mockTexts.length)];
        
        const newHighlight = {
            id: Date.now().toString(),
            text: randomText,
            color: this.settings.currentColor,
            timestamp: Date.now(),
            url: this.currentTab?.url || 'demo-page'
        };
        
        this.highlights.push(newHighlight);
        this.updateHighlightsList();
        this.updateHighlightCount();
        
        if (this.settings.showNotifications) {
            this.showNotification('Demo highlight added!', 'success');
        }
    }

    async selectAllHighlights() {
        try {
            const allText = this.highlights.map(h => h.text).join('\n\n');
            
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(allText);
                this.showTemporaryButtonText('selectAllBtn', '✓ Copied!', '📋 Select All');
                
                if (this.settings.showNotifications) {
                    this.showNotification('All highlights copied to clipboard!', 'success');
                }
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = allText;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                this.showTemporaryButtonText('selectAllBtn', '✓ Copied!', '📋 Select All');
            }
        } catch (error) {
            console.error('Failed to copy highlights:', error);
            this.showNotification('Failed to copy highlights', 'error');
        }
    }

    async exportHighlights() {
        if (this.highlights.length === 0) {
            this.showNotification('No highlights to export', 'warning');
            return;
        }
        
        try {
            // Create export data
            const exportData = {
                url: this.currentTab?.url || 'demo-page',
                title: this.currentTab?.title || 'Demo Page',
                timestamp: new Date().toISOString(),
                highlights: this.highlights.map(h => ({
                    text: h.text,
                    color: h.color,
                    timestamp: new Date(h.timestamp).toISOString()
                }))
            };

            // Create text export
            const txtContent = this.createTextExport(exportData);
            this.downloadFile(txtContent, 'text/plain', 'txt');
            
            if (this.settings.showNotifications) {
                this.showNotification('Highlights exported successfully!', 'success');
            }
        } catch (error) {
            console.error('Failed to export highlights:', error);
            this.showNotification('Failed to export highlights', 'error');
        }
    }

    async clearAllHighlights() {
        if (this.highlights.length === 0) {
            this.showNotification('No highlights to clear', 'warning');
            return;
        }
        
        const confirmed = confirm('Clear all highlights? This action cannot be undone.');
        if (!confirmed) return;
        
        try {
            if (this.currentTab && chrome.tabs) {
                await chrome.tabs.sendMessage(this.currentTab.id, {
                    action: 'clearAllHighlights'
                });
            }
            
            this.highlights = [];
            this.updateHighlightsList();
            this.updateHighlightCount();
            
            if (this.settings.showNotifications) {
                this.showNotification('All highlights cleared', 'success');
            }
        } catch (error) {
            console.error('Failed to clear highlights:', error);
            // Clear local highlights anyway
            this.highlights = [];
            this.updateHighlightsList();
            this.updateHighlightCount();
        }
    }

    async jumpToHighlight(highlightId) {
        if (!this.currentTab) return;
        
        try {
            await chrome.tabs.sendMessage(this.currentTab.id, {
                action: 'jumpToHighlight',
                id: highlightId
            });
            
            // Close popup after jumping
            window.close();
        } catch (error) {
            console.error('Failed to jump to highlight:', error);
        }
    }

    async removeHighlight(highlightId) {
        try {
            if (this.currentTab && chrome.tabs) {
                const response = await chrome.tabs.sendMessage(this.currentTab.id, {
                    action: 'removeHighlight',
                    id: highlightId
                });
                
                if (response && response.success) {
                    this.highlights = response.highlights || [];
                }
            } else {
                // Local removal for demo mode
                this.highlights = this.highlights.filter(h => h.id !== highlightId);
            }
            
            this.updateHighlightsList();
            this.updateHighlightCount();
            
            if (this.settings.showNotifications) {
                this.showNotification('Highlight removed', 'success');
            }
        } catch (error) {
            console.error('Failed to remove highlight:', error);
            // Fallback to local removal
            this.highlights = this.highlights.filter(h => h.id !== highlightId);
            this.updateHighlightsList();
            this.updateHighlightCount();
        }
    }

    // UI Update Methods
    updateUI() {
        // Update settings UI
        const autoSaveToggle = document.getElementById('autoSaveToggle');
        if (autoSaveToggle) {
            autoSaveToggle.classList.toggle('active', this.settings.autoSave);
        }

        const notificationsToggle = document.getElementById('notificationsToggle');
        if (notificationsToggle) {
            notificationsToggle.classList.toggle('active', this.settings.showNotifications);
        }
        
        // Update color selection
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('active');
        });
        const selectedOption = document.querySelector(`[data-color="${this.settings.currentColor}"]`);
        if (selectedOption) {
            selectedOption.classList.add('active');
        }

        // Update color indicator
        const indicator = document.getElementById('colorIndicator');
        if (indicator) {
            indicator.className = `current-color-indicator color-${this.settings.currentColor}`;
        }
        
        // Update button states
        this.updateButtonStates();
    }

    updateButtonStates() {
        const hasHighlights = this.highlights.length > 0;
        
        const selectAllBtn = document.getElementById('selectAllBtn');
        if (selectAllBtn) selectAllBtn.disabled = !hasHighlights;
        
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) exportBtn.disabled = !hasHighlights;
        
        const clearAllBtn = document.getElementById('clearAllBtn');
        if (clearAllBtn) clearAllBtn.disabled = !hasHighlights;
    }

    updateHighlightCount() {
        const countElement = document.getElementById('highlightCount');
        if (countElement) {
            countElement.textContent = this.highlights.length;
        }
        this.updateButtonStates();
    }

    updateHighlightsList() {
        const container = document.getElementById('highlightsList');
        const emptyState = document.getElementById('emptyState');
        
        if (!container) return;
        
        if (this.highlights.length === 0) {
            if (emptyState) emptyState.style.display = 'flex';
            container.innerHTML = '';
            return;
        }
        
        if (emptyState) emptyState.style.display = 'none';
        
        container.innerHTML = this.highlights.map((highlight, index) => {
            const previewText = highlight.text.length > 150 
                ? highlight.text.substring(0, 150) + '...' 
                : highlight.text;
            
            const timeString = new Date(highlight.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            return `
                <div class="highlight-item color-${highlight.color}" style="animation-delay: ${index * 0.05}s">
                    <div class="highlight-text">${previewText}</div>
                    <div class="highlight-meta">
                        <span>${timeString}</span>
                        <div class="highlight-actions">
                            <button class="action-icon" onclick="window.lumoraPopup.editHighlight('${highlight.id}')" title="Edit">✏️</button>
                            <button class="action-icon" onclick="window.lumoraPopup.removeHighlight('${highlight.id}')" title="Delete">🗑️</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    editHighlight(highlightId) {
        const highlight = this.highlights.find(h => h.id === highlightId);
        if (!highlight) return;
        
        const newText = prompt('Edit highlight:', highlight.text);
        if (newText && newText.trim()) {
            highlight.text = newText.trim();
            this.updateHighlightsList();
            
            if (this.settings.showNotifications) {
                this.showNotification('Highlight updated', 'success');
            }
        }
    }

    toggleSettings() {
        const settingsContent = document.getElementById('settingsContent');
        if (settingsContent) {
            settingsContent.classList.toggle('open');
        }
    }

    showNotification(message, type = 'info') {
        // Create a simple notification system
        const existing = document.querySelector('.lumora-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = 'lumora-notification';
        
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        
        notification.style.cssText = `
            position: fixed;
            top: 70px;
            left: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 10px 15px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            z-index: 10000;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease-out;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showTemporaryButtonText(buttonId, tempText, originalText) {
        const button = document.getElementById(buttonId);
        if (!button) return;
        
        button.innerHTML = `<span>${tempText.split(' ')[0]}</span>${tempText.split(' ').slice(1).join(' ')}`;
        setTimeout(() => {
            button.innerHTML = `<span>${originalText.split(' ')[0]}</span>${originalText.split(' ').slice(1).join(' ')}`;
        }, 2000);
    }

    // Export utility methods
    createTextExport(exportData) {
        let content = `LUMORA HIGHLIGHTS EXPORT\n`;
        content += `=========================\n\n`;
        content += `Website: ${exportData.url}\n`;
        content += `Page Title: ${exportData.title}\n`;
        content += `Exported: ${new Date(exportData.timestamp).toLocaleString()}\n`;
        content += `Total Highlights: ${exportData.highlights.length}\n\n`;
        
        exportData.highlights.forEach((highlight, index) => {
            content += `--- Highlight ${index + 1} ---\n`;
            content += `Text: "${highlight.text}"\n`;
            content += `Color: ${highlight.color}\n`;
            content += `Date: ${highlight.timestamp}\n\n`;
        });
        
        return content;
    }

    downloadFile(content, mimeType, extension) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        
        let filename = 'lumora-highlights';
        if (this.currentTab?.url) {
            try {
                const hostname = new URL(this.currentTab.url).hostname;
                filename += `-${hostname}`;
            } catch (e) {
                // Invalid URL, use default
            }
        }
        filename += `-${new Date().toISOString().split('T')[0]}.${extension}`;
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.lumoraPopup = new LumoraPopup();
});

// Also make functions globally available for onclick handlers
window.editHighlight = function(id) {
    if (window.lumoraPopup) {
        window.lumoraPopup.editHighlight(id);
    }
};

window.deleteHighlight = function(id) {
    if (window.lumoraPopup) {
        window.lumoraPopup.removeHighlight(id);
    }
};