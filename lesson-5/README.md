# Rust Primer + Anchor Intro — Lesson 5

Lesson ini adalah fondasi sebelum kamu bisa menulis program Solana dengan Anchor.
Kita akan belajar sintaks Rust dari nol — mulai dari variabel sampai ownership —
lalu melihat bagaimana Anchor menyederhanakan pengembangan program Solana.

Tidak ada script TypeScript di lesson ini. Semua latihan dilakukan melalui **Rustlings**,
sebuah tool interaktif yang akan membimbingmu belajar Rust dengan latihan kecil-kecil.

---

## Prasyarat

- Sudah selesai Lesson 4 (Building UIs in Solana)
- Rust dan Cargo terinstall — jika belum:
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  source ~/.cargo/env
  ```
- Verifikasi instalasi:
  ```bash
  rustc --version
  cargo --version
  ```

---

## Instalasi Rustlings

Rustlings adalah tool latihan Rust resmi dari komunitas Rust. Install dengan:

```bash
cargo install rustlings
rustlings init
cd rustlings
```

Atau jika pakai script cepat:

```bash
curl -L https://raw.githubusercontent.com/rust-lang/rustlings/main/install.sh | bash
```

---

## Cara Menjalankan Rustlings

### Mulai latihan:
```bash
rustlings watch
```
Rustlings akan otomatis mendeteksi file yang kamu edit dan menampilkan feedback langsung.

### Lihat daftar latihan:
```bash
rustlings list
```

### Cek progres:
```bash
rustlings progress
```

### Jalankan satu latihan tertentu:
```bash
rustlings run variables1
```

---

## Target Latihan Lesson 5

Selesaikan chapter-chapter berikut dalam urutan ini:

| Chapter | Konsep | Jumlah Latihan |
|---------|--------|---------------|
| `variables` | Variabel, mutability, shadowing | 6 |
| `functions` | Deklarasi fungsi, return value | 5 |
| `if` | Conditional expression | 2 |
| `primitive_types` | Tipe dasar, tuple, array | 6 |
| `vecs` | Vector (koleksi dinamis) | 2 |
| `structs` | Struct dan metodenya | 3 |
| `enums` | Enum, Option, match | 5 |
| `strings` | String vs &str | 4 |
| `modules` | mod, pub, use | 3 |
| `move_semantics` | Ownership, move, borrow | 6 |

**Total: ~42 latihan** — selesaikan secara bertahap sesuai jadwal lesson.

---

## Penjelasan Konsep — Ringkasan Lesson 5

### Langkah 1: Variabel & Mutability

Di Rust, variabel default bersifat **immutable** (tidak bisa diubah). Ini bukan keterbatasan —
ini adalah fitur keamanan. Dengan default immutable, compiler bisa mendeteksi bug lebih awal.

```rust
// Immutable — nilai tidak bisa diubah
let nama = "Budi";

// Mutable — perlu kata kunci mut
let mut saldo: u64 = 1_000_000;
saldo += 500_000;

// Constant — immutable dan harus ada tipe
const LAMPORTS_PER_SOL: u64 = 1_000_000_000;
```

Di Solana/Anchor, kamu akan sering melihat `u64` untuk menyimpan jumlah lamports dan token.

---

### Langkah 2: Tipe Data Dasar

```rust
// Integer
let i: i64 = -100;      // bertanda (signed)
let u: u64 = 1_000_000; // tak bertanda (unsigned) — paling umum di Solana

// Float
let f: f64 = 3.14;

// Bool
let aktif: bool = true;

// String
let s1: String = String::from("owned string"); // heap-allocated
let s2: &str   = "string literal";             // stack reference

// Tuple
let pair: (u64, bool) = (42, true);

// Array (panjang tetap)
let pubkey_bytes: [u8; 32] = [0u8; 32]; // contoh: 32 bytes pubkey
```

---

### Langkah 3: Control Flow

```rust
// if / else
if saldo > 0 {
    println!("Saldo ada: {}", saldo);
} else {
    println!("Saldo kosong");
}

// for range
for i in 0..5 {
    println!("Index: {}", i);
}

// match — wajib exhaustive (semua kasus ditangani)
let status = "aktif";
match status {
    "aktif"   => println!("Member aktif"),
    "expired" => println!("Perpanjang membership"),
    _         => println!("Status tidak dikenal"), // wildcard
}
```

`match` adalah fitur paling kuat di Rust. Di Anchor, kita pakai `match` untuk menangani
berbagai jenis error dan status akun.

---

### Langkah 4: Structs

Struct dipakai untuk mengelompokkan data yang berhubungan. Di Anchor, setiap **Account state**
didefinisikan sebagai struct.

```rust
#[derive(Debug)]
struct Member {
    nama: String,
    saldo: u64,
    aktif: bool,
}

impl Member {
    // Constructor (associated function)
    fn baru(nama: &str, saldo: u64) -> Member {
        Member {
            nama: String::from(nama),
            saldo,
            aktif: true,
        }
    }

    // Method baca
    fn cek_saldo(&self) -> u64 {
        self.saldo
    }

    // Method ubah
    fn deposit(&mut self, jumlah: u64) {
        self.saldo += jumlah;
    }
}

let mut budi = Member::baru("Budi", 1_000_000);
budi.deposit(500_000);
println!("Saldo Budi: {}", budi.cek_saldo());
```

---

### Langkah 5: Enums, Option & Result

```rust
// Enum biasa
enum StatusMember {
    Aktif,
    Expired,
    Banned { alasan: String },
}

// Option<T> — nilai yang mungkin ada atau tidak
// Tidak ada null di Rust! Option memaksa kamu tangani keduanya.
let nama: Option<String> = Some(String::from("Budi"));
let kosong: Option<String> = None;

match nama {
    Some(n) => println!("Nama: {}", n),
    None    => println!("Tidak ada nama"),
}

// Result<T, E> — operasi yang bisa sukses atau gagal
fn bagi(a: u64, b: u64) -> Result<u64, String> {
    if b == 0 {
        return Err(String::from("Tidak bisa bagi dengan nol!"));
    }
    Ok(a / b)
}
```

Di Anchor, setiap instruction handler mengembalikan `Result<()>`. Error ditangani
dengan custom `#[error_code]` enum.

---

### Langkah 6: Ownership

**Analogi:** Sistem pinjam buku di perpustakaan.
- Hanya 1 orang yang bisa "memiliki" buku sekaligus
- Saat pemilik pergi (keluar scope), buku dikembalikan ke rak (memori dibebaskan)
- Tidak ada garbage collector — memori dikelola otomatis oleh compiler

```rust
// MOVE: s1 tidak valid setelah di-assign ke s2
let s1 = String::from("hello");
let s2 = s1;
// println!("{}", s1); // ERROR: value moved

// CLONE: buat salinan eksplisit
let s3 = String::from("world");
let s4 = s3.clone(); // sekarang s3 dan s4 keduanya valid

// Copy types: int, bool, char, tuple/array dari copy types
let x = 5;
let y = x; // int di-COPY, bukan di-move
println!("{} {}", x, y); // keduanya valid
```

---

### Langkah 7: Borrowing & References

**Analogi:** Baca buku di perpustakaan tanpa membawanya pulang.

```rust
let s = String::from("hello");

// Immutable reference: &T — bisa banyak sekaligus
let r1 = &s;
let r2 = &s;
println!("{} {}", r1, r2); // keduanya valid

// Mutable reference: &mut T — hanya SATU sekaligus
let mut s2 = String::from("hello");
let r3 = &mut s2;
r3.push_str(", world");
println!("{}", r3);
```

**Aturan borrow (diperiksa compiler):**
1. Boleh banyak `&T` (shared/immutable) sekaligus, ATAU
2. Tepat satu `&mut T` (exclusive/mutable), tidak bisa bersamaan

---

## Ringkasan Konsep

| Konsep | Penjelasan Singkat |
|--------|--------------------|
| `let` | Deklarasi variabel (default immutable) |
| `let mut` | Variabel yang bisa diubah nilainya |
| `const` | Konstanta (immutable, perlu tipe eksplisit) |
| `struct` | Mengelompokkan data terkait |
| `impl` | Menambahkan method ke struct |
| `enum` | Tipe dengan beberapa varian |
| `Option<T>` | Nilai yang mungkin ada (`Some`) atau tidak (`None`) |
| `Result<T, E>` | Operasi yang bisa sukses (`Ok`) atau gagal (`Err`) |
| Ownership | Setiap nilai punya 1 pemilik; freed saat owner keluar scope |
| Borrowing | Pinjam nilai tanpa pindah ownership (`&T` atau `&mut T`) |
| `mod` | Modul untuk organisasi kode |
| `pub` | Publik — bisa diakses dari luar modul |

---

## Langkah Selanjutnya

- **Lesson 6**: Anchor Part 2 — Building Escrows
  (PDA, CPI, SPL Token dalam Anchor, escrow make/take/cancel)
- Lanjutkan Rustlings sampai chapter `traits`, `lifetimes`, dan `iterators`
- Baca [The Rust Book](https://doc.rust-lang.org/book/) — gratis, lengkap, dan sangat baik
- Bergabung dengan [Superteam Indonesia](https://superteam.fun/indonesia) untuk networking, bounties, dan hackathon
