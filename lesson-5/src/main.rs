// =============================================================================
// SOLUSI: Rust Primer — Lesson 5
// Superteam Indonesia Weekend Class
//
// File ini adalah jawaban lengkap.
// File latihan ada di: src/workshop.rs
// Jalankan: cargo run --bin solution
// =============================================================================

// ---------------------------------------------------------------------------
// MODULE: state — menyimpan definisi data (mirip #[account] di Anchor)
// ---------------------------------------------------------------------------
mod state {
    /// Representasi sederhana dari sebuah escrow offer.
    ///
    /// Di Anchor, struct ini akan didekorasi dengan #[account] dan
    /// field `maker` bertipe `Pubkey` (bukan String). Strukturnya sama persis.
    #[derive(Debug)]
    pub struct EscrowOffer {
        pub id: u64,
        pub maker: String,              // di Anchor: Pubkey
        pub token_offered_amount: u64,
        pub token_wanted_amount: u64,
    }

    impl EscrowOffer {
        /// Buat offer baru.
        /// `maker: &str` — kita pinjam string, tidak mengambil ownershipnya.
        pub fn new(id: u64, maker: &str, offered: u64, wanted: u64) -> Self {
            EscrowOffer {
                id,
                maker: maker.to_string(),
                token_offered_amount: offered,
                token_wanted_amount: wanted,
            }
        }

        /// Cek apakah offer ini valid (kedua jumlah harus > 0).
        pub fn is_valid(&self) -> bool {
            self.token_offered_amount > 0 && self.token_wanted_amount > 0
        }

        /// Buat deskripsi offer dalam format yang mudah dibaca.
        pub fn describe(&self) -> String {
            format!(
                "Offer #{}: {} menawarkan {} token, meminta {} token",
                self.id, self.maker, self.token_offered_amount, self.token_wanted_amount
            )
        }
    }
}

// ---------------------------------------------------------------------------
// MODULE: errors — kode error kustom (mirip #[error_code] di Anchor)
// ---------------------------------------------------------------------------
mod errors {
    /// Error-error yang bisa terjadi dalam escrow program.
    ///
    /// Di Anchor, enum ini didekorasi dengan #[error_code] dan
    /// setiap variant otomatis dapat kode numerik.
    #[derive(Debug)]
    pub enum EscrowError {
        InvalidAmount,
        Unauthorized,
        OfferNotFound,
    }

    impl std::fmt::Display for EscrowError {
        fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
            match self {
                EscrowError::InvalidAmount => {
                    write!(f, "Jumlah token tidak valid (harus lebih dari 0)")
                }
                EscrowError::Unauthorized => {
                    write!(f, "Tidak punya akses untuk operasi ini")
                }
                EscrowError::OfferNotFound => {
                    write!(f, "Offer tidak ditemukan")
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// MODULE: instructions — logika instruksi (mirip handler fn di Anchor)
// ---------------------------------------------------------------------------
mod instructions {
    use super::errors::EscrowError;
    use super::state::EscrowOffer;

    /// Validasi offer sebelum diproses.
    ///
    /// Kenapa `offer: &EscrowOffer` bukan `offer: EscrowOffer`?
    /// Di Anchor, semua account diteruskan sebagai referensi lewat Context.
    /// Kita tidak pernah memindahkan (move) ownership sebuah account — kita
    /// hanya meminjam (borrow) untuk dibaca atau dimodifikasi.
    pub fn validate_offer(offer: &EscrowOffer) -> Result<(), EscrowError> {
        if offer.token_offered_amount == 0 {
            return Err(EscrowError::InvalidAmount);
        }
        if offer.token_wanted_amount == 0 {
            return Err(EscrowError::InvalidAmount);
        }
        Ok(())
    }

    /// Buat offer baru setelah validasi.
    ///
    /// Operator `?` pada `validate_offer(&temp)?` artinya:
    /// kalau hasilnya Err, langsung return Err ke pemanggil fungsi ini.
    /// Setara dengan: if let Err(e) = validate_offer(&temp) { return Err(e); }
    pub fn make_offer(
        id: u64,
        maker: &str,
        offered: u64,
        wanted: u64,
    ) -> Result<EscrowOffer, EscrowError> {
        let offer = EscrowOffer::new(id, maker, offered, wanted);
        validate_offer(&offer)?;
        Ok(offer)
    }

    /// Cancel offer — hanya maker yang boleh cancel.
    pub fn cancel_offer(offer: &EscrowOffer, caller: &str) -> Result<(), EscrowError> {
        if offer.maker != caller {
            return Err(EscrowError::Unauthorized);
        }
        Ok(())
    }

    /// Cari offer berdasarkan ID.
    ///
    /// Return type `Option<&EscrowOffer>`:
    /// - `Some(&offer)` kalau ditemukan
    /// - `None` kalau tidak ada
    ///
    /// Kenapa `&[EscrowOffer]` bukan `Vec<EscrowOffer>`?
    /// Slice reference memungkinkan kita membaca data tanpa mengambil ownershipnya.
    pub fn find_offer(offers: &[EscrowOffer], id: u64) -> Option<&EscrowOffer> {
        offers.iter().find(|o| o.id == id)
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

    // `let` = immutable by default. Tambah `mut` untuk bisa diubah.
    let harga: u64 = 1_000_000; // lamports — underscore = pemisah ribuan
    let mut saldo: u64 = 5_000_000;
    let nama: &str = "Budi"; // &str = pinjam string literal
    let aktif: bool = true;

    println!("User  : {}", nama);
    println!("Aktif : {}", aktif);
    println!("Saldo : {} lamports", saldo);
    println!("Harga : {} lamports", harga);

    saldo -= harga; // bisa karena `saldo` dideklarasikan `mut`
    println!("Saldo setelah bayar: {} lamports\n", saldo);

    // -------------------------------------------------------------------------
    // Section B: Struct dan impl
    // -------------------------------------------------------------------------
    println!("=== Section B: Struct dan impl ===");

    let offer = match make_offer(1, "Alice", 100, 50) {
        Ok(o) => {
            println!("{}", o.describe());
            println!("Valid: {}\n", o.is_valid());
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

    // Coba buat offer dengan amount = 0 (harus ditolak)
    match make_offer(2, "Bob", 0, 50) {
        Ok(_) => println!("Offer dibuat (tidak seharusnya sampai sini)"),
        Err(EscrowError::InvalidAmount) => println!("Ditolak: jumlah token tidak valid"),
        Err(EscrowError::Unauthorized) => println!("Ditolak: tidak punya akses"),
        Err(EscrowError::OfferNotFound) => println!("Offer tidak ditemukan"),
    }
    println!();

    // -------------------------------------------------------------------------
    // Section D: Option dan Result dengan `?`
    // -------------------------------------------------------------------------
    println!("=== Section D: Option dan Result ===");

    let offers = vec![offer];

    // if let — cara aman untuk unwrap Option tanpa panic
    if let Some(found) = find_offer(&offers, 1) {
        println!("Ditemukan: {}", found.describe());
    }

    // Cari offer yang tidak ada
    let missing = find_offer(&offers, 99);

    // .map() — transformasi isi Option tanpa unwrap
    // .unwrap_or() — nilai default kalau None
    let label = missing
        .map(|o| o.describe())
        .unwrap_or_else(|| "tidak ada".to_string());
    println!("Offer ID 99: {}\n", label);

    // -------------------------------------------------------------------------
    // Section E: References dan Borrowing (seperti pola CPI di Anchor)
    // -------------------------------------------------------------------------
    println!("=== Section E: References (pola CPI Anchor) ===");

    // `&offers[0]` = pinjam offer, bukan pindahkan ownership-nya
    match cancel_offer(&offers[0], "Alice") {
        Ok(()) => println!("Alice berhasil cancel offer-nya"),
        Err(e) => println!("Error: {}", e),
    }

    match cancel_offer(&offers[0], "Charlie") {
        Ok(()) => println!("Charlie berhasil cancel (tidak seharusnya)"),
        Err(EscrowError::Unauthorized) => println!("Charlie ditolak: bukan pemilik offer"),
        Err(e) => println!("Error: {}", e),
    }

    println!("\n=== Selesai! ===");
    println!("Minggu depan: struct ini jadi on-chain account dengan Anchor.");
    println!("Perhatikan betapa miripnya EscrowOffer di sini dengan");
    println!("EscrowState yang akan kamu tulis di Lesson 6.\n");

    // =========================================================================
    // PREVIEW: Inilah kode Anchor ASLI yang kamu tulis minggu depan.
    // Tidak perlu dijalankan — cukup baca dan perhatikan pola yang familiar.
    // =========================================================================
    //
    // #[account]                              // ← macro: generate serialize/deserialize
    // pub struct EscrowState {                // ← struct yang baru kamu pelajari hari ini
    //     pub id: u64,                        // ← u64, sama seperti di atas
    //     pub maker: Pubkey,                  // ← seperti String tapi untuk alamat Solana
    //     pub token_mint_a: Pubkey,
    //     pub token_mint_b: Pubkey,
    //     pub token_b_wanted_amount: u64,     // ← sama persis dengan token_wanted_amount
    //     pub bump: u8,                       // ← untuk PDA (Lesson 6)
    // }
    //
    // pub fn make_offer(                      // ← sama seperti fn make_offer() di atas
    //     ctx: Context<MakeOffer>,            // ← accounts diteruskan lewat Context (bukan param)
    //     id: u64,
    //     token_b_wanted_amount: u64,
    // ) -> Result<()> {                       // ← Result<()> yang sama
    //     ctx.accounts.offer.set_inner(EscrowState {
    //         id,
    //         maker: ctx.accounts.maker.key(),
    //         token_b_wanted_amount,
    //         bump: ctx.bumps.offer,
    //         ..Default::default()
    //     });
    //     Ok(())                              // ← Ok(()) yang sama
    // }
    //
    // Pertanyaan: bagian mana yang sudah familiar setelah hari ini?
}
