const modalOverlay = document.getElementById("successModal");
const installBtn = document.getElementById("installButton");
const leadForm = document.getElementById("leadForm");
const loadingMsg = document.getElementById("loadingMsg");
const errorMsg = document.getElementById("formErrorMsg");
const darkModeToggle = document.getElementById("dark-mode-toggle");
const fadeElems = document.querySelectorAll(".fade-in-element");
const mainHeader = document.querySelector('.main-header');

// // --- TAMPILKAN MODAL UNTUK TESTING (SEMENTARA) ---
// if (modalOverlay) {
//     modalOverlay.classList.add("show");
// }

document.addEventListener("DOMContentLoaded", () => {
  const images = document.querySelectorAll(".gallery-image");
  const lightbox = document.createElement("div");
  lightbox.classList.add("lightbox");
  lightbox.innerHTML = `
    <button class="lightbox-close" aria-label="Tutup">&times;</button>
    <img src="" alt="Preview" />
  `;
  document.body.appendChild(lightbox);

  const lightboxImg = lightbox.querySelector("img");
  const closeBtn = lightbox.querySelector(".lightbox-close");

  let scale = 1;
  let isDragging = false;
  let hasDragged = false;
  let startX, startY, translateX = 0, translateY = 0;

  function resetZoom() {
    scale = 1;
    translateX = 0;
    translateY = 0;
    lightboxImg.style.transform = `translate(0, 0) scale(1)`;
  }

  images.forEach(img => {
    img.addEventListener("click", () => {
      resetZoom();
      lightboxImg.src = img.src;
      lightbox.classList.add("active");
    });
  });

  closeBtn.addEventListener("click", () => lightbox.classList.remove("active"));
  lightbox.addEventListener("click", e => {
    if (e.target === lightbox) lightbox.classList.remove("active");
  });

  // --- Perbaikan di sini: Tambahkan event listener 'wheel' pada elemen 'lightbox'
  lightbox.addEventListener("wheel", e => {
    e.preventDefault();
    if (e.deltaY < 0) {
      scale = Math.min(scale + 0.2, 5);
    } else {
      scale = Math.max(scale - 0.2, 1);
      if (scale === 1) {
        resetZoom();
      }
    }
    // Update transform hanya jika scale > 1 atau jika sudah di reset
    if (scale > 1) {
       lightboxImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    } else {
       lightboxImg.style.transform = `translate(0, 0) scale(1)`;
    }
  });

  lightboxImg.addEventListener("mousedown", e => {
    if (scale <= 1) return;
    isDragging = true;
    hasDragged = false;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    lightboxImg.style.cursor = "grabbing";
    e.preventDefault();
  });

  window.addEventListener("mouseup", () => {
    isDragging = false;
    lightboxImg.style.cursor = "grab";
  });

  lightboxImg.addEventListener("mousemove", e => {
    if (!isDragging) return;

    const newTranslateX = e.clientX - startX;
    const newTranslateY = e.clientY - startY;
    
    const imgWidth = lightboxImg.offsetWidth * scale;
    const imgHeight = lightboxImg.offsetHeight * scale;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const maxTranslateX = (imgWidth - viewportWidth) / 2;
    const maxTranslateY = (imgHeight - viewportHeight) / 2;

    translateX = Math.max(-maxTranslateX, Math.min(newTranslateX, maxTranslateX));
    translateY = Math.max(-maxTranslateY, Math.min(newTranslateY, maxTranslateY));

    if (!hasDragged && (Math.abs(newTranslateX) > 5 || Math.abs(newTranslateY) > 5)) {
      hasDragged = true;
    }

    lightboxImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  });

  lightbox.addEventListener('click', e => {
    if(hasDragged) {
      e.stopPropagation();
      hasDragged = false;
    }
  }, true);
});


// --- DARK MODE TOGGLE ---
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
const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.2 }
);
fadeElems.forEach((el) => observer.observe(el));

// --- STICKY HEADER ---
if (mainHeader) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            mainHeader.classList.add('scrolled');
        } else {
            mainHeader.classList.remove('scrolled');
        }
    });
}

// --- IMAGE FULLSCREEN HANDLING (Delegasi Event) ---


// --- HELPER FUNCTIONS UNTUK TRACKING ---
const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
};
const getQueryParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
        ttclid: params.get('ttclid'),
        fbclid: params.get('fbclid'),
    };
};
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
        fbc: getCookie('_fbc'),
        fbp: getCookie('_fbp'),
        ttp: getCookie('_ttp'),
        ...getQueryParams(),
    };
};
const trackEvent = async (eventName, eventData) => {
    try {
        console.log(`Mempersiapkan pengiriman event '${eventName}'...`);
        const clientInfo = getClientInfo();
        const payload = {
            eventName,
            eventId: crypto.randomUUID(), 
            eventData: {
                value: eventData.value ?? 1,
                currency: eventData.currency ?? "IDR",
                contentType: eventData.contentType ?? "page",
                contents: eventData.contents ?? null,
                ...eventData,
            },
            clientInfo,
        };
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
if (leadForm) {
    function setFormStatus(isLoading, errorMessage = null) {
        if (loadingMsg) {
            loadingMsg.style.display = isLoading ? "block" : "none";
        }
        if (errorMsg) {
            errorMsg.textContent = errorMessage || "";
            errorMsg.style.display = errorMessage ? "block" : "none";
        }
        const submitBtn = leadForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = isLoading;
        }
    }
    function validateForm() {
        let isValid = true;
        const inputs = leadForm.querySelectorAll('input[required]');
        inputs.forEach(input => {
            const errorElement = document.getElementById(`err-${input.id}`);
            if (!input.checkValidity()) {
                input.classList.add('invalid');
                if (errorElement) errorElement.style.display = 'block';
                isValid = false;
            } else {
                input.classList.remove('invalid');
                if (errorElement) errorElement.style.display = 'none';
            }
        });
        return isValid;
    }
    leadForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        setFormStatus(false);
        if (!validateForm()) {
            setFormStatus(false, 'Harap isi semua kolom dengan format yang benar.');
            return;
        }
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
                const userMessage = result.error === 'Email sudah terdaftar' 
                    ? 'Email ini sudah terdaftar. Silakan gunakan email lain.'
                    : 'Terjadi kesalahan saat pengiriman data. Silakan coba lagi.';
                setFormStatus(false, userMessage);
                console.error("Server error:", result.error || "Unknown error");
            }
        } catch (err) {
            setFormStatus(false, "Gagal mengirim data. Silakan periksa koneksi internet Anda.");
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
        closeModalBtn.classList.add("visible");
    });
}
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
    const scrollPercentage = (totalHeight > 0) ? (scrollPosition / totalHeight) * 100 : 0;
    if (scrollPercentage >= 80) {
        trackEvent('ViewContent', {
            value: 1, 
            currency: "IDR",
            contentType: "product", 
            contents: [
                {
                    id: "PAGEVIEW-DEFAULT", 
                    content_id: "PAGEVIEW-DEFAULT",
                    quantity: 1,
                    price: 1
                }
            ],
            page_title: document.title,
            page_location: window.location.href,
        });
        hasViewedContent = true;
        console.log('✅ Event ViewContent berhasil dikirim setelah mencapai 80% scroll');
    }
};
window.addEventListener('scroll', handleScroll);