/**
 * POPREDE RTP ENGINE FINAL
 * Runs in 2 modes:
 * - hourly  → Full shuffle regeneration
 * - micro   → Small RTP movement (0.5% – 2.5%)
 *
 * Output: rtp.json
 * Input (optional): previous rtp.json or games.json
 */

const fs = require("fs");

/* ============================================================
   SETTINGS
============================================================ */
const HIGH_COUNT = 10;
const LOW_COUNT  = 30;

const MODE = process.env.SCHEDULE_MODE || "micro";
console.log("RTP Engine Mode:", MODE);


/* ============================================================
   UTILITIES
============================================================ */
function rand(min, max) {
    return Math.random() * (max - min) + min;
}

function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}


/* ============================================================
   LOAD GAME LIST (BASE)
   This MUST contain provider + name at minimum.
============================================================ */
let baseGames = [];

try {
    baseGames = JSON.parse(fs.readFileSync("games.json", "utf8"));
    console.log("Loaded games.json:", baseGames.length, "games");
} catch (e) {
    console.error("ERROR: games.json not found or invalid.");
    process.exit(1);
}


/* If previous RTP exists, load it for micro-update mode */
let previous = null;
try {
    previous = JSON.parse(fs.readFileSync("rtp.json", "utf8"));
} catch {
    previous = null;
}


/* ============================================================
   MODE: HOURLY (FULL SHUFFLE)
============================================================ */
function fullShuffle() {
    console.log("→ FULL SHUFFLE EXECUTION");

    // Clone & randomize order
    let tmp = [...baseGames].sort(() => Math.random() - 0.5);

    // Assign HIGH
    let high = tmp.splice(0, HIGH_COUNT);
    high = high.map(g => ({ 
        ...g,
        rtp: Number(rand(90, 99).toFixed(1)) 
    }));

    // Assign LOW
    let low = tmp.splice(0, LOW_COUNT);
    low = low.map(g => ({ 
        ...g,
        rtp: Number(rand(30, 55).toFixed(1))
    }));

    // Assign MID
    let mid = tmp.map(g => ({
        ...g,
        rtp: Number(rand(56, 89).toFixed(1))
    }));

    let all = [...high, ...low, ...mid];

    console.log("Assigned:", {
        high: high.length,
        low: low.length,
        mid: mid.length
    });

    return all;
}


/* ============================================================
   MODE: MICRO UPDATE (EVERY 3 MINUTES)
============================================================ */
function microUpdate() {
    console.log("→ MICRO UPDATE EXECUTION (0.5% – 2.5%)");

    if (!previous) {
        console.log("No previous rtp.json → fallback to full shuffle");
        return fullShuffle();
    }

    return previous.map(g => {

        let delta = rand(0.5, 2.5);
        if (Math.random() < 0.5) delta = -delta;

        let newRTP = g.rtp + delta;

        // Range control
        if (g.rtp >= 90)      newRTP = clamp(newRTP, 90, 99);
        else if (g.rtp <= 55) newRTP = clamp(newRTP, 30, 55);
        else                  newRTP = clamp(newRTP, 56, 89);

        return {
            ...g,
            rtp: Number(newRTP.toFixed(1))
        };
    });
}


/* ============================================================
   MAIN EXECUTION
============================================================ */
let output = (MODE === "hourly")
    ? fullShuffle()
    : microUpdate();

fs.writeFileSync("rtp.json", JSON.stringify(output, null, 2));
console.log("DONE → rtp.json updated successfully.");
