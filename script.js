// --- PAGE LOAD ---
window.addEventListener("load", () => {
  document.getElementById("loading").style.display = "none";
});

// --- NAVIGATION ---
const navButtons = document.querySelectorAll(".nav-btn");
const tabContents = document.querySelectorAll(".tab-content");

function setActiveTab(tabId) {
  tabContents.forEach(tab => tab.classList.remove("active"));
  navButtons.forEach(btn => btn.classList.remove("active"));

  const activeTab = document.getElementById(tabId);
  if (activeTab) activeTab.classList.add("active");

  navButtons.forEach(btn => {
    if (btn.dataset.tab === tabId) btn.classList.add("active");
  });

  if (tabId === "properties") {
    resetPropertyFilters();
    showAllProperties();
  }
}

navButtons.forEach(btn => {
  btn.addEventListener("click", () => setActiveTab(btn.dataset.tab));
});

// --- SEARCH ICON LOGIC WITH BLUR ---
const searchToggle = document.getElementById("searchToggle");
const searchContainer = document.getElementById("searchContainer");
const searchInput = document.getElementById("searchInput");
const searchError = document.getElementById("searchError");
const hero = document.getElementById("home");
const homeBlurOverlay = document.getElementById("homeBlurOverlay");

searchToggle.addEventListener("click", () => {
  const showSearch = searchContainer.classList.toggle("hidden");

  if (!showSearch) {
    hero.classList.add("blur-active");
    homeBlurOverlay.classList.remove("hidden");
    searchError.classList.add("hidden");
    searchInput.focus();
  } else {
    hero.classList.remove("blur-active");
    homeBlurOverlay.classList.add("hidden");
  }
});

document.addEventListener("click", (e) => {
  const isInsideSearch = searchContainer.contains(e.target) || searchToggle.contains(e.target);
  if (!isInsideSearch && hero.classList.contains("blur-active")) {
    searchContainer.classList.add("hidden");
    hero.classList.remove("blur-active");
    homeBlurOverlay.classList.add("hidden");
  }
});

function showAllProperties() {
  document.querySelectorAll(".property-card").forEach(card => card.style.display = "block");
}

// --- SEARCH FUNCTIONALITY ---
function searchProperty() {
  const query = searchInput.value.trim().toLowerCase();
  const properties = document.querySelectorAll(".property-card");
  let found = false;

  if (query === "") {
    showAllProperties();
    searchError.classList.add("hidden");
    document.getElementById("noResultsMessage").style.display = "none";
    return;
  }

  properties.forEach(card => {
    const name = card.dataset.name?.toLowerCase() || "";
    const country = card.dataset.country?.toLowerCase() || "";
    const city = card.dataset.city?.toLowerCase() || "";

    const match = name.includes(query) || country.includes(query) || city.includes(query);
    card.style.display = match ? "block" : "none";
    if (match) found = true;
  });

  searchError.classList.toggle("hidden", found);
  document.getElementById("noResultsMessage").style.display = found ? "none" : "block";

  if (found) setActiveTab("properties");

  hero.classList.remove("blur-active");
  searchContainer.classList.add("hidden");
  homeBlurOverlay.classList.add("hidden");
}

document.getElementById("searchButton").addEventListener("click", searchProperty);
searchInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    searchProperty();
  }
});

// --- FILTER LOGIC ---
const filterPopup = document.getElementById("filterPopup");
const filterToggle = document.getElementById("filterToggle");
const blurOverlay = document.getElementById("blurOverlay");

function applyPropertyFilters() {
  const filters = {
    country: document.getElementById("countryFilter").value.toLowerCase(),
    city: document.getElementById("cityFilter").value.toLowerCase(),
    land: parseInt(document.getElementById("landSizeFilter").value),
    cityDist: parseFloat(document.getElementById("distanceToCityFilter").value),
    beachDist: parseFloat(document.getElementById("distanceToBeachFilter").value),
    budget: parseInt(document.getElementById("budgetFilter").value),
    population: parseInt(document.getElementById("populationFilter").value),
  };

  const cards = document.querySelectorAll(".property-card");
  let found = false;

  cards.forEach(card => {
    const checks = [
      !filters.country || card.dataset.country?.includes(filters.country),
      !filters.city || card.dataset.city?.includes(filters.city),
      isNaN(filters.land) || parseInt(card.dataset.land) >= filters.land,
      isNaN(filters.cityDist) || parseFloat(card.dataset.cityDistance) <= filters.cityDist,
      isNaN(filters.beachDist) || parseFloat(card.dataset.beachDistance) <= filters.beachDist,
      isNaN(filters.budget) || parseInt(card.dataset.budget) <= filters.budget,
      isNaN(filters.population) || parseInt(card.dataset.population) >= filters.population,
    ];
    const visible = checks.every(Boolean);
    card.style.display = visible ? "block" : "none";
    if (visible) found = true;
  });

  document.getElementById("noResultsMessage").style.display = found ? "none" : "block";
  filterPopup.classList.remove("active");
  blurOverlay.classList.remove("active");
  blurOverlay.classList.add("hidden");
}

document.getElementById("applyFilters").addEventListener("click", applyPropertyFilters);

document.getElementById("closeFilter").addEventListener("click", () => {
  filterPopup.classList.remove("active");
  blurOverlay.classList.remove("active");
  blurOverlay.classList.add("hidden");
});

filterToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  filterPopup.classList.add("active");
  blurOverlay.classList.add("active");
  blurOverlay.classList.remove("hidden");
});

blurOverlay.addEventListener("click", () => {
  filterPopup.classList.remove("active");
  blurOverlay.classList.remove("active");
  blurOverlay.classList.add("hidden");
});

function resetPropertyFilters() {
  ["countryFilter", "cityFilter", "landSizeFilter", "distanceToCityFilter", "distanceToBeachFilter", "budgetFilter", "populationFilter"].forEach(id => {
    document.getElementById(id).value = "";
  });
  document.getElementById("noResultsMessage").style.display = "none";
  showAllProperties();
}

// --- FAQ NAVIGATION ---
document.querySelectorAll('.faq-card').forEach(card => {
  card.addEventListener('click', () => setActiveTab(card.dataset.tab));
});
document.querySelectorAll('.back-btn').forEach(btn => {
  btn.addEventListener('click', () => setActiveTab('vault'));
});

// --- MOBILE NAV TOGGLE ---
document.addEventListener("DOMContentLoaded", function () {
    const hamburger = document.querySelector(".hamburger");
    const navLinks = document.querySelector(".nav-links");

    hamburger.addEventListener("click", function () {
      navLinks.classList.toggle("mobile");
      navLinks.classList.toggle("active");
    });
  });

// --- COUNTRY FILTER ONLY ---
document.getElementById("countryFilter").addEventListener("change", function () {
  const selectedCountry = this.value.toLowerCase();
  const cards = document.querySelectorAll(".property-card");
  let found = false;

  cards.forEach(card => {
    const country = card.dataset.country?.toLowerCase() || "";
    if (!selectedCountry || country === selectedCountry) {
      card.style.display = "block";
      found = true;
    } else {
      card.style.display = "none";
    }
  });

  document.getElementById("noResultsMessage").style.display = found ? "none" : "block";
});

// --- Property Modal Logic ---
const propertyDetail = document.getElementById("propertyDetail");
const closePropertyDetail = document.getElementById("closePropertyDetail");
const modalTitle = document.getElementById("modalTitle");
const modalDescription = document.getElementById("modalDescription");
const modalPrice = document.getElementById("modalPrice");
const modalImage = document.getElementById("modalImage");
const prevImage = document.getElementById("prevImage");
const nextImage = document.getElementById("nextImage");

let currentImages = [];
let currentImageIndex = 0;

// Öppna modal vid klick på property-card
document.querySelectorAll(".property-card").forEach(card => {
  card.addEventListener("click", () => {
    // Hämta bilder
    const imagesData = card.dataset.images || card.querySelector("img")?.src || "";
    currentImages = imagesData.split(",").map(url => url.trim());
    currentImageIndex = 0;

    // Sätt bild
    modalImage.src = currentImages[currentImageIndex];

    // Sätt innehåll
    modalTitle.textContent = card.querySelector("h3")?.textContent || "No title";
    const descFromHTML = card.querySelector(".description")?.textContent.trim();
modalDescription.textContent = card.dataset.description || descFromHTML || "Ingen beskrivning tillgänglig.";

    const price = card.dataset.budget ? `Price: €${Number(card.dataset.budget).toLocaleString()}` : "";
    modalPrice.textContent = price;

    // Visa modal
    propertyDetail.classList.add("active");
    propertyDetail.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  });
});

// Navigera bilder
prevImage.addEventListener("click", (e) => {
  e.stopPropagation();
  if (currentImages.length) {
    currentImageIndex = (currentImageIndex - 1 + currentImages.length) % currentImages.length;
    modalImage.src = currentImages[currentImageIndex];
  }
});

nextImage.addEventListener("click", (e) => {
  e.stopPropagation();
  if (currentImages.length) {
    currentImageIndex = (currentImageIndex + 1) % currentImages.length;
    modalImage.src = currentImages[currentImageIndex];
  }
});

// Stäng modal
closePropertyDetail.addEventListener("click", () => {
  propertyDetail.classList.remove("active");
  setTimeout(() => {
    propertyDetail.classList.add("hidden");
    document.body.style.overflow = "";
  }, 400);
});

propertyDetail.addEventListener("click", (e) => {
  if (e.target === propertyDetail) {
    propertyDetail.classList.remove("active");
    setTimeout(() => {
      propertyDetail.classList.add("hidden");
      document.body.style.overflow = "";
    }, 400);
  }
});


// Modal Contact Form Logic
const openContactFormBtn = document.getElementById("openContactForm");
const modalContactForm = document.getElementById("modalContactForm");
const modalContactEmail = document.getElementById("modalContactEmail");
const modalContactStatus = document.getElementById("modalContactStatus");

openContactFormBtn.addEventListener("click", () => {
  modalContactForm.classList.add("visible");
  modalContactForm.classList.remove("hidden");
  modalContactEmail.focus();
  openContactFormBtn.style.display = "none";
});

modalContactForm.addEventListener("submit", function(e) {
  e.preventDefault();
  modalContactStatus.textContent = "Sending...";
  modalContactStatus.style.color = "#007aff";
  // Use EmailJS to send the email
 src="https://cdn.jsdelivr.net/npm/emailjs-com@3/dist/email.min.js"

   emailjs.init("LIGhuOBvexlJzWLNw"); // 🛠 Ersätt med din riktiga Public Key

  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    status.textContent = "Sending...";

    emailjs.sendForm("service_rswkwdf", "template_33m4vbo", this)
      .then(() => {
        status.textContent = "Thank you! Your message has been sent.";
        form.reset();
      }, (error) => {
        status.textContent = "Oops! Something went wrong.";
        console.error("EmailJS Error:", error);
      });
  });

});
function openContactForm(propertyId) {
  const modal = document.getElementById('contact-modal');
  modal.style.display = 'flex';
  document.getElementById('property-id').value = propertyId;
}

function closeModal() {
  document.getElementById('contact-modal').style.display = 'none';
}
document.querySelectorAll(".nav-links button").forEach((btn) => {
  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});
/* --- VIAESTATE BLOG --- */
(function(){
  const posts = [
    {
      id: "occitanie-2025-real-estate",
      title: "Why Occitanie Is a Smart Bet for Real Estate in 2025",
      summary: "Affordable prices, sunny climate, strong second-home market and international interest in Occitanie.",
      body: `
  <p>Occitanie offers sun-drenched landscapes, historic villages and dynamic cities. It now leads France in second-home ownership, with about 501 000 secondary residences—roughly 16 % of the national total.</p>
  <p>Median house prices in Occitanie average €2 287/m²—well below the Côte d’Azur—making it a highly attractive value market.</p>
  <p>A third of homes in Aude are second residences; coastal and rural areas draw both domestic and international buyers thanks to climate, culture and accessibility.</p>
  <p>Despite a national slowdown in 2023, second-home purchases by US buyers rose 39 % in Occitanie; UK, Belgian and German interest remains strong.</p>
`,

      category: "France",
      author: "ViaEstate",
      date: "2025-08-13",
      readMin: 4,
      image: "https://images.unsplash.com/photo-1699611466985-ab04e05d5579?q=80&w=1182&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      views: 620
    },
    
   
  ];
    
  

  // --- DOM refs
  const grid = document.getElementById("blogGrid");
  const chips = document.getElementById("blogChips");
  const featured = document.getElementById("blogFeatured");
  const searchInput = document.getElementById("blogSearch");
  const clearBtn = document.getElementById("blogClear");
  const sortSelect = document.getElementById("blogSort");
  const prevBtn = document.getElementById("blogPrev");
  const nextBtn = document.getElementById("blogNext");
  const pageInfo = document.getElementById("blogPageInfo");
  const emptyMsg = document.getElementById("blogEmpty");

  // Reader
  const reader = document.getElementById("blogReader");
  const readerClose = document.getElementById("blogReaderClose");
  const readerTitle = document.getElementById("readerTitle");
  const readerMeta = document.getElementById("readerMeta");
  const readerBody = document.getElementById("readerBody");
  const readerCover = document.getElementById("readerCover");
  const readerCategory = document.getElementById("readerCategory");
  const readerProgress = document.getElementById("blogReadProgress");
  const shareBtn = document.getElementById("blogShare");

  // --- State
  let state = {
    q: "",
    cat: "Alla",
    sort: "date_desc",
    page: 1,
    perPage: 6
  };

  const categories = ["Alla", ...Array.from(new Set(posts.map(p => p.category)))];

  function applyFilters(){
    let list = posts.slice();

    // search
    if(state.q){
      const q = state.q.toLowerCase();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    // category
    if(state.cat !== "Alla"){
      list = list.filter(p => p.category === state.cat);
    }
    // sort
    if(state.sort === "date_desc") list.sort((a,b)=> new Date(b.date)-new Date(a.date));
    if(state.sort === "date_asc") list.sort((a,b)=> new Date(a.date)-new Date(b.date));
    if(state.sort === "pop_desc") list.sort((a,b)=> b.views-a.views);

    return list;
  }

  function renderChips(){
    chips.innerHTML = "";
    categories.forEach(cat=>{
      const btn = document.createElement("button");
      btn.className = "chip" + (state.cat===cat ? " is-active":"");
      btn.textContent = cat;
      btn.addEventListener("click", ()=>{
        state.cat = cat;
        state.page = 1;
        render();
      });
      chips.appendChild(btn);
    });
  }

  function renderFeatured(list){
    if(!list.length){ featured.innerHTML=""; return; }
    const top = list[0];
    featured.innerHTML = `
      <article class="card">
        <img src="${top.image}" alt="">
        <div class="card-body">
          <div class="blog-eyebrow">${top.category}</div>
          <h3>${top.title}</h3>
          <p>${top.summary}</p>
          <div class="blog-meta">${formatDate(top.date)} · ${top.readMin} min</div>
          <div style="margin-top:10px">
            <button class="blog-btn gold" data-read="${top.id}">Read</button>
          </div>
        </div>
      </article>
    `;
    featured.querySelector("[data-read]").addEventListener("click", ()=>openReader(top.id));
  }

  function renderGrid(list){
    grid.setAttribute("aria-busy","true");
    grid.innerHTML = "";
    const start = (state.page-1)*state.perPage;
    const pageItems = list.slice(start, start + state.perPage);

    pageItems.forEach(p=>{
      const card = document.createElement("article");
      card.className = "blog-card";
      card.innerHTML = `
        <img src="${p.image}" alt="">
        <div class="card-body">
          <div class="blog-eyebrow">${p.category}</div>
          <h3>${p.title}</h3>
          <p>${p.summary}</p>
          <div class="blog-meta">${formatDate(p.date)} · ${p.readMin} min</div>
          <div>
            <button class="blog-btn" data-read="${p.id}">Läs</button>
          </div>
        </div>
      `;
      card.querySelector("[data-read]").addEventListener("click", ()=>openReader(p.id));
      grid.appendChild(card);
    });

    grid.setAttribute("aria-busy","false");
  }

  function renderPagination(total){
    const pages = Math.max(1, Math.ceil(total / state.perPage));
    prevBtn.disabled = state.page <= 1;
    nextBtn.disabled = state.page >= pages;
    pageInfo.textContent = `Sida ${state.page} / ${pages}`;
  }

  function render(){
    renderChips();
    const list = applyFilters();
    emptyMsg.hidden = list.length > 0;
    renderFeatured(list);
    renderGrid(list);
    renderPagination(list.length);
  }

  function openReader(id){
    const p = posts.find(x=>x.id===id);
    if(!p) return;
    readerTitle.textContent = p.title;
    readerMeta.textContent = `${p.author} · ${formatDate(p.date)} · ${p.readMin} min`;
    readerBody.innerHTML = p.body;
    readerCover.src = p.image;
    readerCover.alt = p.title;
    readerCategory.textContent = p.category;
    reader.showModal();
    readerProgress.style.width = "0";
    readerBody.scrollTop = 0;
  }

  function formatDate(d){
    const date = new Date(d);
    return date.toLocaleDateString("sv-SE", { year:"numeric", month:"short", day:"2-digit" });
  }

  // events
  searchInput.addEventListener("input", (e)=>{ state.q = e.target.value.trim(); state.page=1; render(); });
  clearBtn.addEventListener("click", ()=>{ searchInput.value=""; state.q=""; state.page=1; render(); });
  sortSelect.addEventListener("change", (e)=>{ state.sort = e.target.value; state.page=1; render(); });
  prevBtn.addEventListener("click", ()=>{ if(state.page>1){ state.page--; render(); }});
  nextBtn.addEventListener("click", ()=>{ state.page++; render(); });

  readerClose.addEventListener("click", ()=> reader.close());
  reader.addEventListener("close", ()=>{ readerProgress.style.width = "0"; });
  readerBody.addEventListener("scroll", ()=>{
    const el = readerBody;
    const pct = (el.scrollTop) / (el.scrollHeight - el.clientHeight);
    readerProgress.style.width = (Math.min(1, Math.max(0,pct)) * 100) + "%";
  });
  if(shareBtn && navigator.share){
    shareBtn.addEventListener("click", ()=>{
      const title = readerTitle.textContent;
      navigator.share({ title, text: title, url: location.href }).catch(()=>{});
    });
  }

  // init
  render();
})();
