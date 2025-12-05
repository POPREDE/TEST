/* ============================================================
   GOOGLE SHEETS CSV SOURCES
============================================================ */
const CSV = {
    gamelist: "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?gid=0&single=true&output=csv",
    links:    "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?gid=1888859615&single=true&output=csv",
    banners:  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?gid=773368200&single=true&output=csv",
    logos:    "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?gid=1030942322&single=true&output=csv"
};


/* ============================================================
   BASIC CSV LOADER
============================================================ */
async function loadCSV(url) {
    const res = await fetch(url);
    const txt = await res.text();
    return txt.trim().split("\n").map(r => r.split(","));
}


/* ============================================================
   GLOBAL VARIABLES
============================================================ */
let GAME_DATA = [];

let CURRENT_PROVIDER  = "ALL";
let CURRENT_CATEGORY  = "ALL";
let CURRENT_VOLATILITY = "ALL";
let SEARCH_VALUE      = "";

let lastFullShuffle = Date.now();


/* ============================================================
   INIT WEBSITE
============================================================ */
async function initSite() {

    const gamelist = await loadCSV(CSV.gamelist);
    const links    = await loadCSV(CSV.links);
    const banners  = await loadCSV(CSV.banners);
    const logos    = await loadCSV(CSV.logos);

    /* Apply LINK sheet */
    links.forEach(r => {
        let key = r[0], img = r[1], val = r[2];
        if (key === "header_logo") document.getElementById("header_logo").src = img;
        if (key === "header_btn")  document.getElementById("header_btn").href = val;
        if (key === "hero_title")  document.getElementById("hero_title").innerText = val;
        if (key === "hero_desc")   document.getElementById("hero_desc").innerText = val;
    });

    /* Banners */
    generateBanner(banners.map(r => ({
        img: r[0],
        link: r[1],
        caption: r[2] || ""
    })));

    /* Logos */
    generateLogos(logos.map(r => ({
        img: r[0],
        link: r[1]
    })));

    /* Game list with categories + volatility */
    GAME_DATA = gamelist.map(r => ({
        provider: r[0],
        img: r[1],
        name: r[2],
        rtp: Number(r[3]),
        link: r[4],
        category: r[5] || "slots",
        volatility: r[6] || "MID"
    }));

    /* First FULL SHUFFLE */
    fullShuffleRTP();
    renderGames();

    /* TIMERS */
    setInterval(checkHourlyShuffle, 60 * 1000);
    setInterval(microUpdateRTP, 3 * 60 * 1000);

    /* FILTER LISTENERS */
    document.getElementById("searchInput").addEventListener("input", e => {
        SEARCH_VALUE = e.target.value.toLowerCase();
        renderGames();
    });

    document.getElementById("filterCategory").addEventListener("change", e => {
        CURRENT_CATEGORY = e.target.value;
        renderGames();
    });

    document.getElementById("filterVolatility").addEventListener("change", e => {
        CURRENT_VOLATILITY = e.target.value;
        renderGames();
    });

    document.getElementById("filterProvider").addEventListener("change", e => {
        CURRENT_PROVIDER = e.target.value;
        renderGames();
    });

    /* THEME SWITCH */
    document.getElementById("themeToggle").addEventListener("click", toggleTheme);
}

initSite();



/* ============================================================
   FULL SHUFFLE RTP (EVERY 1 HOUR)
============================================================ */
function fullShuffleRTP() {
    lastFullShuffle = Date.now();

    let tmp = [...GAME_DATA].sort(() => Math.random() - 0.5);

    let high = tmp.splice(0, 10);
    let low  = tmp.splice(0, 30);
    let mid  = tmp;

    high.forEach(g => g.rtp = rand(90, 99));
    low.forEach(g  => g.rtp = rand(30, 55));
    mid.forEach(g  => g.rtp = rand(56, 89));
}


/* ============================================================
   CHECK FULL SHUFFLE TIME
============================================================ */
function checkHourlyShuffle() {
    const oneHour = 60 * 60 * 1000;
    if (Date.now() - lastFullShuffle >= oneHour) {
        fullShuffleRTP();
        renderGames();
    }
}



/* ============================================================
   MICRO UPDATE RTP (EVERY 3 MINUTES)
============================================================ */
function microUpdateRTP() {
    GAME_DATA.forEach(g => {

        let delta = rand(0.5, 2.5);
        if (Math.random() < 0.5) delta = -delta;

        let target = g.rtp + delta;

        if (g.rtp >= 90) target = clamp(target, 90, 99);
        else if (g.rtp <= 55) target = clamp(target, 30, 55);
        else target = clamp(target, 56, 89);

        g.rtp = Number(target.toFixed(1));
    });

    renderGames();
}



/* ============================================================
   RENDER GAME GRID + FILTER + SEARCH
============================================================ */
function renderGames() {
    const grid = document.getElementById("game-grid");
    grid.innerHTML = "";

    GAME_DATA
        .filter(g => CURRENT_PROVIDER === "ALL" || g.provider === CURRENT_PROVIDER)
        .filter(g => CURRENT_CATEGORY === "ALL" || g.category === CURRENT_CATEGORY)
        .filter(g => CURRENT_VOLATILITY === "ALL" || g.volatility === CURRENT_VOLATILITY)
        .filter(g => g.name.toLowerCase().includes(SEARCH_VALUE))
        .forEach((g, idx) => {

            grid.innerHTML += `
                <div class="card" onclick="openModal(${idx})">

                    <img src="${g.img}" alt="${g.name}">
                    <div class="game-name">${g.name}</div>

                    <div class="rtp-bar">
                        <div class="rtp-fill" style="width: ${g.rtp}%"></div>
                    </div>

                    <div class="rtp-text">${g.rtp}% RTP</div>
                </div>
            `;
        });
}



/* ============================================================
   BANNERS
============================================================ */
function generateBanner(list) {
    const track = document.getElementById("bannerTrack");
    const dots  = document.getElementById("bannerDots");
    const cap   = document.getElementById("bannerCaption");

    track.innerHTML = "";
    dots.innerHTML  = "";

    list.forEach((b,i) => {
        track.innerHTML += `
            <div class="banner-item">
                <a href="${b.link}" target="_blank">
                    <img src="${b.img}">
                </a>
            </div>`;

        dots.innerHTML += `<span class="dot ${i===0?"active":""}" data-i="${i}"></span>`;
    });

    let idx = 0;
    cap.innerText = list[0].caption;

    setInterval(() => {
        idx = (idx + 1) % list.length;
        track.style.transform = `translateX(-${idx * 100}%)`;
        cap.innerText = list[idx].caption;

        [...dots.children].forEach(d => d.classList.remove("active"));
        dots.children[idx].classList.add("active");
    }, 3500);
}



/* ============================================================
   LOGO GRID
============================================================ */
function generateLogos(list) {
    const box = document.getElementById("logoStrip");
    box.innerHTML = list.map(l => `
        <a href="${l.link}" target="_blank">
            <img src="${l.img}">
        </a>
    `).join("");
}



/* ============================================================
   MODAL POPUP
============================================================ */
function openModal(i) {
    const g = GAME_DATA[i];

    document.getElementById("modal_img").src = g.img;
    document.getElementById("modal_name").innerText = g.name;
    document.getElementById("modal_provider").innerText = g.provider;
    document.getElementById("modal_rtp_text").innerText = g.rtp + "% RTP";
    document.getElementById("modal_rtp_bar").style.width = g.rtp + "%";

    document.getElementById("modal_play").href = g.link;

    document.getElementById("modal").style.display = "flex";
}

document.getElementById("modalClose").onclick = () =>
    document.getElementById("modal").style.display = "none";

document.getElementById("modal").addEventListener("click", e => {
    if (e.target.id === "modal") {
        document.getElementById("modal").style.display = "none";
    }
});



/* ============================================================
   THEME SWITCHER
============================================================ */
function toggleTheme() {
    const body = document.body;
    if (body.classList.contains("theme-dark")) {
        body.classList.remove("theme-dark");
        body.classList.add("theme-light");
    } else {
        body.classList.remove("theme-light");
        body.classList.add("theme-dark");
    }
}



/* ============================================================
   UTILS
============================================================ */
function rand(a,b){ return Math.random()*(b-a)+a }
function clamp(v,min,max){ return Math.max(min, Math.min(max,v)) }
