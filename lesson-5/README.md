# Lesson 5 — Rust Primer

Selamat datang di lesson pertama yang menggunakan bahasa **Rust**!

Sampai sekarang kita sudah pakai TypeScript untuk berinteraksi dengan Solana.
Lesson ini kita mulai belajar bahasa yang dipakai untuk **menulis program Solana itu sendiri**.

> Rust adalah bahasa yang dipakai di Anchor — framework yang akan kita pakai di Lesson 6 untuk build escrow program pertama kamu.

Jangan khawatir kalau ini pertama kali kamu lihat Rust. Lesson ini dirancang dari nol.

---

## Yang Akan Kamu Pelajari Hari Ini

- Cara deklarasi variabel dan kapan pakai `mut`
- Tipe data Rust yang sering muncul di Anchor (`u64`, `bool`, `String`, `&str`)
- Struct — cara Anchor menyimpan data on-chain
- Enum — cara Anchor mendefinisikan error codes
- `Option` dan `Result` — cara Rust handle "mungkin ada" dan "mungkin gagal"
- Operator `?` — cara elegan propagate error (muncul di setiap Anchor instruction)
- Borrowing dengan `&` — kenapa semua parameter di Anchor pakai referensi

---

## Prasyarat

- Sudah selesai Lesson 4
- **Rust** sudah terinstall di komputer kamu

  Belum install? Jalankan perintah ini:
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  ```
  Ikuti instruksi yang muncul, lalu tutup dan buka kembali terminal kamu.

  Cek berhasil:
  ```bash
  rustc --version   # harus muncul versi, contoh: rustc 1.75.0
  cargo --version   # harus muncul versi, contoh: cargo 1.75.0
  ```

---

## Cara Menjalankan Workshop

### 1. Masuk ke folder lesson-5

```bash
cd weekend-class-code/lesson-5
```

### 2. Jalankan file workshop (file latihan kamu)

```bash
cargo run --bin workshop
```

Program akan **compile** tapi akan berhenti di bagian yang belum diisi dan mencetak:
```
not yet implemented: <pesan TODO>
```

Itu normal! Artinya kamu perlu isi bagian tersebut.

### 3. Edit file workshop dan isi TODO-nya

Buka `src/workshop.rs` di editor kamu, cari `todo!(...)`, isi dengan kode yang benar,
lalu jalankan lagi:

```bash
cargo run --bin workshop
```

Ulangi sampai program berjalan penuh tanpa error.

### 4. Lihat jawaban (kalau stuck)

```bash
cargo run --bin solution
```

Atau buka `src/main.rs` di editor.

---

## Struktur File

```
lesson-5/
├── Cargo.toml            # konfigurasi project Rust
├── src/
│   ├── workshop.rs       # ← FILE INI yang kamu kerjakan
│   └── main.rs           # jawaban lengkap (jangan buka dulu!)
└── README.md
```

---

## Alur Workshop

Workshop ini punya **5 section** yang harus diselesaikan berurutan.
Setiap section memperkenalkan satu konsep Rust baru.

### Section A — Variabel dan Tipe Data *(~10 menit)*

Kamu akan belajar cara deklarasi variabel di Rust dan kapan harus pakai `mut`.

```rust
let harga: u64 = 1_000_000; // tidak bisa diubah
let mut saldo: u64 = 5_000_000; // bisa diubah karena pakai `mut`
saldo -= harga; // ini bisa karena `saldo` adalah `mut`
```

**Koneksi ke Solana:** `u64` adalah tipe yang paling sering muncul di Anchor
karena semua jumlah lamports dan token disimpan sebagai unsigned 64-bit integer.

---

### Section B — Struct dan impl *(~15 menit)*

Kamu akan membuat `EscrowOffer` — sebuah struct yang menyimpan data offer escrow.

```rust
struct EscrowOffer {
    pub id: u64,
    pub maker: String,
    pub token_offered_amount: u64,
    pub token_wanted_amount: u64,
}
```

**Koneksi ke Anchor:** Struct `EscrowOffer` yang kamu tulis hari ini bentuknya hampir
identik dengan `EscrowState` yang akan kamu deklarasikan di Lesson 6 dengan `#[account]`.

---

### Section C — Enum dan match *(~10 menit)*

Kamu akan membuat `EscrowError` — enum yang mendefinisikan berbagai jenis error.

```rust
enum EscrowError {
    InvalidAmount,
    Unauthorized,
    OfferNotFound,
}
```

**Koneksi ke Anchor:** Di Anchor, error codes didefinisikan persis seperti ini,
hanya ditambahkan `#[error_code]` di atasnya.

---

### Section D — Option dan Result *(~15 menit)*

Kamu akan belajar dua tipe paling penting di Rust:

- **`Option<T>`** — nilai yang mungkin ada (`Some`) atau tidak ada (`None`)
- **`Result<T, E>`** — operasi yang bisa berhasil (`Ok`) atau gagal (`Err`)
- **Operator `?`** — cara singkat untuk propagate error tanpa menulis `match` panjang

**Koneksi ke Anchor:** Setiap instruction handler di Anchor return `Result<()>`.
Operator `?` muncul di hampir setiap baris kode Anchor.

---

### Section E — References dan Borrowing *(~10 menit)*

Kamu akan belajar kenapa parameter fungsi di Anchor selalu pakai `&`:

```rust
// Kenapa &EscrowOffer, bukan EscrowOffer?
fn cancel_offer(offer: &EscrowOffer, caller: &str) -> Result<(), EscrowError>
```

**Koneksi ke Anchor:** Di Anchor, semua account diteruskan lewat referensi
(`&ctx.accounts.escrow`, `&ctx.accounts.vault`). Kamu tidak pernah "memindahkan"
sebuah account — kamu hanya meminjamnya.

---

## Setelah Selesai Workshop

Di bagian bawah `src/workshop.rs` ada komentar **BONUS** yang menampilkan
kode Anchor asli dari Lesson 6. Baca dan jawab pertanyaan ini:

> **Bagian mana dari kode Anchor itu yang sudah familiar setelah hari ini?**

---

## Latihan Mandiri (Sebelum Lesson 6)

Kalau mau memperdalam Rust sebelum lesson berikutnya, kerjakan latihan-latihan
di [Rustlings](https://rustlings.rust-lang.org/) — tool interaktif resmi dari komunitas Rust.

Prioritaskan chapter berikut (dalam urutan ini):

| Chapter | Konsep |
|---------|--------|
| `variables` | Variabel dan mutability |
| `primitive_types` | Tipe data dasar |
| `move_semantics` | Ownership dan move |
| `structs` | Struct dan method |
| `enums` | Enum dan pattern matching |
| `error_handling` | Result, Option, dan `?` |

---

## Referensi

- [The Rust Book](https://doc.rust-lang.org/book/) — buku resmi Rust, gratis dan sangat baik
- [Anchor Docs](https://www.anchor-lang.com/docs) — preview apa yang kita build di Lesson 6
- [Blueshift — Anchor 101](https://learn.blueshift.gg/en/courses/anchor-for-dummies/anchor-101)

---

## Langkah Selanjutnya

**Lesson 6 — Anchor Part 2: Building Escrows**

Kamu akan mengambil `EscrowOffer` dan `EscrowError` yang kamu tulis hari ini
dan mengubahnya menjadi program yang berjalan di blockchain Solana:

- `EscrowOffer` → `#[account] pub struct EscrowState { ... }`
- `EscrowError` → `#[error_code] pub enum EscrowError { ... }`
- Instruction `make_offer()` → on-chain transaction yang ditulis ke Devnet

---

Sudah selesai? Bagikan progres kamu di komunitas!

- Telegram: [t.me/superteamindonesia](https://t.me/superteamindonesia)
- Website: [superteam.fun/indonesia](https://superteam.fun/indonesia)
