# GeprekFlow Project 1 — Sistem Pemesanan Ayam Geprek

Project baru dengan dua role memakai satu database Supabase.

**Pelanggan**: Register/Login, menu, keranjang, checkout, alamat + GPS, pengaturan akun, riwayat pesanan, notifikasi status.

**Kasir**: Login khusus, dashboard, input manual seperti kasir offline, kelola menu, upload/edit gambar menu, kelola pesanan, terima/tolak, proses, siap diambil, konfirmasi pembayaran, cetak struk thermal.

## Setup

1. Buat project baru di Supabase.
2. SQL Editor → jalankan `supabase/schema.sql`.
3. Authentication → Users: buat akun kasir.
4. Setelah user kasir dibuat, jalankan:

```sql
update public.profiles set role = 'cashier' where id = 'UUID_KASIR';
```

5. Backend:

```powershell
cd backend
npm install
copy .env.example .env
npm run start:dev
```

Isi `.env`:

```env
PORT=4000
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_KEY
```

6. Frontend:

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open `http://localhost:5173`.

## Catatan

- User yang register dari UI otomatis role `customer`.
- Role `cashier` ditetapkan dari `profiles` oleh owner/database admin.
- Notifikasi status pelanggan memakai polling 5 detik agar sederhana dan tidak bergantung pada WebSocket browser.
- Struk memakai dialog print browser dengan layout 80mm. Printer thermal umum dapat dipilih dari dialog printer.
- Jangan commit `.env`.
