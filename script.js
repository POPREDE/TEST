//------------------------------------------------------------
// CSV SOURCES
//------------------------------------------------------------
const GAME_CSV   = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?gid=0&single=true&output=csv";
const LINK_CSV   = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?gid=1888859615&single=true&output=csv";
const BANNER_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?gid=773368200&single=true&output=csv";
const LOGO_CSV   = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?single=true&output=csv";

const RTP_JSON = "https://raw.githubusercontent.com/POPREDE/TEST/main/rtp.json";


//------------------------------------------------------------
// CSV PARSER
//------------------------------------------------------------
async function fetchCSV(url) {
    const res = await fetch(url);
    const text = await res.text();
    const rows = text.split("\n").map(r => r.split(","));
    const headers = rows.shift().map(h => h.trim());

    return rows.map(row => {
        let obj = {};
        row.forEach((val, i) => obj[headers[i]] = val.trim());
        return obj;
    });
}


//------------------------------------------------------------
// LINKS + LOGO POPREDE
//------------------------------------------------------------
async function loadLinks() {
    const list = await fetchCSV(LINK_CSV);

    const clean = x => x?.trim().toLowerCase();

    document.getElementById("btn-register").href =
        list.find(x => clean(x.key) === "register")?.value || "#";

    document.getElementById("btn-login").href =
        list.find(x => clean(x.key) === "login")?.value || "#";

    // LOAD HEADER LOGO
    document.getElementById("logo-poprede").src =
        list.find(x => clean(x.key) === "logo")?.value || "";
}


//------------------------------------------------------------
// BANNER SLIDER
//------------------------------------------------------------
async function loadBanners() {
    const list = await fetchCSV(BANNER_CSV);

    const track = document.getElementById("banner-track");
    const caption = document.getElementById("banner-caption");
    const dots = document.getElementById("banner-dots");

    track.innerHTML = "";
    dots.innerHTML = "";
    caption.innerHTML = "";

    list.forEach((b, i) => {
        track.innerHTML += `
            <div class="banner-slide">
                <img src="${b.banner_url}">
            </div>
        `;

        dots.innerHTML += `<span class="dot ${i===0?'active':''}" data-id="${i}"></span>`;
    });

    caption.textContent = list.length > 0 ? list[0].banner_text : "";

    startBannerSlider(list);
}

let bIndex = 0;
let bannerTimer;

function startBannerSlider(list) {

    const total = list.length;
    const track = document.getElementById("banner-track");
    const dots = document.querySelectorAll(".banner-dots .dot");
    const caption = document.getElementById("banner-caption");

    function move(n) {
        bIndex = (n + total) % total;
        track.style.transform = `translateX(-${bIndex * 100}%)`;

        dots.forEach(d => d.classList.remove("active"));
        dots[bIndex].classList.add("active");

        caption.textContent = list[bIndex].banner_text;
    }

    dots.forEach(dot => {
        dot.onclick = () => {
            clearInterval(bannerTimer);
            move(Number(dot.dataset.id));
            auto();
        };
    });

    function auto() {
        bannerTimer = setInterval(() => move(bIndex + 1), 4000);
    }

    auto();
}


//------------------------------------------------------------
// LOGO STRIP (PG / PRAGMATIC ONLY)
//------------------------------------------------------------
async function loadLogoStrip() {
    const list = await fetchCSV(LOGO_CSV);
    const wrap = document.getElementById("logo-strip");

    wrap.innerHTML = "";

    const logos = list.filter(l =>
        l.provider?.toLowerCase().includes("pg") ||
        l.provider?.toLowerCase().includes("pragmatic")
    ).slice(0, 2);

    logos.forEach(logo => {
        wrap.innerHTML += `<img src="${logo.logo_url}">`;
    });
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

    const allGames = await fetchCSV(GAME_CSV);
    const games = allGames.filter(g => g.provider === provider);

    const rtpList = await loadRTP(provider);

    const grid = document.getElementById("game-grid");
    grid.innerHTML = "";

    games.forEach((g,i)=>{
        const rtp = rtpList[i] || 50;
        const color = getColorClass(rtp);

        grid.innerHTML += `
        <div class="card">
            <img src="${g.image_url}">
            <div class="game-name">${g.game_name}</div>

            <div class="rtp-bar-container">
                <div class="rtp-bar ${color}" style="width:${rtp}%"></div>
            </div>

            <div class="rtp-text">${rtp}%</div>
        </div>`;
    });

}


//------------------------------------------------------------
// PROVIDER SWITCHER
//------------------------------------------------------------
document.querySelectorAll(".provider").forEach(btn=>{
    btn.onclick = () => {
        document.querySelectorAll(".provider").forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");
        renderGames(btn.dataset.provider);
    };
});


//------------------------------------------------------------
// INITIAL LOAD
//------------------------------------------------------------
loadLinks();
loadBanners();
loadLogoStrip();

document.getElementById("default-provider").classList.add("active");
renderGames("PG");
