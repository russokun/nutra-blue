import React from 'react';
import { Helmet } from '@/components/Meta';
import { absoluteUrl } from '@/lib/seo';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';

const HistoriaPage = () => {
  return (
    <>
      <Helmet>
        <title>Nuestra Historia - NutraBlue</title>
        <meta
          name="description"
          content="Conoce la historia detrás de NutraBlue, una empresa familiar chilena dedicada a mejorar la calidad de vida mediante alimentación funcional."
        />
        <meta property="og:title" content="Nuestra Historia — NutraBlue" />
        <meta
          property="og:description"
          content="La familia detrás de NutraBlue. Alimentos naturales y funcionales para energía, concentración y longevidad."
        />
        <meta property="og:image" content={absoluteUrl('/images/lifestyle/hero_trekking_family.jpg')} />
        <meta property="og:url" content={absoluteUrl('/historia')} />
        <link rel="canonical" href={absoluteUrl('/historia')} />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-[#fcfbf9] pb-20">
        {/* Hero Inmersivo Familiar */}
        <section className="relative h-[320px] md:h-[420px] w-full overflow-hidden mb-12 select-none">
          <img
            src="/images/lifestyle/hero_trekking_family.jpg"
            alt="Familia NutraBlue en la naturaleza"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/45 to-transparent flex items-center justify-center text-center p-6">
            <div className="max-w-3xl text-white space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-accent bg-accent/20 px-3.5 py-1 rounded-full border border-accent/30 inline-block mb-1">
                Empresa Familiar Chilena
              </span>
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight"
                style={{ fontFamily: 'Impact, sans-serif' }}
              >
                Nuestra Historia
              </h1>
              <p className="text-lg md:text-xl text-slate-200 font-medium max-w-xl mx-auto">
                La familia detrás de NutraBlue
              </p>
            </div>
          </div>
        </section>

        {/* Tarjeta de Relato y Galería */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Foto Principal de Momentos Compartidos */}
            <div className="h-[380px] md:h-[460px] w-full relative group overflow-hidden">
              <img
                src="/images/lifestyle/friends_healthy_living_nowine.jpg"
                alt="Compartiendo momentos NutraBlue"
                className="w-full h-full object-cover object-[center_30%] group-hover:scale-[1.02] transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Texto del Manifiesto Familiar */}
            <div className="p-8 md:p-12 space-y-6 text-base md:text-lg text-slate-700 leading-relaxed">
              <p>
                Somos una empresa familiar chilena apasionada por la salud y el bienestar real. Todo comenzó buscando soluciones para nosotros mismos: queríamos rendir mejor en nuestro día a día sin depender de estimulantes que a la larga nos pasaban la cuenta, y queríamos dormir mejor para poder disfrutar nuestros años.
              </p>
              <p>
                En ese camino descubrimos el poder de la naturaleza bien elegida y respaldada por la ciencia. Hoy traemos a tu mesa los mejores alimentos y compuestos funcionales —libres de rellenos y aditivos— para ayudarte a cuidar tu energía, tu concentración y tu longevidad.
              </p>
              <p>
                Nuestra misión es simple: queremos que te sientas increíble hoy y que construyas una salud fuerte para mañana. Y llegamos a todo Chile para lograrlo.
              </p>

              {/* Trilogía de Momentos / Cards de Estilo de Vida */}
              <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl overflow-hidden shadow-sm h-48 group relative border border-border/40">
                  <img
                    src="/images/lifestyle/breakfast_couple_card.jpg"
                    alt="Desayuno saludable NutraBlue"
                    className="w-full h-full object-cover object-[center_25%] group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent flex items-end p-3">
                    <span className="text-white text-xs font-semibold">Alimentación Diaria Consciente</span>
                  </div>
                </div>

                <div className="rounded-2xl overflow-hidden shadow-sm h-48 group relative border border-border/40">
                  <img
                    src="/images/lifestyle/yoga_senior_card.jpg"
                    alt="Bienestar y longevidad NutraBlue"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent flex items-end p-3">
                    <span className="text-white text-xs font-semibold">Descanso & Longevidad</span>
                  </div>
                </div>

                <div className="rounded-2xl overflow-hidden shadow-sm h-48 group relative border border-border/40">
                  <img
                    src="/images/lifestyle/office_team_card.jpg"
                    alt="Enfoque y energía en equipo"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent flex items-end p-3">
                    <span className="text-white text-xs font-semibold">Enfoque & Claridad Mental</span>
                  </div>
                </div>
              </div>

              {/* Botón CTA al Catálogo */}
              <div className="pt-8 text-center">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full px-10 py-6 text-base font-bold bg-accent text-white hover:bg-accent/90 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
                >
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
