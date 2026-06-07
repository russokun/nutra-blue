import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';

const adminLinks = [
  { name: 'Órdenes', path: '/admin/orders' },
  { name: 'Productos', path: '/admin/products' },
];

const AdminLayout = () => {
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>
              Administración
            </h1>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/">Volver a la tienda</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={logout}>Salir</Button>
            </div>
          </div>

          <nav className="flex gap-4 mb-8 border-b border-border pb-4">
            {adminLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                  location.pathname === link.path
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <Outlet />
        </div>
      </main>
      <Footer />
    </>
  );
};

export default AdminLayout;
