//------------------------------------------------------------
// CSV SOURCES
//------------------------------------------------------------
const GAME_CSV   = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?gid=0&single=true&output=csv";
const LINK_CSV   = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?gid=1888859615&single=true&output=csv";
const BANNER_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?gid=773368200&single=true&output=csv";
const LOGO_CSV   = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?single=true&output=csv";


//------------------------------------------------------------
// GLOBAL RTP JSON SOURCE
//------------------------------------------------------------
// 🔥 GANTI DENGAN REPO KAMU
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
// LOAD GLOBAL RTP (everyone sees same data)
//------------------------------------------------------------
async function loadRTP(provider) {
    // Add timestamp to bypass browser cache
    const res = await fetch(RTP_JSON + "?t=" + Date.now());
    const data = await res.json();

    return data.provider[provider];
}


//------------------------------------------------------------
// COLOR LOGIC
//------------------------------------------------------------
function getColorClass(rtp) {
    if (rtp >= 90) return "rtp-green";
    if (rtp >= 70) return "rtp-yellow";
    return "rtp-red";
}


//------------------------------------------------------------
// REGISTER / LOGIN LINKS
//------------------------------------------------------------
async function loadLinks() {
    const list = await fetchCSV(LINK_CSV);

    const clean = str => str?.trim().toLowerCase();

    document.getElementById("btn-register").href =
        list.find(x => clean(x.key) === "register")?.value?.trim() || "#";

    document.getElementById("btn-login").href =
        list.find(x => clean(x.key) === "login")?.value?.trim() || "#";
}


//------------------------------------------------------------
// BANNER SLIDER
//------------------------------------------------------------
async function loadBanners() {
    const list = await fetchCSV(BANNER_CSV);
    const track = document.getElementById("slider-track");
    const dots = document.getElementById("slider-dots");

    track.innerHTML = "";
    dots.innerHTML = "";

    list.forEach((b,i)=>{
        track.innerHTML += `
            <div class="slide">
                <img src="${b.banner_url}">
                ${b.banner_text ? `<div class="slide-text">${b.banner_text}</div>` : ""}
            </div>
        `;
        dots.innerHTML += `<span class="dot ${i===0?"active":""}" data-id="${i}"></span>`;
    });

    startSlider(list.length);
}


let slideIndex = 0;
let slideTimer;

function startSlider(total) {
    const track = document.getElementById("slider-track");
    const dots = document.querySelectorAll(".dot");

    function move(n) {
        slideIndex = (n + total) % total;
        track.style.transform = `translateX(-${slideIndex * 100}%)`;

        dots.forEach(d=>d.classList.remove("active"));
        dots[slideIndex].classList.add("active");
    }

    dots.forEach(d=>{
        d.onclick = ()=>{
            clearInterval(slideTimer);
            move(Number(d.dataset.id));
            auto();
        };
    });

    function auto() {
        slideTimer = setInterval(()=>move(slideIndex + 1), 4000);
    }
    auto();
}


//------------------------------------------------------------
// LOGO PROVIDER STRIP (PG & Pragmatic only)
//------------------------------------------------------------
async function loadLogoStrip() {
    const list = await fetchCSV(LOGO_CSV);
    const wrap = document.getElementById("logo-strip");

    wrap.innerHTML = "";

    const logos = list.filter(l =>
        l.provider?.toLowerCase().includes("pg") ||
        l.provider?.toLowerCase().includes("pragmatic")
    ).slice(0,2);

    logos.forEach(logo=>{
        wrap.innerHTML += `<img src="${logo.logo_url}">`;
    });
}


//------------------------------------------------------------
// GAME GRID (uses global RTP)
//------------------------------------------------------------
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
// PROVIDER BUTTONS
//------------------------------------------------------------
document.querySelectorAll(".provider").forEach(btn=>{
    btn.onclick = ()=>{
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
