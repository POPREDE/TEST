/* ===========================================
   MULTI-SHEET CSV URLS (PUNYA KAMU)
   =========================================== */

const CSV = {
    gamelist: "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?gid=0&single=true&output=csv",

    links: "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?gid=1888859615&single=true&output=csv",

    banners: "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?gid=773368200&single=true&output=csv",

    logogrid: "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?gid=1030942322&single=true&output=csv"
};


/* ===========================================
   LOAD CSV
   =========================================== */
async function loadCSV(url) {
    const res = await fetch(url);
    const text = await res.text();
    return text.trim().split("\n").map(r => r.split(","));
}


/* ===========================================
   INIT (LOAD ALL SHEETS)
   =========================================== */
async function initSite() {

    const gameRows   = await loadCSV(CSV.gamelist);
    const linkRows   = await loadCSV(CSV.links);
    const bannerRows = await loadCSV(CSV.banners);
    const logoRows   = await loadCSV(CSV.logogrid);


    /* -----------------------------------------------------
       LINKS SHEET → HEADER + HERO
       ----------------------------------------------------- */
    linkRows.forEach(r => {
        const key   = r[0];
        const img   = r[1];
        const value = r[2];

        if (key === "header_logo") {
            document.getElementById("header_logo").src = img;
        }

        if (key === "header_btn") {
            document.getElementById("header_btn").href = value;
        }

        if (key === "hero_title") {
            document.getElementById("hero_title").innerText = value;
        }

        if (key === "hero_desc") {
            document.getElementById("hero_desc").innerText = value;
        }
    });



    /* -----------------------------------------------------
       BANNERS SHEET
       ----------------------------------------------------- */
    let banners = bannerRows.map(r => ({
        img: r[0],
        link: r[1],
        caption: r[2] || ""
    }));

    generateBanner(banners);



    /* -----------------------------------------------------
       LOGO GRID SHEET
       ----------------------------------------------------- */
    let logos = logoRows.map(r => ({
        img: r[0],
        link: r[1]
    }));

    generateLogos(logos);



    /* -----------------------------------------------------
       GAMELIST SHEET
       ----------------------------------------------------- */
    let games = gameRows.map(r => ({
        provider: r[0],
        img: r[1],
        name: r[2],
        rtp: Number(r[3])
    }));

    generateGames(games);
}

initSite();



/* ===========================================
   BANNER SLIDER
   =========================================== */
function generateBanner(list) {
    const track   = document.getElementById("bannerTrack");
    const dots    = document.getElementById("bannerDots");
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

        dots.innerHTML += `
            <span class="dot ${i===0?"active":""}" data-index="${i}"></span>
        `;
    });

    caption.innerText = list[0]?.caption ?? "";

    let index = 0;

    setInterval(() => {
        index = (index + 1) % list.length;
        track.style.transform = `translateX(-${index * 100}%)`;
        caption.innerText = list[index].caption;

        [...dots.children].forEach(d => d.classList.remove("active"));
        dots.children[index].classList.add("active");

    }, 3500);
}



/* ===========================================
   LOGO GRID GENERATOR
   =========================================== */
function generateLogos(list) {
    let html = "";

    list.forEach(l => {
        html += `
            <a href="${l.link}">
                <img src="${l.img}">
            </a>
        `;
    });

    document.getElementById("logoStrip").innerHTML = html;
}



/* ===========================================
   GAME GRID GENERATOR
   =========================================== */
function generateGames(list) {
    let html = "";

    list.forEach(g => {
        let barColor =
            g.rtp >= 80 ? "rtp-green" :
            g.rtp >= 60 ? "rtp-yellow" :
                          "rtp-red";

        html += `
            <div class="card">

                <img src="${g.img}">
                
                <div class="game-name">${g.name}</div>

                <div class="rtp-bar-container">
                    <div class="rtp-bar ${barColor}" style="width:${g.rtp}%"></div>
                </div>

                <div class="rtp-text">${g.rtp}% RTP</div>

            </div>
        `;
    });

    document.getElementById("game-grid").innerHTML = html;
}
