/**
 * Solana NFT Membership Workshop - Lesson 3 — File Latihan Peserta
 *
 * Instruksi:
 * - Isi setiap blok // TODO: sesuai penjelasan instruktur
 * - File jawaban lengkap ada di: nft-membership.ts
 * - Jalankan dengan: npx ts-node nft-membership.workshop.ts
 *
 * Prasyarat:
 *   1. npm run generate   — buat wallets.json (satu kali saja)
 *   2. npm run show-wallets — tampilkan alamat untuk faucet
 *   3. Isi wallet pribadi via faucet, lalu transfer ke Wallet A — Superstudy Faucet https://superstudy.fun/faucet
 *   4. npm run workshop
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

const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

const NFT_METADATA_URI =
  'https://raw.githubusercontent.com/solana-developers/professional-education/main/labs/sample-nft-offchain-data.json';

const WALLETS_FILE = path.join(__dirname, 'wallets.json');

// ============================================================================
// FUNGSI HELPER
// ============================================================================

/**
 * Cek apakah wallet memiliki NFT membership.
 * Wallet dianggap MEMBER jika ATA-nya ada dan saldo NFT = 1.
 */
async function checkMembership(
  wallet: PublicKey,
  mint: PublicKey,
  label: string
): Promise<boolean> {
  try {
    // TODO: Hitung alamat ATA dengan getAssociatedTokenAddressSync(mint, wallet)
    // TODO: Ambil info account dengan getAccount(connection, ata)
    // TODO: Cek apakah Number(info.amount) === 1
    // TODO: Tampilkan '✅ MEMBER' atau '❌ BUKAN MEMBER'
    // TODO: Return true jika member, false jika bukan
    return false; // ganti dengan implementasi
  } catch {
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
  // Keypair disimpan di wallets.json (dibuat via npm run generate).
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- Memuat Wallet dari wallets.json ---');

  if (!fs.existsSync(WALLETS_FILE)) {
    console.error('\n❌ wallets.json tidak ditemukan!');
    console.error('   Jalankan: npm run generate');
    process.exit(1);
  }

  console.log('\n--- Memuat Wallet dari wallets.json ---');

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
  // createUmi() membuat instance Umi dengan adapter HTTP/RPC.
  // .use(mplTokenMetadata()) menambahkan plugin Token Metadata Program.
  // umi.eddsa.createKeypairFromSecretKey() mengonversi secretKey web3.js → Umi Keypair.
  // keypairIdentity() menetapkan keypair sebagai identity + payer + signer.
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- Langkah 1: Setup Umi ---');

  // TODO: Buat instance Umi:
  //   const umi = createUmi(clusterApiUrl('devnet')).use(mplTokenMetadata())
  // TODO: Konversi secretKey walletA ke format Umi Keypair:
  //   const umiKeypair = umi.eddsa.createKeypairFromSecretKey(walletA.secretKey)
  // TODO: Set identity Umi:
  //   umi.use(keypairIdentity(umiKeypair))

  console.log('Umi siap dengan identity: Wallet A');

  // ─────────────────────────────────────────────────────────────────────────
  // Langkah 2 — Mint Membership NFT ke Wallet A
  // generateSigner(umi) membuat keypair baru untuk alamat mint.
  // createNft() melakukan semuanya sekaligus: buat mint, metadata, ATA, mint 1 token.
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- Langkah 2: Mint Membership NFT ke Wallet A ---');
  console.log('Minting NFT... (bisa memakan waktu beberapa detik)');

  // TODO: Buat signer untuk mint baru:
  //   const mintSigner = generateSigner(umi)
  // TODO: Mint NFT:
  //   await createNft(umi, {
  //     mint: mintSigner,
  //     name: 'Membership NFT',
  //     symbol: 'MEMBER',
  //     uri: NFT_METADATA_URI,
  //     sellerFeeBasisPoints: percentAmount(0),
  //     isMutable: false,
  //   }).sendAndConfirm(umi)
  // TODO: Konversi mint address ke web3.js PublicKey:
  //   const nftMintWeb3 = toWeb3JsPublicKey(mintSigner.publicKey)
  // TODO: Tampilkan nftMintWeb3.toBase58() dan link explorer devnet

  console.log('✅ NFT berhasil di-mint!');

  // ─────────────────────────────────────────────────────────────────────────
  // Langkah 3 — Cek Keanggotaan (Sebelum Transfer)
  // Setelah mint, hanya Wallet A yang punya NFT.
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- Langkah 3: Cek Keanggotaan (Sebelum Transfer) ---');

  // TODO: Panggil checkMembership(walletA.publicKey, nftMintWeb3, 'Wallet A')
  // TODO: Panggil checkMembership(walletB.publicKey, nftMintWeb3, 'Wallet B')

  // ─────────────────────────────────────────────────────────────────────────
  // Langkah 4 — Transfer NFT ke Wallet B
  // transferV1() menangani transfer beserta pembuatan ATA walletB secara otomatis.
  // umiPublicKey(address) mengonversi base58 string → Umi PublicKey.
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- Langkah 4: Transfer NFT ke Wallet B ---');
  console.log('Mentransfer NFT... (bisa memakan waktu beberapa detik)');

  // TODO: Transfer NFT:
  //   await transferV1(umi, {
  //     mint: mintSigner.publicKey,          // Umi PublicKey
  //     authority: umi.identity,              // Signer (walletA)
  //     tokenOwner: umi.identity.publicKey,   // Pemilik saat ini (walletA)
  //     destinationOwner: umiPublicKey(walletB.publicKey.toBase58()), // Penerima
  //     tokenStandard: TokenStandard.NonFungible,
  //   }).sendAndConfirm(umi)

  console.log('✅ NFT berhasil ditransfer ke Wallet B!');

  // ─────────────────────────────────────────────────────────────────────────
  // Langkah 5 — Cek Keanggotaan (Setelah Transfer)
  // Wallet B kini memegang NFT → MEMBER. Wallet A → bukan MEMBER.
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- Langkah 5: Cek Keanggotaan (Setelah Transfer) ---');

  // TODO: Panggil checkMembership untuk walletA (seharusnya ❌ sekarang)
  // TODO: Panggil checkMembership untuk walletB (seharusnya ✅ sekarang)

  console.log('\nWorkshop selesai!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
