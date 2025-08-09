# Lumora: Illuminate Your Web with Intelligent Highlighting

## ✨ Transform Your Reading Experience

Lumora is a minimalist yet powerful Chrome extension designed to revolutionize how you interact with web content. Say goodbye to scattered notes and forgotten insights. With Lumora, you can effortlessly capture the brilliance of what you read, preserving key information directly on the webpage, organized by site, and elegantly marked for quick reference. It's more than just a highlighter; it's your personal knowledge curator for the web.

## 🚀 Key Features That Will Amaze You

Lumora is packed with intuitive features engineered for a seamless and productive highlighting experience. We've meticulously crafted every aspect to ensure your focus remains on the content, while Lumora handles the organization and retrieval.

### 🎨 Core Highlighting & Customization

*   **Smart Text Highlighting**: Effortlessly select any text on any webpage and illuminate it with vibrant, beautiful colors. Lumora intelligently handles complex DOM structures, ensuring your highlights are precise and persistent.
*   **Multiple Color Options**: Personalize your highlighting with a palette of 6 carefully designed, aesthetically pleasing color themes:
    *   **Sunshine Yellow**: Bright and energetic, perfect for primary insights.
    *   **Forest Green**: Calm and focused, ideal for supporting details.
    *   **Ocean Blue**: Deep and clear, great for analytical points.
    *   **Rose Pink**: Gentle and distinct, for nuanced observations.
    *   **Sunset Orange**: Warm and inviting, for important takeaways.
    *   **Mystic Purple**: Rich and sophisticated, for profound discoveries.
*   **Persistent Storage**: Never lose an insight again. All your illuminations are automatically saved and seamlessly restored when you revisit pages, even after closing your browser or restarting your computer. Lumora ensures your knowledge is always where you left it.
*   **Visual Feedback**: Enjoy clear, unobtrusive visual indicators for highlighted text, complete with subtle hover effects that enhance usability without distracting from your reading.

### 🎯 Advanced Selection & Management

Lumora goes beyond basic highlighting, offering sophisticated tools to manage your illuminated text with unparalleled control.

*   **Select/Deselect Individual Highlights**: Gain granular control by right-clicking on highlighted text to precisely select or deselect specific illuminations. This is perfect for refining your focus or preparing specific sections for export.
*   **Bulk Selection**: Need to manage multiple highlights at once? Lumora allows you to select or deselect all illuminations on a page with a single action, streamlining your workflow for large documents or research.
*   **Visual Selection Indicators**: Selected highlights are clearly marked with a distinctive blue outline and a checkmark, providing immediate visual confirmation of your active selections.

### 💾 Robust Export & Data Safety

Your highlighted knowledge is valuable, and Lumora treats it as such. We provide multiple options for export and ensure your data is always safe and accessible.

*   **Multiple Export Formats**: Export your valuable illuminations in formats that suit your needs:
    *   **JSON (Structured Data)**: Ideal for developers, researchers, or anyone needing to programmatically process their highlights. This format preserves all metadata, including color, timestamp, and URL.
    *   **Plain Text (Readable Format)**: Perfect for quick notes, sharing, or integrating into other documents. This format provides a clean, human-readable summary of your highlighted content.
*   **Local Backup**: Lumora employs a multi-layered, automatic backup system to ensure the utmost data safety. Your highlights are securely stored in your browser's local storage and IndexedDB, providing redundancy and peace of mind.
*   **Copy to Clipboard**: Instantly copy all highlighted text from the current page to your clipboard with a single click, making it incredibly easy to paste into notes, emails, or documents.

### 🖱️ Intuitive Right-Click Context Menu

Access Lumora's powerful features directly from your browser's context menu, making your workflow incredibly efficient.

*   **✨ Illuminate Selection**: The fastest way to highlight selected text.
*   **🎯 Select This Illumination**: Mark a specific highlight for further action.
*   **🚫 Deselect This Illumination**: Unmark a previously selected highlight.
*   **❌ Remove This Illumination**: Delete a single highlight.
*   **📋 Copy Illumination**: Copy the text of a specific highlight.
*   **🎯 Select All Illuminations**: Select all highlights on the current page.
*   **🚫 Deselect All Illuminations**: Deselect all highlights on the current page.
*   **🧹 Clear All Illuminations**: Remove all highlights from the current page (with confirmation).
*   **💾 Export All Illuminations**: Trigger the export process directly.

### ⌨️ Efficiency-Boosting Keyboard Shortcuts

For power users who prefer keyboard navigation, Lumora offers convenient shortcuts to speed up your highlighting process.

*   `Ctrl+Shift+H`: Quickly highlight selected text.
*   `Ctrl+Shift+C`: Clear all highlights from the current page (requires confirmation to prevent accidental data loss).
*   `Ctrl+Click`: A rapid way to remove an existing highlight.

## ⚙️ Under the Hood: Technical Excellence

Lumora isn't just feature-rich; it's built with performance, reliability, and privacy at its core.

### Performance Optimizations

*   **Flicker-Free Interface**: Experience a smooth, uninterrupted reading flow. Lumora has been meticulously optimized to eliminate unnecessary animations and transforms, ensuring a seamless highlighting experience.
*   **Efficient Storage**: Leveraging Chrome's native storage API, Lumora ensures your data is stored efficiently, with robust local backup fallbacks for added security.
*   **Memory Management**: Lumora intelligently manages memory, including automatic cleanup of older highlights (30+ days) to maintain optimal browser performance.
*   **Error Handling**: Built with resilience, Lumora incorporates graceful fallbacks for all operations, ensuring a stable and reliable experience even in unexpected scenarios.

### Data Safety & Privacy: Your Information, Your Control

We believe your data is yours. Lumora is designed with a strong commitment to privacy and data security.

*   **Triple Backup System**: Your highlights are protected by a robust triple backup system: Chrome storage, localStorage, and IndexedDB. This redundancy ensures your data is safe even if one storage mechanism encounters an issue.
*   **Automatic Recovery**: In the rare event of primary storage failure, Lumora is engineered to automatically restore your highlights from its backup mechanisms, minimizing data loss.
*   **Export Options**: Beyond automatic backups, the comprehensive export options provide you with the ultimate control, allowing you to create external backups of your valuable insights at any time.
*   **Local-Only Data**: Lumora respects your privacy. All your highlighting data is stored exclusively within your browser. **No data is ever sent to external servers, and there is no tracking or analytics whatsoever.**
*   **Open Source & Transparent**: Lumora's codebase is open source, allowing for full transparency and community scrutiny. You can inspect the code yourself to verify its privacy practices.

### Browser Compatibility

*   **Chrome Manifest V3 Compliant**: Lumora is built to the latest Chrome extension standards, ensuring future compatibility and security.
*   **Universal Web Compatibility**: Works seamlessly on virtually all websites, providing a consistent experience across your browsing journey (excluding `chrome://` pages due to browser security restrictions).
*   **Responsive Design**: The extension's popup interface is designed to be responsive, adapting gracefully to different screen sizes for an optimal user experience.

## 🛠️ Installation

Getting started with Lumora is quick and easy:

1.  **Download or Clone**: Obtain the Lumora repository by either downloading the ZIP file or cloning it via Git:
    ```bash
    git clone https://github.com/MinaBoktor/Lumora.git
    ```
2.  **Open Chrome Extensions**: Navigate to `chrome://extensions/` in your Chrome browser.
3.  **Enable Developer Mode**: In the top right corner of the extensions page, toggle on "Developer mode."
4.  **Load Unpacked**: Click the "Load unpacked" button and select the `Lumora` folder you downloaded or cloned.
5.  **Pin to Toolbar**: The Lumora extension will now appear in your browser toolbar. For easy access, click the puzzle piece icon in your toolbar and pin Lumora.

## 📖 Usage Guide

Lumora is designed to be intuitive, but here's a quick guide to get you started:

### Basic Highlighting

1.  **Select Text**: On any webpage, simply select the text you wish to highlight.
2.  **Illuminate**: You have two primary ways to illuminate:
    *   **Toolbar Icon**: Click the Lumora icon in your browser toolbar and choose "Illuminate Selection."
    *   **Right-Click Context Menu**: Right-click on the selected text and choose "✨ Illuminate Selection."
3.  **Voila!**: Your text is now beautifully highlighted and persistently saved.

### Managing Highlights

*   **Change Colors**: Before highlighting new text, click the Lumora icon in the toolbar and select a different color from the palette. Your next highlight will use the newly chosen color.
*   **View All Highlights**: Click the Lumora icon to open the popup. The popup displays a list of all your illuminations for the current page, organized for easy review.
*   **Jump to Highlight**: In the popup, click the 🔗 (link) icon next to any highlight. Lumora will automatically scroll the webpage to bring that highlight into view and briefly flash it for easy identification.
*   **Remove Highlights**: Use the 🗑️ (trash) icon in the popup next to a specific highlight, or right-click on a highlighted section on the page and select "❌ Remove This Illumination."

### Advanced Selection Features

*   **Individual Selection**: Right-click on any highlighted text on the page and select "🎯 Select This Illumination" to mark it with a blue outline and checkmark. This is useful for isolating specific highlights.
*   **Select All**: In the right-click context menu, choose "🎯 Select All Illuminations" to select every highlight on the current page. This allows for group management.
*   **Group Management**: Once highlights are selected, you can perform actions on them as a group (though current version focuses on individual removal and export of all).

### Exporting Your Insights

1.  **Open Popup**: Click the Lumora icon in your toolbar.
2.  **Click Export**: Locate and click the "Export" button in the popup.
3.  **Choose Format**: Select your preferred export format: JSON for structured data or TXT for a readable plain text file.
4.  **Download**: The file containing all your highlights for the current page will be automatically downloaded to your computer.

## 🧑‍💻 Development & Contribution

Lumora is an open-source project, and contributions are welcome! Here's a brief overview for developers.

### File Structure

```
lumora-extension/
├── manifest.json          # Extension configuration and permissions
├── background.js          # Service worker for context menus, background tasks, and inter-script communication
├── content.js             # Main script for text highlighting, DOM manipulation, and highlight restoration
├── popup.html             # The HTML structure for the extension's popup interface
├── popup.js               # JavaScript for popup functionality, UI interactions, and communication with content/background scripts
├── popup.css              # Styling for the extension's popup
├── styles.css             # CSS for the highlighted text on webpages
├── icons/                 # Directory containing extension icons (16x16, 48x48, 128x128)
├── image.png              # Example image (likely for README or internal use)
├── logo.png               # Lumora logo (light theme)
├── logo_dark.png          # Lumora logo (dark theme)
└── README.md              # This documentation file
```

### Key Components Explained

*   **Content Script (`content.js`)**: This is the workhorse of Lumora, injected directly into every webpage you visit. It's responsible for:
    *   Detecting text selections.
    *   Applying the visual highlighting styles.
    *   Managing the persistence and restoration of highlights on the page.
    *   Handling interactions with highlighted text (e.g., removing individual highlights).
    *   Communicating with the popup and background scripts.
*   **Background Script (`background.js`)**: Running in the background, this service worker handles:
    *   Creating and managing the right-click context menu options.
    *   Listening for extension installation events.
    *   Setting default user preferences.
    *   Facilitating communication between the content script and the popup, especially for updates to the highlight list.
*   **Popup (`popup.html`, `popup.js`, `popup.css`)**: This is the user interface that appears when you click the Lumora icon in your toolbar. It allows you to:
    *   Select your preferred highlighting color.
    *   View a list of all highlights on the current page.
    *   Jump to specific highlights on the page.
    *   Remove individual highlights.
    *   Clear all highlights from the page.
    *   Export your highlights.
    *   Access basic settings like auto-save and notifications.
*   **Storage System**: Lumora utilizes Chrome's `chrome.storage.local` API for primary data persistence, complemented by `localStorage` and `IndexedDB` for robust, multi-layered local backups. This ensures your data is always safe and recoverable.

## 📜 Version History

### v2.0 (Current - Rebranded as Lumora)

This major update brought significant enhancements and a new identity:

*   **Rebranding**: Renamed from "Modern Text Highlighter" to "Lumora."
*   **Flicker-Free Experience**: Addressed and fixed all known flickering issues for a smoother user experience.
*   **Advanced Selection**: Introduced sophisticated selection and deselection features for individual and bulk highlight management.
*   **Improved Export**: Enhanced export functionality, offering both JSON and plain text formats with comprehensive data.
*   **Enhanced Local Backup**: Strengthened the multi-layered local backup system for superior data safety.
*   **Refined Design**: Updated color themes and overall design for a more modern and intuitive interface.
*   **Comprehensive Context Menu**: Expanded right-click context menu options for quick access to all key functionalities.

### v1.0 (Initial Release - Modern Text Highlighter)

*   **Basic Highlighting**: Core functionality for text highlighting.
*   **Color Selection**: Limited color options.
*   **Simple Export**: Basic export capabilities.

## ❓ Troubleshooting

Encountering an issue? Here are some common solutions:

### Highlights Not Appearing

*   **Refresh the Page**: Sometimes a simple page refresh can resolve the issue.
*   **Website Restrictions**: Certain websites might employ Content Security Policies (CSPs) that block extension scripts. Lumora may not function on such pages.
*   **Extension Enabled**: Ensure the Lumora extension is enabled in `chrome://extensions/`.

### Storage Issues

*   **Automatic Backup**: Lumora automatically uses its backup storage if Chrome's primary storage encounters issues.
*   **Regular Export**: For critical data, regularly use the export feature to create external backups.
*   **Browser Data**: Clearing your browser's data (cache, cookies, local storage) may remove your highlights. Be cautious when performing such actions.

### Performance Issues

*   **Optimization**: Lumora is highly optimized to prevent performance degradation and flickering.
*   **Other Extensions**: If you experience slowness, try temporarily disabling other Chrome extensions to check for conflicts.

## 🤝 Support & Contribution

For any issues, feature requests, or contributions, please refer to the GitHub repository. As an open-source project, community involvement is highly valued.

## 📄 License

This project is open source. Feel free to modify and distribute according to your needs.

## 🌐 About

Lumora is a minimalist Chrome extension designed to help you capture the brilliance of what you read. With a simple highlight, it preserves the insights that matter most — keeping them organized by website, and elegantly marked for quick reference.

## 🚀 Releases

Stay tuned for official releases on the GitHub Releases page.

## 📦 Packages

No packages are currently published.

## 💻 Languages

Lumora is primarily built with:

*   **JavaScript** (59.7%)
*   **HTML** (30.9%)
*   **CSS** (9.4%)
