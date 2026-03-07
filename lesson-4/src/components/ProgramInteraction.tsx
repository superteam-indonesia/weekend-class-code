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

  // TODO: Definisikan PROGRAM_ID dari environment variable
  // Fallback ke CounterIDL.address jika env var tidak di-set
  // Hint:
  //   const PROGRAM_ID = new PublicKey(
  //     process.env.NEXT_PUBLIC_COUNTER_PROGRAM_ID ?? CounterIDL.address
  //   );

  // TODO: Buat helper getProgram() yang mengembalikan instance Program Anchor
  //
  // AnchorProvider menghubungkan Anchor ke:
  //   - connection: untuk RPC calls ke blockchain
  //   - wallet: untuk menandatangani transaksi
  //
  // Hint:
  //   const getProgram = () => {
  //     const provider = new AnchorProvider(connection, wallet as any, {
  //       commitment: 'confirmed',
  //     });
  //     // Anchor 0.30: Program ID diambil dari IDL.address
  //     // Kita override address jika NEXT_PUBLIC_COUNTER_PROGRAM_ID di-set
  //     const idl = {
  //       ...CounterIDL,
  //       address: process.env.NEXT_PUBLIC_COUNTER_PROGRAM_ID ?? CounterIDL.address,
  //     };
  //     return new Program(idl as any, provider);
  //   };

  // TODO: Buat helper getCounterPDA() yang menurunkan alamat PDA counter
  //
  // PDA = Program Derived Address
  // Deterministik: seeds yang sama + program yang sama → PDA yang sama selalu
  // Seeds untuk counter: ["counter", publicKey_bytes]
  //
  // Hint:
  //   const getCounterPDA = (): PublicKey => {
  //     const [pda] = PublicKey.findProgramAddressSync(
  //       [
  //         Buffer.from('counter'),
  //         publicKey!.toBuffer(),
  //       ],
  //       new PublicKey(process.env.NEXT_PUBLIC_COUNTER_PROGRAM_ID ?? CounterIDL.address)
  //     );
  //     return pda;
  //   };

  // Fungsi untuk membaca nilai counter dari blockchain (operasi READ)
  const fetchCount = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    setError('');
    try {
      // TODO: Buat instance program dengan getProgram()
      // TODO: Dapatkan PDA counter dengan getCounterPDA()
      // TODO: Fetch data akun counter dari blockchain
      //   const data = await program.account.counter.fetch(pda) as CounterAccount;
      // TODO: Update state dengan nilai count
      //   setCount(data.count.toNumber());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // Jika akun belum diinisialisasi, counter memang belum ada — bukan error
      if (msg.includes('Account does not exist') || msg.includes('could not find account')) {
        setCount(null);
      } else {
        setError('Gagal membaca counter: ' + msg);
      }
    } finally {
      setLoading(false);
    }
  }, [publicKey, connection, wallet]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  // Fungsi untuk memanggil instruksi initialize (operasi WRITE)
  const handleInitialize = async () => {
    if (!publicKey) return;
    setTxStatus('Menginisialisasi counter...');
    setError('');
    try {
      // TODO: Buat instance program dan PDA
      // TODO: Panggil instruksi initialize
      //   Accounts yang dibutuhkan: authority, counter (PDA), systemProgram
      //   Hint:
      //     const sig = await program.methods
      //       .initialize()
      //       .accounts({
      //         authority: publicKey,
      //         counter: pda,
      //         systemProgram: SystemProgram.programId,
      //       })
      //       .rpc();
      setTxStatus('Berhasil! Counter diinisialisasi.');
      await fetchCount();
    } catch (err: unknown) {
      setError('Error: ' + (err instanceof Error ? err.message : String(err)));
      setTxStatus('');
    }
  };

  // Fungsi increment — pola sama dengan initialize, tapi instruksi berbeda
  const handleIncrement = async () => {
    if (!publicKey) return;
    setTxStatus('Mengirim transaksi increment...');
    setError('');
    try {
      // TODO: Buat instance program dan PDA
      // TODO: Panggil program.methods.increment().accounts({...}).rpc()
      //   Accounts: authority, counter (PDA)
      setTxStatus('Berhasil! Counter bertambah.');
      await fetchCount();
    } catch (err: unknown) {
      setError('Error: ' + (err instanceof Error ? err.message : String(err)));
      setTxStatus('');
    }
  };

  // Fungsi decrement — Anchor akan error jika count == 0 (CounterUnderflow)
  const handleDecrement = async () => {
    if (!publicKey) return;
    setTxStatus('Mengirim transaksi decrement...');
    setError('');
    try {
      // TODO: Buat instance program dan PDA
      // TODO: Panggil program.methods.decrement().accounts({...}).rpc()
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
      // TODO: Buat instance program dan PDA
      // TODO: Panggil program.methods.reset().accounts({...}).rpc()
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

      {/* Grid tombol aksi */}
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
