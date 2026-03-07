'use client';

// ============================================================
// ProgramInteraction.tsx — Berinteraksi dengan smart contract Anchor
//
// KONSEP KUNCI (Bagian 4 — Program Interaction):
// Smart contract (program) di Solana bisa dibaca dan dipanggil
// langsung dari frontend menggunakan library Anchor client.
//
// Alur:
//   1. AnchorProvider  → Bungkus connection + wallet → Anchor bisa tanda tangan
//   2. Program         → Instance dari IDL + provider → gateway ke program on-chain
//   3. PDA             → Alamat akun counter diturunkan dari seeds
//   4. fetch()         → Baca data akun (READ)
//   5. methods.xxx()   → Panggil instruksi program (WRITE)
//
// IDL (Interface Definition Language):
// File JSON yang mendeskripsikan struktur program — seperti ABI di Ethereum.
// Anchor generate IDL otomatis dari source code Rust program.
// Program ID sudah tertanam di CounterIDL.address — tidak perlu env var.
// ============================================================

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider, Program, BN } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { useEffect, useState, useCallback } from 'react';
import CounterIDL from '@/idl/counter.json';

// TypeScript type untuk data akun Counter on-chain
interface CounterAccount {
  authority: PublicKey;
  count: BN;
  bump: number;
}

export default function ProgramInteraction() {
  const { connection } = useConnection();
  // Kita butuh seluruh wallet object (bukan hanya publicKey)
  // karena AnchorProvider butuh wallet untuk menandatangani transaksi
  const wallet = useWallet();
  const { publicKey, connected } = wallet;

  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState('');
  const [error, setError] = useState('');

  // Helper: buat instance Program Anchor yang terhubung ke wallet
  //
  // AnchorProvider menggabungkan:
  //   - connection: tahu cara bicara ke blockchain
  //   - wallet: tahu cara menandatangani transaksi
  // Program ID diambil otomatis dari CounterIDL.address
  const getProgram = useCallback(() => {
    const provider = new AnchorProvider(connection, wallet as any, {
      commitment: 'confirmed',
    });
    return new Program(CounterIDL as any, provider);
  }, [connection, wallet]);

  // Helper: turunkan PDA (Program Derived Address) untuk counter milik user ini
  //
  // PDA = alamat deterministik yang dikontrol oleh program, bukan siapapun.
  // Seeds: ["counter", publicKey] → setiap user punya counter sendiri.
  // findProgramAddressSync mencari nonce (bump) agar hasilnya bukan di curve ed25519.
  const getCounterPDA = useCallback((): PublicKey => {
    const [pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('counter'),    // seed 1: string literal "counter"
        publicKey!.toBuffer(),     // seed 2: bytes dari public key user
      ],
      new PublicKey(CounterIDL.address)
    );
    return pda;
  }, [publicKey]);

  // Fungsi untuk membaca nilai counter dari blockchain (operasi READ)
  // READ = gratis, tidak perlu tanda tangan
  const fetchCount = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    setError('');
    try {
      const program = getProgram();
      const pda = getCounterPDA();

      // program.account.counter.fetch() → baca dan decode akun Counter dari blockchain
      // Anchor otomatis memvalidasi discriminator dan decode field sesuai IDL
      const data = await program.account.counter.fetch(pda) as CounterAccount;

      // data.count adalah BN (BigNumber) — konversi ke number biasa untuk display
      setCount(data.count.toNumber());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // Jika akun belum diinisialisasi, counter memang belum ada — bukan error fatal
      if (msg.includes('Account does not exist') || msg.includes('could not find account')) {
        setCount(null);
      } else {
        setError('Gagal membaca counter: ' + msg);
      }
    } finally {
      setLoading(false);
    }
  }, [publicKey, getProgram, getCounterPDA]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  // Fungsi untuk memanggil instruksi initialize (operasi WRITE)
  // Membuat akun Counter baru untuk user ini, dengan count = 0
  const handleInitialize = async () => {
    if (!publicKey) return;
    setTxStatus('Menginisialisasi counter...');
    setError('');
    try {
      const program = getProgram();
      const pda = getCounterPDA();

      // program.methods.initialize() → buat transaksi dengan instruksi initialize
      // .accounts({...}) → berikan alamat semua akun yang dibutuhkan instruksi
      // .rpc() → tanda tangani + kirim + tunggu konfirmasi (satu langkah!)
      await program.methods
        .initialize()
        .accounts({
          authority: publicKey,
          counter: pda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setTxStatus('Berhasil! Counter diinisialisasi.');
      await fetchCount();
    } catch (err: unknown) {
      setError('Error: ' + (err instanceof Error ? err.message : String(err)));
      setTxStatus('');
    }
  };

  // Fungsi increment — tambahkan 1 ke counter
  const handleIncrement = async () => {
    if (!publicKey) return;
    setTxStatus('Mengirim transaksi increment...');
    setError('');
    try {
      const program = getProgram();
      const pda = getCounterPDA();

      // Instruksi increment tidak butuh systemProgram (tidak membuat akun baru)
      await program.methods
        .increment()
        .accounts({
          authority: publicKey,
          counter: pda,
        })
        .rpc();

      setTxStatus('Berhasil! Counter bertambah.');
      await fetchCount();
    } catch (err: unknown) {
      setError('Error: ' + (err instanceof Error ? err.message : String(err)));
      setTxStatus('');
    }
  };

  // Fungsi decrement — kurangi 1 dari counter
  // Program akan throw CounterUnderflow (error code 6000) jika count sudah 0
  const handleDecrement = async () => {
    if (!publicKey) return;
    setTxStatus('Mengirim transaksi decrement...');
    setError('');
    try {
      const program = getProgram();
      const pda = getCounterPDA();

      await program.methods
        .decrement()
        .accounts({
          authority: publicKey,
          counter: pda,
        })
        .rpc();

      setTxStatus('Berhasil! Counter berkurang.');
      await fetchCount();
    } catch (err: unknown) {
      setError('Error: ' + (err instanceof Error ? err.message : String(err)));
      setTxStatus('');
    }
  };

  // Fungsi reset — kembalikan counter ke 0
  const handleReset = async () => {
    if (!publicKey) return;
    setTxStatus('Mereset counter ke 0...');
    setError('');
    try {
      const program = getProgram();
      const pda = getCounterPDA();

      await program.methods
        .reset()
        .accounts({
          authority: publicKey,
          counter: pda,
        })
        .rpc();

      setTxStatus('Berhasil! Counter direset ke 0.');
      await fetchCount();
    } catch (err: unknown) {
      setError('Error: ' + (err instanceof Error ? err.message : String(err)));
      setTxStatus('');
    }
  };

  if (!connected) return null;

  return (
    <div className="card">
      <h2>Program Interaction (Counter)</h2>
      <p className="hint">
        Berinteraksi langsung dengan smart contract Anchor on-chain.
        Setiap tombol memanggil satu instruksi program.
      </p>

      {/* Tampilkan nilai counter saat ini */}
      <div style={{ margin: '1.25rem 0', textAlign: 'center' }}>
        {loading ? (
          <p className="hint">Memuat...</p>
        ) : count !== null ? (
          <p className="balance">{count}</p>
        ) : (
          <p className="hint">
            Counter belum diinisialisasi. Klik &ldquo;Initialize&rdquo; untuk membuat akun counter.
          </p>
        )}
      </div>

      {/* Grid tombol aksi — 4 instruksi program */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <button onClick={handleInitialize} className="btn-secondary">
          Initialize
        </button>
        <button
          onClick={handleIncrement}
          className="btn-primary"
          disabled={count === null}
        >
          + Increment
        </button>
        <button
          onClick={handleDecrement}
          className="btn-secondary"
          disabled={count === null || count === 0}
        >
          - Decrement
        </button>
        <button
          onClick={handleReset}
          className="btn-secondary"
          disabled={count === null}
        >
          Reset
        </button>
      </div>

      <button
        onClick={fetchCount}
        className="btn-secondary"
        style={{ width: '100%', marginTop: '0.5rem' }}
      >
        Refresh Count
      </button>

      {txStatus && (
        <p className="status-connected" style={{ marginTop: '0.75rem' }}>
          {txStatus}
        </p>
      )}
      {error && (
        <p className="error-text" style={{ marginTop: '0.5rem' }}>
          {error}
        </p>
      )}
    </div>
  );
}
