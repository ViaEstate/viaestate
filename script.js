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
const navLinks = document.querySelector(".nav-links");
document.getElementById("hamburgerBtn").addEventListener("click", () => {
  navLinks.classList.toggle("active");
  navLinks.classList.toggle("mobile");
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
