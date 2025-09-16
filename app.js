// --- DEKLARASI VARIABEL GLOBAL ---
const modal = document.getElementById("image-modal");
const modalImage = document.getElementById("modal-image-content");
const modalOverlay = document.getElementById("successModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const installBtn = document.getElementById("installButton");
const leadForm = document.getElementById("leadForm");
const loadingMsg = document.getElementById("loadingMsg");
const errorMsg = document.getElementById("formErrorMsg");
const darkModeToggle = document.getElementById("dark-mode-toggle");
const fadeElems = document.querySelectorAll(".fade-in-element");
const mainHeader = document.querySelector('.main-header');

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
if (modal && modalImage) {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('gallery-image')) {
            modal.style.display = "flex"; // <-- GANTI MENJADI 'flex'
            modalImage.src = e.target.src;
        }

        if (e.target.classList.contains('modal-close')) {
            modal.style.display = "none";
        }
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });
}

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