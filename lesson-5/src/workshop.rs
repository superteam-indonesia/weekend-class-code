// =============================================================================
// WORKSHOP: Rust Primer — Lesson 5
// Superteam Indonesia Weekend Class
//
// Instruksi:
// - Isi setiap blok `todo!()` dan komentar `// TODO:` sesuai panduan instruktur
// - File jawaban lengkap ada di: src/main.rs
// - Jalankan dengan: cargo run --bin workshop
//
// Program ini AKAN COMPILE, tapi akan PANIC di bagian yang belum diisi.
// Tujuan: isi satu todo!() sekaligus, jalankan, lihat hasilnya, lanjut.
// =============================================================================

// ---------------------------------------------------------------------------
// MODULE: state
// ---------------------------------------------------------------------------
mod state {
    /// Struct ini mewakili sebuah escrow offer.
    ///
    /// Di Anchor (Lesson 6), struct ini akan terlihat seperti ini:
    ///   #[account]
    ///   pub struct EscrowState { pub id: u64, pub maker: Pubkey, ... }
    ///
    /// Untuk sekarang, kita pakai `String` sebagai pengganti `Pubkey`.
    #[derive(Debug)]
    pub struct EscrowOffer {
        pub id: u64,
        pub maker: String,

        // TODO A1: Tambahkan dua field berikut dengan tipe yang tepat:
        //   - token_offered_amount  — bilangan bulat tanpa negatif, ukuran besar
        //   - token_wanted_amount   — sama dengan di atas
        //
        // Hint: di Solana, jumlah token disimpan sebagai `u64`
        // (unsigned 64-bit integer, range 0 sampai ~18 triliun)
    }

    impl EscrowOffer {
        /// Buat EscrowOffer baru.
        ///
        /// Parameter `maker: &str` — kita pinjam (&) string dari pemanggil,
        /// tidak mengambil ownershipnya. Ini pola umum di Anchor.
        pub fn new(id: u64, maker: &str, offered: u64, wanted: u64) -> Self {
            // TODO B1: Kembalikan EscrowOffer baru dengan field yang diisi.
            //
            // Hint: untuk field `maker`, gunakan `maker.to_string()`
            // karena `maker` bertipe `&str` tapi field-nya bertipe `String`.
            //
            // Contoh struct literal:
            //   EscrowOffer { id: id, maker: maker.to_string(), ... }
            //
            // Atau gunakan shorthand kalau nama variabel sama dengan nama field:
            //   EscrowOffer { id, maker: maker.to_string(), ... }
            todo!("Isi struct EscrowOffer baru")
        }

        /// Return true kalau offer ini valid (kedua jumlah harus > 0).
        pub fn is_valid(&self) -> bool {
            // TODO B2: Return true kalau token_offered_amount DAN token_wanted_amount
            // keduanya lebih dari 0. Gunakan `&&` untuk AND.
            todo!("Cek validitas offer")
        }

        /// Buat string deskripsi offer.
        pub fn describe(&self) -> String {
            // TODO B3: Gunakan format!() untuk membuat string seperti:
            // "Offer #1: Alice menawarkan 100 token, meminta 50 token"
            //
            // Hint: format!("teks {} dan {}", nilai1, nilai2)
            todo!("Format deskripsi offer")
        }
    }
}

// ---------------------------------------------------------------------------
// MODULE: errors
// ---------------------------------------------------------------------------
mod errors {
    /// Kode error untuk escrow program.
    ///
    /// Di Anchor, ini akan didekorasi dengan #[error_code]:
    ///   #[error_code]
    ///   pub enum EscrowError { InvalidAmount, Unauthorized, ... }
    #[derive(Debug)]
    pub enum EscrowError {
        InvalidAmount,

        // TODO C1: Tambahkan dua variant lagi:
        //   - Unauthorized  — untuk aksi yang tidak diizinkan
        //   - OfferNotFound — untuk offer yang tidak ditemukan
    }

    impl std::fmt::Display for EscrowError {
        fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
            // TODO C2: Tulis match yang mengembalikan pesan error untuk setiap variant.
            //
            // Pola:
            //   match self {
            //       EscrowError::InvalidAmount => write!(f, "pesan error ..."),
            //       EscrowError::Unauthorized  => write!(f, "pesan error ..."),
            //       EscrowError::OfferNotFound => write!(f, "pesan error ..."),
            //   }
            todo!("Tulis match untuk semua variant EscrowError")
        }
    }
}

// ---------------------------------------------------------------------------
// MODULE: instructions
// ---------------------------------------------------------------------------
mod instructions {
    use super::errors::EscrowError;
    use super::state::EscrowOffer;

    /// Validasi offer sebelum diproses.
    ///
    /// PERTANYAAN: kenapa parameternya `offer: &EscrowOffer` bukan `offer: EscrowOffer`?
    /// JAWAB: Di Anchor, accounts diteruskan sebagai referensi lewat `ctx.accounts`.
    /// Kita tidak pernah memindahkan (move) ownership sebuah account — hanya meminjam.
    pub fn validate_offer(offer: &EscrowOffer) -> Result<(), EscrowError> {
        // TODO D1: Return Err(EscrowError::InvalidAmount) kalau token_offered_amount == 0
        // TODO D2: Return Err(EscrowError::InvalidAmount) kalau token_wanted_amount == 0
        // TODO D3: Return Ok(()) kalau semua valid
        todo!("Validasi offer")
    }

    /// Buat offer baru setelah validasi.
    ///
    /// Perhatikan operator `?` setelah validate_offer(&offer):
    ///   validate_offer(&offer)?
    ///
    /// Artinya: kalau validate_offer return Err, langsung return Err ke pemanggil.
    /// Tanpa `?`, kamu harus tulis:
    ///   match validate_offer(&offer) {
    ///       Ok(()) => {},
    ///       Err(e) => return Err(e),
    ///   }
    pub fn make_offer(
        id: u64,
        maker: &str,
        offered: u64,
        wanted: u64,
    ) -> Result<EscrowOffer, EscrowError> {
        let offer = EscrowOffer::new(id, maker, offered, wanted);

        // TODO D4: Panggil validate_offer(&offer) dengan operator `?`
        // Hint: validate_offer(&offer)?;
        todo!("Validasi dengan operator ?");

        Ok(offer)
    }

    /// Cancel offer — hanya maker yang boleh cancel.
    ///
    /// Kenapa `offer: &EscrowOffer` bukan `offer: EscrowOffer`?
    /// Sama seperti di Anchor: kita hanya perlu baca data offer, tidak perlu
    /// memindahkan ownershipnya.
    pub fn cancel_offer(offer: &EscrowOffer, caller: &str) -> Result<(), EscrowError> {
        // TODO E1: Return Err(EscrowError::Unauthorized) kalau offer.maker != caller
        // TODO E2: Return Ok(()) kalau caller adalah maker
        //
        // Hint: String comparison: offer.maker != caller
        todo!("Cek authorization")
    }

    /// Cari offer berdasarkan ID dari sebuah slice.
    ///
    /// Return type `Option<&EscrowOffer>`:
    ///   - Some(&offer) kalau ditemukan
    ///   - None kalau tidak ada
    ///
    /// Kenapa `offers: &[EscrowOffer]` bukan `Vec<EscrowOffer>`?
    /// Slice reference memungkinkan kita membaca list tanpa mengambil ownershipnya.
    pub fn find_offer(offers: &[EscrowOffer], id: u64) -> Option<&EscrowOffer> {
        // TODO D5: Gunakan offers.iter().find() untuk mencari offer dengan id yang cocok
        //
        // Hint: offers.iter().find(|o| o.id == id)
        todo!("Cari offer berdasarkan id")
    }
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
fn main() {
    use errors::EscrowError;
    use instructions::{cancel_offer, find_offer, make_offer};

    println!("╔══════════════════════════════════════════════════════════╗");
    println!("║     RUST PRIMER — Lesson 5 (Superteam Indonesia)        ║");
    println!("╚══════════════════════════════════════════════════════════╝\n");

    // -------------------------------------------------------------------------
    // Section A: Variabel dan Tipe Data
    // -------------------------------------------------------------------------
    println!("=== Section A: Variabel dan Tipe Data ===");

    // `let` = immutable secara default.
    // Variabel yang nilainya akan berubah perlu keyword `mut`.

    let harga: u64 = 1_000_000; // lamports (1 SOL = 1_000_000_000 lamports)

    // TODO A2: Deklarasikan `saldo` dengan nilai 5_000_000 dan tipe u64.
    //          Tambahkan `mut` karena nilai saldo akan kita kurangi di bawah.
    //          Contoh: let mut nama_variabel: tipe = nilai;
    let saldo: u64 = 5_000_000; // ← SALAH: tambahkan `mut`

    let nama: &str = "Budi"; // &str = pinjam string literal, tidak perlu alokasi heap
    let aktif: bool = true;

    println!("User  : {}", nama);
    println!("Aktif : {}", aktif);
    println!("Saldo : {} lamports", saldo);
    println!("Harga : {} lamports", harga);

    // TODO A3: Kurangi saldo dengan harga menggunakan operator -=
    //          Baris ini akan compile error sampai kamu tambah `mut` di atas.
    // saldo -= harga;

    println!("Saldo setelah bayar: {} lamports\n", saldo);

    // -------------------------------------------------------------------------
    // Section B: Struct dan impl
    // -------------------------------------------------------------------------
    println!("=== Section B: Struct dan impl ===");

    // Buat offer baru — ini akan memanggil EscrowOffer::new() yang kamu tulis
    let offer = match make_offer(1, "Alice", 100, 50) {
        Ok(o) => {
            // TODO B4: Panggil o.describe() dan o.is_valid() dan tampilkan hasilnya
            // Hint: println!("{}", o.describe());
            todo!("Tampilkan deskripsi dan validitas offer");
            o
        }
        Err(e) => {
            println!("Gagal membuat offer: {}", e);
            return;
        }
    };

    // -------------------------------------------------------------------------
    // Section C: Enum dan match
    // -------------------------------------------------------------------------
    println!("=== Section C: Enum dan match ===");

    // Coba buat offer dengan token_offered_amount = 0 — harus ditolak!
    match make_offer(2, "Bob", 0, 50) {
        Ok(_) => println!("Offer dibuat (tidak seharusnya sampai sini)"),
        // TODO C3: Tambahkan arm untuk EscrowError::InvalidAmount
        //          dan cetak pesan yang sesuai
        Err(e) => println!("Error tidak dikenal: {}", e),
    }
    println!();

    // -------------------------------------------------------------------------
    // Section D: Option dan Result dengan `?`
    // -------------------------------------------------------------------------
    println!("=== Section D: Option dan Result ===");

    let offers = vec![offer];

    // `find_offer` mengembalikan Option<&EscrowOffer>
    // Gunakan `if let` untuk unwrap dengan aman

    // TODO D6: Gunakan `if let Some(found) = find_offer(&offers, 1)` untuk
    //          menampilkan deskripsi offer yang ditemukan.
    //
    // Pola if let:
    //   if let Some(nilai) = ekspresi_option {
    //       // gunakan nilai di sini
    //   } else {
    //       // kalau None
    //   }
    todo!("Gunakan if let untuk find_offer");

    // Cari offer yang tidak ada (id = 99) — hasilnya None
    let missing = find_offer(&offers, 99);

    // TODO D7: Gunakan .map() dan .unwrap_or_else() untuk menampilkan:
    //          - deskripsi offer kalau Some
    //          - "tidak ada" kalau None
    //
    // Hint: missing.map(|o| o.describe()).unwrap_or_else(|| "tidak ada".to_string())
    let label: String = todo!("map dan unwrap_or_else");
    println!("Offer ID 99: {}\n", label);

    // -------------------------------------------------------------------------
    // Section E: References dan Borrowing (pola CPI di Anchor)
    // -------------------------------------------------------------------------
    println!("=== Section E: References (pola CPI Anchor) ===");

    // Perhatikan `&offers[0]` — kita pinjam (&) offer, tidak memindahkan ownership.
    // Di Anchor, semua account diteruskan lewat referensi: `&ctx.accounts.escrow`

    // TODO E3: Panggil cancel_offer(&offers[0], "Alice") dan handle hasilnya
    //          - Ok(())   → cetak "Alice berhasil cancel offer-nya"
    //          - Err(e)   → cetak error message
    todo!("Cancel offer sebagai Alice");

    // TODO E4: Panggil cancel_offer(&offers[0], "Charlie") dan handle hasilnya
    //          - Ok(())                        → cetak "(tidak seharusnya)"
    //          - Err(EscrowError::Unauthorized) → cetak "Charlie ditolak: bukan pemilik offer"
    //          - Err(e)                        → cetak error message lainnya
    todo!("Cancel offer sebagai Charlie");

    println!("\n=== Selesai! ===");
    println!("Minggu depan: struct ini jadi on-chain account dengan Anchor.");

    // =========================================================================
    // BONUS (baca saja, tidak perlu dijalankan):
    //
    // Ini adalah kode Anchor ASLI yang akan kamu tulis minggu depan.
    // Perhatikan pola yang sudah familiar.
    // =========================================================================
    //
    // #[account]                              // ← macro: generate serialize/deserialize
    // pub struct EscrowState {                // ← persis seperti EscrowOffer di atas!
    //     pub id: u64,                        // ← u64, sama
    //     pub maker: Pubkey,                  // ← seperti String, tapi untuk alamat Solana
    //     pub token_mint_a: Pubkey,
    //     pub token_mint_b: Pubkey,
    //     pub token_b_wanted_amount: u64,     // ← sama dengan token_wanted_amount
    //     pub bump: u8,
    // }
    //
    // pub fn make_offer(
    //     ctx: Context<MakeOffer>,            // ← accounts diteruskan lewat Context
    //     id: u64,
    //     token_b_wanted_amount: u64,
    // ) -> Result<()> {                       // ← Result<()> yang sama!
    //     ctx.accounts.offer.set_inner(EscrowState {
    //         id,                             // ← shorthand field yang sama
    //         maker: ctx.accounts.maker.key(),
    //         token_b_wanted_amount,
    //         bump: ctx.bumps.offer,
    //         ..Default::default()
    //     });
    //     Ok(())                              // ← Ok(()) yang sama!
    // }
    //
    // Pertanyaan untuk kamu: bagian mana yang sudah familiar setelah hari ini?
}
