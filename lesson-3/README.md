# Solana NFT Membership Workshop — Lesson 3

Workshop ini mendemonstrasikan pembuatan **NFT Membership Card** di blockchain Solana menggunakan **Metaplex Token Metadata Program**. Konsepnya sederhana: memiliki NFT tertentu = memiliki kartu keanggotaan digital.

---

## Prasyarat

- **Node.js** versi 18 atau lebih baru

  ```bash
  node --version   # harus >= 18.0.0
  ```

- **npm** (sudah termasuk dalam instalasi Node.js)

  ```bash
  npm --version
  ```

---

## Instalasi

```bash
cd lesson-3
npm install
```

Package yang diinstal:

| Package | Fungsi |
|---------|--------|
| `@solana/web3.js` | SDK utama Solana: koneksi jaringan, keypair, transaksi |
| `@solana/spl-token` | Membaca token account dan ATA |
| `@metaplex-foundation/umi` | Core framework Metaplex generasi baru |
| `@metaplex-foundation/umi-bundle-defaults` | Adapter HTTP/RPC + utilitas bawaan Umi |
| `@metaplex-foundation/mpl-token-metadata` | Client untuk Token Metadata Program (NFT mint, transfer) |
| `@metaplex-foundation/umi-web3js-adapters` | Konversi tipe antara Umi PublicKey ↔ web3.js PublicKey |

---

## Cara Menjalankan

Berbeda dengan lesson-2, lesson-3 memisahkan pembuatan wallet dari script utama. Ikuti langkah berikut **secara berurutan**:

### Step 0 — Generate Wallets (satu kali saja)

```bash
npm run generate
```

Script ini membuat dua keypair baru dan menyimpannya ke `wallets.json`. Jalankan **hanya sekali** — jika `wallets.json` sudah ada, script akan berhenti dengan pesan peringatan.

> ⚠️ **Keamanan:** `wallets.json` berisi **private key**. File ini sudah masuk `.gitignore` agar tidak ter-commit ke repository.

### Step 1 — Tampilkan Alamat Wallet

```bash
npm run show-wallets
```

Menampilkan public key kedua wallet dalam format yang mudah di-copy-paste ke faucet UI.

### Step 2 — Isi Wallet A dengan SOL

Isi **wallet pribadi Anda** via faucet Devnet, lalu transfer SOL ke **Wallet A**:

```
Superstudy Faucet https://superstudy.fun/faucet
```

Wallet A perlu SOL untuk membayar biaya transaksi (minting NFT, transfer, dll).

### Step 3 — Jalankan Script Utama

```bash
npm start
```

> Koneksi internet aktif diperlukan untuk terhubung ke Solana Devnet.

---

## Penjelasan Kode

### `generate-wallets.ts` — Buat Wallet Sekali, Simpan ke File

Script ini menggunakan `Keypair.generate()` untuk membuat dua keypair acak, lalu menyimpannya ke `wallets.json`. Secret key disimpan sebagai array angka biasa agar mudah di-*serialize* ke JSON.

Kenapa dipisahkan? Karena dalam pengembangan nyata, kita tidak pernah membuat wallet baru setiap kali menjalankan program. Wallet dibuat sekali, didanai, lalu dipakai berulang kali.

---

### Startup — Load Wallets dari File

Di awal `nft-membership.ts`, wallet dibaca dari file:

```typescript
const walletsData = JSON.parse(fs.readFileSync('wallets.json', 'utf-8'));
const walletA = Keypair.fromSecretKey(Uint8Array.from(walletsData.walletA.secretKey));
const walletB = Keypair.fromSecretKey(Uint8Array.from(walletsData.walletB.secretKey));
```

`Keypair.fromSecretKey()` merekonstruksi keypair dari secret key — hasilnya identik dengan keypair asli. `Uint8Array.from()` mengubah array angka biasa kembali menjadi typed array yang dibutuhkan Solana.

---

### Langkah 1: Setup Umi

```typescript
const umi = createUmi(clusterApiUrl('devnet')).use(mplTokenMetadata());
const umiKeypair = umi.eddsa.createKeypairFromSecretKey(walletA.secretKey);
umi.use(keypairIdentity(umiKeypair));
```

**Umi** adalah framework Metaplex generasi baru (menggantikan `@metaplex-foundation/js` yang sudah *deprecated*). Lebih ringan, modular, dan aktif dikembangkan.

Tiga langkah setup:
1. `createUmi(endpoint)` — buat instance Umi dengan adapter HTTP/RPC
2. `.use(mplTokenMetadata())` — tambahkan plugin Token Metadata Program
3. `umi.eddsa.createKeypairFromSecretKey(walletA.secretKey)` — konversi keypair web3.js ke format Umi, lalu tetapkan sebagai **identity** (payer + signer untuk semua operasi)

**Kenapa ada dua format PublicKey?**
Umi menggunakan tipe `PublicKey` sendiri yang berbeda dari `@solana/web3.js`. Kita perlu mengonversinya:
- `umi.eddsa.createKeypairFromSecretKey(secretKey)` → web3.js secretKey ke Umi Keypair
- `toWeb3JsPublicKey(umiPubkey)` → Umi PublicKey ke web3.js PublicKey
- `umiPublicKey(base58string)` → string base58 ke Umi PublicKey

---

### Langkah 2: Mint Membership NFT ke Wallet A

```typescript
const mintSigner = generateSigner(umi);
await createNft(umi, {
  mint: mintSigner,
  name: 'Membership NFT',
  symbol: 'MEMBER',
  uri: NFT_METADATA_URI,
  sellerFeeBasisPoints: percentAmount(0),
  isMutable: false,
}).sendAndConfirm(umi);

const nftMintWeb3 = toWeb3JsPublicKey(mintSigner.publicKey);
```

`createNft()` melakukan **beberapa operasi sekaligus** dalam satu panggilan:

1. Membuat **Token Mint** baru dengan `decimals = 0` dan `supply = 1`
2. Membuat **Metadata Account** via Token Metadata Program (nama, simbol, URI)
3. Membuat **ATA** (Associated Token Account) untuk Wallet A
4. **Mint 1 token** ke ATA Wallet A

| Parameter | Penjelasan |
|-----------|------------|
| `name` | Nama NFT yang tampil di explorer dan marketplace |
| `symbol` | Simbol singkat (seperti ticker saham) |
| `uri` | Link ke JSON off-chain berisi gambar & atribut NFT |
| `sellerFeeBasisPoints` | Royalti dalam basis poin (0 = tidak ada royalti) |
| `isMutable` | `false` = metadata tidak bisa diubah setelah mint |

**Tentang `uri`:** Di produksi, ini adalah link ke file JSON di **Arweave** atau **IPFS** (penyimpanan terdesentralisasi permanen). File JSON tersebut berisi nama, deskripsi, gambar, dan atribut NFT sesuai standar Metaplex.

---

### Langkah 3: Cek Keanggotaan (Sebelum Transfer)

Fungsi `checkMembership()` memeriksa apakah sebuah wallet memiliki NFT:

```typescript
async function checkMembership(wallet: PublicKey, mint: PublicKey, label: string) {
  try {
    const ata = getAssociatedTokenAddressSync(mint, wallet);
    const info = await getAccount(connection, ata);
    const isMember = Number(info.amount) === 1;
    console.log(`  ${label}: ${isMember ? '✅ MEMBER' : '❌ BUKAN MEMBER'}`);
    return isMember;
  } catch {
    console.log(`  ${label}: ❌ BUKAN MEMBER (tidak memiliki NFT)`);
    return false;
  }
}
```

Logikanya:
1. Hitung alamat ATA secara deterministik (tidak perlu query jaringan)
2. Ambil data ATA dari jaringan — *throw error* jika account tidak ada
3. Cek apakah saldo tepat `1` (NFT tidak bisa dipecah, hanya ada satu)

Sebelum transfer: **Wallet A = MEMBER ✅**, **Wallet B = bukan MEMBER ❌**

---

### Langkah 4: Transfer NFT ke Wallet B

```typescript
await transferV1(umi, {
  mint: mintSigner.publicKey,
  authority: umi.identity,
  tokenOwner: umi.identity.publicKey,
  destinationOwner: umiPublicKey(walletB.publicKey.toBase58()),
  tokenStandard: TokenStandard.NonFungible,
}).sendAndConfirm(umi);
```

`transferV1()` adalah instruksi dari Token Metadata Program yang menangani semua kompleksitas:
- Membuat ATA untuk Wallet B jika belum ada (Wallet A yang membayar)
- Memindahkan NFT dari ATA Wallet A ke ATA Wallet B
- `authority` dan `tokenOwner` menggunakan `umi.identity` (= Wallet A)

Setelah transfer, Wallet A tidak lagi memiliki NFT ini.

---

### Langkah 5: Cek Keanggotaan (Setelah Transfer)

Setelah transfer: **Wallet A = bukan MEMBER ❌**, **Wallet B = MEMBER ✅**

Inilah inti konsep **NFT sebagai membership card**: kepemilikan NFT = akses/keanggotaan. Keanggotaan bisa dipindahtangankan karena NFT bisa ditransfer.

---

## Ringkasan Operasi

| Langkah | Operasi | Fungsi | Efek |
|---------|---------|--------|------|
| Generate | Buat & simpan wallet | `Keypair.generate()` + `fs.writeFileSync()` | `wallets.json` berisi dua keypair |
| Startup | Load wallet dari file | `Keypair.fromSecretKey()` | Keypair siap dipakai tanpa buat ulang |
| 1 | Setup Umi | `createUmi().use(mplTokenMetadata())` + `keypairIdentity()` | Framework NFT siap dengan identity Wallet A |
| 2 | Mint NFT | `createNft(umi, { mint, ... }).sendAndConfirm(umi)` | 1 NFT dicetak ke Wallet A |
| 3 | Cek keanggotaan | `checkMembership()` | Wallet A = MEMBER, Wallet B = bukan |
| 4 | Transfer NFT | `transferV1(umi, { ... }).sendAndConfirm(umi)` | NFT pindah ke Wallet B |
| 5 | Cek keanggotaan | `checkMembership()` | Wallet A = bukan, Wallet B = MEMBER |
