/**
 * Solana NFT Membership Workshop - Lesson 3
 * Script generate-wallets.ts — jalankan SATU KALI sebelum memulai workshop
 *
 * Script ini membuat dua keypair baru dan menyimpannya ke wallets.json.
 * Setelah itu, isi wallet pribadi via faucet, lalu transfer SOL ke Wallet A, sebelum menjalankan npm start.
 *
 * Jalankan: npm run generate
 */

import * as fs from 'fs';
import * as path from 'path';
import { Keypair } from '@solana/web3.js';

const WALLETS_FILE = path.join(__dirname, 'wallets.json');

function main() {
  // Cek apakah wallets.json sudah ada — hindari menimpa wallet yang sudah ada
  if (fs.existsSync(WALLETS_FILE)) {
    console.log('\n⚠️  wallets.json sudah ada!');
    console.log('   Hapus file tersebut secara manual jika ingin membuat wallet baru.');
    console.log('   Untuk menampilkan alamat wallet yang ada, jalankan: npm run show-wallets\n');
    process.exit(1);
  }

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║          GENERATE WALLETS — Lesson 3                  ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  // Buat dua keypair baru secara acak
  const walletA = Keypair.generate();
  const walletB = Keypair.generate();

  console.log('\n  Wallet A (Pemilik NFT awal & payer):');
  console.log(`  → ${walletA.publicKey.toBase58()}`);

  console.log('\n  Wallet B (Penerima NFT):');
  console.log(`  → ${walletB.publicKey.toBase58()}`);

  // Simpan keypair ke wallets.json
  // secretKey disimpan sebagai array angka biasa agar mudah di-serialize
  const walletsData = {
    walletA: {
      publicKey: walletA.publicKey.toBase58(),
      secretKey: Array.from(walletA.secretKey),
    },
    walletB: {
      publicKey: walletB.publicKey.toBase58(),
      secretKey: Array.from(walletB.secretKey),
    },
  };

  fs.writeFileSync(WALLETS_FILE, JSON.stringify(walletsData, null, 2), 'utf-8');

  console.log('\n✅ wallets.json berhasil dibuat!');
  console.log('\n─────────────────────────────────────────────────────────');
  console.log('  LANGKAH SELANJUTNYA:');
  console.log('');
  console.log('  1. Jalankan: npm run show-wallets');
  console.log('     (untuk menampilkan alamat wallet dengan rapi)');
  console.log('');
  console.log('  2. Isi wallet pribadi Anda via faucet Devnet, lalu transfer SOL ke Wallet A:');
  console.log('     Superstudy Faucet https://superstudy.fun/faucet');
  console.log('');
  console.log('  3. Setelah Wallet A terisi, jalankan: npm start');
  console.log('─────────────────────────────────────────────────────────\n');

  console.log('⚠️  PERINGATAN KEAMANAN:');
  console.log('   wallets.json berisi PRIVATE KEY — jangan bagikan ke siapapun!');
  console.log('   File ini sudah di-list di .gitignore agar tidak ter-commit.\n');
}

main();
