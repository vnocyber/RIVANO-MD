📱 Install di Termux

1. Update Termux

pkg update -y
pkg upgrade -y

2. Install Git dan Node.js

pkg install git nodejs -y

Cek versi:

node -v
npm -v

Disarankan menggunakan Node.js versi modern.

3. Clone Repository

git clone https://github.com/vnocyber/RIVANO-MD.git

Ganti "USERNAME" dengan username GitHub pemilik repository.

Contoh:

git clone https://github.com/rivano/RIVANO-MD.git

Kemudian masuk ke folder:

cd RIVANO-MD

4. Install Dependencies

npm install

5. Atur Owner

Buka:

config.js

Kemudian ubah:

owner: '628xxxxxxxxxx',

menjadi nomor WhatsApp owner.

Contoh:

owner: '6281234567890',

Gunakan format:

628xxxxxxxxxx

Jangan menggunakan:

+628xxxxxxxxxx

atau:

08xxxxxxxxxx

6. Jalankan Bot

npm start

Jika menggunakan pairing code, masukkan nomor WhatsApp yang ingin digunakan sebagai akun bot.

Ikuti pairing code yang muncul di terminal.

Setelah berhasil terhubung, bot siap digunakan.
