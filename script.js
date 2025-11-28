//------------------------------------------------------------
// CSV SOURCES
//------------------------------------------------------------
const GAME_CSV   = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?gid=0&single=true&output=csv";
const LINK_CSV   = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?gid=1888859615&single=true&output=csv";
const BANNER_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?gid=773368200&single=true&output=csv";
const LOGO_CSV   = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?gid=1030942322&single=true&output=csv";

// RAW JSON selalu pakai anti-cache
const RTP_JSON   = "https://raw.githubusercontent.com/POPREDE/TEST/main/rtp.json";


//------------------------------------------------------------
// CSV PARSER (TAB PRIORITY + fallback comma/semicolon)
//------------------------------------------------------------
async function fetchCSV(url) {
    const res = await fetch(url + "&cache=" + Date.now(), { cache: "no-store" });
    const text = await res.text();

    const rows = text.trim().split("\n").map(r =>
        r.includes("\t") ? r.split(/\t+/) : r.split(/[,;]+/)
    );

    const headers = rows.shift().map(h => h.trim());

    return rows.map(r => {
        let o = {};
        r.forEach((v, i) => o[headers[i]] = v?.trim());
        return o;
    });
}


//------------------------------------------------------------
// REGISTER / LOGIN / LOGO HEADER
//------------------------------------------------------------
async function loadLinks() {
    const list = await fetchCSV(LINK_CSV);
    const clean = x => (x || "").trim().toLowerCase();

    document.getElementById("btn-register").href =
        list.find(x => clean(x.key) === "register")?.value || "#";

    document.getElementById("btn-login").href =
        list.find(x => clean(x.key) === "login")?.value || "#";

    document.getElementById("logo-poprede").src =
        list.find(x => clean(x.key) === "logo")?.value || "";
}


//------------------------------------------------------------
// BANNER SLIDER — SLIDE 1 BANNER PENUH
//------------------------------------------------------------
let bannerList = [];
let bannerIndex = 0;
let bannerTimer = null;
let startX = 0;

async function loadBanners() {
    bannerList = await fetchCSV(BANNER_CSV);

    const track = document.getElementById("banner-track");
    const dots = document.getElementById("banner-dots");
    const caption = document.getElementById("banner-caption");

    track.innerHTML = "";
    dots.innerHTML = "";

    bannerList.forEach((b, i) => {
        track.innerHTML += `
            <div class="banner-item">
                <img src="${b.banner_url}">
            </div>
        `;
        dots.innerHTML += `<span class="dot ${i === 0 ? 'active' : ''}" data-id="${i}"></span>`;
    });

    caption.textContent = bannerList[0]?.banner_text || "";

    initBannerEngine();
}

function initBannerEngine() {
    const track = document.getElementById("banner-track");
    const items = document.querySelectorAll(".banner-item");
    const dots = document.querySelectorAll(".banner-dots .dot");
    const caption = document.getElementById("banner-caption");

    function move(n) {
        bannerIndex = (n + bannerList.length) % bannerList.length;

        const offset = items[bannerIndex].offsetLeft * -1;
        track.style.transform = `translateX(${offset}px)`;

        dots.forEach(d => d.classList.remove("active"));
        dots[bannerIndex].classList.add("active");

        caption.textContent = bannerList[bannerIndex]?.banner_text || "";
    }

    dots.forEach(dot => {
        dot.onclick = () => {
            clearInterval(bannerTimer);
            move(Number(dot.dataset.id));
            autoSlide();
        };
    });

    function autoSlide() {
        bannerTimer = setInterval(() => move(bannerIndex + 1), 3500);
    }

    autoSlide();

    track.addEventListener("touchstart", e => startX = e.touches[0].clientX);
    track.addEventListener("touchend", e => {
        const dx = e.changedTouches[0].clientX - startX;

        if (dx > 50) {
            clearInterval(bannerTimer);
            move(bannerIndex - 1);
            autoSlide();
        }
        if (dx < -50) {
            clearInterval(bannerTimer);
            move(bannerIndex + 1);
            autoSlide();
        }
    });

    window.addEventListener("resize", () => {
        const offset = items[bannerIndex].offsetLeft * -1;
        track.style.transform = `translateX(${offset}px)`;
    });
}


//------------------------------------------------------------
// LOGO GRID (2 provider only — PG + PRAGMATIC)
//------------------------------------------------------------
async function loadLogoStrip() {
    const list = await fetchCSV(LOGO_CSV);
    const grid = document.getElementById("logo-strip");

    grid.innerHTML = "";

    const logos = list
        .filter(l =>
            l.provider?.toLowerCase().includes("pg") ||
            l.provider?.toLowerCase().includes("prag")
        )
        .slice(0, 2);

    logos.forEach(logo => {
        grid.innerHTML += `<img src="${logo.logo_url}">`;
    });
}


//------------------------------------------------------------
// RTP JSON LOADER — ANTI CACHE 100%
//------------------------------------------------------------
async function loadRTP(provider) {
    const res = await fetch(
        RTP_JSON + "?v=" + new Date().getTime(),
        { cache: "no-store" }
    );

    const json = await res.json();
    return json.provider[provider] || [];
}


//------------------------------------------------------------
// COLOR CLASS UNTUK RTP
//------------------------------------------------------------
function getColorClass(rtp) {
    if (rtp >= 90) return "rtp-green";
    if (rtp >= 70) return "rtp-yellow";
    return "rtp-red";
}


//------------------------------------------------------------
// RENDER GAME GRID
//------------------------------------------------------------
async function renderGames(provider = "PG") {
    const allGames = await fetchCSV(GAME_CSV);
    const games = allGames.filter(g =>
        (g.provider || "").trim().toLowerCase().startsWith(provider.toLowerCase())
    );

    const rtp = await loadRTP(provider);
    const grid = document.getElementById("game-grid");

    grid.innerHTML = "";

    games.forEach((g, i) => {
        const r = rtp[i] ?? 50;
        const color = getColorClass(r);

        grid.innerHTML += `
        <div class="card">
            <img src="${g.image_url}">
            <div class="game-name">${g.game_name}</div>

            <div class="rtp-bar-container">
                <div class="rtp-bar ${color}" style="width:${r}%"></div>
            </div>

            <div class="rtp-text">${r}%</div>
        </div>
        `;
    });
}


//------------------------------------------------------------
// PROVIDER SWITCH
//------------------------------------------------------------
document.querySelectorAll(".provider").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll(".provider").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        renderGames(btn.dataset.provider);
    };
});


//------------------------------------------------------------
// INIT
//------------------------------------------------------------
loadLinks();
loadBanners();
loadLogoStrip();
renderGames("PG");
