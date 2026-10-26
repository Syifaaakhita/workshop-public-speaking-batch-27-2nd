document.addEventListener('DOMContentLoaded', function () {
    const waForm = document.getElementById('waForm');
    const paketInput = document.getElementById('paket');
    const pagePackage = paketInput ? paketInput.value.toLowerCase() : '';

    // 1. Deteksi Kategori Kursi Aktif Berdasarkan Nama Paket
    let activeCategory = '';
    if (pagePackage.includes('bronze') || pagePackage.includes('paket 1')) {
        activeCategory = 'bronze';
    } else if (pagePackage.includes('silver') || pagePackage.includes('paket 2')) {
        activeCategory = 'silver';
    } else if (pagePackage.includes('gold') || pagePackage.includes('platinum') || pagePackage.includes('paket 3')) {
        activeCategory = 'platinum';
    }

    // 2. Generate Denah Kursi
    generateSeats('platinumRow', 'P', 20, 'platinum', activeCategory);
    generateSeats('silverRow', 'S', 30, 'silver', activeCategory);
    generateSeats('bronzeRow', 'B', 50, 'bronze', activeCategory);

    // 3. URL Google Apps Script Anda
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyrlPY33qIitJ3H2tCTQWs6mb7Rgo_-v4LpTo1Zmq9kdmPQWLgbmeZDBQIC6NFrwghOYw/exec";

    // 4. Otomatis Membaca Kursi Terisi dari Google Sheets
    fetchSeatsFromSheet(SCRIPT_URL);

    // 5. Handle Pengiriman Form
    if (waForm) {
        waForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const namaInput = document.getElementById('nama');
            const whatsappInput = document.getElementById('whatsapp');
            const selectedSeatInput = document.getElementById('selectedSeatInput');
            const catatanInput = document.getElementById('catatan');

            const nama = namaInput ? namaInput.value.trim() : '';
            const whatsapp = whatsappInput ? whatsappInput.value.trim() : '';
            const paket = paketInput ? paketInput.value : 'Workshop Public Speaking Batch 27';
            const seatTerpilih = selectedSeatInput ? selectedSeatInput.value.trim() : '';
            const catatan = catatanInput ? catatanInput.value.trim() : '';

            if (!seatTerpilih) {
                alert('Silakan klik dan pilih nomor kursi Anda pada denah sebelum melanjutkan!');
                return;
            }

            // A. Langsung ubah kursi jadi merah & terkunci di tampilan lokal
            markOccupiedSeats([seatTerpilih]);

            // B. Kirim Data ke Google Sheets
            const formData = new FormData();
            formData.append('nama', nama);
            formData.append('whatsapp', whatsapp);
            formData.append('paket', paket);
            formData.append('seat', seatTerpilih);
            formData.append('catatan', catatan);

            fetch(SCRIPT_URL, { method: 'POST', body: formData })
                .then(response => console.log('Data berhasil disimpan ke Google Sheets!'))
                .catch(error => console.error('Error saat menyimpan ke Google Sheets:', error));

            // C. Buka WhatsApp Admin (Hanya Angka Murni: 6285182723319)
            const adminPhone = "6285182723319";
            const message = `Halo Admin, saya ingin mendaftar workshop.%0A%0A` +
                            `*Nama:* ${encodeURIComponent(nama)}%0A` +
                            `*No. WhatsApp:* ${encodeURIComponent(whatsapp)}%0A` +
                            `*Pilihan Paket:* ${encodeURIComponent(paket)}%0A` +
                            `*Nomor Kursi Terpilih:* ${encodeURIComponent(seatTerpilih)}%0A` +
                            `*Catatan:* ${encodeURIComponent(catatan ? catatan : '-')}`;

            const waUrl = `https://wa.me/${adminPhone}?text=${message}`;
            window.open(waUrl, '_blank');
        });
    }
});

// MEMBACA DATA KURSI TERISI DARI GSHEET
function fetchSeatsFromSheet(url) {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data && data.seats && Array.isArray(data.seats)) {
                markOccupiedSeats(data.seats);
            }
        })
        .catch(error => console.error('Gagal mengambil data kursi terisi:', error));
}

// MEMBUAT DENSITY SEAT DINAMIS
function generateSeats(containerId, prefix, total, category, activeCategory) {
    const container = document.getElementById(containerId);
    if (!container) return;

    for (let i = 1; i <= total; i++) {
        const seatNum = `${prefix}-${i < 10 ? '0' + i : i}`;
        const btn = document.createElement('button');
        btn.type = 'button';

        const isLocked = category !== activeCategory;
        btn.className = `seat-btn ${category} ${isLocked ? 'locked' : ''}`;
        btn.innerText = seatNum;
        btn.dataset.seat = seatNum;

        if (!isLocked) {
            btn.addEventListener('click', function () {
                selectSeat(btn, seatNum);
            });
        }

        container.appendChild(btn);
    }
}

// PILIH KURSI
function selectSeat(btnElement, seatNum) {
    if (btnElement.classList.contains('occupied') || btnElement.classList.contains('locked')) return;

    document.querySelectorAll('.seat-btn').forEach(s => s.classList.remove('selected'));
    btnElement.classList.add('selected');

    const selectedSeatNumEl = document.getElementById('selectedSeatNum');
    const selectedSeatInputEl = document.getElementById('selectedSeatInput');

    if (selectedSeatNumEl) selectedSeatNumEl.innerText = seatNum;
    if (selectedSeatInputEl) selectedSeatInputEl.value = seatNum;
}

// MENGUBAH KURSI MENJADI MERAH (SOLD OUT & DISABLED)
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