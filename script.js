//------------------------------------------------------------
// DATA SOURCE (spreadsheet CSV)
//------------------------------------------------------------
const GAME_CSV =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?gid=0&single=true&output=csv";

const LINK_CSV =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?gid=1888859615&single=true&output=csv";

const BANNER_CSV =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?gid=773368200&single=true&output=csv";

const LOGO_CSV =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?gid=1030942322&single=true&output=csv";

const RTP_JSON =
"https://raw.githubusercontent.com/POPREDE/TEST/main/rtp.json";


//------------------------------------------------------------
// CSV PARSER
//------------------------------------------------------------
async function fetchCSV(url){
    const res = await fetch(url);
    const txt = await res.text();
    const rows = txt.trim().split("\n").map(r=>r.split(","));
    const head = rows.shift();
    return rows.map(r=>{
        const o={};
        r.forEach((v,i)=>o[head[i]] = v.trim());
        return o;
    });
}


//------------------------------------------------------------
// REGISTER & LOGIN & HEADER LOGO
//------------------------------------------------------------
async function loadLinks(){
    const list = await fetchCSV(LINK_CSV);
    const clean = x => x?.trim().toLowerCase();

    document.getElementById("btn-register").href =
        list.find(x => clean(x.key)==="register")?.value || "#";

    document.getElementById("btn-login").href =
        list.find(x => clean(x.key)==="login")?.value || "#";

    document.getElementById("logo-poprede").src =
        list.find(x => clean(x.key)==="logo")?.value || "";
}


//------------------------------------------------------------
// BANNER SLIDER — SLIDE 1 BANNER PENUH
//------------------------------------------------------------
let bannerList=[];
let bannerIndex=0;

async function loadBanners(){

    bannerList = await fetchCSV(BANNER_CSV);

    const track = document.getElementById("banner-track");
    const dots  = document.getElementById("banner-dots");
    const caption = document.getElementById("banner-caption");

    track.innerHTML="";
    dots.innerHTML="";

    bannerList.forEach((b,i)=>{
        track.innerHTML+=`
        <div class="banner-item">
            <img src="${b.banner_url}">
        </div>`;
        dots.innerHTML+=`<span class="dot ${i===0?"active":""}" data-id="${i}"></span>`;
    });

    caption.textContent = bannerList[0]?.banner_text || "";

    initBannerEngine();
}

function initBannerEngine(){

    const track=document.getElementById("banner-track");
    const items=document.querySelectorAll(".banner-item");
    const dots=document.querySelectorAll(".banner-dots .dot");
    const caption=document.getElementById("banner-caption");

    function move(n){
        bannerIndex = (n + bannerList.length) % bannerList.length;
        const offset = items[bannerIndex].offsetLeft * -1;
        track.style.transform = `translateX(${offset}px)`;

        dots.forEach(d=>d.classList.remove("active"));
        dots[bannerIndex].classList.add("active");

        caption.textContent = bannerList[bannerIndex]?.banner_text || "";
    }

    dots.forEach(dot=>{
        dot.onclick=()=>{
            move(Number(dot.dataset.id));
        };
    });

    setInterval(()=> move(bannerIndex+1), 3500);
}


//------------------------------------------------------------
// LOGO STRIP
//------------------------------------------------------------
async function loadLogoStrip(){
    const list = await fetchCSV(LOGO_CSV);
    const strip = document.getElementById("logo-strip");

    strip.innerHTML="";

    list.slice(0,2).forEach(l=>{
        strip.innerHTML += `<img src="${l.logo_url}">`;
    });
}


//------------------------------------------------------------
// RTP LOADER + GAME GRID
//------------------------------------------------------------
function getColor(r){
    if(r>=90) return "rtp-green";
    if(r>=70) return "rtp-yellow";
    return "rtp-red";
}

async function loadRTP(provider){
    const res = await fetch(RTP_JSON+"?cache="+Date.now());
    const json = await res.json();
    return json.provider[provider];
}

async function renderGames(provider="PG"){

    const all  = await fetchCSV(GAME_CSV);
    const list = all.filter(x => x.provider === provider);

    const rtp  = await loadRTP(provider);

    const grid = document.getElementById("game-grid");
    grid.innerHTML="";

    list.forEach((g,i)=>{
        const val = rtp[i] || 50;
        const color = getColor(val);

        grid.innerHTML += `
        <div class="card">

            <img src="${g.image_url}">
            <div class="game-name">${g.game_name}</div>

            <div class="rtp-bar-container">
                <div class="rtp-bar ${color}" data-value="${val}"></div>
            </div>

            <div class="rtp-text">${val}%</div>

        </div>`;
    });

    // Animate bar
    setTimeout(()=>{
        document.querySelectorAll(".rtp-bar").forEach(bar=>{
            bar.style.width = bar.dataset.value+"%";
        });
    },50);
}


//------------------------------------------------------------
// PROVIDER SWITCH
//------------------------------------------------------------
document.querySelectorAll(".provider").forEach(btn=>{
    btn.onclick=()=>{
        document.querySelectorAll(".provider")
            .forEach(x=>x.classList.remove("active"));

        btn.classList.add("active");
        renderGames(btn.dataset.provider);
    };
});


//------------------------------------------------------------
// INIT WEBSITE
//------------------------------------------------------------
loadLinks();
loadBanners();
loadLogoStrip();
renderGames("PG");
