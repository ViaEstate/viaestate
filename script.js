window.addEventListener("load", () => {
  document.getElementById("loading").style.display = "none";
});

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
}

navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.tab;
    setActiveTab(target);
  });
});

const cards = document.querySelectorAll(".property-card");
cards.forEach(card => {
  card.addEventListener("click", () => {
    const detailTab = card.dataset.tab;
    if (detailTab) setActiveTab(detailTab);
  });
});

function searchProperty() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  const match = Array.from(cards).find(card =>
    card.dataset.name.includes(query)
  );
  if (match) {
    setActiveTab(match.dataset.tab);
  } else {
    alert("No matching property found.");
  }
}

document.getElementById("searchInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    searchProperty();
  }
});

function submitContact(e) {
  e.preventDefault();
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const message = document.getElementById("message").value;

  if (!name || !email || !message) {
    alert("Please fill in all fields.");
    return;
  }

  console.log("Message sent:", { name, email, message });
  alert("Thanks for contacting us!");

  e.target.reset();
}
document.querySelectorAll(".faq-card").forEach(card => {
  card.addEventListener("click", () => {
    const tab = card.dataset.tab;
    setActiveTab(tab);
  });
});
const faqData = {
  "buying-process": {
    title: "How does the buying process work?",
    text: "The buying process varies by country, but typically includes property selection, offer submission, legal review, signing of contracts, and final payment. We guide you at every step to ensure a secure transaction."
  },
  "financing": {
    title: "How can I get financing as a foreign buyer?",
    text: "ViaEstate partners with international lenders to help you explore your mortgage options, even as a non-resident. Contact us to connect with the right institutions for your needs."
  },
  "inspection": {
    title: "What does an independent property inspection include?",
    text: "An independent inspection evaluates the structure, systems, and safety of the property before purchase. This helps you understand the true condition and avoid unexpected costs."
  }
};

function openFaq(id) {
  const answerBox = document.getElementById("faq-answer");
  const title = document.getElementById("faq-title");
  const text = document.getElementById("faq-text");

  if (faqData[id]) {
    title.textContent = faqData[id].title;
    text.textContent = faqData[id].text;
    answerBox.style.display = "block";
  }
}

function closeFaq() {
  document.getElementById("faq-answer").style.display = "none";
}
