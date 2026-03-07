// Page adalah Server Component — tidak ada interaktivitas di sini.
// Semua logika wallet ada di dalam SolanaProviders (Client Component).
import SolanaProviders from '@/components/SolanaProviders';
import WalletConnect from '@/components/WalletConnect';
import BalanceDisplay from '@/components/BalanceDisplay';
import TransferForm from '@/components/TransferForm';

// TODO: (Bagian 4) Uncomment import berikut setelah ProgramInteraction selesai diimplementasi
// import ProgramInteraction from '@/components/ProgramInteraction';

export default function Home() {
  return (
    <SolanaProviders>
      <div className="app-container">
        <h1>Solana Token Transfer UI</h1>
        <p className="subtitle">Lesson 4 — Superteam Indonesia Weekend Class</p>

        {/* Komponen 1: Hubungkan wallet (Slide 7) */}
        <WalletConnect />

        {/* Komponen 2: Tampilkan saldo — operasi READ (Slide 12) */}
        <BalanceDisplay />

        {/* Komponen 3: Kirim SOL — operasi WRITE (Slide 12) */}
        <TransferForm />

        {/* TODO: (Bagian 4) Uncomment setelah ProgramInteraction selesai diimplementasi */}
        {/* <ProgramInteraction /> */}
      </div>
    </SolanaProviders>
  );
}
