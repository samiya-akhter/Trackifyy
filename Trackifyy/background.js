let currentSessionStart = null;
let lastTickTime = null;
let lastSavedTickTime = null;
let isInitialized = false;
let checkInterval = null;

console.log("[Trackifyy] Background script loaded.");

// Run migration check on installation or startup
chrome.runtime.onInstalled.addListener(() => {
    console.log("[Trackifyy] Extension installed.");
    enqueueStorageOperation((resolve) => {
        runMigration(resolve);
    });
});
chrome.runtime.onStartup.addListener(() => {
    console.log("[Trackifyy] Browser started.");
    enqueueStorageOperation((resolve) => {
        runMigration(resolve);
    });
});

// Enqueue storage operations to avoid race conditions
let storageQueue = Promise.resolve();

function enqueueStorageOperation(operationFn) {
    storageQueue = storageQueue.then(() => {
        return new Promise((resolve) => {
            operationFn(resolve);
        });
    }).catch((err) => {
        console.error("[Trackifyy] Error in storage queue:", err);
    });
    return storageQueue;
}

function runMigration(resolve) {
    chrome.storage.local.get(["totalTime", "dailyStats"], (data) => {
        const total = data.totalTime || 0;
        let daily = data.dailyStats || {};
        console.log("[Trackifyy] Migration check. totalTime:", total, "dailyStats keys:", Object.keys(daily));
        if (total > 0 && Object.keys(daily).length === 0) {
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const yYear = yesterday.getFullYear();
            const yMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
            const yDay = String(yesterday.getDate()).padStart(2, '0');
            const yesterdayStr = `${yYear}-${yMonth}-${yDay}`;
            
            daily[yesterdayStr] = total;
            chrome.storage.local.set({ dailyStats: daily }, () => {
                console.log("[Trackifyy] Legacy data migrated to yesterday:", yesterdayStr, "seconds:", total);
                resolve();
            });
        } else {
            resolve();
        }
    });
}

// Initialize session state from storage and recover any crashed sessions
enqueueStorageOperation((resolve) => {
    chrome.storage.local.get(["sessionStartTime", "lastTickTime", "dailyStats", "totalTime"], (data) => {
        const storedStart = data.sessionStartTime || null;
        const storedLastTick = data.lastTickTime || null;
        let daily = data.dailyStats || {};
        let total = data.totalTime || 0;

        console.log("[Trackifyy] Initializing. Stored sessionStartTime:", storedStart, "lastTickTime:", storedLastTick);

        if (storedStart && storedLastTick) {
            const elapsed = Math.floor((storedLastTick - storedStart) / 1000);
            if (elapsed > 0) {
                console.log("[Trackifyy] Recovering crashed/interrupted session. Elapsed seconds:", elapsed);
                total += elapsed;
                
                // Split segments by midnight
                let current = storedStart;
                const now = storedLastTick;
                while (current < now) {
                    const currentDateObj = new Date(current);
                    const nextDateObj = new Date(currentDateObj.getFullYear(), currentDateObj.getMonth(), currentDateObj.getDate() + 1);
                    const nextMidnight = nextDateObj.getTime();

                    const endOfSegment = Math.min(nextMidnight, now);
                    const segmentSeconds = Math.floor((endOfSegment - current) / 1000);

                    if (segmentSeconds > 0) {
                        const year = currentDateObj.getFullYear();
                        const month = String(currentDateObj.getMonth() + 1).padStart(2, '0');
                        const day = String(currentDateObj.getDate()).padStart(2, '0');
                        const dateStr = `${year}-${month}-${day}`;

                        daily[dateStr] = (daily[dateStr] || 0) + segmentSeconds;
                    }
                    current = nextMidnight;
                }
            }
        }

        // Clear session tracking variables on start
        chrome.storage.local.set({
            sessionStartTime: null,
            lastTickTime: null,
            dailyStats: daily,
            totalTime: total
        }, () => {
            currentSessionStart = null;
            lastTickTime = null;
            lastSavedTickTime = null;
            isInitialized = true;
            console.log("[Trackifyy] Initialization completed. Session state reset.");
            startCheckTimer();
            resolve();
        });
    });
});

// Listener for heartbeat ticks from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "tick") {
        handleTick();
        sendResponse({ ack: true });
    }
});

function handleTick() {
    if (!isInitialized) return;

    const now = Date.now();
    lastTickTime = now;

    if (currentSessionStart === null) {
        // Start new tracking session
        currentSessionStart = now;
        lastSavedTickTime = now;
        console.log("[Trackifyy] Starting session at:", currentSessionStart);
        enqueueStorageOperation((resolve) => {
            chrome.storage.local.set({
                sessionStartTime: currentSessionStart,
                lastTickTime: currentSessionStart
            }, () => {
                resolve();
            });
        });
    } else {
        // Periodically write lastTickTime to storage every 5 seconds (to support crash/shutdown recovery)
        if (now - lastSavedTickTime >= 5000) {
            lastSavedTickTime = now;
            enqueueStorageOperation((resolve) => {
                chrome.storage.local.set({
                    lastTickTime: now
                }, () => {
                    resolve();
                });
            });
        }
    }
}

// Timer to detect when ticks have stopped (i.e. user left CF or closed tab)
function startCheckTimer() {
    if (checkInterval) return;
    checkInterval = setInterval(() => {
        if (!isInitialized) return;
        
        const now = Date.now();
        if (currentSessionStart !== null && lastTickTime !== null) {
            const timeSinceLastTick = now - lastTickTime;
            if (timeSinceLastTick > 2500) {
                // Heartbeat lost! Pause tracking and save
                console.log("[Trackifyy] Heartbeat lost. Time since last tick:", timeSinceLastTick, "ms. Pausing session.");
                stopTrackingAndSave();
            }
        }
    }, 1000);
}

function stopTrackingAndSave() {
    const start = currentSessionStart;
    const end = lastTickTime;

    // Reset in-memory state synchronously
    currentSessionStart = null;
    lastTickTime = null;
    lastSavedTickTime = null;

    if (start && end && end > start) {
        enqueueStorageOperation((resolve) => {
            chrome.storage.local.get(["totalTime", "dailyStats"], (data) => {
                const elapsed = Math.floor((end - start) / 1000);
                let total = (data.totalTime || 0) + elapsed;
                let daily = data.dailyStats || {};
                
                console.log("[Trackifyy] Saving session. Elapsed seconds:", elapsed, "Total:", total);

                let current = start;
                while (current < end) {
                    const currentDateObj = new Date(current);
                    const nextDateObj = new Date(currentDateObj.getFullYear(), currentDateObj.getMonth(), currentDateObj.getDate() + 1);
                    const nextMidnight = nextDateObj.getTime();

                    const endOfSegment = Math.min(nextMidnight, end);
                    const segmentSeconds = Math.floor((endOfSegment - current) / 1000);

                    if (segmentSeconds > 0) {
                        const year = currentDateObj.getFullYear();
                        const month = String(currentDateObj.getMonth() + 1).padStart(2, '0');
                        const day = String(currentDateObj.getDate()).padStart(2, '0');
                        const dateStr = `${year}-${month}-${day}`;

                        daily[dateStr] = (daily[dateStr] || 0) + segmentSeconds;
                    }
                    current = nextMidnight;
                }

                chrome.storage.local.set({
                    totalTime: total,
                    dailyStats: daily,
                    sessionStartTime: null,
                    lastTickTime: null
                }, () => {
                    console.log("[Trackifyy] Session successfully saved and cleared.");
                    resolve();
                });
            });
        });
    } else {
        enqueueStorageOperation((resolve) => {
            chrome.storage.local.set({
                sessionStartTime: null,
                lastTickTime: null
            }, () => {
                resolve();
            });
        });
    }
}
