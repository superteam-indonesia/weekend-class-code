'use client';

// ============================================================
// TransferForm.tsx — Form untuk mengirim SOL ke alamat lain
//
// KONSEP KUNCI (Slide 12 — Write/Tulis):
// Mengirim SOL adalah operasi TULIS — mengubah state di blockchain.
// Ini memerlukan:
//   1. Tanda tangan dari wallet (user harus approve)
//   2. Pembayaran gas fee (dalam lamports)
//   3. Konfirmasi dari validator sebelum dianggap selesai
//
// Alur transaksi:
//   Buat Instruksi → Bungkus dalam Transaksi → Tanda Tangan → Kirim → Konfirmasi
//
// KEAMANAN (Slide 16):
// Selalu tampilkan ringkasan transaksi SEBELUM user menandatangani.
// Wallet (Phantom) juga akan menampilkan detail ini untuk konfirmasi.
// ============================================================

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { useState } from 'react';
import TransactionStatus from './TransactionStatus';

type TxStatus = 'idle' | 'signing' | 'confirming' | 'success' | 'error';

export default function TransferForm() {
  const { connection } = useConnection();
  // sendTransaction: fungsi dari wallet-adapter untuk mengirim tx via wallet
  const { publicKey, sendTransaction, connected } = useWallet();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [status, setStatus] = useState<TxStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleTransfer = async () => {
    // Reset state sebelum mulai
    setErrorMessage('');
    setTxSignature(null);

    // --- VALIDASI INPUT ---
    // Best Practice (Slide 16): Selalu validasi di sisi client sebelum kirim ke chain

    if (!publicKey) {
      setErrorMessage('Wallet belum terhubung!');
      setStatus('error');
      return;
    }

    // Validasi alamat tujuan — PublicKey akan throw jika format salah
    let recipientPubkey: PublicKey;
    try {
      recipientPubkey = new PublicKey(recipient.trim());
    } catch {
      setErrorMessage('Alamat tujuan tidak valid! Pastikan formatnya benar.');
      setStatus('error');
      return;
    }

    // Tidak boleh kirim ke diri sendiri (edge case sederhana)
    if (recipientPubkey.toBase58() === publicKey.toBase58()) {
      setErrorMessage('Tidak bisa mengirim SOL ke alamat sendiri.');
      setStatus('error');
      return;
    }

    // Validasi jumlah
    const solAmount = parseFloat(amount);
    if (isNaN(solAmount) || solAmount <= 0) {
      setErrorMessage('Jumlah SOL harus lebih dari 0!');
      setStatus('error');
      return;
    }

    // Konversi SOL ke lamports (harus integer)
    const lamports = Math.round(solAmount * LAMPORTS_PER_SOL);

    try {
      setStatus('signing');

      // --- LANGKAH 1: Buat instruksi transfer ---
      // SystemProgram.transfer adalah instruksi built-in Solana untuk transfer SOL
      // Tidak perlu program custom — ini sudah ada di protocol Solana
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: publicKey,       // Pengirim (harus tanda tangan)
        toPubkey: recipientPubkey,   // Penerima
        lamports: lamports,          // Jumlah dalam lamports
      });

      // --- LANGKAH 2: Buat objek Transaction dan tambahkan instruksi ---
      // Satu transaksi bisa berisi banyak instruksi (tapi kita pakai 1 saja di sini)
      const transaction = new Transaction().add(transferInstruction);

      // --- LANGKAH 3: Ambil blockhash terbaru ---
      // Blockhash = "cap waktu" transaksi. Jika terlalu lama tidak dikirim,
      // blockhash akan expired dan transaksi ditolak.
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;  // Siapa yang bayar gas fee

      // --- LANGKAH 4: Kirim ke wallet untuk ditandatangani ---
      // sendTransaction() akan membuka popup Phantom untuk konfirmasi user
      // User bisa APPROVE atau REJECT di sini
      setStatus('confirming');
      const signature = await sendTransaction(transaction, connection);
      setTxSignature(signature);

      // --- LANGKAH 5: Tunggu konfirmasi dari validator ---
      // 'confirmed': transaksi sudah disetujui oleh mayoritas validator
      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        'confirmed'
      );

      setStatus('success');

    } catch (err: unknown) {
      setStatus('error');

      // --- ERROR HANDLING (Slide 18) ---
      // Berbagai jenis error yang mungkin terjadi:
      const message = err instanceof Error ? err.message : String(err);

      if (message.includes('User rejected') || message.includes('user rejected')) {
        // User mengklik "Reject" di Phantom
        setErrorMessage('Transaksi dibatalkan oleh user.');
      } else if (message.includes('Blockhash not found')) {
        // Terlalu lama menunggu sebelum mengirim
        setErrorMessage('Blockhash sudah expired. Silakan coba lagi.');
      } else if (message.includes('insufficient lamports') || message.includes('insufficient funds')) {
        // Saldo tidak cukup (termasuk untuk gas fee)
        setErrorMessage('Saldo tidak cukup untuk transaksi ini (sudah termasuk gas fee).');
      } else if (message.includes('Invalid public key')) {
        setErrorMessage('Alamat tujuan tidak valid.');
      } else {
        setErrorMessage(`Error: ${message || 'Terjadi kesalahan yang tidak diketahui.'}`);
      }
    }
  };

  const isProcessing = status === 'signing' || status === 'confirming';

  const resetForm = () => {
    setStatus('idle');
    setErrorMessage('');
    setTxSignature(null);
    setRecipient('');
    setAmount('');
  };

  // Sembunyikan komponen jika wallet belum terhubung
  if (!connected) return null;

  return (
    <div className="card">
      <h2>Kirim SOL</h2>
      <p className="hint">
        Operasi TULIS — memerlukan tanda tangan wallet dan membayar gas fee kecil.
      </p>

      <div className="form-group">
        <label htmlFor="recipient">Alamat Tujuan:</label>
        <input
          id="recipient"
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="Masukkan alamat Solana tujuan..."
          className="input"
          disabled={isProcessing}
        />
      </div>

      <div className="form-group">
        <label htmlFor="amount">Jumlah SOL:</label>
        <input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.01"
          min="0"
          step="0.001"
          className="input"
          disabled={isProcessing}
        />
      </div>

      {/* Ringkasan transaksi — tampilkan SEBELUM user klik kirim (Best Practice Slide 16) */}
      {recipient && amount && parseFloat(amount) > 0 && (
        <div className="tx-preview">
          <h3>Ringkasan Transaksi:</h3>
          <p><strong>Program:</strong> SystemProgram (Transfer SOL)</p>
          <p><strong>Dari:</strong> {publicKey?.toBase58().slice(0, 12)}...</p>
          <p><strong>Ke:</strong> {recipient.slice(0, 12)}{recipient.length > 12 ? '...' : ''}</p>
          <p><strong>Jumlah:</strong> {amount} SOL</p>
          <p className="hint">Gas fee akan ditambahkan otomatis oleh jaringan.</p>
        </div>
      )}

      <button
        onClick={status === 'success' || status === 'error' ? resetForm : handleTransfer}
        disabled={isProcessing}
        className="btn-primary"
      >
        {status === 'signing' && 'Menunggu tanda tangan di Phantom...'}
        {status === 'confirming' && 'Mengkonfirmasi transaksi...'}
        {status === 'success' && 'Kirim Lagi'}
        {status === 'error' && 'Coba Lagi'}
        {status === 'idle' && 'Kirim SOL'}
      </button>

      <TransactionStatus
        status={status}
        signature={txSignature}
        errorMessage={errorMessage}
      />
    </div>
  );
}
