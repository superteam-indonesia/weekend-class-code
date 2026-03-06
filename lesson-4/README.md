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
# atau: bun install

# 2. Salin file environment
cp .env.example .env

# 3. Jalankan development server
npm run dev
# atau: bun run dev

# 4. Buka browser di http://localhost:5173
```

## Struktur Proyek

```
src/
├── app/
│   ├── layout.tsx            # Root layout — import CSS global
│   └── page.tsx              # Halaman utama (Server Component)
├── components/
│   ├── SolanaProviders.tsx   # Provider Solana (Client Component)
│   ├── WalletConnect.tsx     # Koneksi wallet (Slide 7)
│   ├── BalanceDisplay.tsx    # Baca saldo — READ operation (Slide 12)
│   ├── TransferForm.tsx      # Kirim SOL — WRITE operation (Slide 12)
│   └── TransactionStatus.tsx # Tampilkan status & link Explorer
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

## Catatan untuk Pengajar

Saat live coding, ikuti urutan ini:

1. **Setup Provider** (`App.tsx`) — jelaskan 3 layer provider
2. **Wallet Connect** (`WalletConnect.tsx`) — demo konek Phantom
3. **Baca Saldo** (`BalanceDisplay.tsx`) — tunjukkan getBalance
4. **Kirim SOL** (`TransferForm.tsx`) — walkthrough seluruh alur transaksi
5. **Error Handling** — demo reject di Phantom, alamat salah, saldo kurang

## Troubleshooting

**"Buffer is not defined"**
→ Pastikan import Buffer ada di `main.tsx` sebelum import lain

**Wallet tidak terdeteksi**
→ Install ekstensi Phantom, lalu refresh halaman

**Transaksi gagal: Insufficient funds**
→ Claim SOL gratis di https://faucet.solana.com

**RPC rate limit**
→ Ganti `VITE_SOLANA_RPC_URL` di `.env` dengan RPC provider berbayar (Helius, QuickNode)

## Langkah Selanjutnya

- **Lesson 5**: Berinteraksi dengan program Anchor — membaca dan menulis data custom
- Coba buat fitur: history transaksi, transfer token SPL, airdrop devnet SOL dari UI
