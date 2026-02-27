/**
 * Solana Token Workshop - Lesson 2
 * Script show-wallets.ts — tampilkan alamat wallet untuk faucet UI
 *
 * Membaca wallets.json dan menampilkan public key dalam format yang
 * mudah di-copy-paste ke faucet Devnet Solana.
 *
 * Jalankan: npm run show-wallets
 */

import * as fs from 'fs';
import * as path from 'path';

const WALLETS_FILE = path.join(__dirname, 'wallets.json');

function main() {
  // Cek apakah wallets.json ada — exit dengan pesan yang jelas jika belum
  if (!fs.existsSync(WALLETS_FILE)) {
    console.log('\n❌ wallets.json tidak ditemukan!');
    console.log('   Jalankan terlebih dahulu: npm run generate\n');
    process.exit(1);
  }

  const walletsData = JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf-8'));

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║               ALAMAT WALLET LESSON 2                  ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  console.log('\n  Wallet A (Pemilik token awal):');
  console.log(`  → ${walletsData.walletA.publicKey}`);

  console.log('\n  Wallet B (Penerima token):');
  console.log(`  → ${walletsData.walletB.publicKey}`);

  console.log('\n─────────────────────────────────────────────────────────');
  console.log('  Kunjungi faucet untuk mengisi SOL ke Wallet A');
  console.log('  sebelum menjalankan npm start:');
  console.log('');
  console.log('  https://faucet.solana.com');
  console.log('─────────────────────────────────────────────────────────\n');
}

main();
