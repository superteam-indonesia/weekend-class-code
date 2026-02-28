/**
 * Solana NFT Membership Workshop - Lesson 3
 * Demonstrasi minting dan transfer NFT menggunakan Metaplex Umi + Token Metadata Program
 *
 * Konsep: Memiliki NFT tertentu = memiliki kartu keanggotaan (membership card).
 *
 * Prasyarat sebelum menjalankan:
 *   1. npm run generate   — buat wallets.json (satu kali saja)
 *   2. npm run show-wallets — tampilkan alamat untuk faucet
 *   3. Isi wallet pribadi via faucet, lalu transfer ke Wallet A — Superstudy Faucet https://superstudy.fun/faucet
 *   4. npm start
 *
 * Jalankan: npm start
 */

import * as fs from 'fs';
import * as path from 'path';
import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  mplTokenMetadata,
  createNft,
  transferV1,
  TokenStandard,
} from '@metaplex-foundation/mpl-token-metadata';
import {
  keypairIdentity,
  generateSigner,
  percentAmount,
  publicKey as umiPublicKey,
} from '@metaplex-foundation/umi';
import { toWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters';
import { getAssociatedTokenAddressSync, getAccount } from '@solana/spl-token';

// ============================================================================
// KONFIGURASI
// ============================================================================

// Koneksi web3.js tetap dibutuhkan untuk fungsi checkMembership (@solana/spl-token)
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

// URI metadata NFT — dalam produksi ini adalah link ke Arweave/IPFS
// yang berisi JSON dengan nama, deskripsi, dan gambar NFT.
// Untuk workshop ini kita pakai URI contoh.
const NFT_METADATA_URI =
  'https://raw.githubusercontent.com/solana-developers/professional-education/main/labs/sample-nft-offchain-data.json';

const WALLETS_FILE = path.join(__dirname, 'wallets.json');

// ============================================================================
// FUNGSI HELPER
// ============================================================================

/**
 * Cek apakah sebuah wallet memiliki NFT membership card.
 * Logika: wallet dianggap MEMBER jika ATA-nya ada dan saldo NFT = 1.
 *
 * NFT di Solana adalah token SPL biasa dengan:
 * - decimals = 0 (tidak bisa dipecah)
 * - supply = 1 (hanya ada satu)
 *
 * Parameter menggunakan web3.js PublicKey agar kompatibel dengan @solana/spl-token.
 */
async function checkMembership(
  wallet: PublicKey,
  mint: PublicKey,
  label: string
): Promise<boolean> {
  try {
    // Hitung alamat ATA (Associated Token Account) deterministik —
    // tidak perlu query jaringan, alamat dihitung dari public key + mint
    const ata = getAssociatedTokenAddressSync(mint, wallet);

    // Ambil info account — akan throw error jika account tidak ada
    const info = await getAccount(connection, ata);

    // NFT harus bernilai tepat 1 (tidak lebih, tidak kurang)
    const isMember = Number(info.amount) === 1;
    console.log(`  ${label}: ${isMember ? '✅ MEMBER' : '❌ BUKAN MEMBER'}`);
    return isMember;
  } catch {
    // Account tidak ditemukan = wallet tidak punya NFT ini
    console.log(`  ${label}: ❌ BUKAN MEMBER (tidak memiliki NFT)`);
    return false;
  }
}

// ============================================================================
// PROGRAM UTAMA
// ============================================================================

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║       SOLANA NFT MEMBERSHIP WORKSHOP - Lesson 3       ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  // ─────────────────────────────────────────────────────────────────────────
  // Startup — Load Wallets dari File
  // ─────────────────────────────────────────────────────────────────────────
  // Berbeda dengan lesson-2, wallet tidak dibuat baru setiap kali script jalan.
  // Wallet sudah dibuat sekali via `npm run generate` dan disimpan ke file.
  console.log('\n--- Memuat Wallet dari wallets.json ---');

  if (!fs.existsSync(WALLETS_FILE)) {
    console.error('\n❌ wallets.json tidak ditemukan!');
    console.error('   Jalankan: npm run generate');
    console.error('   kemudian isi wallet pribadi via faucet dan transfer ke Wallet A — https://superstudy.fun/faucet\n');
    process.exit(1);
  }

  const walletsData = JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf-8'));

  // Rekonstruksi Keypair dari secret key — hasilnya identik dengan keypair asli
  const walletA = Keypair.fromSecretKey(
    Uint8Array.from(walletsData.walletA.secretKey)
  );
  const walletB = Keypair.fromSecretKey(
    Uint8Array.from(walletsData.walletB.secretKey)
  );

  console.log('Wallet A:', walletA.publicKey.toBase58());
  console.log('Wallet B:', walletB.publicKey.toBase58());

  // ─────────────────────────────────────────────────────────────────────────
  // Langkah 1 — Setup Umi
  // ─────────────────────────────────────────────────────────────────────────
  // Umi adalah framework Metaplex generasi baru untuk berinteraksi dengan
  // program Solana. Lebih ringan dan modular dibanding SDK lama (@metaplex-foundation/js).
  //
  // createUmi() → membuat instance Umi dengan adapter HTTP/RPC
  // .use(mplTokenMetadata()) → menambahkan plugin Token Metadata Program
  //
  // umi.eddsa.createKeypairFromSecretKey() mengonversi secret key web3.js
  // ke format Keypair internal Umi — tidak memerlukan paket adapter tambahan.
  //
  // keypairIdentity() menetapkan keypair sebagai identity + payer + signer
  // untuk semua operasi yang dilakukan melalui instance Umi ini.
  console.log('\n--- Langkah 1: Setup Umi ---');

  const umi = createUmi(clusterApiUrl('devnet')).use(mplTokenMetadata());
  const umiKeypair = umi.eddsa.createKeypairFromSecretKey(walletA.secretKey);
  umi.use(keypairIdentity(umiKeypair));

  console.log('Umi siap dengan identity: Wallet A');

  // ─────────────────────────────────────────────────────────────────────────
  // Langkah 2 — Mint Membership NFT ke Wallet A
  // ─────────────────────────────────────────────────────────────────────────
  // generateSigner(umi) membuat keypair baru — ini akan menjadi alamat mint NFT.
  //
  // createNft() mengirim satu transaksi yang sekaligus:
  // 1. Membuat Token Mint baru (decimals=0, supply=1)
  // 2. Membuat Metadata Account via Token Metadata Program
  // 3. Membuat ATA untuk umi.identity (walletA)
  // 4. Mencetak 1 token ke ATA walletA
  //
  // sellerFeeBasisPoints: royalti (percentAmount(0) = 0%)
  // isMutable: false → metadata tidak bisa diubah setelah mint (lebih aman)
  // uri: link ke JSON off-chain berisi gambar + atribut NFT
  console.log('\n--- Langkah 2: Mint Membership NFT ke Wallet A ---');
  console.log('Minting NFT... (bisa memakan waktu beberapa detik)');

  const mintSigner = generateSigner(umi);

  await createNft(umi, {
    mint: mintSigner,
    name: 'Membership NFT',
    symbol: 'MEMBER',
    uri: NFT_METADATA_URI,
    sellerFeeBasisPoints: percentAmount(0),
    isMutable: false,
  }).sendAndConfirm(umi);

  // toWeb3JsPublicKey mengonversi Umi PublicKey → web3.js PublicKey
  // diperlukan agar bisa dipakai oleh fungsi checkMembership (@solana/spl-token)
  const nftMintWeb3 = toWeb3JsPublicKey(mintSigner.publicKey);

  console.log('✅ NFT berhasil di-mint!');
  console.log('  Mint addr:', nftMintWeb3.toBase58());
  console.log(
    '  Explorer :',
    `https://explorer.solana.com/address/${nftMintWeb3.toBase58()}?cluster=devnet`
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Langkah 3 — Cek Keanggotaan (Sebelum Transfer)
  // ─────────────────────────────────────────────────────────────────────────
  // Setelah mint, hanya Wallet A yang memiliki NFT ini.
  console.log('\n--- Langkah 3: Cek Keanggotaan (Sebelum Transfer) ---');

  await checkMembership(walletA.publicKey, nftMintWeb3, 'Wallet A');
  await checkMembership(walletB.publicKey, nftMintWeb3, 'Wallet B');

  // ─────────────────────────────────────────────────────────────────────────
  // Langkah 4 — Transfer NFT ke Wallet B
  // ─────────────────────────────────────────────────────────────────────────
  // transferV1() adalah instruksi transfer dari Token Metadata Program.
  // Menangani semua kompleksitas transfer NFT:
  // - Membuat ATA untuk walletB jika belum ada (walletA yang membayar)
  // - Memindahkan NFT dari ATA walletA ke ATA walletB
  //
  // mint          → alamat mint NFT (Umi PublicKey)
  // authority     → signer yang mengotorisasi transfer (umi.identity = walletA)
  // tokenOwner    → public key pemilik saat ini (walletA)
  // destinationOwner → public key penerima (walletB)
  // tokenStandard → jenis token; NonFungible untuk NFT standar
  //
  // umiPublicKey(address) mengonversi base58 string → Umi PublicKey
  console.log('\n--- Langkah 4: Transfer NFT ke Wallet B ---');
  console.log('Mentransfer NFT... (bisa memakan waktu beberapa detik)');

  await transferV1(umi, {
    mint: mintSigner.publicKey,
    authority: umi.identity,
    tokenOwner: umi.identity.publicKey,
    destinationOwner: umiPublicKey(walletB.publicKey.toBase58()),
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);

  console.log('✅ NFT berhasil ditransfer ke Wallet B!');

  // ─────────────────────────────────────────────────────────────────────────
  // Langkah 5 — Cek Keanggotaan (Setelah Transfer)
  // ─────────────────────────────────────────────────────────────────────────
  // Sekarang Wallet B memegang NFT → MEMBER.
  // Wallet A sudah tidak punya NFT → bukan MEMBER.
  //
  // Inilah inti konsep NFT sebagai membership card:
  // Kepemilikan NFT = akses/keanggotaan. Bisa dipindahtangankan.
  console.log('\n--- Langkah 5: Cek Keanggotaan (Setelah Transfer) ---');

  await checkMembership(walletA.publicKey, nftMintWeb3, 'Wallet A');
  await checkMembership(walletB.publicKey, nftMintWeb3, 'Wallet B');

  // ─────────────────────────────────────────────────────────────────────────
  // Ringkasan Akhir
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║               WORKSHOP SELESAI!                       ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('\n  NFT mint address  :', nftMintWeb3.toBase58());
  console.log('  Dicetak ke        : Wallet A');
  console.log('  Ditransfer ke     : Wallet B');
  console.log('  Member sekarang   : Wallet B ✅');
  console.log('\n  Semua operasi berhasil!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
