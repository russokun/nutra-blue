import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';

const HistoriaPage = () => {
  return (
    <>
      <Helmet>
        <title>Nuestra Historia - NutraBlue</title>
        <meta name="description" content="Conoce la historia detrás de NutraBlue, una empresa familiar chilena dedicada a mejorar la calidad de vida mediante alimentación funcional." />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-[#fcfbf9] py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
              Nuestra Historia
            </h1>
            <p className="text-xl text-slate-600">La familia detrás de NutraBlue</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="h-[400px] w-full bg-slate-200 relative">
              {/* Placeholder for family/team photo */}
              <img 
                src="https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&h=400&fit=crop" 
                alt="Familia NutraBlue" 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="p-8 md:p-12 space-y-6 text-lg text-slate-700 leading-relaxed">
              <p>
                Somos una empresa familiar chilena apasionada por la salud y el bienestar real. Todo comenzó buscando soluciones para nosotros mismos: queríamos rendir mejor en nuestro día a día sin depender de estimulantes que a la larga nos pasaban la cuenta, y queríamos dormir mejor para poder disfrutar nuestros años.
              </p>
              <p>
                En ese camino descubrimos el poder de la naturaleza bien elegida y respaldada por la ciencia. Hoy traemos a tu mesa los mejores alimentos y compuestos funcionales —libres de rellenos y aditivos— para ayudarte a cuidar tu energía, tu concentración y tu longevidad.
              </p>
              <p>
                Nuestra misión es simple: queremos que te sientas increíble hoy y que construyas una salud fuerte para mañana. Y llegamos a todo Chile para lograrlo.
              </p>
              
              <div className="pt-8 text-center">
                <Button asChild size="lg" className="rounded-full px-8">
                  <Link to="/shop">Ver nuestros productos</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default HistoriaPage;
