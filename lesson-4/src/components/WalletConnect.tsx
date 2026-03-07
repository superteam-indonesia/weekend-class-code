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
  // TODO: Ambil publicKey dan connected dari useWallet()
  // Hint: const { publicKey, connected } = useWallet();

  return (
    <div className="card">
      <h2>Hubungkan Wallet</h2>

      {/* WalletMultiButton: tombol siap pakai dari @solana/wallet-adapter-react-ui */}
      {/* Tombol ini menangani connect, disconnect, dan tampilkan address secara otomatis */}
      <WalletMultiButton />

      {/* TODO: Tampilkan info wallet jika connected && publicKey
          - Tampilkan <p className="status-connected">Wallet Terhubung!</p>
          - Tampilkan publicKey.toBase58() sebagai alamat wallet
          - Gunakan className="pubkey" untuk styling monospace
          - Tambahkan hint: "Ini adalah identitas kamu di blockchain Solana..." */}

      {/* TODO: Tampilkan hint jika !connected
          - "Pastikan Phantom Wallet sudah terinstall di browser kamu..." */}
    </div>
  );
}
