document.addEventListener('DOMContentLoaded', function () {
    const paketInput = document.getElementById('paket');
    const pagePackage = paketInput ? paketInput.value.toLowerCase() : '';

    let activeCategory = '';
    if (pagePackage.includes('bronze') || pagePackage.includes('paket 1')) {
        activeCategory = 'bronze';
    } else if (pagePackage.includes('silver') || pagePackage.includes('paket 2')) {
        activeCategory = 'silver';
    } else if (pagePackage.includes('gold') || pagePackage.includes('platinum') || pagePackage.includes('paket 3')) {
        activeCategory = 'platinum';
    }

    // 1. GENERATE ZONA GOLD (2 Meja @ 5 Seat = 10 Seat)
    buildRoundTable('table-G1', 'P', 1, 5, 'platinum', activeCategory);
    buildRoundTable('table-G2', 'P', 6, 5, 'platinum', activeCategory);

    // 2. GENERATE ZONA SILVER (5 Meja @ 4 Seat = 20 Seat)
    for (let i = 1; i <= 5; i++) {
        const startNum = (i - 1) * 4 + 1;
        buildRoundTable(`table-S${i}`, 'S', startNum, 4, 'silver', activeCategory);
    }

    // 3. GENERATE ZONA BRONZE (14 Meja @ 5 Seat = 70 Seat)
    for (let i = 1; i <= 14; i++) {
        const startNum = (i - 1) * 5 + 1;
        buildRoundTable(`table-B${i}`, 'B', startNum, 5, 'bronze', activeCategory);
    }

    // 4. GOOGLE APPS SCRIPT INTEGRATION
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbztPKk9NTYfvggTLPzjE2092Ol8LzM-6wrg9sCE1xVBhHDXCZX3aY7s6vCkXaU9qlrL8w/exec";
    fetchSeatsFromSheet(SCRIPT_URL);

    // 5. FORM SUBMIT HANDLER
    const waForm = document.getElementById('waForm');
    if (waForm) {
        waForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const nama = document.getElementById('nama')?.value.trim();
            const whatsapp = document.getElementById('whatsapp')?.value.trim();
            const paket = paketInput ? paketInput.value : 'Workshop Public Speaking Batch 27';
            const seatTerpilih = document.getElementById('selectedSeatInput')?.value.trim();
            const catatan = document.getElementById('catatan')?.value.trim();

            if (!seatTerpilih) {
                alert('Silakan pilih nomor kursi Anda pada denah terlebih dahulu!');
                return;
            }

            markOccupiedSeats([seatTerpilih]);

            const formData = new FormData();
            formData.append('nama', nama);
            formData.append('whatsapp', whatsapp);
            formData.append('paket', paket);
            formData.append('seat', seatTerpilih);
            formData.append('catatan', catatan);

            fetch(SCRIPT_URL, { method: 'POST', body: formData });

            const adminPhone = "6285182723319";
            const message = `Halo Admin, saya ingin mendaftar workshop.%0A%0A` +
                            `*Nama:* ${encodeURIComponent(nama)}%0A` +
                            `*No. WhatsApp:* ${encodeURIComponent(whatsapp)}%0A` +
                            `*Pilihan Paket:* ${encodeURIComponent(paket)}%0A` +
                            `*Nomor Kursi Terpilih:* ${encodeURIComponent(seatTerpilih)}%0A` +
                            `*Catatan:* ${encodeURIComponent(catatan ? catatan : '-')}`;

            window.open(`https://wa.me/${adminPhone}?text=${message}`, '_blank');
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
                document.getElementById('selectedSeatNum').innerText = seatNum;
                document.getElementById('selectedSeatInput').value = seatNum;
            });
        }
        container.appendChild(btn);
    }
}

function fetchSeatsFromSheet(url) {
    fetch(url)
        .then(res => res.json())
        .then(data => { if (data?.seats) markOccupiedSeats(data.seats); })
        .catch(err => console.error('Gagal memuat data kursi:', err));
}

function markOccupiedSeats(seatArray) {
    seatArray.forEach(seatNum => {
        if (!seatNum) return;
        const btn = document.querySelector(`[data-seat="${seatNum.toString().trim()}"]`);
        if (btn) {
            btn.classList.add('occupied');
            btn.classList.remove('locked', 'selected');
            btn.disabled = true;
        }
    });
}