document.addEventListener('DOMContentLoaded', function () {
    const paketInput = document.getElementById('paket');
    const pagePackage = paketInput ? paketInput.value.toLowerCase() : '';

    // 1. DETEKSI KATEGORI KURSI AKTIF BERDASARKAN HALAMAN PAKET
    let activeCategory = '';
    if (pagePackage.includes('bronze') || pagePackage.includes('paket 1')) {
        activeCategory = 'bronze';
    } else if (pagePackage.includes('silver') || pagePackage.includes('paket 2')) {
        activeCategory = 'silver';
    } else if (pagePackage.includes('gold') || pagePackage.includes('platinum') || pagePackage.includes('paket 3')) {
        activeCategory = 'platinum';
    }

    // 2. GENERATE SEAT MEJA BUNDAR
    // Zona Gold (2 Meja @ 5 Seat = 10 Seat: G-01 s/d G-10)
    buildRoundTable('table-G1', 'G', 1, 5, 'platinum', activeCategory);
    buildRoundTable('table-G2', 'G', 6, 5, 'platinum', activeCategory);

    // Zona Silver (5 Meja @ 4 Seat = 20 Seat: S-01 s/d S-20)
    for (let i = 1; i <= 5; i++) {
        const startNum = (i - 1) * 4 + 1;
        buildRoundTable(`table-S${i}`, 'S', startNum, 4, 'silver', activeCategory);
    }

    // Zona Bronze (14 Meja @ 5 Seat = 70 Seat: B-01 s/d B-70)
    for (let i = 1; i <= 14; i++) {
        const startNum = (i - 1) * 5 + 1;
        buildRoundTable(`table-B${i}`, 'B', startNum, 5, 'bronze', activeCategory);
    }

    // 3. INTEGRASI GOOGLE APPS SCRIPT
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyGvpVPtQThqRS_zK-IKznDEQcOnQ0kj44zM82VtOCUd_M2OV4BtDa9RTCl-yyThDCPkw/exec";
    fetchSeatsFromSheet(SCRIPT_URL);

    // 4. HANDLER PENDAFTARAN FORM & WHATSAPP (DENGAN DEBOUNCE ANTI-DOUBLE)
    const waForm = document.getElementById('waForm');
    let isSubmitting = false; // Flag pencegah submit ganda

    if (waForm) {
        waForm.addEventListener('submit', function (e) {
            e.preventDefault();
            e.stopPropagation();

            if (isSubmitting) return; // Hentikan jika sedang dalam proses submit

            const submitBtn = waForm.querySelector('button[type="submit"]');
            const nama = document.getElementById('nama')?.value.trim() || '';
            const whatsapp = document.getElementById('whatsapp')?.value.trim() || '';
            const paket = paketInput ? paketInput.value : 'Workshop Public Speaking Batch 27';
            const seatTerpilih = document.getElementById('selectedSeatInput')?.value.trim() || '';
            const catatan = document.getElementById('catatan')?.value.trim() || '';

            if (!seatTerpilih) {
                alert('Silakan pilih nomor kursi Anda pada denah terlebih dahulu!');
                return;
            }

            // Lock status submit & tombol
            isSubmitting = true;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerText = "⏳ Memproses Pendaftaran...";
            }

            // Tandai kursi terisi langsung di interface web
            markOccupiedSeats([seatTerpilih]);

            // Formulasi payload JSON
            const payloadData = {
                nama: nama,
                whatsapp: whatsapp,
                paket: paket,
                seat: seatTerpilih,
                catatan: catatan
            };

            // Kirim request via text/plain (Bebas CORS)
            fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                },
                body: JSON.stringify(payloadData)
            })
            .then(() => {
                console.log('Data pendaftaran berhasil dikirim ke Google Sheets!');
            })
            .catch(err => {
                console.error('Gagal mengirim data ke Google Sheets:', err);
            })
            .finally(() => {
                // Buka WhatsApp Admin setelah fetch terlepas
                const adminPhone = "6285182723319";
                const message = `Halo Admin, saya ingin mendaftar workshop.%0A%0A` +
                                `*Nama:* ${encodeURIComponent(nama)}%0A` +
                                `*No. WhatsApp:* ${encodeURIComponent(whatsapp)}%0A` +
                                `*Pilihan Paket:* ${encodeURIComponent(paket)}%0A` +
                                `*Nomor Kursi Terpilih:* ${encodeURIComponent(seatTerpilih)}%0A` +
                                `*Catatan:* ${encodeURIComponent(catatan ? catatan : '-')}`;

                window.open(`https://wa.me/${adminPhone}?text=${message}`, '_blank');

                // Reset tombol setelah 3 detik
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

function buildRoundTable(tableId, prefix, startNum, totalSeats, category, activeCategory) {
    const container = document.getElementById(tableId);
    if (!container) return;

    container.innerHTML = '';
    container.classList.add(`seats-${totalSeats}`);

    for (let i = 0; i < totalSeats; i++) {
        const currentNum = startNum + i;
        const seatNum = `${prefix}-${currentNum < 10 ? '0' + currentNum : currentNum}`;

        const btn = document.createElement('button');
        btn.type = 'button';
        const isLocked = category !== activeCategory;
        btn.className = `seat-btn ${category} ${isLocked ? 'locked' : ''}`;
        btn.innerText = seatNum;
        btn.dataset.seat = seatNum;

        if (!isLocked) {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.seat-btn').forEach(s => s.classList.remove('selected'));
                btn.classList.add('selected');
                
                const selectedSeatNumEl = document.getElementById('selectedSeatNum');
                const selectedSeatInputEl = document.getElementById('selectedSeatInput');
                if (selectedSeatNumEl) selectedSeatNumEl.innerText = seatNum;
                if (selectedSeatInputEl) selectedSeatInputEl.value = seatNum;
            });
        }
        container.appendChild(btn);
    }
}

function fetchSeatsFromSheet(url) {
    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (data && data.seats && Array.isArray(data.seats)) {
                markOccupiedSeats(data.seats);
            }
        })
        .catch(err => console.error('Gagal memuat data kursi terisi:', err));
}

function markOccupiedSeats(seatArray) {
    seatArray.forEach(seatNum => {
        if (!seatNum) return;
        const cleanSeat = seatNum.toString().trim();
        const btn = document.querySelector(`[data-seat="${cleanSeat}"]`);
        if (btn) {
            btn.classList.add('occupied');
            btn.classList.remove('locked', 'selected');
            btn.disabled = true;
        }
    });
}