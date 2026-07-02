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
- `.owner` / `.creator` menampilkan kontak owner bot.
- `.sticker` / `.stiker` / `.s` membuat sticker dari gambar, GIF, atau video pendek.
- `.tagall [pesan]` mention semua member grup.
- `.hidetag [pesan]` mengirim pesan dengan mention tersembunyi ke semua member.
- `.kick`, `.promote`, `.demote` untuk target yang di-reply, di-tag, atau ditulis nomornya.
- `.antilink on/off/status` menghapus pesan berisi link WhatsApp di grup tanpa kick member.
- `.autoread on/off/status` mengatur auto read khusus owner.
- `.autotyping on/off/status` mengatur auto typing khusus owner.
- `.dbstats` menampilkan statistik database khusus owner.
- `.backup` mengirim backup source khusus owner.

Fitur sticker membutuhkan `ffmpeg` pada server atau hosting. Jika command gagal dengan pesan `ffmpeg belum terpasang`, install `ffmpeg` terlebih dahulu di environment bot.

Fitur anti link dan group tools membutuhkan bot sebagai admin grup agar bisa menghapus pesan, kick, promote, atau demote member.

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
