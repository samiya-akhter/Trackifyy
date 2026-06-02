# Trackifyy 🚀 — Codeforces Practice Time Tracker

<p align="center">
  <img src="Trackifyy/logo.png" alt="Trackifyy Logo" width="128" height="128" />
</p>

<p align="center">
  <strong>A modern, cyber-neon themed Chrome extension designed specifically for competitive programmers on Codeforces.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-blueviolet?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Chrome Extension Manifest V3" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License MIT" />
  <img src="https://img.shields.io/badge/Theme-Cyber%20Neon-ff007f?style=for-the-badge" alt="Theme Cyber Neon" />
</p>

---

## 🌟 Overview

**Trackifyy** helps you stay disciplined and track your practice hours by automatically logging the time you spend actively solving problems on **Codeforces**. It features an elegant neon-themed dashboard, a built-in 7-day history chart, streak tracking, and an interactive stopwatch with lap support to time your runs and check your problem-solving speed.

---

## ✨ Features

### 1. 🕒 Automatic Active Time Tracker
* **Smart Tab Monitoring**: Automatically tracks and counts only the seconds spent on active, focused Codeforces tabs.
* **Cyberpunk Digital UI**: Displays today's total practice time in a glowing, high-visibility digital clock interface.
* **Daily Statistics & Streaks**: Automatically tracks your consecutive days of practice (🔥) and displays your all-time daily peak practice record.
* **7-Day History Chart**: A beautiful, custom-built CSS-based bar chart visualizing your practice time trends over the last week.

### 2. ⏱️ Stopwatch & Lap Tracker
* **Targeted Timing**: Run the stopwatch to track exact duration for a single problem or simulated contest setup.
* **Responsive Controls**: Start, Pause, and Reset with smooth glow-button interactions.
* **Lap Logs**: Record laps to track splits between different steps of problem-solving (e.g., understanding, coding, debugging).
* **Scrollable Lap History**: Easily review your recorded lap logs in a sleek list directly within the popup interface.

### 3. 🎨 Neon Aesthetic Design
* **Glassmorphism & Glow**: Built with HSL color-tailored glows, semi-transparent panels, and smooth drop-shadow animations.
* **Transitions**: Fluid animations for switching between the Tracker and Stopwatch screens.
* **Micro-interactions**: Hover effects, responsive buttons, and visual state feedback for an extremely premium developer feel.

---

## 📂 Repository Structure

The project has a clear and modular layout:

```text
cf-time-tracker/
├── Trackifyy/                  # Chrome Extension source files
│   ├── manifest.json           # Chrome Extension Manifest (V3)
│   ├── background.js           # Background service worker (monitors tabs, manages tracking state)
│   ├── content.js              # Content script injecting presence tracking on Codeforces pages
│   ├── popup.html              # Core HTML structure (Dashboard & Stopwatch panels)
│   ├── popup.css               # Styling system (cyber-neon colors, custom variables, and animations)
│   ├── popup.js                # Core UI logic (chart rendering, stopwatch controls, and state management)
│   ├── logo.png                # Main logo (128x128)
│   ├── icon16.png              # Standard extension icons (different resolution assets)
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── .gitignore                  # Excludes editor files and OS cache
├── LICENSE                     # MIT License
└── README.md                   # Project documentation
```

---

## 🛠️ Installation Instructions

To install **Trackifyy** locally on Google Chrome:

1. **Clone the Repository**
   ```bash
   git clone https://github.com/samiya-akhter/Trackifyy.git
   ```

2. **Open Chrome Extensions Page**
   * Open your Chrome browser and navigate to: `chrome://extensions/`
   * Alternatively, click the Chrome menu (three dots) -> **Extensions** -> **Manage Extensions**.

3. **Enable Developer Mode**
   * Toggle the **Developer mode** switch in the top-right corner to **ON**.

4. **Load Unpacked Extension**
   * Click the **Load unpacked** button in the top-left corner.
   * Select the **`Trackifyy`** subfolder inside the cloned repository directory (the folder containing `manifest.json`).

5. **Pin the Extension**
   * Click the puzzle icon (Extensions) in your Chrome toolbar.
   * Click the pin icon next to **Trackifyy** to keep it active and accessible!

---

## ⚙️ Technical Architecture

* **Service Worker (`background.js`)**: Runs in the background, listening to Chrome tab events. It evaluates active tab URLs against Codeforces patterns and updates local storage records periodically.
* **Content Script (`content.js`)**: Injected into Codeforces tabs to report user activity state and heartbeat status to the service worker.
* **Storage (`chrome.storage.local`)**: Persistently saves:
  * Daily accumulated practice seconds.
  * History data for the last 7 days.
  * Streak records (consecutive days of practice) and peak records.
  * Stopwatch lap histories.
* **UI styling (`popup.css`)**: Implemented from scratch using Vanilla CSS CSS-Variables, flexbox, and transitions. Completely responsive layout utilizing modern HSL colors for cyber-neon glowing borders and button triggers.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <em>Made with 💙 for competitive programmers by <a href="https://github.com/samiya-akhter">@samiya-akhter</a> and contributors.</em>
</p>
