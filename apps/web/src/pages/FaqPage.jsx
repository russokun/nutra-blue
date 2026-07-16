import React from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { HelpCircle } from 'lucide-react';

const FaqPage = () => {
  const faqs = [
    {
      q: '¿Cuánto demora el envío?',
      a: 'Santiago: 1-2 días hábiles. Regiones: 2-4 días hábiles.'
    },
    {
      q: '¿Son productos naturales?',
      a: 'Sí, 100% extractos naturales sin químicos sintéticos.'
    },
    {
      q: '¿Cómo se toman?',
      a: 'Cada producto tiene indicaciones en su etiqueta. En general, se mezclan con agua, café o batidos.'
    },
    {
      q: '¿Puedo devolver un producto?',
      a: 'Sí, aceptamos devoluciones de productos cerrados dentro de los primeros 10 días.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Preguntas Frecuentes - NutraBlue</title>
        <meta name="description" content="Encuentra respuestas a las dudas más comunes sobre los productos y envíos de NutraBlue." />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-[#fcfbf9] py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
              Preguntas Frecuentes
            </h1>
            <p className="text-xl text-slate-600">
              Resolvemos tus dudas sobre nuestros productos funcionales y despachos.
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 flex gap-4">
                <div className="text-primary shrink-0 mt-1">
                  <HelpCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-slate-900 mb-2">{faq.q}</h3>
                  <p className="text-slate-600 leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default FaqPage;
