document.addEventListener('DOMContentLoaded', function () {
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby_XJMVo-0s9y3na1k52P-k6Il9b6XMT1EYUsTc4KX1axsakCZ7V6lEcEPAGbeEDDK2uQ/exec";

    const waForm = document.getElementById('waForm');
    let isSubmitting = false;

    if (waForm) {
        waForm.addEventListener('submit', function (e) {
            e.preventDefault();
            e.stopPropagation();

            if (isSubmitting) return;

            const submitBtn = waForm.querySelector('button[type="submit"]');
            
            // Ambil data input formulir
            const nama = document.getElementById('nama')?.value.trim() || '';
            const whatsapp = document.getElementById('whatsapp')?.value.trim() || '';
            const email = document.getElementById('email')?.value.trim() || '';
            const pekerjaan = document.getElementById('pekerjaan')?.value.trim() || '';
            const kota = document.getElementById('kota')?.value.trim() || '';
            const paket = document.getElementById('paket')?.value || 'Workshop Public Speaking Batch 27 (Rp 3.900.000)';
            const catatan = document.getElementById('catatan')?.value.trim() || '';

            isSubmitting = true;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerText = "⏳ Memproses Pendaftaran...";
            }

            const payloadData = {
                nama: nama,
                whatsapp: whatsapp,
                email: email,
                pekerjaan: pekerjaan,
                kota: kota,
                paket: paket,
                catatan: catatan
            };

            // Otomatis kirim data pendaftaran ke Apps Script / Google Sheets
            fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                },
                body: JSON.stringify(payloadData)
            })
            .then(() => console.log('Data pendaftaran terkirim ke Google Sheets!'))
            .catch(err => console.error('Error saat kirim ke Sheets:', err))
            .finally(() => {
                // Format pesan WA tanpa emoji bermasalah (menggunakan titik & garis tebal standar)
                const adminPhone = "6285182723319";
                const message = `Halo Admin, saya ingin mendaftar *Workshop Public Speaking Batch 27*.%0A%0A` +
                                `*DATA PESERTA:*%0A` +
                                `• Nama Lengkap: ${encodeURIComponent(nama)}%0A` +
                                `• No. WhatsApp: ${encodeURIComponent(whatsapp)}%0A` +
                                `• Email: ${encodeURIComponent(email)}%0A` +
                                `• Profesi/Instansi: ${encodeURIComponent(pekerjaan)}%0A` +
                                `• Kota Asal: ${encodeURIComponent(kota)}%0A%0A` +
                                `*Catatan/Target Bicara:*%0A` +
                                `• ${encodeURIComponent(catatan ? catatan : '-')}`;

                window.open(`https://wa.me/${adminPhone}?text=${message}`, '_blank');

                setTimeout(() => {
                    isSubmitting = false;
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerText = "📱 Kirim Pendaftaran via WhatsApp";
                    }
                }, 3000);
            });
        });
    }
});