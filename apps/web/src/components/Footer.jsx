import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <span className="text-2xl font-bold text-primary" style={{ fontFamily: 'Playfair Display, serif' }}>
              Nutra Blue
            </span>
            <p className="mt-4 text-sm leading-relaxed">
              Suplementos funcionales premium para optimizar tu biología y alcanzar la longevidad.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <span className="text-sm font-semibold tracking-wide uppercase">Enlaces Rápidos</span>
            <nav className="mt-4 flex flex-col space-y-2">
              <Link to="/" className="text-sm hover:text-primary transition-all duration-200">
                Inicio
              </Link>
              <Link to="/shop" className="text-sm hover:text-primary transition-all duration-200">
                Catálogo
              </Link>
              <Link to="/impacto" className="text-sm hover:text-primary transition-all duration-200">
                Nuestro Impacto
              </Link>
              <a href="mailto:contacto@nutrablue.cl" className="text-sm hover:text-primary transition-all duration-200">
                Contacto
              </a>
            </nav>
          </div>

          {/* Social Links */}
          <div>
            <span className="text-sm font-semibold tracking-wide uppercase">Síguenos</span>
            <div className="mt-4 flex space-x-4">
              <a href="#" className="text-secondary-foreground hover:text-primary transition-all duration-200">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-secondary-foreground hover:text-primary transition-all duration-200">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-secondary-foreground hover:text-primary transition-all duration-200">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border/50">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm">
              © 2026 Nutra Blue. Todos los derechos reservados.
            </p>
            <div className="flex space-x-6">
              <Link to="/privacy-policy" className="text-sm hover:text-primary transition-all duration-200">
                Política de Privacidad
              </Link>
              <Link to="/terms-of-service" className="text-sm hover:text-primary transition-all duration-200">
                Términos de Servicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;