import React from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag, Truck, RotateCcw, AlertTriangle } from 'lucide-react';

const TermsOfServicePage = () => {
  return (
    <>
      <Helmet>
        <title>Términos de Servicio - Nutra Blue</title>
        <meta name="description" content="Términos y condiciones de uso de Nutra Blue. Conoce los términos de compra, envíos, políticas de devolución y garantías en Chile." />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Reglas de Operación</span>
            <h1
              className="text-4xl md:text-5xl font-bold text-foreground mt-2 mb-4"
              style={{ fontFamily: 'Playfair Display, serif', letterSpacing: '-0.02em' }}
            >
              Términos de Servicio
            </h1>
            <p className="text-muted-foreground mx-auto text-base max-w-2xl">
              Bienvenido a Nutra Blue. Al acceder a nuestro sitio web y realizar compras, aceptas
              y te comprometes a cumplir los siguientes términos y condiciones de uso, regulados bajo la
              Ley N° 19.496 sobre Protección de los Derechos de los Consumidores en Chile.
            </p>
            <p className="text-xs text-muted-foreground/80 mt-2">
              Última actualización: 4 de junio de 2026
            </p>
          </div>

          {/* Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
            <Card className="bg-card border-border/60">
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <div className="p-2.5 rounded-full bg-primary/10 text-primary mb-3">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-card-foreground mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Compras Seguras
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Precios en pesos chilenos (CLP) con IVA incluido en todo el catálogo.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border/60">
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <div className="p-2.5 rounded-full bg-primary/10 text-primary mb-3">
                  <Truck className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-card-foreground mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Despachos a Chile
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Envíos confiables con Starken, Chilexpress y couriers autorizados.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border/60">
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <div className="p-2.5 rounded-full bg-primary/10 text-primary mb-3">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-card-foreground mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Garantía Legal
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Cumplimos estrictamente con la garantía de 6 meses ante fallas o defectos de fábrica.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border/60">
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <div className="p-2.5 rounded-full bg-primary/10 text-primary mb-3">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-card-foreground mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Uso Responsable
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Suplementos alimenticios que no reemplazan diagnósticos médicos profesionales.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Legal Content */}
          <div className="prose prose-slate max-w-none text-foreground/90 space-y-8 bg-card border border-border/50 rounded-2xl p-8 md:p-12 shadow-sm">
            
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                <span className="text-primary text-lg">1.</span> Aspectos Generales
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Las transacciones que se efectúen a través del sitio web de Nutra Blue están sujetas a los presentes Términos y Condiciones, así como a las leyes de la República de Chile, en particular la Ley N° 19.496 sobre Protección de los Derechos de los Consumidores y la Ley N° 19.628 sobre Protección de la Vida Privada.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                El acceso y uso de este sitio web es gratuito para los usuarios. Para realizar compras en nuestra plataforma es requisito la aceptación de los presentes términos, lo cual se entiende realizado al hacer clic en el botón de confirmación de compra o al registrarse en el sitio.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                <span className="text-primary text-lg">2.</span> Registro de Usuario y Seguridad
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                El usuario podrá registrarse para agilizar el proceso de compra. Es responsabilidad del usuario:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                <li>Proporcionar información fidedigna, veraz y actualizada (nombre, RUT, correo, dirección de despacho, etc.).</li>
                <li>Mantener la confidencialidad de sus claves de acceso asociadas a su cuenta personal.</li>
                <li>Notificar de inmediato a Nutra Blue ante cualquier uso no autorizado de su cuenta.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                <span className="text-primary text-lg">3.</span> Proceso de Compra y Precios
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Los precios de los productos exhibidos en Nutra Blue están expresados en pesos chilenos (CLP) e incluyen el Impuesto al Valor Agregado (IVA). El costo del despacho se calcula de forma separada según la comuna de destino y se desglosa claramente en la pantalla de resumen del checkout antes del pago.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Una vez completado el flujo de pago, Nutra Blue enviará un correo electrónico de confirmación automática detallando los productos adquiridos, el precio total cobrado, el método de pago utilizado y los datos de envío. La venta se considerará formalizada y válida una vez recibido dicho correo y validados los fondos de pago.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                <span className="text-primary text-lg">4.</span> Condiciones de Despacho y Entrega
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Los productos comprados serán despachados bajo las siguientes consideraciones:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                <li><strong className="text-foreground/90">Cobertura:</strong> Realizamos despachos a todo el territorio continental de la República de Chile a través de empresas aliadas.</li>
                <li><strong className="text-foreground/90">Plazos:</strong> Los plazos estimados de entrega varían según la región y comuna, siendo típicamente entre 2 a 5 días hábiles para Santiago y capitales regionales, y hasta 8 días hábiles para zonas extremas.</li>
                <li><strong className="text-foreground/90">Responsabilidad en la dirección:</strong> El usuario es responsable de ingresar de forma exacta la dirección de entrega. Si un pedido no se puede entregar por dirección errónea, incompleta o ausencia de receptores tras dos intentos, los costos de re-despacho serán de cargo exclusivo del cliente.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                <span className="text-primary text-lg">5.</span> Garantías y Devoluciones (Derecho de Retracto)
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                En cumplimiento de las normas de consumo nacionales:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                <li>
                  <strong className="text-foreground/90">Derecho a Retracto:</strong> De conformidad con el artículo 3 bis letra b) de la Ley N° 19.496, Nutra Blue dispone que en las compras realizadas a través de este portal <strong className="text-foreground/95">no se podrá ejercer el derecho de retracto</strong> de forma discrecional una vez abierto el empaque, dado que comercializamos alimentos y suplementos alimenticios cuyas condiciones de esterilidad e inocuidad se pierden al abrirse los sellos de seguridad. Sin embargo, para productos completamente sellados, sin abrir y en su embalaje original, se podrá solicitar la devolución dentro de los 10 días siguientes a la recepción.
                </li>
                <li>
                  <strong className="text-foreground/90">Garantía Legal:</strong> Si el producto presenta fallas de origen, defectos de fabricación, roturas de envase o no corresponde a lo solicitado, el cliente tiene derecho a la garantía legal dentro de los 6 meses siguientes a la compra, pudiendo optar entre el cambio del producto, reparación o la devolución del dinero pagado. Para esto, se debe presentar la boleta o comprobante de compra respectivo.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                <span className="text-primary text-lg">6.</span> Exclusión de Responsabilidad Médica y Uso de Productos
              </h2>
              <p className="text-sm leading-relaxed text-amber-600/95 bg-amber-500/10 p-4 rounded-xl border border-amber-500/25">
                <strong className="text-amber-800">ADVERTENCIA:</strong> Los suplementos funcionales que comercializa Nutra Blue son formulaciones complementarias orientadas a la nutrición y el bienestar general. No constituyen medicamentos, fármacos ni tratamientos clínicos específicos, y de ninguna manera reemplazan la consulta, diagnóstico o indicación de un profesional médico matriculado. Te recomendamos leer atentamente el rotulado y las indicaciones de cada envase antes de consumir.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                <span className="text-primary text-lg">7.</span> Solución de Controversias y Jurisdicción
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Cualquier dificultad o controversia que surja en relación con la validez, interpretación o ejecución de estos Términos de Servicio será sometida a las leyes chilenas y a la competencia de los tribunales de justicia chilenos correspondientes al domicilio del consumidor.
              </p>
            </section>

          </div>

          {/* CTA Box */}
          <div className="mt-8 bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
            <p className="text-sm text-foreground/90 font-medium">
              ¿Quieres realizar una devolución o consultar sobre la garantía legal de tu pedido?
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Escríbenos directamente a <a href="mailto:contacto@nutrablue.cl" className="text-primary hover:underline font-semibold">contacto@nutrablue.cl</a> incluyendo tu número de orden y boleta.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default TermsOfServicePage;
