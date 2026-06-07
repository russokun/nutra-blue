import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import ProtectedRoute from '@/components/ProtectedRoute';

const AccountContent = () => {
  const { currentUser, isAdmin, logout } = useAuth();
  const displayName = currentUser?.user_metadata?.full_name || currentUser?.email;

  return (
    <>
      <Helmet>
        <title>Mi Cuenta - Nutra Blue</title>
      </Helmet>
      <Header />
      <main className="min-h-screen bg-background py-12">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-foreground mb-8" style={{ fontFamily: 'Playfair Display, serif' }}>
            Mi Cuenta
          </h1>
          <div className="bg-card rounded-xl p-6 border border-border space-y-4">
            <p className="text-card-foreground">
              <span className="text-muted-foreground">Email: </span>
              {currentUser?.email}
            </p>
            {displayName && (
              <p className="text-card-foreground">
                <span className="text-muted-foreground">Nombre: </span>
                {displayName}
              </p>
            )}
            <div className="flex flex-wrap gap-3 pt-4">
              {isAdmin && (
                <Button asChild variant="outline">
                  <Link to="/admin">Panel de Administración</Link>
                </Button>
              )}
              <Button variant="destructive" onClick={logout}>
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

const AccountPage = () => (
  <ProtectedRoute>
    <AccountContent />
  </ProtectedRoute>
);

export default AccountPage;
