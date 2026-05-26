import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import CartManager from "@/components/CartManager";

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: "SFIZIO | Mobiliário de Alto Padrão",
  description: "Descubra a elegância e o design autoral em móveis premium para ambientes sofisticados.",
  openGraph: {
    title: "SFIZIO | Mobiliário de Alto Padrão",
    description: "Design contemporâneo, materiais nobres e exclusividade.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <Navbar />
        <CartManager />
        <main style={{ marginTop: 'var(--header-height)' }} className="page-enter">
          {children}
        </main>
        <footer style={{ backgroundColor: 'var(--bg-secondary)', padding: '80px 5%', marginTop: 'auto' }}>
          <div className="grid-container">
            <div style={{ gridColumn: 'span 4' }}>
              <h3 style={{ marginBottom: '24px' }}>SFIZIO</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Curadoria exclusiva de móveis que unem arte, conforto e sofisticação para os projetos mais exigentes do país.
              </p>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <h4 style={{ marginBottom: '16px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Explorar</h4>
              <ul style={{ listStyle: 'none', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <li>Sofás</li>
                <li>Mesas de Jantar</li>
                <li>Cadeiras Premium</li>
                <li>Lançamentos</li>
              </ul>
            </div>
            <div style={{ gridColumn: 'span 3' }}>
              <h4 style={{ marginBottom: '16px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Atendimento</h4>
              <ul style={{ listStyle: 'none', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <li>Falar com Consultor</li>
                <li>Showrooms</li>
                <li>Políticas de Entrega</li>
              </ul>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
