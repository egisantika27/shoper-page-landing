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

// --- HELPER FUNCTIONS UNTUK TRACKING ---
// Mengambil nilai cookie
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

// Mengambil parameter iklan dari URL
const getQueryParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    ttclid: params.get('ttclid'),
    fbclid: params.get('fbclid'),
  };
};

// ✅ FUNGSI BARU: Mengumpulkan semua info klien dan sesi
const getClientInfo = () => {
  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('sessionId', sessionId);
  }

  return {
    sessionId: sessionId,
    url: window.location.href,
    referrer: document.referrer,
    userAgent: navigator.userAgent,
    // Mengambil cookie yang relevan
    fbc: getCookie('_fbc'),
    fbp: getCookie('_fbp'),
    ttp: getCookie('_ttp'),
    ...getQueryParams(),
  };
};

// Fungsi utama untuk mengirim event tracking
const trackEvent = async (eventName, eventData) => {
  try {
    console.log(`Mempersiapkan pengiriman event '${eventName}'...`);
    
    // ✅ PERUBAHAN: Mengumpulkan semua data klien dan sesi
    const clientInfo = getClientInfo();

    const payload = {
  eventName,
  eventId: crypto.randomUUID(), // biar unik
  eventData: {
    value: eventData.value ?? 0,
    currency: eventData.currency ?? "IDR",
    contentType: eventData.contentType ?? "page",
    contents: eventData.contents ?? null,
    ...eventData,
  },
  clientInfo,
};

    // Mengirim payload ke endpoint events-log
    const response = await fetch('https://psstmdfdoantnlmicvcp.supabase.co/functions/v1/events-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Events Log API error: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ Event '${eventName}' berhasil dikirim ke events-log:`, result);
  } catch (error) {
    console.error(`❌ Gagal mengirim event tracking:`, error);
  }
};

// --- FORM HANDLING ---
const leadForm = document.getElementById("leadForm");
const loadingMsg = document.getElementById("loadingMsg");
const errorMsg = document.getElementById("formErrorMsg");
const modalOverlay = document.getElementById("successModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const installBtn = document.querySelector(".install-button");

// Fungsi untuk mengelola status UI formulir
function setFormStatus(isLoading, errorMessage = null) {
  if (loadingMsg) {
    loadingMsg.style.display = isLoading ? "block" : "none";
  }
  if (errorMsg) {
    errorMsg.textContent = errorMessage || "";
    errorMsg.style.display = errorMessage ? "block" : "none";
  }
}

if (leadForm) {
  leadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    setFormStatus(true);
    const formData = new FormData(leadForm);
    const payload = {
      nama: formData.get("nama")?.toString().trim() || "",
      email: formData.get("email")?.toString().trim() || "",
      phone: formData.get("phone")?.toString().trim() || "",
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
      setFormStatus(false);

      if (response.ok && result.success) {
        await trackEvent('Lead', payload);
        showModal();
        leadForm.reset();
      } else {
        setFormStatus(false, result.error || "Terjadi kesalahan server");
        console.error("Server error:", result.error || "Unknown error");
      }
    } catch (err) {
      setFormStatus(false, "Gagal mengirim data. Silakan coba lagi.");
      console.error("Request error:", err);
    }
  });
}

// --- MODAL HANDLING ---
function showModal() {
  if (!modalOverlay) return;
  modalOverlay.classList.add("show");
}

function closeModal() {
  if (!modalOverlay) return;
  modalOverlay.classList.remove("show");
  if (closeModalBtn) closeModalBtn.classList.remove("visible");
}

if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
if (installBtn && closeModalBtn) {
  installBtn.addEventListener("click", () => {
    setTimeout(() => closeModalBtn.classList.add("visible"), 500);
  });
}

// --- EVENT TRACKING UNTUK PAGEVIEW ---
window.addEventListener('load', () => {
  trackEvent('PageView', {
      page_title: document.title,
      page_location: window.location.href,
      referrer: document.referrer,
  });
});

// --- EVENT TRACKING UNTUK VIEWCONTENT (ON SCROLL) ---
let hasViewedContent = false;
const handleScroll = () => {
  if (hasViewedContent) {
    window.removeEventListener('scroll', handleScroll);
    return;
  }
  
  const scrollPosition = window.scrollY;
  const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollPercentage = (scrollPosition / totalHeight) * 100;
  
  if (scrollPercentage >= 80) {
    trackEvent('ViewContent', {
      page_title: document.title,
      page_location: window.location.href,
    });
    hasViewedContent = true;
    console.log('✅ Event ViewContent berhasil dikirim setelah mencapai 80% scroll');
  }
};
window.addEventListener('scroll', handleScroll);










