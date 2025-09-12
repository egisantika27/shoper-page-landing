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

// Mengambil ID pengunjung unik dari localStorage
const getVisitorId = () => {
  let visitorId = localStorage.getItem('visitorId');
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem('visitorId', visitorId);
  }
  return visitorId;
};

// Mengambil parameter iklan dari URL
const getQueryParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    ttclid: params.get('ttclid'),
    fbclid: params.get('fbclid'),
  };
};

// Fungsi utama untuk mengirim event tracking
const trackEvent = async (eventName, eventData) => {
  try {
    console.log(`Mempersiapkan pengiriman event '${eventName}'...`);
    
    // Langkah 3: Mengumpulkan semua data yang relevan
    const clientInfo = {
      clientId: getVisitorId(),
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      fbc: getCookie('_fbc'),
      fbp: getCookie('_fbp'),
      ttp: getCookie('_ttp'),
      ...getQueryParams(),
    };

    const payload = {
      eventName,
      eventData,
      clientInfo,
    };

    // Langkah 4: Mengirim payload ke endpoint events-log
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
      // Langkah 1 & 2: Kirim data formulir ke backend database
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
        // ✅ HANYA JIKA BERHASIL, panggil fungsi tracking
        // Meneruskan payload yang sama ke fungsi tracking
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
  // Logika untuk menampilkan tombol 'X' dihapus dari sini
}

function closeModal() {
  if (!modalOverlay) return;
  modalOverlay.classList.remove("show");
  if (closeModalBtn) closeModalBtn.classList.remove("visible");
}

if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);

// ✅ Tambahkan event listener baru untuk menampilkan tombol 'X'
// Tombol 'X' hanya akan muncul saat user mengklik tombol "Install"
if (installBtn && closeModalBtn) {
  installBtn.addEventListener("click", () => {
    setTimeout(() => closeModalBtn.classList.add("visible"), 500);
  });
}




