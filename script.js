//------------------------------------------------------------
// CSV SOURCES (FINAL FROM USER)
//------------------------------------------------------------
const GAME_CSV   = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?gid=0&single=true&output=csv";
const LINK_CSV   = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?gid=1888859615&single=true&output=csv";
const BANNER_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?gid=773368200&single=true&output=csv";

// LOGO GRID — ambil 2 banner pertama sebagai logo
const LOGO_SOURCE = BANNER_CSV;


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
// RTP SYSTEM
//------------------------------------------------------------
const MIN_DAILY = 50;
const MAX_DAILY = 98;
const MIN_CHANGE = 0.1;
const MAX_CHANGE = 1;
const INTERVAL = 5 * 60 * 1000;
const STORAGE_KEY = "rtpPremium";

function loadRTP() {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const today = new Date().getDate();

    if (!saved) {
        const base = randomDaily();
        saveRTP(base, base, today);
        return {base,rtp:base,today};
    }

    if (saved.today !== today) {
        const base = randomDaily();
        saveRTP(base, base, today);
        return {base,rtp:base,today};
    }

    return saved;
}
function saveRTP(base, rtp, today) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({base,rtp,today}));
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

    const dir = Math.random() < 0.5 ? -1 : 1;
    rtp = Number((rtp + dir * randomMinuteChange()).toFixed(2));

    if (rtp > 99.9) rtp = 99.9;
    if (rtp < 30) rtp = 30;

    saveRTP(data.base, rtp, data.today);
}


//------------------------------------------------------------
// LOAD REGISTER / LOGIN
//------------------------------------------------------------
async function loadLinks() {
    const list = await fetchCSV(LINK_CSV);
    document.getElementById("btn-register").href = list.find(x=>x.key==="register")?.value || "#";
    document.getElementById("btn-login").href    = list.find(x=>x.key==="login")?.value || "#";
}


//------------------------------------------------------------
// BANNER SLIDER
//------------------------------------------------------------
async function loadBanners() {
    const list = await fetchCSV(BANNER_CSV);
    const track = document.getElementById("slider-track");
    const dots  = document.getElementById("slider-dots");

    track.innerHTML = "";
    dots.innerHTML = "";

    list.forEach((b,i)=>{
        track.innerHTML += `
        <div class="slide">
            <img src="${b.banner_url}">
            ${b.banner_text ? `<div class="slide-text">${b.banner_text}</div>` : ""}
        </div>`;
        dots.innerHTML += `<span class="dot ${i===0?'active':''}" data-id="${i}"></span>`;
    });

    startSlider(list.length);
}


// SLIDER AUTO
let slideIndex = 0;
let slideTimer;

function startSlider(total) {
    const track = document.getElementById("slider-track");
    const dots  = document.querySelectorAll(".dot");

    function move(n) {
        slideIndex = (n + total) % total;
        track.style.transform = `translateX(-${slideIndex*100}%)`;

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
        slideTimer = setInterval(()=>move(slideIndex+1), 4000);
    }
    auto();
}


//------------------------------------------------------------
// LOGO GRID (ambil 2 banner pertama)
//------------------------------------------------------------
async function loadLogoGrid() {
    const list = await fetchCSV(LOGO_SOURCE);
    const wrap = document.getElementById("logo-grid");

    wrap.innerHTML = "";

    list.slice(0,2).forEach(b=>{
        wrap.innerHTML += `<img src="${b.banner_url}">`;
    });
}


//------------------------------------------------------------
// GAME LIST
//------------------------------------------------------------
async function renderGames(provider="ALL") {
    const list = await fetchCSV(GAME_CSV);
    const wrap = document.getElementById("rtp-container");
    wrap.innerHTML = "";

    const rtp = loadRTP().rtp;

    list
    .filter(g => provider==="ALL" || g.provider===provider)
    .forEach(g=>{
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


//------------------------------------------------------------
// PROVIDER BUTTON EVENTS
//------------------------------------------------------------
document.querySelectorAll(".provider").forEach(btn=>{
    btn.onclick = ()=>{
        document.querySelectorAll(".provider").forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");
        renderGames(btn.dataset.provider);
    };
});


//------------------------------------------------------------
// RUN EVERYTHING
//------------------------------------------------------------
loadLinks();
loadBanners();
loadLogoGrid();
renderGames();

setInterval(()=>{
    updateRTP();
    const prov = document.querySelector(".provider.active").dataset.provider;
    renderGames(prov);
}, INTERVAL);
