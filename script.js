/* ===========================
   GOOGLE SHEET CONFIG
   =========================== */

const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?output=csv";


/* ===========================
   LOAD CSV
   =========================== */
async function loadCSV() {
    const res = await fetch(sheetURL);
    const text = await res.text();
    return text.split("\n").map(r => r.split(","));
}


/* ===========================
   PUT DATA INTO WEBSITE
   =========================== */
async function initSite() {
    const rows = await loadCSV();

    let banners = [];
    let logos = [];
    let games = [];

    rows.forEach(r => {
        const type = r[0];
        const img = r[1];
        const link = r[2];
        const extra = r[3] || "";

        if (type === "header_logo") document.getElementById("header_logo").src = img;
        if (type === "header_button") document.getElementById("header_btn").href = link;

        if (type === "hero_title") document.getElementById("hero_title").innerText = extra;
        if (type === "hero_desc")  document.getElementById("hero_desc").innerText = extra;

        if (type.includes("banner")) banners.push({img, link, caption: extra});
        if (type.includes("logo_")) logos.push({img, link});

        if (type === "game") games.push({img, name: extra, rtp: Number(link)});
    });

    generateBanner(banners);
    generateLogos(logos);
    generateGames(games);
}

initSite();



/* ===========================
   BANNER SLIDER
   =========================== */
function generateBanner(list) {
    const track = document.getElementById("bannerTrack");
    const dots  = document.getElementById("bannerDots");
    const caption = document.getElementById("bannerCaption");

    track.innerHTML = "";
    dots.innerHTML = "";

    list.forEach((b,i) => {
        track.innerHTML += `
            <div class="banner-item">
                <a href="${b.link}">
                    <img src="${b.img}">
                </a>
            </div>
        `;
        dots.innerHTML += `<span class="dot ${i===0?'active':''}" data-index="${i}"></span>`;
    });

    caption.innerText = list[0].caption;

    let index = 0;
    setInterval(() => {
        index = (index + 1) % list.length;
        track.style.transform = `translateX(-${index * 100}%)`;
        caption.innerText = list[index].caption;

        [...dots.children].forEach(d => d.classList.remove("active"));
        dots.children[index].classList.add("active");

    }, 3500);
}



/* ===========================
   LOGOS
   =========================== */
function generateLogos(list) {
    let out = "";
    list.forEach(l => {
        out += `
            <a href="${l.link}">
                <img src="${l.img}">
            </a>
        `;
    })
    document.getElementById("logoStrip").innerHTML = out;
}



/* ===========================
   GAME GRID
   =========================== */
function generateGames(list) {
    let out = "";

    list.forEach(g => {
        let color =
            g.rtp >= 80 ? "rtp-green" :
            g.rtp >= 60 ? "rtp-yellow" : "rtp-red";

        out += `
            <div class="card">
                <img src="${g.img}">
                <div class="game-name">${g.name}</div>

                <div class="rtp-bar-container">
                    <div class="rtp-bar ${color}" style="width:${g.rtp}%"></div>
                </div>

                <div class="rtp-text">${g.rtp}% RTP</div>
            </div>
        `;
    });

    document.getElementById("game-grid").innerHTML = out;
}
