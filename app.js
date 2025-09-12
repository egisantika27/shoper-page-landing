document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("leadForm");
  const submitBtn = document.getElementById("submitBtn");
  const loadingMsg = document.getElementById("loadingMsg");
  const formErrorMsg = document.getElementById("formErrorMsg");

  const modal = document.getElementById("successModal");
  const closeModalBtn = document.getElementById("closeModalBtn");

  // --- Tutup modal ---
  closeModalBtn.addEventListener("click", () => {
    modal.classList.remove("show");
    closeModalBtn.classList.remove("visible");
  });

  // --- Dark mode toggle ---
  const darkToggle = document.getElementById("dark-mode-toggle");
  darkToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
  });

  // --- Form submit ---
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    formErrorMsg.style.display = "none";
    loadingMsg.style.display = "block";

    const formData = {
      nama: document.getElementById("nama").value.trim(),
      email: document.getElementById("email").value.trim(),
      phone: document.getElementById("wa").value.trim(),
      source_page: window.location.href,
      user_agent: navigator.userAgent
    };

    try {
      const res = await fetch("https://shoper-api-endpoint-vercel.vercel.app/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const result = await res.json();

      loadingMsg.style.display = "none";

      if (!res.ok) {
        formErrorMsg.textContent = result.error || "Terjadi kesalahan";
        formErrorMsg.style.display = "block";
        return;
      }

      // Reset form
      form.reset();

      // Tampilkan modal sukses
      modal.classList.add("show");
      closeModalBtn.classList.add("visible");

    } catch (err) {
      console.error("Request error:", err);
      loadingMsg.style.display = "none";
      formErrorMsg.textContent = "Gagal mengirim data. Silakan coba lagi.";
      formErrorMsg.style.display = "block";
    }
  });
});
