// ===========================================================
// CONFIG — GANTI SHEET ID KAMU
// ===========================================================

const SHEET_ID = "PASTE_SHEET_ID_HERE";

const GAME_URL   = `https://opensheet.elk.sh/${SHEET_ID}/GameList`;
const LINKS_URL  = `https://opensheet.elk.sh/${SHEET_ID}/Links`;
const BANNER_URL = `https://opensheet.elk.sh/${SHEET_ID}/Banners`;

const MIN_DAILY = 50;
const MAX_DAILY = 98;
const MIN_CHANGE = 0.1;
const MAX_CHANGE = 1;
const RTP_INTERVAL = 5 * 60 * 1000;

const STORAGE_KEY = "rtpSystemAutoPremium";


// ===========================================================
// RTP SYSTEM
// ===========================================================

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

    rtp = Number((rtp + dir * change).toFixed(2));

    if (rtp > 99.9) rtp = 99.9;
    if (rtp < 30) rtp = 30;

    saveRTP(data.base, rtp, data.today);
}


// ===========================================================
// FETCH GOOGLE SHEETS
// ===========================================================

async function getGames() {
    const res = await fetch(GAME_URL);
    return await res.json();
}

async function loadLinks() {
    const res = await fetch(LINKS_URL);
    const list = await res.json();

    document.getElementById("btn-register").href = list.find(a => a.key === "register")?.value || "#";
    document.getElementById("btn-login").href    = list.find(a => a.key === "login")?.value || "#";
}

async function loadBanners() {
    const res = await fetch(BANNER_URL);
    const list = await res.json();

    const track = document.getElementById("slider-track");
    const dotsWrap = document.getElementById("slider-dots");

    track.innerHTML = "";
    dotsWrap.innerHTML = "";

    list.forEach((b, i) => {
        track.innerHTML += `
        <div class="slide">
            <img src="${b.banner_url}">
            ${b.banner_text ? `<div class="slide-text">${b.banner_text}</div>` : ""}
        </div>`;

        dotsWrap.innerHTML += `<span class="dot ${i===0?"active":""}" data-index="${i}"></span>`;
    });

    startSlider(list.length);
}


// ===========================================================
// SLIDER SYSTEM
// ===========================================================

let currentSlide = 0;
let sliderTimer;

function startSlider(total) {
    const track = document.getElementById("slider-track");
    const dots = document.querySelectorAll(".dot");

    function switchSlide(n) {
        currentSlide = (n + total) % total;
        track.style.transform = `translateX(-${currentSlide * 100}%)`;

        dots.forEach(d => d.classList.remove("active"));
        dots[currentSlide].classList.add("active");
    }

    dots.forEach(d => {
        d.addEventListener("click", () => {
            clearInterval(sliderTimer);
            switchSlide(Number(d.dataset.index));
            autoSlide();
        });
    });

    function autoSlide() {
        sliderTimer = setInterval(() => switchSlide(currentSlide + 1), 4000);
    }

    autoSlide();
}


// ===========================================================
// RENDER GAME LIST
// ===========================================================

async function renderGames(provider="ALL") {
    const wrap = document.getElementById("rtp-container");
    wrap.innerHTML = "";

    const list = await getGames();
    const rtp = loadRTP().rtp;

    list
        .filter(g => provider==="ALL" || g.provider === provider)
        .forEach(g => {
            wrap.innerHTML += `
            <div class="card">
                <img src="${g.image_url}">
                <div class="card-content">
                    <h2>${g.game_name}</h2>
                    <div class="provider-tag">${g.provider}</div>
                </div>
                <div class="rtp-badge">${rtp}%</div>
            </div>`;
        });
}


// ===========================================================
// PROVIDER BUTTONS
// ===========================================================

document.querySelectorAll(".provider").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".provider").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const prov = btn.dataset.provider;
        renderGames(prov);
    });
});


// ===========================================================
// RUN
// ===========================================================

renderGames();
loadBanners();
loadLinks();

setInterval(() => {
    updateRTP();
    const activeProv = document.querySelector(".provider.active").dataset.provider;
    renderGames(activeProv);
}, RTP_INTERVAL);
