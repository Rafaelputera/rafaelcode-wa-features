# @rafaelcode/wa-features

Package ini menyimpan semua command bot. Bot utama hanya memuat package ini melalui `createFeatures()`.

## Format plugin

Setiap file plugin harus mengekspor object seperti ini:

```js
module.exports = {
  name: "ping",
  commands: ["ping", "p"],
  category: "Info",
  description: "Mengecek respons bot.",
  ownerOnly: false,
  async execute({ m }) {
    await m.reply("Pong!");
  }
};
```

Tambahkan plugin ke array pada `index.js`. Router bot akan memvalidasi nama, daftar command, dan fungsi `execute()` saat start.

## Fitur bawaan

- `.menu` / `.help` menampilkan daftar command.
- `.runtime` menampilkan uptime bot.
- `.ping` / `.speed` mengecek latency, uptime, dan memory bot.
- `.botinfo` / `.infobot` menampilkan info bot, total fitur, user, dan log command.
- `.owner` / `.creator` menampilkan kontak owner bot.
- `.ai` / `.ask` / `.gpt` chat AI memakai provider Vikey, Mimo, atau Bynara.
- `.sticker` / `.stiker` / `.s` membuat sticker dari gambar, GIF, atau video pendek.
- `.toimg` / `.toimage` mengubah sticker menjadi gambar PNG.
- `.upch <link saluran>` upload audio sebagai voice note ke Channel WhatsApp memakai FFmpeg.
- `.cekid` / `.id` menampilkan ID chat, sender, dan quoted sender.
- `.tagall [pesan]` mention semua member grup.
- `.hidetag [pesan]` mengirim pesan dengan mention tersembunyi ke semua member.
- `.kick`, `.promote`, `.demote` untuk target yang di-reply, di-tag, atau ditulis nomornya.
- `.antilink on/off/status` menghapus pesan berisi link WhatsApp di grup tanpa kick member.
- `.autoread on/off/status` mengatur auto read khusus owner.
- `.autotyping on/off/status` mengatur auto typing khusus owner.
- `.dbstats` menampilkan statistik database khusus owner.
- `.backup` mengirim backup source khusus owner.
- `.reloadfeatures` memuat ulang fitur tanpa restart bot khusus owner.
- `.update` update package `@rafaelcode/wa-features` dari bot utama khusus owner.

Fitur sticker membutuhkan `ffmpeg` pada server atau hosting. Jika command gagal dengan pesan `ffmpeg belum terpasang`, install `ffmpeg` terlebih dahulu di environment bot.

Fitur anti link dan group tools membutuhkan bot sebagai admin grup agar bisa menghapus pesan, kick, promote, atau demote member.

## Konfigurasi AI

Fitur AI membaca API key dari environment variable server. Pada bot utama, simpan key di file `bot-main/.env`. Jangan upload file `.env` ke GitHub.

```bash
VIKEY_API_KEY=isi_key_vikey
MIMO_API_KEY=isi_key_mimo
BYNARA_API_KEY=isi_key_bynara
```

Contoh command:

```bash
.ai jelaskan apa itu Node.js
.ai vikey buat caption promosi
.ai mimo buat ide konten
.ai bynara rangkum teks ini
```

## Menambah feature

1. Buat file baru di `features/`, misalnya `features/ping.js`.
2. Daftarkan file tersebut pada `index.js`.
3. Jalankan `npm run check`.
4. Buat commit dan tag release, misalnya `v0.2.0`.
5. Perbarui dependency package di server bot lalu restart, atau gunakan `.reloadfeatures` setelah install selesai.

## Menghubungkan ke GitHub

Inisialisasi folder ini sebagai repository GitHub terpisah. Dari bot utama, gunakan dependency bertag:

```json
"@rafaelcode/wa-features": "github:USERNAME/rafaelcode-wa-features#v0.2.0"
```

Hindari menunjuk branch `main` di server production. Tag release membuat rollback lebih mudah.
