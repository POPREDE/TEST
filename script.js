const SHEET_PRODUCTS =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vTTCtV7qFSDZDCVIDI2vkXzGxI5GbG8Ez8suIyx_TrDEXSS6t23s6QrFn9ttW079TZk6yenfuc5LVt1/pub?gid=0&single=true&output=csv";

const SHEET_HIGHLIGHT =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vTTCtV7qFSDZDCVIDI2vkXzGxI5GbG8Ez8suIyx_TrDEXSS6t23s6QrFn9ttW079TZk6yenfuc5LVt1/pub?gid=2032194924&single=true&output=csv";

let allProducts = [];
let categories = [];

/* LOAD HIGHLIGHT ⭐ */
Papa.parse(SHEET_HIGHLIGHT, {
    download: true,
    header: true,
    complete: res => {
        const box = document.getElementById("highlightSlider");

        res.data.forEach(item => {
            if (!item.img_url) return;

            box.innerHTML += `
                <div class="highlight-item" onclick="openImageViewer('${item.img_url}')">
                    <img src="${item.img_url}">
                    <div>
                        <div class="h-title">${item.name}</div>
                        <div class="h-price">${item.price || ""}</div>
                    </div>
                </div>`;
        });
    }
});

/* LOAD PRODUCTS */
Papa.parse(SHEET_PRODUCTS, {
    download: true,
    header: true,
    complete: res => {
        allProducts = res.data.filter(p => p.name);
        categories = [...new Set(allProducts.map(p => p.category))].filter(Boolean);

        renderProducts(allProducts);
        renderCategories();
    }
});

/* RENDER HOME GRID */
function renderProducts(list) {
    const grid = document.getElementById("productGrid");
    grid.innerHTML = "";

    list.forEach(p => {
        grid.innerHTML += `
            <div class="item">
                <img src="${p.img_url}" onclick="openImageViewer('${p.img_url}')">
                <div class="name">${p.name}</div>
                <div class="price">${p.price}</div>
            </div>`;
    });
}

/* RENDER CATEGORY LIST */
function renderCategories() {
    const list = document.getElementById("categoryList");
    list.innerHTML = "";

    categories.forEach(c => {
        list.innerHTML += `
            <div class="category-item" onclick="openCategory('${c}')">${c}</div>`;
    });
}

/* CATEGORY ITEM PAGE */
function openCategory(cat) {
    hideHeader();
    showPage("categoryItemPage");

    document.getElementById("categoryTitle").innerText = cat;

    const grid = document.getElementById("categoryGrid");
    grid.innerHTML = "";

    allProducts
        .filter(p => p.category === cat)
        .forEach(p => {
            grid.innerHTML += `
                <div class="item">
                    <img src="${p.img_url}" onclick="openImageViewer('${p.img_url}')">
                    <div class="name">${p.name}</div>
                    <div class="price">${p.price}</div>
                </div>`;
        });
}

/* PAGE SWITCH */
function showPage(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

function openHome() {
    showHeader();
    showPage("homePage");
}
function openCategoryPage() {
    hideHeader();
    showPage("categoryPage");
}

/* HEADER CONTROL */
function hideHeader() {
    document.getElementById("header").style.display = "none";
}
function showHeader() {
    document.getElementById("header").style.display = "flex";
}

/* SEARCH OVERLAY */
function openSearchOverlay() {
    document.getElementById("searchOverlay").style.display = "flex";
}
function closeSearchOverlay() {
    document.getElementById("searchOverlay").style.display = "none";
    closeSearch();
}

/* SEARCH LOGIC */
function applyFilters() {
    let q = document.getElementById("searchInput").value.toLowerCase();
    renderProducts(allProducts.filter(p => p.name.toLowerCase().includes(q)));
}
function closeSearch() {
    document.getElementById("searchInput").value = "";
    renderProducts(allProducts);
}

/* HIGHLIGHT MENU */
function toggleHighlightMenu() {
    document.getElementById("highlightMenu").classList.toggle("open");
}

/* IMAGE VIEWER */
function openImageViewer(src) {
    document.getElementById("viewerImg").src = src;
    document.getElementById("imageViewer").style.display = "flex";
}
function closeImageViewer() {
    document.getElementById("imageViewer").style.display = "none";
}
