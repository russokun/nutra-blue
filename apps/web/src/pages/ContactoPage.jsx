import React from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Mail, Clock, MessageCircle } from 'lucide-react';

const ContactoPage = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('¡Mensaje enviado! Te responderemos a la brevedad.');
    e.target.reset();
  };

  return (
    <>
      <Helmet>
        <title>Contacto y Soporte - NutraBlue</title>
        <meta name="description" content="Comunícate con NutraBlue. Estamos aquí para ayudarte con tus dudas sobre nuestros alimentos funcionales y despachos." />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-[#fcfbf9] py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Estamos para ayudarte
            </h1>
            <p className="text-lg text-slate-600">
              ¿Dudas sobre un producto, tu pedido o qué elegir para ti? Escríbenos — somos una familia, no un call center, y te responderemos personalmente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-xl text-primary shrink-0">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">WhatsApp</h3>
                  <p className="text-slate-600">[COMPLETAR]</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-xl text-primary shrink-0">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Correo</h3>
                  <p className="text-slate-600">[COMPLETAR]</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-xl text-primary shrink-0">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Horario de atención</h3>
                  <p className="text-slate-600">[COMPLETAR]</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Envíanos un mensaje</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                  <input type="text" required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Asunto</label>
                  <input type="text" required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mensaje</label>
                  <textarea rows={4} required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"></textarea>
                </div>
                <Button type="submit" className="w-full" size="lg">
                  Enviar Mensaje
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default ContactoPage;
