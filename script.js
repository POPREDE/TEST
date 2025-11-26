const SHEET_PRODUCTS =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vTTCtV7qFSDZDCVIDI2vkXzGxI5GbG8Ez8suIyx_TrDEXSS6t23s6QrFn9ttW079TZk6yenfuc5LVt1/pub?gid=0&single=true&output=csv";

const SHEET_HIGHLIGHT =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vTTCtV7qFSDZDCVIDI2vkXzGxI5GbG8Ez8suIyx_TrDEXSS6t23s6QrFn9ttW079TZk6yenfuc5LVt1/pub?gid=2032194924&single=true&output=csv";

let allProducts = [];
let categories = [];

/* ========== LOAD HIGHLIGHT (⭐) ========== */
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
                    <div class="highlight-info">
                        <div class="h-title">${item.name}</div>
                        <div class="h-price">${item.price || ""}</div>
                    </div>
                </div>`;
        });
    }
});

/* ========== LOAD PRODUCTS ========== */
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

/* ========== HOME RENDER ========== */
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

/* ========== CATEGORY LIST PAGE ========== */
function renderCategories() {
    const list = document.getElementById("categoryList");
    list.innerHTML = "";

    categories.forEach(c => {
        list.innerHTML += `
            <div class="category-item" onclick="openCategory('${c}')">${c}</div>`;
    });
}

/* ========== CATEGORY DETAIL ========== */
function openCategory(cat) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById("categoryItemPage").classList.add("active");

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

/* ========== NAVIGATION ========== */
function openHome() {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById("homePage").classList.add("active");
}

function openCategoryPage() {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById("categoryPage").classList.add("active");
}

/* ========== SEARCH ========== */
function applyFilters() {
    let q = document.getElementById("searchInput").value.toLowerCase();
    renderProducts(allProducts.filter(p => p.name.toLowerCase().includes(q)));
}
function closeSearch() {
    document.getElementById("searchInput").value = "";
    renderProducts(allProducts);
}

/* ========== HIGHLIGHT PANEL ========== */
function toggleHighlightMenu() {
    document.getElementById("highlightMenu").classList.toggle("open");
}

/* ========== IMAGE VIEWER ========== */
function openImageViewer(src) {
    document.getElementById("viewerImg").src = src;
    document.getElementById("imageViewer").style.display = "flex";
}
function closeImageViewer() {
    document.getElementById("imageViewer").style.display = "none";
}
