import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

const Footer = ({ minimal = false }) => {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    toast.success('¡Gracias por suscribirte a NutraBlue! Pronto recibirás novedades científicas y ofertas.');
    setEmail('');
  };

  if (minimal) {
    return (
      <footer className="bg-card text-muted-foreground border-t border-border py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
            <p>© 2026 NutraBlue. Todos los derechos reservados. Distribuidor Autorizado.</p>
            <div className="flex items-center space-x-6">
              <Link to="/privacy-policy" className="hover:text-primary transition-colors duration-200">
                Términos y Condiciones
              </Link>
              <Link to="/privacy-policy" className="hover:text-primary transition-colors duration-200">
                Política de Privacidad
              </Link>
              <a href="mailto:soporte@nutrablue.cl" className="hover:text-primary transition-colors duration-200">
                Soporte al Cliente
              </a>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="relative bg-slate-950 text-white border-t border-border overflow-hidden">
      {/* Background Image Container */}
      <div 
        className="absolute inset-0 z-0 opacity-45 mix-blend-multiply pointer-events-none" 
        style={{
          backgroundImage: 'url("/footer_bg.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <img src="/logo.png" alt="NutraBlue Logo" className="h-12 w-auto brightness-0 invert" />
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Alimentos naturales y funcionales, seleccionados para mejorar tu salud y tu vida. Empresa familiar chilena — despacho a todo el país.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <span className="text-sm font-bold tracking-wider uppercase text-white">Enlaces Útiles</span>
              <nav className="mt-4 flex flex-col space-y-2">
                <Link to="/" className="text-sm text-slate-300 hover:text-primary transition-all duration-200">
                  Inicio
                </Link>
                <Link to="/shop" className="text-sm text-slate-300 hover:text-primary transition-all duration-200">
                  Catálogo de Productos
                </Link>
                <Link to="/impacto" className="text-sm text-slate-300 hover:text-primary transition-all duration-200">
                  Conoce Nuestro Impacto
                </Link>
                <Link to="/faqs" className="text-sm text-slate-300 hover:text-primary transition-all duration-200">
                  Preguntas Frecuentes (FAQs)
                </Link>
                <a href="mailto:contacto@nutrablue.cl" className="text-sm text-slate-300 hover:text-primary transition-all duration-200">
                  Contacto & Soporte
                </a>
              </nav>
            </div>

            {/* Certifications & newsletter */}
            <div className="space-y-6 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-sm font-bold tracking-wider uppercase text-white">Salud que llega a tu correo</span>
                <p className="text-xs text-slate-300">
                  Recetas, ideas simples para comer mejor y descuentos exclusivos para nuestra comunidad. Sin spam, prometido.
                </p>
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Tu correo"
                    required
                    className="flex-grow px-3 py-2 rounded-xl bg-slate-950/80 border border-white/20 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 rounded-xl text-xs transition-all duration-200 active:scale-[0.98] shrink-0"
                  >
                    Suscribirme
                  </button>
                </form>
              </div>

              <div className="pt-2 flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Distribuidor Oficial de NutraBlue</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/10">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-xs text-slate-400">
                © 2026 NutraBlue. Todos los derechos reservados. Desarrollado bajo respaldo científico.
              </p>
              <div className="flex space-x-6 text-xs text-slate-400">
                <Link to="/privacy-policy" className="hover:text-primary transition-all duration-200">
                  Política de Privacidad
                </Link>
                <Link to="/privacy-policy" className="hover:text-primary transition-all duration-200">
                  Términos de Servicio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;