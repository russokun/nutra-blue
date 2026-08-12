import React from 'react';
import { Helmet } from '@/components/Meta';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { HelpCircle } from 'lucide-react';
import { OG_IMAGE, absoluteUrl, faqSchema } from '@/lib/seo';

const FaqPage = () => {
  const faqsProductos = [
    {
      q: '¿Sus productos son medicamentos?',
      a: 'No. Son alimentos naturales y funcionales que aportan a tu bienestar. No curan ni tratan enfermedades, y no reemplazan una alimentación equilibrada ni las indicaciones de tu médico.'
    },
    {
      q: '¿Cómo eligen lo que venden?',
      a: 'Con un solo criterio: que aporte de verdad a tu salud. Cada producto pasa primero por nuestra propia mesa familiar. Si no lo consumiríamos nosotros, no está en el catálogo.'
    },
    {
      q: '¿Puedo consumirlos si tomo medicamentos o estoy embarazada?',
      a: 'Ante cualquier condición de salud, embarazo o tratamiento médico, recomendamos consultar primero con tu médico o nutricionista.'
    }
  ];

  const faqsCompras = [
    {
      q: '¿Hacen despacho a todo Chile?',
      a: 'Sí, llegamos a todas las regiones del país. Despachamos por Blue Express, Starken o Pullman, y te confirmamos por correo el plazo de entrega junto con los datos del envío.'
    },
    {
      q: '¿Cuánto cuesta el envío?',
      a: 'En pedidos sobre $50.000 el envío es gratis a todo Chile: el despacho corre por nuestra cuenta. Bajo ese monto el pedido viaja «por pagar», es decir que le pagas el flete directamente al courier al recibirlo o retirarlo. En ningún caso te cobramos despacho al momento de pagar: el total que ves en el checkout es solo el de los productos.'
    },
    {
      q: '¿Qué medios de pago aceptan?',
      a: 'Pagas con Mercado Pago: dinero en tu cuenta, tarjetas de débito y de crédito, y cuotas sin interés según tu banco.'
    },
    {
      q: '¿Puedo devolver un producto?',
      a: 'Sí. Si tu producto llega dañado o no corresponde a lo que compraste, puedes devolverlo. Revisa nuestra política de devoluciones o escríbenos para ayudarte.'
    }
  ];

  return (
    <>
      <Helmet
        script={[
          {
            type: 'application/ld+json',
            innerHTML: JSON.stringify(faqSchema([...faqsProductos, ...faqsCompras])),
          },
        ]}
      >
        <title>Preguntas Frecuentes - NutraBlue</title>
        <meta name="description" content="Respuestas sobre despachos, medios de pago, devoluciones y cómo elegir entre los alimentos funcionales de NutraBlue." />
        <meta property="og:title" content="Preguntas Frecuentes - NutraBlue" />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:url" content={absoluteUrl('/faqs')} />
        <link rel="canonical" href={absoluteUrl('/faqs')} />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-[#fcfbf9] py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-display text-slate-900 mb-6">
              Preguntas Frecuentes
            </h1>
            <p className="text-xl text-slate-600">
              Resolvemos tus dudas sobre nuestros productos funcionales y despachos.
            </p>
          </div>

          <div className="space-y-6">
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Sobre los productos</h2>
              <div className="space-y-6">
                {faqsProductos.map((faq, index) => (
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

            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Sobre compras y despachos</h2>
              <div className="space-y-6">
                {faqsCompras.map((faq, index) => (
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
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default FaqPage;
