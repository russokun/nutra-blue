import React from 'react';
import { Helmet } from '@/components/Meta';
import { Link } from 'react-router-dom';
import { Compass, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';

/**
 * Página 404.
 *
 * Antes cualquier URL desconocida hacía un redirect silencioso al inicio. Para el visitante
 * era desconcertante —pedía una página y aterrizaba en otra sin explicación— y para Google
 * era peor: una URL rota respondía con un redirect en vez de decir que no existe, así que
 * seguía tratándola como válida.
 *
 * En vez de un callejón sin salida, ofrece las rutas que la mayoría busca cuando llega acá.
 */
const NotFoundPage = () => {
  const atajos = [
    { to: '/shop', titulo: 'Ver el catálogo', detalle: 'Todos nuestros alimentos naturales y funcionales' },
    { to: '/faqs', titulo: 'Preguntas frecuentes', detalle: 'Despachos, pagos y devoluciones' },
    { to: '/contacto', titulo: 'Escribirnos', detalle: 'Te respondemos personalmente' },
  ];

  return (
    <>
      <Helmet>
        <title>Página no encontrada — NutraBlue</title>
        <meta name="description" content="La página que buscas no existe o cambió de dirección. Te ayudamos a encontrar lo que necesitas en NutraBlue." />
        {/* Que no se indexe: es una página de error, no contenido. */}
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <Header />

      <main className="min-h-[70vh] bg-background flex items-center py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6">
            <Compass className="h-8 w-8" aria-hidden="true" />
          </div>

          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Error 404</p>
          <h1 className="text-4xl md:text-5xl font-display text-foreground mt-2 mb-4">
            Esta página no existe
          </h1>
          <p className="text-base text-muted-foreground mx-auto mb-10">
            Puede que el enlace esté mal escrito o que el producto ya no esté disponible.
            Estas son las rutas que suelen buscar quienes llegan acá.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 text-left">
            {atajos.map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="group rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-200"
              >
                <span className="flex items-center justify-between text-sm font-bold text-card-foreground">
                  {a.titulo}
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">{a.detalle}</span>
              </Link>
            ))}
          </div>

          <Button asChild size="lg" className="rounded-xl px-8">
            <Link to="/">Volver al inicio</Link>
          </Button>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default NotFoundPage;
