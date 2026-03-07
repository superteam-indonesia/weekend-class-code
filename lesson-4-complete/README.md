# Lesson 4 Complete — Solana UI + Program Interaction

Versi **solusi lengkap** dari Lesson 4 Weekend Class Superteam Indonesia.

Berisi semua implementasi yang akan di-live-code selama sesi:
1. Koneksi wallet (Phantom)
2. Membaca saldo SOL
3. Mengirim SOL (transfer)
4. Berinteraksi dengan smart contract Anchor (Counter program)

---

## Prasyarat

- Node.js >= 18 atau Bun
- [Phantom Wallet](https://phantom.app/) terinstall di browser
- SOL devnet (gratis dari [faucet](https://faucet.solana.com/))

---

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

---

## Bagian 4 — Program Interaction

Komponen `ProgramInteraction.tsx` mendemonstrasikan cara berinteraksi dengan
smart contract Anchor dari frontend.

### Konsep Kunci

| Konsep | Penjelasan |
|--------|-----------|
| **IDL** | File JSON yang mendeskripsikan struktur program (seperti ABI di Ethereum) |
| **AnchorProvider** | Menghubungkan `connection` + `wallet` agar Anchor bisa menandatangani |
| **Program** | Instance client yang di-generate dari IDL — gateway ke program on-chain |
| **PDA** | Alamat akun deterministik yang dikontrol program, bukan user |
| **fetch()** | Baca data akun on-chain (READ — gratis) |
| **methods.xxx().rpc()** | Kirim instruksi ke program (WRITE — butuh signature + fee) |

### Cara Deploy Counter Program

Jika ingin mencoba dengan program real di devnet:

```bash
# Di repo program Anchor (bukan repo ini)
anchor build
anchor deploy --provider.cluster devnet

# Copy Program ID yang muncul ke .env.local
NEXT_PUBLIC_COUNTER_PROGRAM_ID=<program_id>
```

Tanpa `NEXT_PUBLIC_COUNTER_PROGRAM_ID`, komponen akan tetap render
tapi program calls akan gagal (program tidak ditemukan di devnet).

### PDA Counter

Seeds: `["counter", authority_pubkey]`

Setiap user punya Counter account sendiri. Satu wallet = satu counter.

---

## Struktur File

```
src/
  app/
    layout.tsx          — Root layout + metadata
    page.tsx            — Entry point, mount semua komponen
  components/
    SolanaProviders.tsx — ConnectionProvider + WalletProvider + WalletModalProvider
    WalletConnect.tsx   — Tombol connect wallet, tampilkan pubkey
    BalanceDisplay.tsx  — Baca saldo SOL (READ operation)
    TransferForm.tsx    — Kirim SOL (WRITE operation)
    TransactionStatus.tsx — Display status tx + Explorer link
    ProgramInteraction.tsx — Interaksi dengan Counter program (Anchor)
  idl/
    counter.json        — IDL program Counter (Anchor 0.30 format)
  styles/
    index.css           — Dark theme styling
```
