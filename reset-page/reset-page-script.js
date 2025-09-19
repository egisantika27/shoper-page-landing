// app.js - Logika untuk halaman Update Kata Sandi

document.addEventListener('DOMContentLoaded', function() {
    
    // --- Inisialisasi Supabase Client ---
    const SUPABASE_URL = 'https://psstmdfdoantnlmicvcp.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzc3RtZGZkb2FudG5sbWljdmNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMjMwMzUsImV4cCI6MjA3MDg5OTAzNX0.YJTfXgGmbNdNoNa-77QZfZqbBUNJdZk-x7WGsFW6IJE';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // --- Seleksi Elemen DOM ---
    const form = document.getElementById('update-password-form');
    const messageDiv = document.getElementById('message');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');

    // --- Event Listener untuk Submit Form ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Mencegah form di-submit secara default
        
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        // Reset pesan notifikasi
        messageDiv.textContent = '';
        messageDiv.className = 'message';

        // --- Validasi Input ---
        if (password !== confirmPassword) {
            messageDiv.textContent = 'Kata sandi tidak cocok. Silakan coba lagi.';
            messageDiv.classList.add('error');
            return;
        }
        
        if (!/^\d{6}$/.test(password)) {
            messageDiv.textContent = 'Kata sandi harus terdiri dari 6 digit angka.';
            messageDiv.classList.add('error');
            return;
        }

        // --- Memperbarui Kata Sandi di Supabase ---
        const { error } = await supabase.auth.updateUser({ password: password });

        if (error) {
            messageDiv.textContent = `Error: ${error.message}`;
            messageDiv.classList.add('error');
        } else {
            messageDiv.textContent = 'Kata sandi Anda berhasil diperbarui! Silahkan login dengan kata sandi terbaru.';
            messageDiv.classList.add('success');
            form.reset(); // Mengosongkan form setelah berhasil
        }
    });
});
