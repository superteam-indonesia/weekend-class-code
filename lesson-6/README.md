# Lesson 6 — Anchor Part 2: Building Escrows

Di lesson ini kita akan membangun **escrow program** menggunakan Anchor. Escrow adalah mekanisme "titipan ke notaris" — kamu menitipkan aset ke program, dan program akan melepaskannya hanya ketika syarat terpenuhi. Ini adalah salah satu pola paling umum di DeFi dan Web3.

---

## Prasyarat

- Lesson 5 sudah selesai (Rust basics: structs, enums, Option/Result, ownership, impl blocks)
- Rust dan Cargo terinstall: [https://rustup.rs](https://rustup.rs)
- Solana CLI terinstall: [https://docs.solana.com/cli/install-solana-cli-tools](https://docs.solana.com/cli/install-solana-cli-tools)
- Anchor CLI versi 0.30.1 terinstall:
  ```bash
  cargo install --git https://github.com/coral-xyz/anchor anchor-cli --tag v0.30.1 --locked
  ```
- Node.js + Yarn terinstall
- Surfpool atau validator lokal untuk menjalankan test

---

## Instalasi

```bash
cd lesson-6
yarn install
anchor build
```

---

## Cara Menjalankan

Jalankan validator lokal (surfpool atau `solana-test-validator`), lalu:

```bash
anchor test
```

Anchor akan build program, deploy ke localnet, dan menjalankan semua test TypeScript secara otomatis.

---

## Penjelasan Kode

### Make — Membuat Escrow

Instruksi `make` adalah titik awal dari seluruh alur escrow. Bayangkan kamu sebagai seorang pedagang yang ingin menukar token A dengan token B. Kamu tidak percaya begitu saja kepada pembeli yang belum kamu kenal. Solusinya? Kamu titipkan token A ke "notaris" — dalam hal ini, program Anchor — dan notaris itu akan memegang token kamu sampai pembeli memenuhi kewajibannya.

Ketika `make` dipanggil, program membuat dua akun baru: sebuah **EscrowState PDA** dan sebuah **vault**. EscrowState adalah catatan resmi yang menyimpan semua informasi tentang escrow ini — siapa pembuatnya, token apa yang ditawarkan, berapa banyak yang diminta, dan angka `seed` unik yang membedakan escrow ini dari escrow lain milik maker yang sama.

```rust
ctx.accounts.escrow.set_inner(EscrowState {
    seed,
    maker: ctx.accounts.maker.key(),
    mint_a: ctx.accounts.mint_a.key(),
    mint_b: ctx.accounts.mint_b.key(),
    receive_amount,
    bump: ctx.bumps.escrow,
});
```

**Vault** adalah ATA (Associated Token Account) untuk token A, tapi yang menjadi `authority`-nya bukan manusia — melainkan escrow PDA itu sendiri. Ini seperti loker bank yang kuncinya dipegang oleh program, bukan oleh maker. Artinya, tidak ada satu pun manusia yang bisa membuka loker itu secara sepihak; hanya logika program yang boleh memindahkan isi vault. Setelah vault dibuat, program langsung mentransfer sejumlah token A dari ATA maker ke vault menggunakan CPI ke Token Program.

Program juga memvalidasi input dasar: tidak boleh ada escrow dengan jumlah deposit atau jumlah yang diminta bernilai nol.

```rust
require!(deposit_amount > 0, EscrowError::ZeroDepositAmount);
require!(receive_amount > 0, EscrowError::ZeroReceiveAmount);
```

---

### Take — Memenuhi Escrow

Instruksi `take` dipanggil oleh pihak kedua (taker) yang ingin membeli token A dengan membayar token B. Seluruh pertukaran terjadi dalam satu transaksi yang bersifat atomik — artinya, tidak ada kondisi di mana salah satu pihak membayar tapi tidak mendapatkan apa yang dijanjikan.

Alurnya ada tiga langkah: (1) taker mengirim token B ke maker, (2) program melepaskan token A dari vault ke taker, (3) vault dan escrow PDA ditutup, rent-nya dikembalikan ke maker.

Yang menarik ada di langkah kedua. Karena vault dimiliki oleh escrow PDA (bukan manusia), program harus "menandatangani" transaksi atas nama PDA tersebut. PDA tidak punya private key, jadi cara menandatanganinya adalah dengan menyediakan ulang seed yang sama yang digunakan untuk menurunkan PDA itu — teknik ini disebut **PDA signing**:

```rust
let signer_seeds: &[&[&[u8]]] = &[&[
    b"escrow",
    ctx.accounts.maker.key.as_ref(),
    &ctx.accounts.escrow.seed.to_le_bytes(),
    &[ctx.accounts.escrow.bump],
]];
```

Seed ini diserahkan ke CPI via `CpiContext::new_with_signer`. Token Program akan memverifikasi bahwa seed + program ID menghasilkan alamat PDA yang sama dengan yang ada di field `authority` vault — kalau cocok, transfer diizinkan. Inilah inti dari keamanan model PDA: kunci bukan dari private key, melainkan dari kepastian matematis bahwa hanya program ini yang bisa menurunkan alamat tersebut.

Constraint `has_one` di akun escrow memastikan bahwa `maker`, `mint_a`, dan `mint_b` yang dikirim dalam transaksi cocok dengan yang tersimpan di escrow state — mencegah serangan di mana seseorang mencoba menukar akun dengan versi palsu.

---

### Cancel — Membatalkan Escrow

Instruksi `cancel` memberi maker kemampuan untuk menarik kembali token A kapan saja, selama belum ada taker yang memenuhi escrow. Ini penting untuk UX — pengguna harus bisa berubah pikiran.

Alurnya sederhana: program mengembalikan semua token A dari vault ke ATA maker, menutup vault, dan menutup escrow PDA. Rent dari kedua akun dikembalikan ke maker karena merekalah yang awalnya membayar.

```rust
transfer(
    CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.maker_ata_a.to_account_info(),
            authority: ctx.accounts.escrow.to_account_info(),
        },
        signer_seeds,
    ),
    ctx.accounts.vault.amount, // transfer seluruh isi vault
)?;
```

Constraint `has_one = maker` pada akun escrow memastikan bahwa hanya maker asli yang bisa memanggil cancel — bukan sembarang orang. Ini adalah contoh **access control** berbasis data on-chain, tanpa memerlukan daftar whitelist terpisah.

---

## Ringkasan Operasi

| Instruksi | Siapa Memanggil | Apa yang Terjadi                                              | Akun yang Ditutup        |
|-----------|-----------------|---------------------------------------------------------------|--------------------------|
| `make`    | Maker           | Buat escrow PDA + vault, deposit token A ke vault             | —                        |
| `take`    | Taker           | Taker bayar token B ke maker, terima token A dari vault       | Vault, Escrow PDA        |
| `cancel`  | Maker           | Kembalikan token A ke maker, batalkan escrow                  | Vault, Escrow PDA        |

---

## Konsep yang Dipelajari

| Konsep                  | Penjelasan                                                                                                              |
|-------------------------|-------------------------------------------------------------------------------------------------------------------------|
| **PDA (Program Derived Address)** | Alamat yang diturunkan dari seeds + program ID. Tidak punya private key — hanya program yang bisa "menandatanganinya". Seperti loker yang kuncinya matematika. |
| **CPI (Cross-Program Invocation)** | Program Anchor memanggil program lain (misalnya Token Program) di dalam instruksi. Seperti satu departemen meminta departemen lain melakukan tugasnya. |
| **Vault**               | ATA yang dimiliki oleh PDA. Karena authority-nya bukan manusia, hanya program yang bisa memindahkan isinya.             |
| **PDA Signing**         | Cara program "menandatangani" CPI atas nama PDA dengan menyediakan ulang seeds yang benar.                             |
| **`has_one` constraint**| Anchor secara otomatis memverifikasi bahwa field di akun sesuai dengan akun yang dikirim — mencegah akun palsu.         |
| **`close` constraint**  | Anchor otomatis menutup akun dan mengirim rent ke alamat yang ditentukan saat instruksi berhasil.                       |
| **`init_if_needed`**    | Membuat ATA kalau belum ada, skip kalau sudah ada. Berguna untuk taker yang mungkin belum punya ATA untuk token tertentu. |
| **`#[derive(InitSpace)]`** | Anchor macro yang menghitung ukuran account secara otomatis dari field-field struct. Tidak perlu hitung manual.       |

---

## Langkah Selanjutnya

Selamat! Kamu sudah membangun program escrow yang sesungguhnya berjalan di blockchain. Di **Lesson 7: Full-Stack Building**, kita akan menyambungkan program ini ke sebuah frontend Next.js — sehingga pengguna bisa membuat, memenuhi, dan membatalkan escrow langsung dari browser.

Untuk terus belajar dan bergabung dengan komunitas builder Solana Indonesia, kunjungi:
👉 [superteam.fun/indonesia](https://superteam.fun/indonesia)
👉 [t.me/superteamindonesia](https://t.me/superteamindonesia)
