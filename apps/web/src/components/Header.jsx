import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, User, LogOut } from 'lucide-react';
import CartIcon from '@/components/CartIcon';
import { useAuth } from '@/hooks/useAuth';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

const Header = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, isAdmin, logout, authAvailable } = useAuth();

  const navLinks = [
    { name: 'Inicio', path: '/' },
    { name: 'Catálogo', path: '/shop' },
    { name: 'Impacto', path: '/impacto' },
    { name: 'Carrito', path: '/cart' },
  ];

  const isActive = (path) => location.pathname === path;

  const authLink = isAuthenticated
    ? { name: 'Mi Cuenta', path: '/account' }
    : authAvailable
      ? { name: 'Ingresar', path: '/login' }
      : null;

  const allLinks = authLink ? [...navLinks, authLink] : navLinks;

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary" style={{ fontFamily: 'Playfair Display, serif' }}>
              Nutra Blue
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            {allLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-all duration-200 relative ${
                  isActive(link.path)
                    ? 'text-primary font-semibold'
                    : 'text-foreground/80 hover:text-primary'
                }`}
              >
                {link.name}
                {isActive(link.path) && (
                  <span className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-primary" />
                )}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" className="text-sm font-medium text-primary hover:text-primary/80">
                Admin
              </Link>
            )}
            <Link to="/cart" className="text-foreground/80 hover:text-primary transition-all duration-200">
              <CartIcon />
            </Link>
            {isAuthenticated && (
              <Button variant="ghost" size="icon" onClick={logout} title="Cerrar sesión">
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </nav>

          <div className="md:hidden flex items-center gap-2">
            <Link to="/cart"><CartIcon /></Link>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col space-y-4 mt-8">
                  {allLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`text-lg font-medium transition-all duration-200 ${
                        isActive(link.path)
                          ? 'text-primary font-semibold'
                          : 'text-foreground/80 hover:text-primary'
                      }`}
                    >
                      {link.name}
                    </Link>
                  ))}
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-primary">
                      Admin
                    </Link>
                  )}
                  {isAuthenticated ? (
                    <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="text-lg font-medium text-left text-muted-foreground flex items-center gap-2">
                      <LogOut className="h-4 w-4" /> Cerrar sesión
                    </button>
                  ) : authAvailable && (
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-muted-foreground flex items-center gap-2">
                      <User className="h-4 w-4" /> Crear cuenta
                    </Link>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
