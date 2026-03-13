# Rust Primer Workshop — Lesson 5

Workshop ini memperkenalkan bahasa Rust dalam konteks pengembangan Solana.
Semua kode ditulis murni dalam Rust — tanpa dependency eksternal — sehingga bisa langsung dijalankan di komputer manapun yang sudah terinstal Rust.

Setelah menyelesaikan workshop ini, kamu akan siap menulis program Anchor di Lesson 6.

---

## Prasyarat

- **Rust** (via `rustup`) versi 1.70 atau lebih baru

  ```bash
  rustc --version   # harus >= 1.70.0
  ```

  Jika belum terinstal, ikuti panduan di: https://rustup.rs

- **Cargo** (sudah termasuk dalam instalasi Rust)

  ```bash
  cargo --version
  ```

---

## Cara Menjalankan

### Workshop (file latihan peserta)

```bash
cd lesson-5
cargo run --bin workshop
```

### Solution (jawaban lengkap — untuk referensi)

```bash
cargo run --bin solution
```

> **Catatan:** File workshop (`src/workshop.rs`) akan **compile** tapi akan **panic** di bagian yang belum diisi.
> Isi satu `todo!()` sekaligus, jalankan, lihat hasilnya, lanjut ke yang berikutnya.

---

## Struktur File

```
lesson-5/
├── Cargo.toml            # konfigurasi project (dua binary: solution + workshop)
├── src/
│   ├── main.rs           # SOLUSI — jawaban lengkap
│   └── workshop.rs       # FILE LATIHAN — isi bagian TODO ini
└── README.md
```

---

## Alur Workshop (5 Section)

### Section A — Variabel dan Tipe Data *(~10 menit)*

Konsep yang dipraktikkan:
- Deklarasi variabel dengan `let`
- Keyword `mut` untuk variabel yang bisa diubah
- Tipe data: `u64`, `bool`, `&str`
- Underscore sebagai pemisah angka: `1_000_000`

**Kenapa `u64`?** Di Solana, jumlah SOL dan token disimpan dalam lamports sebagai `u64`
(unsigned 64-bit integer). Tidak ada angka negatif di sini — kamu tidak bisa punya saldo minus.

---

### Section B — Struct dan impl *(~15 menit)*

Konsep yang dipraktikkan:
- Definisi `struct` dengan multiple field
- `impl` block untuk menambahkan method
- Konstruktor `new()`
- `self` dan `&self` — perbedaan method yang mutate vs yang hanya baca

**Koneksi ke Anchor:** Struct `EscrowOffer` yang kamu tulis hari ini adalah versi sederhana dari
`EscrowState` yang akan kamu deklarasikan di Lesson 6 dengan `#[account]`.

---

### Section C — Enum dan match *(~10 menit)*

Konsep yang dipraktikkan:
- Definisi `enum` dengan multiple variant
- `match` expression — exhaustive pattern matching
- `impl Display` untuk pesan error yang readable

**Koneksi ke Anchor:** `EscrowError` di sini adalah versi sederhana dari error codes di Anchor
yang didekorasi dengan `#[error_code]`.

---

### Section D — Option dan Result dengan `?` *(~15 menit)*

Konsep yang dipraktikkan:
- `Result<T, E>` — return value yang bisa berhasil atau gagal
- Operator `?` — cara elegan untuk propagasi error
- `Option<T>` — nilai yang mungkin ada atau tidak ada
- `if let Some(x) = ...` — unwrap aman tanpa risiko panic
- `.map()` dan `.unwrap_or_else()` — transformasi option

**Kenapa penting?** Hampir semua fungsi di Anchor return `Result<()>`. Operator `?`
digunakan di setiap baris instruksi handler. Menguasai ini = fluent di Anchor.

---

### Section E — References dan Borrowing *(~10 menit)*

Konsep yang dipraktikkan:
- Borrow dengan `&` vs move (tanpa `&`)
- Function signature dengan reference parameter
- Kenapa semua parameter di CPI Anchor menggunakan referensi

**Koneksi ke Anchor:** Di Anchor, accounts diteruskan lewat `ctx.accounts.nama_account`
yang selalu berupa referensi. Kamu tidak pernah "memindahkan" ownership sebuah account.

---

## Ringkasan Konsep

| Konsep | Syntax | Contoh dalam Anchor |
|--------|--------|---------------------|
| Struct | `pub struct Foo { pub x: u64 }` | `#[account] pub struct State { ... }` |
| Impl | `impl Foo { fn bar(&self) {} }` | Method di account struct |
| Enum error | `enum E { Invalid }` | `#[error_code] pub enum E { ... }` |
| Result + `?` | `fn f() -> Result<(), E> { g()?; Ok(()) }` | Setiap instruction handler |
| Option | `Option<T>`, `if let Some(x)` | Optional accounts, optional fields |
| Reference | `fn f(x: &Foo)` | `ctx.accounts.vault`, CPI helpers |
| Match | `match e { A => ..., B => ... }` | Error handling, status checks |

---

## Materi Tambahan

### Wajib dibaca sebelum Lesson 6
- [The Rust Book — Chapters 4-6](https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html)
  (ownership, references, enums dan pattern matching)

### Latihan mandiri (opsional, kerjakan sebelum Lesson 6)
- [Rustlings](https://rustlings.rust-lang.org/) — exercises interaktif Rust
  Prioritaskan chapter berikut (dalam urutan ini):
  1. `variables`
  2. `primitive_types`
  3. `move_semantics`
  4. `structs`
  5. `enums`
  6. `error_handling`

### Referensi Anchor (preview Lesson 6)
- https://www.anchor-lang.com/docs
- https://learn.blueshift.gg/en/courses/anchor-for-dummies/anchor-101

---

## Next Steps

**Lesson 6 — Anchor Part 2: Building Escrows**

Kamu akan mengambil konsep yang dipelajari hari ini dan menerapkannya sebagai on-chain program:
- `EscrowOffer` → `#[account] pub struct EscrowState`
- `EscrowError` → `#[error_code] pub enum EscrowError`
- `make_offer()` → instruction handler yang write ke blockchain
- References → account contexts dengan `&ctx.accounts.vault`

Cek progress kamu di Superteam Indonesia:
- Telegram: [t.me/superteamindonesia](https://t.me/superteamindonesia)
- Website: [superteam.fun/indonesia](https://superteam.fun/indonesia)
