// =======================
// CONFIG
// =======================

// GANTI dengan Google Sheets kamu
const SHEET_URL = "https://opensheet.elk.sh/1AbCDeFgHiJKLM12345/GameList";

const MIN_DAILY = 50;
const MAX_DAILY = 98;
const MIN_CHANGE = 0.1;
const MAX_CHANGE = 1;

const INTERVAL = 5 * 60 * 1000; // 5 menit
const STORAGE_KEY = "rtpAutoPremium";


// =======================
// RTP SYSTEM
// =======================

function loadRTP() {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const today = new Date().getDate();

    if (!saved) {
        const base = randomDaily();
        saveRTP(base, base, today);
        return { base, rtp: base, today };
    }

    if (saved.today !== today) {
        const base = randomDaily();
        saveRTP(base, base, today);
        return { base, rtp: base, today };
    }

    return saved;
}

function saveRTP(base, rtp, today) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ base, rtp, today }));
}

function randomDaily() {
    return Number((Math.random()*(MAX_DAILY-MIN_DAILY)+MIN_DAILY).toFixed(2));
}

function randomMinuteChange() {
    return Number((Math.random()*(MAX_CHANGE-MIN_CHANGE)+MIN_CHANGE).toFixed(2));
}

function updateRTP() {
    let data = loadRTP();
    let rtp = data.rtp;

    const change = randomMinuteChange();
    const dir = Math.random() < 0.5 ? -1 : 1;

    rtp = Number((rtp + dir*change).toFixed(2));

    if (rtp > 99.9) rtp = 99.9;
    if (rtp < 30) rtp = 30;

    saveRTP(data.base, rtp, data.today);
}


// =======================
// FETCH GOOGLE SHEETS
// =======================

async function getGames() {
    const res = await fetch(SHEET_URL);
    return await res.json();
}


// =======================
// RENDER CARD
// =======================

async function renderRTP(providerFilter="ALL") {
    const games = await getGames();
    const wrap = document.querySelector("#rtp-container");
    wrap.innerHTML = "";

    const data = loadRTP();
    const rtp = data.rtp;

    games
        .filter(g => providerFilter === "ALL" || g.provider === providerFilter)
        .forEach(g => {

            const card = document.createElement("div");
            card.classList.add("card");

            card.innerHTML = `
                <img src="${g.image_url}" alt="">
                <div class="card-content">
                    <h2>${g.game_name}</h2>
                    <div class="provider-tag">${g.provider || "Unknown Provider"}</div>
                </div>
                <div class="rtp-badge">${rtp}%</div>
            `;

            wrap.appendChild(card);
        });
}


// =======================
// PROVIDER FILTER BUTTON
// =======================

document.querySelectorAll(".provider").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".provider").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const provider = btn.getAttribute("data-provider");
        renderRTP(provider);
    });
});


// =======================
// RUN
// =======================

renderRTP();

setInterval(() => {
    updateRTP();
    renderRTP(document.querySelector(".provider.active").dataset.provider);
}, INTERVAL);
