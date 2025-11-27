//------------------------------------------------------------
// CSV SOURCES
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
// CSV READER
//------------------------------------------------------------
async function fetchCSV(url){
    const res = await fetch(url);
    const txt = await res.text();
    const rows = txt.trim().split("\n").map(r=>r.split(","));
    const head = rows.shift();
    return rows.map(r=>{
        let o={};
        r.forEach((v,i)=>o[head[i]] = v.trim());
        return o;
    });
}


//------------------------------------------------------------
// LOAD REGISTER, LOGIN, HEADER LOGO
//------------------------------------------------------------
async function loadLinks(){
    const data = await fetchCSV(LINK_CSV);
    const clean = x => x?.trim().toLowerCase();

    document.getElementById("btn-register").href =
        data.find(x => clean(x.key)==="register")?.value || "#";

    document.getElementById("btn-login").href =
        data.find(x => clean(x.key)==="login")?.value || "#";

    document.getElementById("logo-poprede").src =
        data.find(x => clean(x.key)==="header_logo")?.value || "";
}


//------------------------------------------------------------
// BANNER (FULL SLIDE RESTORED)
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
        dots.innerHTML+=`
        <span class="dot ${i===0?"active":""}" data-id="${i}"></span>`;
    });

    caption.textContent = bannerList[0]?.banner_text || "";

    let imgs = track.querySelectorAll("img");
    let loaded = 0;

    imgs.forEach(img=>{
        img.onload = ()=>{
            loaded++;
            if(loaded === imgs.length){
                initBannerEngine();
            }
        };
    });
}

function initBannerEngine(){

    const track = document.getElementById("banner-track");
    const dots  = document.querySelectorAll(".dot");
    const caption = document.getElementById("banner-caption");
    const items = document.querySelectorAll(".banner-item");

    function move(n){
        bannerIndex = (n + bannerList.length) % bannerList.length;
        const width = items[bannerIndex].clientWidth;
        track.style.transform = `translateX(-${bannerIndex * width}px)`;

        dots.forEach(d=>d.classList.remove("active"));
        dots[bannerIndex].classList.add("active");

        caption.textContent = bannerList[bannerIndex].banner_text;
    }

    dots.forEach(dot=>{
        dot.onclick = ()=> move(Number(dot.dataset.id));
    });

    setInterval(()=> move(bannerIndex+1), 3500);
}


//------------------------------------------------------------
// LOGO STRIP (PG & PRAG)
//------------------------------------------------------------
async function loadLogoStrip(){
    const list = await fetchCSV(LOGO_CSV);
    const strip = document.getElementById("logo-strip");

    strip.innerHTML = "";

    list.slice(0,2).forEach(l=>{
        const url = l.logo_url || l.Logo || l.img || "";
        strip.innerHTML += `<img src="${url}">`;
    });
}


//------------------------------------------------------------
// RTP COLOR
//------------------------------------------------------------
function getColor(r){
    if(r>=90) return "rtp-green";
    if(r>=70) return "rtp-yellow";
    return "rtp-red";
}


//------------------------------------------------------------
// LOAD RTP + GAME GRID
//------------------------------------------------------------
async function loadRTP(provider){
    const res = await fetch(RTP_JSON+"?t="+Date.now());
    const json = await res.json();
    return json.provider[provider];
}

async function renderGames(provider="PG"){

    const all = await fetchCSV(GAME_CSV);
    const list = all.filter(x => x.provider === provider);
    const rtp = await loadRTP(provider);

    const grid = document.getElementById("game-grid");
    grid.innerHTML = "";

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

    // Animate bars
    setTimeout(()=>{
        document.querySelectorAll(".rtp-bar").forEach(bar=>{
            bar.style.width = bar.dataset.value+"%";
        });
    },80);
}


//------------------------------------------------------------
// PROVIDER BUTTONS
//------------------------------------------------------------
document.querySelectorAll(".provider").forEach(btn=>{
    btn.onclick=()=>{
        document.querySelectorAll(".provider").forEach(x=>x.classList.remove("active"));
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
