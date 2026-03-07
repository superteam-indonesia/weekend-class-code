'use client';

// ============================================================
// WalletConnect.tsx — Komponen untuk menghubungkan wallet
//
// KONSEP KUNCI (Slide 7):
// Di Web3, wallet = identitas user. Tidak ada username/password.
// Public key wallet = "alamat" user yang bisa dilihat semua orang.
// Private key = "kunci" yang digunakan untuk menandatangani transaksi.
//
// useWallet() memberikan kita:
// - publicKey: alamat wallet yang sedang terhubung
// - connected: boolean apakah wallet sudah terkonek
// ============================================================

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function WalletConnect() {
  // Hook dari wallet-adapter — beri kita info dan kontrol wallet
  const { publicKey, connected } = useWallet();

  return (
    <div className="card">
      <h2>Hubungkan Wallet</h2>

      {/* WalletMultiButton: tombol siap pakai dari @solana/wallet-adapter-react-ui */}
      {/* Tombol ini menangani connect, disconnect, dan tampilkan address secara otomatis */}
      <WalletMultiButton />

      {connected && publicKey && (
        <div className="wallet-info">
          <p className="status-connected">Wallet Terhubung!</p>
          {/* publicKey.toBase58() mengubah public key menjadi string yang bisa dibaca */}
          <p className="pubkey">
            <strong>Alamat:</strong> {publicKey.toBase58()}
          </p>
          <p className="hint">
            Ini adalah identitas kamu di blockchain Solana. Seperti nomor rekening, tapi bisa dilihat semua orang.
          </p>
        </div>
      )}

      {!connected && (
        <p className="hint">
          Pastikan Phantom Wallet sudah terinstall di browser kamu. Klik tombol di atas untuk terhubung.
        </p>
      )}
    </div>
  );
}
