# Lesson 4: Coding UI dalam Solana

Demo frontend Solana yang menunjukkan cara membangun antarmuka Web3 dari nol:
- Menghubungkan wallet Phantom
- Membaca saldo SOL (operasi READ)
- Mengirim SOL ke alamat lain (operasi WRITE)
- Menangani error dengan benar

## Prasyarat

- Node.js v18+ atau Bun
- [Phantom Wallet](https://phantom.app) — ekstensi browser
- SOL di Devnet — gunakan faucet: https://faucet.solana.com
- Pengetahuan dasar React & TypeScript

## Cara Menjalankan

```bash
# 1. Install dependencies
npm install

# 2. Salin file environment
cp .env.example .env.local

# 3. Jalankan development server
npm run dev

# 4. Buka browser di http://localhost:3000
```

---

## Panduan Langkah demi Langkah

### Langkah 1 — Setup Provider (`SolanaProviders.tsx`)

Sebelum bisa berinteraksi dengan Solana, app kita perlu dibungkus dengan 3 layer provider. Buka `src/components/SolanaProviders.tsx`.

```tsx
// Tentukan ke jaringan mana kita konek
const endpoint = useMemo(
  () => process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl('devnet'),
  []
);

// Daftar wallet yang didukung
const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
```

Provider dibungkus berlapis-lapis seperti ini:

```tsx
<ConnectionProvider endpoint={endpoint}>   {/* Layer 1: Koneksi RPC */}
  <WalletProvider wallets={wallets} autoConnect>  {/* Layer 2: Akses wallet */}
    <WalletModalProvider>   {/* Layer 3: UI modal pemilihan wallet */}
      {children}
    </WalletModalProvider>
  </WalletProvider>
</ConnectionProvider>
```

**Mengapa 3 layer?**
- `ConnectionProvider` → menyediakan koneksi ke node RPC Solana. Semua komponen di dalamnya bisa memanggil `useConnection()`.
- `WalletProvider` → mendeteksi wallet user dan menyediakan `publicKey`, `sendTransaction`, dll via `useWallet()`.
- `WalletModalProvider` → menyediakan UI popup untuk memilih dan menghubungkan wallet.

> Di Next.js App Router, semua provider ini harus berada di Client Component (`'use client'`) karena mereka menggunakan hooks React.

---

### Langkah 2 — Hubungkan Wallet (`WalletConnect.tsx`)

Buka `src/components/WalletConnect.tsx`. Di sini kita menampilkan tombol connect dan info wallet.

```tsx
const { publicKey, connected } = useWallet();
```

- `connected` — `true` jika wallet sudah terhubung
- `publicKey` — alamat wallet user (bukan nama, bukan email — hanya public key)

```tsx
<WalletMultiButton />
```

`WalletMultiButton` adalah tombol siap pakai dari `@solana/wallet-adapter-react-ui`. Tombol ini menangani seluruh alur: connect, tampilkan alamat, disconnect — tanpa kita perlu tulis logikanya sendiri.

Setelah terhubung, tampilkan `publicKey.toBase58()` — yaitu representasi string dari alamat wallet:

```tsx
{connected && publicKey && (
  <p>{publicKey.toBase58()}</p>
)}
```

---

### Langkah 3 — Baca Saldo SOL (`BalanceDisplay.tsx`)

Buka `src/components/BalanceDisplay.tsx`. Ini adalah contoh operasi **READ** — membaca data dari blockchain tanpa tanda tangan.

```tsx
const { connection } = useConnection();
const { publicKey } = useWallet();
```

Ambil saldo dengan `getBalance()`:

```tsx
const lamports = await connection.getBalance(publicKey);
const sol = lamports / LAMPORTS_PER_SOL;
```

**Poin penting:**
- `getBalance()` adalah RPC call — tidak membutuhkan tanda tangan wallet, tidak membayar fee
- Hasilnya dalam **lamports**, bukan SOL. Konversi: `1 SOL = 1.000.000.000 lamports`
- `LAMPORTS_PER_SOL` adalah konstanta dari `@solana/web3.js` dengan nilai `1_000_000_000`

Gunakan `useEffect` agar saldo otomatis diambil saat wallet terhubung:

```tsx
useEffect(() => {
  fetchBalance();
}, [fetchBalance]); // dijalankan ulang setiap kali publicKey berubah
```

---

### Langkah 4 — Kirim SOL (`TransferForm.tsx`)

Ini adalah bagian utama — contoh operasi **WRITE**. Buka `src/components/TransferForm.tsx`.

#### 4a. Validasi Input

Sebelum membuat transaksi, selalu validasi input di sisi client:

```tsx
// Cek apakah alamat tujuan valid
let recipientPubkey: PublicKey;
try {
  recipientPubkey = new PublicKey(recipient.trim());
} catch {
  setErrorMessage('Alamat tujuan tidak valid!');
  return;
}

// Konversi SOL ke lamports (harus bilangan bulat)
const lamports = Math.round(solAmount * LAMPORTS_PER_SOL);
```

#### 4b. Buat Instruksi Transfer

```tsx
const transferInstruction = SystemProgram.transfer({
  fromPubkey: publicKey,     // Pengirim
  toPubkey: recipientPubkey, // Penerima
  lamports: lamports,        // Jumlah (dalam lamports)
});
```

`SystemProgram.transfer` adalah instruksi **built-in** di Solana — tidak perlu deploy program sendiri untuk transfer SOL biasa.

#### 4c. Bungkus dalam Transaksi

```tsx
const transaction = new Transaction().add(transferInstruction);
```

Satu transaksi bisa berisi banyak instruksi. Di sini kita hanya pakai satu.

#### 4d. Ambil Blockhash Terbaru

```tsx
const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
transaction.recentBlockhash = blockhash;
transaction.feePayer = publicKey;
```

**Apa itu blockhash?** Blockhash adalah "cap waktu" transaksi. Setiap transaksi harus menyertakan blockhash terbaru agar tidak bisa di-replay ulang. Jika terlalu lama menunggu, blockhash akan expired dan transaksi akan ditolak.

#### 4e. Kirim ke Wallet untuk Ditandatangani

```tsx
const signature = await sendTransaction(transaction, connection);
```

`sendTransaction()` membuka popup Phantom. User akan melihat detail transaksi dan bisa memilih **Approve** atau **Reject**.

#### 4f. Tunggu Konfirmasi

```tsx
await connection.confirmTransaction(
  { signature, blockhash, lastValidBlockHeight },
  'confirmed'
);
```

`'confirmed'` artinya kita menunggu sampai mayoritas validator Solana menyetujui transaksi ini. Setelah ini, transaksi tercatat permanen di blockchain.

**Ringkasan alur transaksi:**

```
Validasi Input
    ↓
Buat Instruksi (SystemProgram.transfer)
    ↓
Bungkus dalam Transaction + tambah Blockhash
    ↓
sendTransaction() → Popup Phantom → User Approve/Reject
    ↓
confirmTransaction() → Tunggu validator
    ↓
Sukses → Tampilkan link ke Solana Explorer
```

---

### Langkah 5 — Tampilkan Status Transaksi (`TransactionStatus.tsx`)

Buka `src/components/TransactionStatus.tsx`. Komponen ini menerima prop `status` dan menampilkan pesan yang sesuai.

Status berjalan secara berurutan: `idle` → `signing` → `confirming` → `success` atau `error`.

Setelah sukses, kita tampilkan link ke Solana Explorer agar user bisa verifikasi transaksinya:

```tsx
<a href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}>
  Lihat di Solana Explorer
</a>
```

---

### Langkah 6 — Error Handling (`TransferForm.tsx`)

Berbagai error yang mungkin terjadi saat mengirim transaksi, dan cara menanganinya:

| Error | Penyebab | Pesan ke User |
|-------|----------|---------------|
| `User rejected` | User klik Reject di Phantom | "Transaksi dibatalkan oleh user." |
| `Blockhash not found` | Terlalu lama sebelum mengirim | "Blockhash sudah expired. Silakan coba lagi." |
| `insufficient lamports` | Saldo kurang | "Saldo tidak cukup untuk transaksi ini." |
| `Invalid public key` | Format alamat salah | "Alamat tujuan tidak valid." |

```tsx
const message = err instanceof Error ? err.message : String(err);

if (message.includes('User rejected')) {
  setErrorMessage('Transaksi dibatalkan oleh user.');
} else if (message.includes('insufficient lamports')) {
  setErrorMessage('Saldo tidak cukup untuk transaksi ini.');
}
// dst...
```

---

## Struktur Proyek

```
src/
├── app/
│   ├── layout.tsx            # Root layout — import CSS global
│   └── page.tsx              # Halaman utama (Server Component)
├── components/
│   ├── SolanaProviders.tsx   # Provider Solana (Client Component) — Langkah 1
│   ├── WalletConnect.tsx     # Koneksi wallet — Langkah 2
│   ├── BalanceDisplay.tsx    # Baca saldo (READ) — Langkah 3
│   ├── TransferForm.tsx      # Kirim SOL (WRITE) — Langkah 4
│   └── TransactionStatus.tsx # Status transaksi — Langkah 5
└── styles/
    └── index.css             # Dark theme
```

## Konsep yang Dipelajari

| Konsep | Implementasi |
|--------|-------------|
| **Connection** | `ConnectionProvider` + `useConnection()` |
| **Wallet sebagai Identitas** | `useWallet()` → `publicKey` |
| **Read (Baca)** | `connection.getBalance()` — gratis, tanpa tanda tangan |
| **Write (Tulis)** | `SystemProgram.transfer` + `sendTransaction()` — butuh tanda tangan |
| **Blockhash** | `getLatestBlockhash()` — cap waktu transaksi |
| **Konfirmasi** | `confirmTransaction()` — tunggu validasi |
| **Error Handling** | Tangani reject, saldo kurang, blockhash expired |

## Stack Teknologi

- **Next.js 14** (App Router) + **TypeScript**
- **@solana/web3.js** v1.x — library utama Solana
- **@solana/wallet-adapter-react** — integrasi wallet
- **@solana/wallet-adapter-react-ui** — komponen UI wallet

## Troubleshooting

**Wallet tidak terdeteksi**
→ Install ekstensi [Phantom](https://phantom.app), lalu refresh halaman

**Transaksi gagal: Insufficient funds**
→ Claim SOL gratis di https://faucet.solana.com

**RPC rate limit / lambat**
→ Ganti `NEXT_PUBLIC_SOLANA_RPC_URL` di `.env.local` dengan RPC provider berbayar ([Helius](https://helius.dev), [QuickNode](https://quicknode.com))

**Hydration error di Next.js**
→ Pastikan semua komponen yang menggunakan `useWallet()` atau `useConnection()` memiliki `'use client'` di baris pertama

## Langkah Selanjutnya

- **Lesson 5**: Berinteraksi dengan program Anchor — membaca dan menulis data custom on-chain
- Coba tambahkan fitur: history transaksi, transfer token SPL, tombol airdrop devnet SOL
