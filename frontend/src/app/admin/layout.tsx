'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import './admin.css';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token && !isLoginPage) {
      router.push('/admin/login');
    } else if (token && isLoginPage) {
      router.push('/admin');
    } else {
      setIsAuthorized(!!token || isLoginPage);
      setLoading(false);
    }
  }, [pathname, isLoginPage, router]);

  // If loading, show nothing or a spinner
  if (loading && !isLoginPage) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa' }}>Carregando...</div>;
  }

  // If on login page, just render children without sidebar
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Check safety if not authorized but not loading (fallback)
  if (!isAuthorized) return null;

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          SFIZIO <span>Admin</span>
        </div>
        <nav className="admin-nav">
          <Link href="/admin" className={pathname === '/admin' ? 'active' : ''}>Dashboard</Link>
          <Link href="/admin/products" className={pathname.startsWith('/admin/products') ? 'active' : ''}>Produtos</Link>
          <Link href="/admin/site-settings" className={pathname === '/admin/site-settings' ? 'active' : ''}>Configurações</Link>
          <Link href="/">Ver Site</Link>
        </nav>
        <div className="admin-footer">
          <button onClick={() => {
            localStorage.removeItem('token');
            router.push('/admin/login');
          }}>Sair</button>
        </div>
      </aside>
      <main className="admin-content">
        <header className="admin-header">
           <div className="user-info">Administrador</div>
        </header>
        <div className="admin-page-content">
          {children}
        </div>
      </main>
    </div>
  );
}
