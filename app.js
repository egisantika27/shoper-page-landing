// --- DARK MODE TOGGLE ---
const darkModeToggle = document.getElementById("dark-mode-toggle");
if (darkModeToggle) {
  darkModeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem(
      "darkMode",
      document.body.classList.contains("dark-mode") ? "enabled" : "disabled"
    );
  });

  if (localStorage.getItem("darkMode") === "enabled") {
    document.body.classList.add("dark-mode");
  }
}

// --- FADE-IN ON SCROLL ---
const fadeElems = document.querySelectorAll(".fade-in-element");
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("is-visible");
    });
  },
  { threshold: 0.2 }
);
fadeElems.forEach((el) => observer.observe(el));

// --- FORM HANDLING ---
const leadForm = document.getElementById("leadForm");
const loadingMsg = document.getElementById("loadingMsg");
const errorMsg = document.getElementById("formErrorMsg");
const modalOverlay = document.getElementById("successModal");
const closeModalBtn = document.getElementById("closeModalBtn");

if (leadForm) {
  leadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // reset messages
    if (loadingMsg) loadingMsg.style.display = "block";
    if (errorMsg) errorMsg.style.display = "none";

    const formData = new FormData(leadForm);
    const payload = {
      nama: formData.get("nama"),
      email: formData.get("email"),
      phone: formData.get("wa"), // mapping WhatsApp ke phone
      source_page: window.location.href,
      user_agent: navigator.userAgent,
    };

    try {
      const response = await fetch(
        "https://shoper-api-endpoint-vercel.vercel.app/api/collect-lead",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      if (loadingMsg) loadingMsg.style.display = "none";

      if (response.ok && result.success) {
        showModal();
        leadForm.reset();
      } else {
        if (errorMsg) {
          errorMsg.textContent = result.error || "Terjadi kesalahan server";
          errorMsg.style.display = "block";
        }
        console.error("Server error:", result.error || "Unknown error");
      }
    } catch (err) {
      if (loadingMsg) loadingMsg.style.display = "none";
      if (errorMsg) {
        errorMsg.textContent = "Gagal mengirim data. Silakan coba lagi.";
        errorMsg.style.display = "block";
      }
      console.error("Request error:", err);
    }
  });
}

// --- MODAL HANDLING ---
function showModal() {
  if (!modalOverlay) return;
  modalOverlay.classList.add("show");
  if (closeModalBtn) {
    setTimeout(() => closeModalBtn.classList.add("visible"), 500);
  }
}

function closeModal() {
  if (!modalOverlay) return;
  modalOverlay.classList.remove("show");
  if (closeModalBtn) closeModalBtn.classList.remove("visible");
}

if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);

// Klik di luar modal untuk menutup
if (modalOverlay) {
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });
}

