//------------------------------------------------------------
// CSV SOURCES
//------------------------------------------------------------
const GAME_CSV   = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?gid=0&single=true&output=csv";
const LINK_CSV   = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?gid=1888859615&single=true&output=csv";
const BANNER_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?gid=773368200&single=true&output=csv";
const LOGO_CSV   = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?gid=1030942322&single=true&output=csv";

const RTP_JSON = "https://raw.githubusercontent.com/POPREDE/TEST/main/rtp.json";


//------------------------------------------------------------
// CSV PARSER
//------------------------------------------------------------
async function fetchCSV(url) {
    const res = await fetch(url);
    const text = await res.text();
    const rows = text.split("\n").map(r => r.split(","));
    const head = rows.shift().map(h => h.trim());

    return rows.map(r=>{
        let o={};
        r.forEach((v,i)=>o[head[i]] = v.trim());
        return o;
    });
}


//------------------------------------------------------------
// REGISTER / LOGIN / HEADER LOGO
//------------------------------------------------------------
async function loadLinks() {
    const list = await fetchCSV(LINK_CSV);
    const clean = s => s?.trim().toLowerCase();

    document.getElementById("btn-register").href =
        list.find(x => clean(x.key) === "register")?.value || "#";

    document.getElementById("btn-login").href =
        list.find(x => clean(x.key) === "login")?.value || "#";

    document.getElementById("logo-poprede").src =
        list.find(x => clean(x.key) === "logo")?.value || "";
}


//------------------------------------------------------------
// BANNER SLIDER — FINAL FIX 2
//------------------------------------------------------------
let bannerList = [];
let bannerIndex = 0;
let bannerTimer = null;
let startX = 0;

async function loadBanners() {

    bannerList = await fetchCSV(BANNER_CSV);

    const track = document.getElementById("banner-track");
    const dots  = document.getElementById("banner-dots");
    const caption = document.getElementById("banner-caption");

    track.innerHTML = "";
    dots.innerHTML = "";

    bannerList.forEach((b, i) => {
        track.innerHTML += `
            <div class="banner-item">
                <img src="${b.banner_url}">
            </div>
        `;
        dots.innerHTML += `<span class="dot ${i===0?'active':''}" data-id="${i}"></span>`;
    });

    caption.textContent = bannerList[0]?.banner_text || "";

    initBannerEngine();
}

function initBannerEngine() {

    const track = document.getElementById("banner-track");
    const items = document.querySelectorAll(".banner-item");
    const dots  = document.querySelectorAll(".banner-dots .dot");
    const caption = document.getElementById("banner-caption");

    function move(n) {
        bannerIndex = (n + bannerList.length) % bannerList.length;

        // REAL positions (100% exact)
        const offset = items[bannerIndex].offsetLeft * -1;
        track.style.transform = `translateX(${offset}px)`;

        dots.forEach(d => d.classList.remove("active"));
        dots[bannerIndex].classList.add("active");

        caption.textContent = bannerList[bannerIndex]?.banner_text || "";
    }

    dots.forEach(dot=>{
        dot.onclick = () => {
            clearInterval(bannerTimer);
            move(Number(dot.dataset.id));
            auto();
        };
    });

    function auto() {
        bannerTimer = setInterval(() => move(bannerIndex + 1), 3500);
    }
    auto();

    track.addEventListener("touchstart", e => startX = e.touches[0].clientX);

    track.addEventListener("touchend", e => {
        const dx = e.changedTouches[0].clientX - startX;

        if (dx > 50) { move(bannerIndex - 1); }
        if (dx < -50) { move(bannerIndex + 1); }
    });

    window.addEventListener("resize", () => {
        const offset = items[bannerIndex].offsetLeft * -1;
        track.style.transform = `translateX(${offset}px)`;
    });
}


//------------------------------------------------------------
// LOGO GRID
//------------------------------------------------------------
async function loadLogoStrip() {
    const list = await fetchCSV(LOGO_CSV);
    const grid = document.getElementById("logo-strip");

    grid.innerHTML = "";

    const logos = list
        .filter(x =>
            x.provider.toLowerCase().includes("pg") ||
            x.provider.toLowerCase().includes("pragmatic")
        )
        .slice(0, 2);

    logos.forEach(l => grid.innerHTML += `<img src="${l.logo_url}">`);
}


//------------------------------------------------------------
// RTP + GAME GRID
//------------------------------------------------------------
function getColorClass(rtp) {
    if (rtp >= 90) return "rtp-green";
    if (rtp >= 70) return "rtp-yellow";
    return "rtp-red";
}

async function loadRTP(provider) {
    const res = await fetch(RTP_JSON + "?cache=" + Date.now());
    const json = await res.json();
    return json.provider[provider];
}

async function renderGames(provider="PG") {

    const all = await fetchCSV(GAME_CSV);
    const games = all.filter(x => x.provider === provider);

    const rtp = await loadRTP(provider);

    const grid = document.getElementById("game-grid");
    grid.innerHTML = "";

    games.forEach((g, i) => {
        const val = rtp[i] || 50;
        const color = getColorClass(val);

        grid.innerHTML += `
            <div class="card">
                <img src="${g.image_url}">
                <div class="game-name">${g.game_name}</div>

                <div class="rtp-bar-container">
                    <div class="rtp-bar ${color}" style="width:${val}%"></div>
                </div>

                <div class="rtp-text">${val}%</div>
            </div>
        `;
    });
}


//------------------------------------------------------------
// PROVIDER SWITCH
//------------------------------------------------------------
document.querySelectorAll(".provider").forEach(btn=>{
    btn.onclick = ()=>{
        document.querySelectorAll(".provider").forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");
        renderGames(btn.dataset.provider);
    };
});


//------------------------------------------------------------
// INIT ALL
//------------------------------------------------------------
loadLinks();
loadBanners();
loadLogoStrip();
renderGames("PG");
