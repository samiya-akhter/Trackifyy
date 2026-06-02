# Trackifyy 🚀 — Codeforces Practice Time Tracker

**Trackifyy** is a modern, cyber-neon themed Chrome extension designed specifically for competitive programmers on **Codeforces**. It helps you stay disciplined and track your practice hours by automatically logging the time you spend solving problems on Codeforces, alongside a dedicated problem stopwatch to time your runs and check your speed.

---

## ✨ Features

### 1. 🕒 Automatic Active Time Tracker
* **Passive Monitoring**: Keeps track of the time you spend on active Codeforces tabs automatically.
* **Cyberpunk Digital UI**: Displays today's total practice time in a clean, high-visibility digital clock interface.
* **Daily Statistics**: Shows your maximum daily practice record and keeps track of your consecutive practice streak (🔥).
* **7-Day History Chart**: A beautiful, built-in bar chart visualization highlighting your practice trends over the last week.

### 2. ⏱️ Stopwatch & Lap Tracker
* **Interactive Stopwatch**: Perfect for timing individual problem-solving sessions or simulated contests.
* **Controls**: Seamlessly Start, Pause, and Reset.
* **Lap Tracking**: Record splits to compare your times across multiple problems or checkpoints.
* **Lap Logs**: View a scrollable list of recorded laps directly inside the extension.

### 3. 🎨 Neon Aesthetic Design
* Modern dark mode interface styled with premium HSL glow colors, neon borders, and clean typography.
* Smooth micro-interactions, custom animations, and tab transitions between the Tracker and Stopwatch.

---

## 📂 Project Structure

```text
Trackifyy/
├── Trackifyy/            # Extension source files folder
│   ├── manifest.json     # Chrome Extension Manifest (V3)
│   ├── background.js     # Service worker managing state, tracking active tabs, and timers
│   ├── content.js        # Light scripts interacting with Codeforces pages
│   ├── popup.html        # Primary UI structure (Tracker dashboard and Stopwatch)
│   ├── popup.css         # Cyber-neon styling, layout system, and animations
│   ├── popup.js          # UI logic, chart rendering, stopwatch controls, and state management
│   ├── logo.png          # Extension logo
│   ├── icon16.png        # Extension icons (various sizes)
│   ├── icon32.png            
│   ├── icon48.png            
│   └── icon128.png           
├── .gitignore            # Excludes temporary and editor files
└── LICENSE               # MIT License
```

---

## 🛠️ Installation Instructions

Follow these simple steps to load **Trackifyy** into your Google Chrome browser:

1. **Download / Clone the Repository**
   Download this repository as a ZIP file and extract it, or clone it locally:
   ```bash
   git clone https://github.com/samiya-akhter/Trackifyy.git
   ```

2. **Open Chrome Extensions Page**
   Open Google Chrome and navigate to `chrome://extensions/` (or click the three-dot menu -> **Extensions** -> **Manage Extensions**).

3. **Enable Developer Mode**
   In the top-right corner of the Extensions page, toggle the **Developer mode** switch to **ON**.

4. **Load Unpacked Extension**
   * Click the **Load unpacked** button in the top-left corner.
   * Select the `Trackifyy` subfolder inside the cloned repository folder (the one containing `manifest.json`).

5. **Pin Trackifyy**
   Click the puzzle icon (Extensions) in your Chrome toolbar and pin **Trackifyy** for easy access!

---

## ⚙️ Configuration & Technologies

* **Manifest Version**: 3
* **Permissions**: `storage`, `tabs`
* **Host Permissions**: `*://codeforces.com/*`, `*://*.codeforces.com/*`
* **Core Stack**: HTML5, Vanilla CSS3 (Custom variables, neon styling, Flexbox/Grid), Vanilla JavaScript (ES6+).
* **Storage API**: Uses `chrome.storage.local` to securely store your daily practice statistics, streak data, and 7-day history persistence.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

*Made with 💙 for competitive programmers by [@pandame](https://github.com/pandame).*
