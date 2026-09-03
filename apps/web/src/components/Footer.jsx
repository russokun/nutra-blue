import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import Logo from '@/components/Logo';
import { Helecho, Ramita, Flor } from '@/components/botanica/Botanica';
import dataClient from '@/lib/dataClient';

const Footer = ({ minimal = false }) => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      await dataClient.subscribeLead(email, 'Footer Newsletter');
      toast.success('¡Gracias por suscribirte a NutraBlue! Te enviamos tu descuento de bienvenida al correo.');
      setEmail('');
    } catch (err) {
      console.warn('Subscription error:', err);
      toast.success('¡Gracias por suscribirte a NutraBlue!');
      setEmail('');
    } finally {
      setSubmitting(false);
    }
  };

  if (minimal) {
    return (
      <footer className="bg-card text-muted-foreground border-t border-border py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
            <p>© 2026 NutraBlue. Todos los derechos reservados. Distribuidor Autorizado.</p>
            <div className="flex items-center space-x-6">
              <Link to="/terms-of-service" className="hover:text-primary transition-colors duration-200">
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
    <footer className="relative overflow-hidden border-t border-natural-700 bg-gradient-to-b from-natural-800 via-natural-800 to-natural-900 text-white">
      {/* Acá había una foto de fondo al 25%. Servía cuando el suelo era casi negro y
          hacía falta textura; sobre un verde compuesto se leía como un borrón y le
          peleaba al color. La sensación de naturaleza la lleva la franja vegetal. */}

      {/* Franja vegetal en el borde de arriba: marca que acá empieza la tierra. Van
          asomando desde el borde, cortadas, en vez de alineadas como una guarda: un
          matorral no está ordenado. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-0 flex h-24 items-start justify-between px-[4%] text-natural-500/70 sm:h-28"
      >
        <Helecho className="-mt-10 w-16 rotate-[8deg] sm:w-20" />
        <Ramita className="-mt-14 hidden w-10 -rotate-6 sm:block sm:w-12" />
        <Flor className="-mt-12 w-12 rotate-[14deg] sm:w-14" />
        <Ramita className="-mt-9 hidden w-11 rotate-[9deg] lg:block" />
        <Helecho className="-mt-16 w-20 -rotate-[10deg] sm:w-24" />
      </div>

      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Logo className="h-10" enFondoOscuro />
              </div>
              <p className="text-sm leading-relaxed text-natural-200">
                Alimentos naturales y funcionales, seleccionados para mejorar tu salud y tu vida. Empresa familiar chilena — despacho a todo el país.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <span className="text-sm font-bold tracking-wider uppercase text-white">Enlaces Útiles</span>
              <nav className="mt-4 flex flex-col space-y-2">
                <Link to="/" className="text-sm text-natural-200 hover:text-white transition-colors duration-200">
                  Inicio
                </Link>
                <Link to="/shop" className="text-sm text-natural-200 hover:text-white transition-colors duration-200">
                  Catálogo de Productos
                </Link>
                <Link to="/impacto" className="text-sm text-natural-200 hover:text-white transition-colors duration-200">
                  Conoce Nuestro Impacto
                </Link>
                <Link to="/faqs" className="text-sm text-natural-200 hover:text-white transition-colors duration-200">
                  Preguntas Frecuentes (FAQs)
                </Link>
                <a href="mailto:contacto@nutrablue.cl" className="text-sm text-natural-200 hover:text-white transition-colors duration-200">
                  Contacto & Soporte
                </a>
              </nav>
            </div>

            {/* Certifications & newsletter */}
            <div className="space-y-6 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-sm font-bold tracking-wider uppercase text-white">Salud que llega a tu correo</span>
                <p className="text-xs text-natural-200">
                  Recetas, ideas simples para comer mejor y descuentos exclusivos para nuestra comunidad. Sin spam, prometido.
                </p>
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Tu correo"
                    required
                    className="flex-grow px-3 py-2 rounded-xl bg-natural-900/70 border border-natural-400/40 text-xs text-white placeholder-natural-300 focus:outline-none focus:ring-2 focus:ring-natural-300 focus:border-transparent transition-all"
                  />
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 rounded-xl text-xs transition-all duration-200 active:scale-[0.98] shrink-0"
                  >
                    Suscribirme
                  </button>
                </form>
              </div>

              <div className="pt-2 flex items-center gap-2 text-xs text-natural-300">
                <ShieldCheck className="h-4 w-4 text-natural-300" />
                <span>Distribuidor Oficial de NutraBlue</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-natural-400/25">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-xs text-natural-300">
                © 2026 NutraBlue. Todos los derechos reservados. Desarrollado bajo respaldo científico.
              </p>
              <div className="flex space-x-6 text-xs text-natural-300">
                <Link to="/privacy-policy" className="hover:text-white transition-all duration-200">
                  Política de Privacidad
                </Link>
                <Link to="/terms-of-service" className="hover:text-white transition-all duration-200">
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