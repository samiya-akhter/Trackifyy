let tickInterval = null;

function sendTick() {
    if (document.visibilityState === "visible") {
        chrome.runtime.sendMessage({ action: "tick" }, () => {
            // Suppress connection errors if the service worker is temporarily unavailable or restarting
            if (chrome.runtime.lastError) {
                // Silent
            }
        });
    }
}

function startTicking() {
    if (!tickInterval) {
        sendTick();
        tickInterval = setInterval(sendTick, 1000);
    }
}

function stopTicking() {
    if (tickInterval) {
        clearInterval(tickInterval);
        tickInterval = null;
    }
}

// Check visibility state on load
if (document.visibilityState === "visible") {
    startTicking();
}

// Manage tracking on tab visibility change
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
        startTicking();
    } else {
        stopTicking();
    }
});
