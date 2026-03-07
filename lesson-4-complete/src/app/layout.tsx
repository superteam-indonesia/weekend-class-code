import type { Metadata } from 'next';
import '../styles/index.css';
import '@solana/wallet-adapter-react-ui/styles.css';

export const metadata: Metadata = {
  title: 'Lesson 4 Complete — Solana Token Transfer UI',
  description: 'Superteam Indonesia Weekend Class — Lesson 4: Coding UI dalam Solana (Complete)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
