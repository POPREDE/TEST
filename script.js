//------------------------------------------------------------
// CSV SOURCES (FINAL)
//------------------------------------------------------------
const GAME_CSV   = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?gid=0&single=true&output=csv";
const LINK_CSV   = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?gid=1888859615&single=true&output=csv";
const BANNER_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?gid=773368200&single=true&output=csv";

const LOGO_CSV   = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?output=csv";


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
// RTP GENERATOR PER GAME
//------------------------------------------------------------
function generateRTPList(games) {
    const total = games.length;

    // 3–4 game = 98%
    const high98 = Math.floor(Math.random() * 2) + 3;

    // 10 game = 90–97
    const highRange = 10;

    let arr = [];

    // 98% games
    for (let i = 0; i < high98; i++) {
        arr.push(98);
    }

    // 90–97%
    for (let i = 0; i < highRange; i++) {
        arr.push( Math.floor(Math.random() * 8) + 90 );
    }

    // Sisanya 50–89%
    while (arr.length < total) {
        arr.push( Math.floor(Math.random() * 40) + 50 );
    }

    // Shuffle
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random()* (i+1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
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
// LOAD REGISTER / LOGIN
//------------------------------------------------------------
async function loadLinks() {
    const list = await fetchCSV(LINK_CSV);
    document.getElementById("btn-register").href = list.find(x=>x.key==="register")?.value;
    document.getElementById("btn-login").href = list.find(x=>x.key==="login")?.value;
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
        </div>`;

        dots.innerHTML += `<span class="dot ${i===0?"active":""}" data-id="${i}"></span>`;
    });

    startSlider(list.length);
}


// Slider Logic
let slideIndex = 0;
let slideTimer;

function startSlider(total) {
    const track = document.getElementById("slider-track");
    const dots = document.querySelectorAll(".dot");

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
// LOGO STRIP (Full Width)
//------------------------------------------------------------
async function loadLogoStrip() {
    const list = await fetchCSV(LOGO_CSV);
    const wrap = document.getElementById("logo-strip");

    wrap.innerHTML = "";

    list.forEach(logo=>{
        wrap.innerHTML += `<img src="${logo.logo_url}">`;
    });
}


//------------------------------------------------------------
// GAME GRID (Provider-Based)
//------------------------------------------------------------
async function renderGames(providerSelect="PG") {
    const allGames = await fetchCSV(GAME_CSV);
    const games = providerSelect === "ALL"
        ? allGames
        : allGames.filter(g => g.provider === providerSelect);

    const grid = document.getElementById("game-grid");
    grid.innerHTML = "";

    const rtpList = generateRTPList(games);

    games.forEach((g, i)=>{
        const rtp = rtpList[i];
        const color = getColorClass(rtp);

        grid.innerHTML += `
        <div class="card">
            <img src="${g.image_url}">
            <div class="game-name">${g.game_name}</div>

            <div class="rtp-bar-container">
                <div class="rtp-bar ${color}" style="width:${rtp}%;"></div>
            </div>

            <div class="rtp-text">${rtp}%</div>
        </div>`;
    });
}


//------------------------------------------------------------
// Provider Buttons
//------------------------------------------------------------
document.querySelectorAll(".provider").forEach(btn=>{
    btn.onclick = ()=>{
        document.querySelectorAll(".provider").forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");

        const provider = btn.dataset.provider;
        renderGames(provider);
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

console.log("RTP Live Premium Loaded.");
