'use client';

// ============================================================
// TransactionStatus.tsx — Menampilkan status transaksi
//
// Status transaksi melewati beberapa tahap:
// idle → signing → confirming → success / error
//
// Setelah sukses, kita tampilkan link ke Solana Explorer
// agar user bisa melihat bukti transaksi di blockchain.
// ============================================================

interface Props {
  status: 'idle' | 'signing' | 'confirming' | 'success' | 'error';
  signature: string | null;
  errorMessage: string;
}

export default function TransactionStatus({ status, signature, errorMessage }: Props) {
  // Tidak perlu tampilkan apa-apa jika belum ada aktivitas
  if (status === 'idle') return null;

  return (
    <div className={`tx-status tx-status-${status}`}>
      {status === 'signing' && (
        <p>Menunggu persetujuan dari wallet... Cek notifikasi Phantom kamu.</p>
      )}

      {status === 'confirming' && (
        <p>
          Transaksi terkirim ke jaringan! Menunggu konfirmasi dari validator Solana...
        </p>
      )}

      {status === 'success' && signature && (
        <div>
          <p className="status-connected">Transaksi Berhasil!</p>
          {/* Link ke Solana Explorer agar user bisa verifikasi transaksi */}
          <a
            href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="tx-link"
          >
            Lihat di Solana Explorer
          </a>
          <p className="hint" style={{ marginTop: '0.5rem' }}>
            Transaksi ini tercatat permanen di blockchain dan tidak bisa diubah.
          </p>
        </div>
      )}

      {status === 'error' && (
        <p className="error-text">{errorMessage}</p>
      )}
    </div>
  );
}
