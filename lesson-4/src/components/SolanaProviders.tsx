'use client';

// ============================================================
// SolanaProviders.tsx — Wrapper Client Component untuk semua provider Solana
//
// Di Next.js App Router, provider yang menggunakan hooks React HARUS
// berada di Client Component (ditandai dengan 'use client').
//
// Kita pisahkan provider ke file ini agar layout.tsx tetap bisa
// menjadi Server Component (lebih efisien).
//
// KONSEP KUNCI (Slide 10):
// 3 layer provider yang dibutuhkan:
//   1. ConnectionProvider  → Koneksi ke RPC node Solana
//   2. WalletProvider      → Akses ke wallet user (Phantom, dll)
//   3. WalletModalProvider → UI modal untuk memilih wallet
// ============================================================

import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo } from 'react';

export default function SolanaProviders({ children }: { children: React.ReactNode }) {
  // clusterApiUrl('devnet') → https://api.devnet.solana.com
  // Atau bisa pakai env variable untuk RPC custom
  const endpoint = useMemo(
    () => process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl('devnet'),
    []
  );

  // Daftar wallet yang didukung aplikasi ini
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    // LAYER 1: Koneksi ke blockchain
    <ConnectionProvider endpoint={endpoint}>
      {/* LAYER 2: Akses wallet user — autoConnect: reconnect otomatis */}
      <WalletProvider wallets={wallets} autoConnect>
        {/* LAYER 3: UI modal pemilihan wallet */}
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
