const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function getTodayString() {
    // Normal local date (midnight rollover)
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getDayLabel(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    return daysOfWeek[d.getDay()];
}

function getDayFullName(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    return d.toLocaleDateString(undefined, options);
}

function formatSeconds(totalSeconds) {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return {
        hours: String(hrs).padStart(2, '0'),
        minutes: String(mins).padStart(2, '0'),
        seconds: String(secs).padStart(2, '0')
    };
}

function formatTimeWords(totalSeconds) {
    if (totalSeconds === 0) return "0m";
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
        return `${hrs}h ${mins}m`;
    }
    if (mins > 0) {
        return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
}

function getDailyStatsWithActive(dailyStats, sessionStart) {
    const allStats = { ...dailyStats };
    if (sessionStart) {
        const now = Date.now();
        // Split active session into daily segments (12:00 AM midnight rollover)
        let current = sessionStart;
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

                allStats[dateStr] = (allStats[dateStr] || 0) + segmentSeconds;
            }

            current = nextMidnight;
        }
    }
    return allStats;
}

function getStreakData(combinedStats, todayStr) {
    const activeDates = new Set(Object.keys(combinedStats).filter(d => combinedStats[d] > 0));
    const sortedDates = Array.from(activeDates).sort();
    if (sortedDates.length === 0) {
        return { current: 0, highest: 0 };
    }

    let maxStreak = 0;
    
    // Parse to local midnight timestamps to evaluate daily differences accurately
    const datesParsed = sortedDates.map(d => new Date(d + "T00:00:00"));
    
    let tempStreak = 0;
    for (let i = 0; i < datesParsed.length; i++) {
        if (i === 0) {
            tempStreak = 1;
        } else {
            const diffTime = datesParsed[i] - datesParsed[i - 1];
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
                tempStreak++;
            } else if (diffDays > 1) {
                if (tempStreak > maxStreak) {
                    maxStreak = tempStreak;
                }
                tempStreak = 1;
            }
        }
    }
    if (tempStreak > maxStreak) {
        maxStreak = tempStreak;
    }

    // Check current streak (active today or yesterday)
    let currentStreak = 0;
    const today = new Date(todayStr + "T00:00:00");
    const lastDate = datesParsed[datesParsed.length - 1];
    
    if (lastDate) {
        const diffToToday = Math.round((today - lastDate) / (1000 * 60 * 60 * 24));
        if (diffToToday === 0 || diffToToday === 1) {
            let run = 1;
            for (let j = datesParsed.length - 1; j > 0; j--) {
                const diff = Math.round((datesParsed[j] - datesParsed[j - 1]) / (1000 * 60 * 60 * 24));
                if (diff === 1) {
                    run++;
                } else {
                    break;
                }
            }
            currentStreak = run;
        }
    }

    return {
        current: currentStreak,
        highest: maxStreak
    };
}

function updateTimer() {
    chrome.storage.local.get(["totalTime", "sessionStartTime", "dailyStats"], (data) => {
        let total = data.totalTime || 0;
        const sessionStart = data.sessionStartTime;
        let dailyStats = data.dailyStats || {};

        // Migration: Seed dailyStats with totalTime if migrating from old version
        if (total > 0 && Object.keys(dailyStats).length === 0) {
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const yYear = yesterday.getFullYear();
            const yMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
            const yDay = String(yesterday.getDate()).padStart(2, '0');
            const yesterdayStr = `${yYear}-${yMonth}-${yDay}`;
            
            dailyStats[yesterdayStr] = total;
            chrome.storage.local.set({ dailyStats: dailyStats });
        }
        
        // Retrieve stats combined with current active session
        const combinedStats = getDailyStatsWithActive(dailyStats, sessionStart);
        const todayStr = getTodayString();
        const todayTime = combinedStats[todayStr] || 0;
        
        let isTracking = false;
        if (sessionStart) {
            const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
            total += elapsed;
            isTracking = true;
        }

        // Format and update today's timer
        const todayObj = formatSeconds(todayTime);
        document.getElementById("hours").innerText = todayObj.hours;
        document.getElementById("minutes").innerText = todayObj.minutes;
        document.getElementById("seconds").innerText = todayObj.seconds;

        // Calculate and update streaks using timezone-safe shifted stats
        const streaks = getStreakData(combinedStats, todayStr);
        const streakDays = streaks.current;
        document.getElementById("currStreak").innerText = streakDays + (streakDays === 1 ? " day" : " days");

        // Calculate max daily time (including active session today)
        let maxDailySeconds = 0;
        Object.keys(combinedStats).forEach(date => {
            if (combinedStats[date] > maxDailySeconds) {
                maxDailySeconds = combinedStats[date];
            }
        });
        const maxDailyHrs = (maxDailySeconds / 3600).toFixed(2);
        document.getElementById("maxDayTime").innerText = maxDailyHrs + "h";

        // Update status badge
        const badge = document.getElementById("statusBadge");
        const statusText = document.getElementById("statusText");
        if (isTracking) {
            badge.className = "status-badge tracking";
            statusText.innerText = "TRACKING";
        } else {
            badge.className = "status-badge standby";
            statusText.innerText = "STANDBY";
        }

        // Render history chart
        renderChart(combinedStats, todayStr);
    });
}

function renderChart(combinedStats, todayStr) {
    const container = document.getElementById("chartContainer");
    if (!container) return;
    container.innerHTML = ""; // Clear existing

    // Get last 7 days list
    const dates = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
    }

    // Determine values
    const values = dates.map(date => combinedStats[date] || 0);

    const maxVal = Math.max(...values, 1800); // Scale relative to at least 30 minutes

    dates.forEach((date, idx) => {
        const seconds = values[idx];
        const heightPct = (seconds / maxVal) * 100;
        const dayLabel = getDayLabel(date);
        const formatted = formatTimeWords(seconds);
        const isToday = date === todayStr;
        
        const barWrap = document.createElement("div");
        barWrap.className = "chart-bar-wrap";
        
        const fillClass = isToday ? "chart-bar-fill today" : "chart-bar-fill";
        
        barWrap.innerHTML = `
            <div class="chart-bar-bg" title="${getDayFullName(date)}: ${formatted}">
                <div class="${fillClass}" style="height: ${heightPct}%"></div>
            </div>
            <div class="chart-label ${isToday ? 'today' : ''}">${dayLabel}</div>
        `;
        container.appendChild(barWrap);
    });
}

let stopwatchInterval = null;

function formatSecondsToTimer(totalSeconds) {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return {
        hours: String(hrs).padStart(2, '0'),
        minutes: String(mins).padStart(2, '0'),
        seconds: String(secs).padStart(2, '0')
    };
}

function updateStopwatchUI() {
    chrome.storage.local.get(["swRunning", "swStartTime", "swAccumulatedTime", "swLaps"], (data) => {
        const isRunning = !!data.swRunning;
        const startTime = data.swStartTime || 0;
        const accumulated = data.swAccumulatedTime || 0;
        const laps = data.swLaps || [];

        let currentTotal = accumulated;
        if (isRunning && startTime > 0) {
            currentTotal += Math.floor((Date.now() - startTime) / 1000);
        }

        const timeObj = formatSecondsToTimer(currentTotal);
        
        const hEl = document.getElementById("swHours");
        const mEl = document.getElementById("swMinutes");
        const sEl = document.getElementById("swSeconds");
        if (hEl) hEl.innerText = timeObj.hours;
        if (mEl) mEl.innerText = timeObj.minutes;
        if (sEl) sEl.innerText = timeObj.seconds;

        // Status
        const statusEl = document.getElementById("swStatus");
        if (statusEl) {
            if (isRunning) {
                statusEl.className = "stopwatch-status running";
                statusEl.innerText = "RUNNING";
            } else if (accumulated > 0) {
                statusEl.className = "stopwatch-status";
                statusEl.innerText = "PAUSED";
            } else {
                statusEl.className = "stopwatch-status";
                statusEl.innerText = "READY";
            }
        }

        // Buttons
        const playIcon = document.getElementById("swPlayIcon");
        const pauseIcon = document.getElementById("swPauseIcon");
        const textEl = document.getElementById("swStartPauseText");
        
        if (isRunning) {
            if (playIcon) playIcon.classList.add("hidden");
            if (pauseIcon) pauseIcon.classList.remove("hidden");
            if (textEl) textEl.innerText = "PAUSE";
        } else {
            if (playIcon) playIcon.classList.remove("hidden");
            if (pauseIcon) pauseIcon.classList.add("hidden");
            if (textEl) textEl.innerText = accumulated > 0 ? "RESUME" : "START";
        }

        // Render Laps
        renderLaps(laps);

        // Control local ticking
        if (isRunning) {
            if (!stopwatchInterval) {
                stopwatchInterval = setInterval(tickStopwatch, 1000);
            }
        } else {
            if (stopwatchInterval) {
                clearInterval(stopwatchInterval);
                stopwatchInterval = null;
            }
        }
    });
}

function tickStopwatch() {
    chrome.storage.local.get(["swRunning", "swStartTime", "swAccumulatedTime"], (data) => {
        if (!data.swRunning) {
            if (stopwatchInterval) {
                clearInterval(stopwatchInterval);
                stopwatchInterval = null;
            }
            return;
        }
        const startTime = data.swStartTime || 0;
        const accumulated = data.swAccumulatedTime || 0;
        const currentTotal = accumulated + Math.floor((Date.now() - startTime) / 1000);
        
        const timeObj = formatSecondsToTimer(currentTotal);
        const hEl = document.getElementById("swHours");
        const mEl = document.getElementById("swMinutes");
        const sEl = document.getElementById("swSeconds");
        if (hEl) hEl.innerText = timeObj.hours;
        if (mEl) mEl.innerText = timeObj.minutes;
        if (sEl) sEl.innerText = timeObj.seconds;
    });
}

function renderLaps(laps) {
    const container = document.getElementById("lapContainer");
    if (!container) return;
    
    // Quick comparison: check if rendered laps match data laps
    const childCount = container.children.length;
    if (childCount === laps.length) {
        return;
    }
    
    container.innerHTML = "";
    laps.forEach((lapStr, index) => {
        const lapDiv = document.createElement("div");
        lapDiv.className = "lap-item";
        lapDiv.innerHTML = `
            <span class="lap-number">LAP ${index + 1}</span>
            <span class="lap-time">${lapStr}</span>
        `;
        container.appendChild(lapDiv);
    });
    
    // Auto scroll to bottom
    container.scrollTop = container.scrollHeight;
}

function initStopwatchControls() {
    const startPauseBtn = document.getElementById("swStartPauseBtn");
    const lapBtn = document.getElementById("swLapBtn");
    const resetBtn = document.getElementById("swResetBtn");

    if (startPauseBtn) {
        startPauseBtn.addEventListener("click", () => {
            chrome.storage.local.get(["swRunning", "swStartTime", "swAccumulatedTime"], (data) => {
                const wasRunning = !!data.swRunning;
                const now = Date.now();
                if (wasRunning) {
                    // Pause
                    const elapsed = Math.floor((now - (data.swStartTime || now)) / 1000);
                    const newAccumulated = (data.swAccumulatedTime || 0) + elapsed;
                    chrome.storage.local.set({
                        swRunning: false,
                        swStartTime: null,
                        swAccumulatedTime: newAccumulated
                    }, () => {
                        updateStopwatchUI();
                    });
                } else {
                    // Start/Resume
                    chrome.storage.local.set({
                        swRunning: true,
                        swStartTime: now
                    }, () => {
                        updateStopwatchUI();
                    });
                }
            });
        });
    }

    if (lapBtn) {
        lapBtn.addEventListener("click", () => {
            chrome.storage.local.get(["swRunning", "swStartTime", "swAccumulatedTime", "swLaps"], (data) => {
                const isRunning = !!data.swRunning;
                const startTime = data.swStartTime || 0;
                const accumulated = data.swAccumulatedTime || 0;
                const laps = data.swLaps || [];

                let currentTotal = accumulated;
                if (isRunning && startTime > 0) {
                    currentTotal += Math.floor((Date.now() - startTime) / 1000);
                }

                const t = formatSecondsToTimer(currentTotal);
                const formatted = `${t.hours}:${t.minutes}:${t.seconds}`;
                
                laps.push(formatted);
                chrome.storage.local.set({ swLaps: laps }, () => {
                    updateStopwatchUI();
                });
            });
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            chrome.storage.local.set({
                swRunning: false,
                swStartTime: null,
                swAccumulatedTime: 0,
                swLaps: []
            }, () => {
                updateStopwatchUI();
            });
        });
    }
}

function initTabs() {
    const tabTracker = document.getElementById("tabTracker");
    const tabStopwatch = document.getElementById("tabStopwatch");
    const trackerContent = document.getElementById("trackerContent");
    const stopwatchContent = document.getElementById("stopwatchContent");

    if (tabTracker && tabStopwatch) {
        tabTracker.addEventListener("click", () => {
            tabTracker.classList.add("active");
            tabStopwatch.classList.remove("active");
            trackerContent.classList.remove("hidden");
            stopwatchContent.classList.add("hidden");
            chrome.storage.local.set({ activeTab: "tracker" });
        });

        tabStopwatch.addEventListener("click", () => {
            tabStopwatch.classList.add("active");
            tabTracker.classList.remove("active");
            stopwatchContent.classList.remove("hidden");
            trackerContent.classList.add("hidden");
            chrome.storage.local.set({ activeTab: "stopwatch" });
        });

        // Restore active tab
        chrome.storage.local.get("activeTab", (data) => {
            if (data.activeTab === "stopwatch") {
                tabStopwatch.click();
            }
        });
    }
}

// Run once on load
document.addEventListener("DOMContentLoaded", () => {
    updateTimer();
    setInterval(updateTimer, 1000);

    // Initializations
    initTabs();
    initStopwatchControls();
    updateStopwatchUI();

    const cfBtn = document.getElementById("cfBtn");
    if (cfBtn) {
        cfBtn.addEventListener("click", (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: "https://codeforces.com" });
        });
    }
});