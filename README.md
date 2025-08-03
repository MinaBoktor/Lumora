# Lumora - Intelligent Text Highlighter

Illuminate your reading with beautiful, intelligent text highlighting.

## Features

### ✨ Core Functionality
- **Smart Text Highlighting**: Select any text on any webpage and illuminate it with beautiful colors
- **Multiple Color Options**: Choose from 6 carefully designed color themes (Sunshine Yellow, Forest Green, Ocean Blue, Rose Pink, Sunset Orange, Mystic Purple)
- **Persistent Storage**: All your illuminations are automatically saved and restored when you revisit pages
- **Visual Feedback**: Clear visual indicators for highlighted text with hover effects

### 🎯 Selection Management
- **Select/Deselect Individual Highlights**: Right-click on highlighted text to select or deselect specific illuminations
- **Bulk Selection**: Select or deselect all illuminations on a page at once
- **Visual Selection Indicators**: Selected highlights show a blue outline with a checkmark

### 💾 Export & Backup
- **Multiple Export Formats**: Export your illuminations as JSON or plain text files
- **Local Backup**: Automatic backup to browser's local storage and IndexedDB for data safety
- **Copy to Clipboard**: Quickly copy all highlighted text to clipboard

### 🖱️ Right-Click Context Menu
- ✨ Illuminate Selection
- 🎯 Select This Illumination
- 🚫 Deselect This Illumination
- ❌ Remove This Illumination
- 📋 Copy Illumination
- 🎯 Select All Illuminations
- 🚫 Deselect All Illuminations
- 🧹 Clear All Illuminations
- 💾 Export All Illuminations

### ⌨️ Keyboard Shortcuts
- `Ctrl+Shift+H`: Highlight selected text
- `Ctrl+Shift+C`: Clear all highlights (with confirmation)
- `Ctrl+Click`: Quick remove highlight

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The Lumora extension will appear in your browser toolbar

## Usage

### Basic Highlighting
1. Select any text on a webpage
2. Click the Lumora icon in the toolbar and choose "Illuminate Selection"
3. Or right-click and select "✨ Illuminate Selection"
4. Your text is now beautifully highlighted!

### Managing Highlights
- **Change Colors**: Click the Lumora icon and select a different color before highlighting
- **View All Highlights**: The popup shows all your illuminations for the current page
- **Jump to Highlight**: Click the 🔍 icon next to any highlight in the popup
- **Remove Highlights**: Use the 🗑️ icon in the popup or right-click menu

### Selection Features
- Right-click on any highlighted text to select it (adds blue outline)
- Use "Select All" to select all highlights on the page
- Selected highlights can be managed as a group

### Export Options
1. Click the "Export" button in the popup
2. Choose between JSON (structured data) or TXT (readable format)
3. File will be automatically downloaded

## Technical Features

### Performance Optimizations
- **Flicker-Free Interface**: Removed all unnecessary animations and transforms
- **Efficient Storage**: Uses Chrome's storage API with local backup fallbacks
- **Memory Management**: Automatic cleanup of old highlights (30+ days)
- **Error Handling**: Graceful fallbacks for all operations

### Data Safety
- **Triple Backup**: Chrome storage + localStorage + IndexedDB
- **Automatic Recovery**: Restores from backup if primary storage fails
- **Export Options**: Manual export for external backup

### Browser Compatibility
- Chrome Manifest V3 compliant
- Works on all websites (except chrome:// pages)
- Responsive design for different screen sizes

## Privacy

Lumora respects your privacy:
- All data is stored locally in your browser
- No data is sent to external servers
- No tracking or analytics
- Open source and transparent

## Troubleshooting

### Highlights Not Appearing
- Refresh the page and try again
- Check if the website blocks content scripts
- Ensure the extension is enabled

### Storage Issues
- Extension automatically uses backup storage if Chrome storage fails
- Export your highlights regularly for safety
- Clear browser data may remove highlights

### Performance Issues
- Extension is optimized to prevent flickering
- If you experience issues, try disabling other extensions temporarily

## Development

### File Structure
```
lumora-extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for context menus
├── content.js            # Main highlighting functionality
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── popup.css             # Popup styling
├── styles.css            # Content script styles
└── README.md             # This file
```

### Key Components
- **Content Script**: Handles text highlighting and DOM manipulation
- **Background Script**: Manages context menus and cross-tab communication
- **Popup**: User interface for color selection and highlight management
- **Storage System**: Multi-layer backup system for data persistence

## Version History

### v2.0 (Current)
- Rebranded to Lumora
- Fixed flickering issues
- Added selection/deselection features
- Improved export functionality
- Enhanced local backup system
- Updated color theme and design
- Added comprehensive context menu options

### v1.0
- Initial release as Modern Text Highlighter
- Basic highlighting functionality
- Color selection
- Simple export

## License

This project is open source. Feel free to modify and distribute according to your needs.

## Support

For issues or feature requests, please check the troubleshooting section above or review the code for customization options.

