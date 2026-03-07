'use client';

// ============================================================
// BalanceDisplay.tsx — Menampilkan saldo SOL wallet
//
// KONSEP KUNCI (Slide 11 & 12 — Read/Baca):
// Membaca data dari blockchain adalah operasi GRATIS.
// Tidak perlu tanda tangan wallet — siapapun bisa baca data on-chain.
//
// connection.getBalance(publicKey):
// - Memanggil RPC node untuk membaca saldo
// - Hasilnya dalam satuan LAMPORTS (bukan SOL)
// - 1 SOL = 1.000.000.000 lamports (satu miliar)
// ============================================================

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useEffect, useState, useCallback } from 'react';

export default function BalanceDisplay() {
  // useConnection() → akses objek Connection ke RPC Solana
  const { connection } = useConnection();
  // useWallet() → akses info wallet yang sedang terhubung
  const { publicKey, connected } = useWallet();

  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fungsi untuk mengambil saldo dari blockchain
  const fetchBalance = useCallback(async () => {
    // Jika wallet belum terhubung, tidak ada yang bisa kita cek
    if (!publicKey) return;

    setLoading(true);
    setError('');

    try {
      // getBalance() adalah RPC call — berkomunikasi dengan node Solana
      // Ini operasi READ: tidak butuh tanda tangan, tidak perlu bayar fee
      const lamports = await connection.getBalance(publicKey);

      // Konversi lamports → SOL
      // LAMPORTS_PER_SOL = 1_000_000_000 (konstanta dari @solana/web3.js)
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch (err) {
      console.error('Gagal mengambil saldo:', err);
      setError('Gagal memuat saldo. Periksa koneksi internet kamu.');
    } finally {
      setLoading(false);
    }
  }, [publicKey, connection]);

  // Ambil saldo setiap kali publicKey berubah (wallet connect/disconnect)
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Sembunyikan komponen ini jika wallet belum terhubung
  if (!connected) return null;

  return (
    <div className="card">
      <h2>Saldo Wallet</h2>

      {loading && <p className="hint">Memuat saldo...</p>}

      {error && <p className="error-text">{error}</p>}

      {!loading && !error && balance !== null && (
        <div>
          {/* Tampilkan saldo dengan 4 angka desimal */}
          <p className="balance">{balance.toFixed(4)} SOL</p>

          <button onClick={fetchBalance} className="btn-secondary">
            Refresh Saldo
          </button>

          <p className="hint" style={{ marginTop: '0.75rem' }}>
            Operasi BACA — gratis, tidak memerlukan tanda tangan wallet.
            Saldo dapat berubah setelah transaksi.
          </p>
        </div>
      )}

      {!loading && balance === null && !error && (
        <p className="hint">Memuat saldo...</p>
      )}
    </div>
  );
}
