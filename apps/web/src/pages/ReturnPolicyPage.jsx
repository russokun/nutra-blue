import React from 'react';
import { Helmet } from '@/components/Meta';
import { absoluteUrl } from '@/lib/seo';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ShieldCheck, RotateCcw, AlertTriangle, PackageCheck, HelpCircle, Mail, MessageCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const ReturnPolicyPage = () => {
  return (
    <>
      <Helmet>
        <title>Política de Cambios, Devoluciones y Retracto — NutraBlue</title>
        <meta
          name="description"
          content="Conoce nuestra política oficial de derecho a retracto de 10 días, devoluciones y garantía legal en NutraBlue conforme a la Ley N° 19.496 y Decreto N° 52 de 2024."
        />
        <meta property="og:title" content="Política de Devoluciones y Retracto — NutraBlue" />
        <meta
          property="og:description"
          content="Derecho a retracto de 10 días para productos sellados, garantía legal y procedimientos claros de devolución."
        />
        <meta property="og:url" content={absoluteUrl('/politica-de-devoluciones')} />
        <link rel="canonical" href={absoluteUrl('/politica-de-devoluciones')} />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-[#fcfbf9] py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Navegación de retorno */}
          <div className="mb-6">
            <Link
              to="/"
              className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-primary transition-colors gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Volver al Inicio
            </Link>
          </div>

          {/* Encabezado Principal */}
          <div className="text-center mb-12 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-widest">
              <ShieldCheck className="h-3.5 w-3.5" /> Ley N° 19.496 & Decreto N° 52 de 2024
            </span>
            <h1
              className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight"
              style={{ fontFamily: 'Impact, sans-serif' }}
            >
              Política de Cambios, Devoluciones y Derecho a Retracto
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
              NutraBlue SpA · Concepción, Región del Biobío, Chile · Alimentos naturales y funcionales
            </p>
            <p className="text-xs text-muted-foreground/80">
              Última actualización: Septiembre de 2026 · Versión oficial para clientes
            </p>
          </div>

          {/* Tarjeta de Resumen Rápido */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 md:p-8 mb-10 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 text-primary font-bold text-base md:text-lg">
              <PackageCheck className="h-5 w-5 shrink-0" />
              <span>Resumen de tus derechos en NutraBlue</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm text-foreground/90">
              <div className="bg-white/80 rounded-xl p-4 border border-primary/10">
                <p className="font-bold text-primary mb-1">1. Derecho a Retracto (10 días)</p>
                <p className="text-muted-foreground">
                  Puedes terminar tu compra dentro de los 10 días corridos desde que recibiste el producto cerrado y con sello intacto, sin dar explicaciones. Te devolvemos el 100% de lo pagado.
                </p>
              </div>
              <div className="bg-white/80 rounded-xl p-4 border border-primary/10">
                <p className="font-bold text-primary mb-1">2. Garantía Legal (Vencimiento)</p>
                <p className="text-muted-foreground">
                  Si el producto llega dañado, vencido o incorrecto, tú eliges libremente entre el cambio, la devolución total del dinero o la reposición sin ningún costo para ti.
                </p>
              </div>
            </div>
          </div>

          {/* Contenido Completo del Documento */}
          <div className="bg-white rounded-2xl shadow-sm border border-border p-6 md:p-12 space-y-10 text-foreground">
            {/* Introducción */}
            <section className="space-y-3">
              <p className="text-sm md:text-base leading-relaxed text-muted-foreground">
                Esta política forma parte integrante de los Términos y Condiciones de <strong className="text-foreground">nutrablue.cl</strong> y se rige íntegramente por la <strong className="text-foreground">Ley N° 19.496</strong> sobre Protección de los Derechos de los Consumidores y por el <strong className="text-foreground">Decreto N° 52 de 2024 del Ministerio de Economía, Fomento y Turismo</strong>. Ninguna disposición de este documento restringe o menoscaba los derechos que la legislación chilena reconoce a los consumidores.
              </p>
            </section>

            {/* 1. Derecho a Retracto */}
            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-primary shrink-0" />
                <span>1. Derecho a Retracto (Arrepentimiento) — 10 días</span>
              </h2>
              <p className="text-sm md:text-base leading-relaxed text-slate-700">
                Si compraste a través de nutrablue.cl o por cualquiera de nuestros canales oficiales a distancia (WhatsApp, redes sociales), tienes <strong className="text-foreground">derecho a retracto</strong>: puedes poner término a tu compra dentro de <strong className="text-foreground">10 días corridos contados desde la recepción del pedido</strong>, sin necesidad de expresar causa ni justificar tu decisión.
              </p>
              <div className="bg-muted/40 rounded-xl p-4 border border-border/40 space-y-2 text-sm">
                <p className="font-semibold text-foreground">Condición indispensable:</p>
                <p className="text-muted-foreground">
                  Para ejercer el derecho a retracto, el producto debe encontrarse <strong className="text-foreground">completamente cerrado, con su sello de seguridad y embalaje original intactos</strong> y en óptimo estado de conservación.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <h3 className="font-bold text-base text-foreground">Cómo ejercer tu derecho a retracto:</h3>
                <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
                  <li>
                    Escríbenos directamente a <a href="mailto:Info.nutra@gmail.com" className="text-primary font-semibold hover:underline">Info.nutra@gmail.com</a> o contáctanos por WhatsApp al <a href="https://wa.me/56993493971" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">+56 9 9349 3971</a> indicando tu número de orden de compra o correo registrado.
                  </li>
                  <li>Puedes utilizar el mismo medio por el cual realizaste tu compra. No te solicitaremos justificar tu decisión.</li>
                </ul>
              </div>

              <div className="space-y-3 pt-2">
                <h3 className="font-bold text-base text-foreground">Qué te devolvemos:</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Se realiza la devolución del <strong className="text-foreground">100% de lo pagado</strong>, incluido el costo de despacho cobrado en la compra original, sin cobro de comisiones, multas ni retenciones de ningún tipo.
                </p>
                <p className="text-xs text-muted-foreground">
                  El reembolso se realiza por el mismo medio de pago utilizado al comprar (o mediante transferencia electrónica a solicitud del cliente) en un plazo de hasta 10 días hábiles tras recibir el producto cerrado en nuestras dependencias, y en ningún caso más allá de 45 días contados desde la comunicación del retracto.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <h3 className="font-bold text-base text-foreground">Costo del envío de retorno:</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  El envío de retorno del producto por derecho a retracto es de cargo del cliente, salvo que la devolución se origine en un error atribuible a NutraBlue (producto equivocado, dañado o distinto al ordenado), en cuyo caso el costo lo asume íntegramente NutraBlue.
                </p>
              </div>

              {/* 1.1 Exclusión Legal */}
              <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
                  <span>1.1 Exclusión Legal del Derecho a Retracto (Productos Abiertos)</span>
                </div>
                <p className="text-xs md:text-sm text-amber-950 leading-relaxed">
                  Por estrictas razones de salud pública, higiene y seguridad alimentaria (artículo 3° bis de la Ley N° 19.496 y Decreto N° 52 de 2024 del Ministerio de Economía), <strong className="text-amber-950 underline">el derecho a retracto NO aplica a productos alimenticios o suplementos cuyo sello o envase original haya sido abierto, violado o manipulado</strong>, dado que pierden su inocuidad y no pueden ser comercializados nuevamente.
                </p>
                <p className="text-xs text-amber-900 font-medium">
                  * Esta exclusión no limita ni afecta bajo ninguna circunstancia tu Garantía Legal en caso de productos defectuosos.
                </p>
              </div>
            </section>

            {/* 2. Garantía Legal */}
            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                <span>2. Garantía Legal — Producto defectuoso, vencido o equivocado</span>
              </h2>
              <p className="text-sm md:text-base leading-relaxed text-slate-700">
                La <strong className="text-foreground">Garantía Legal</strong> es un derecho irrenunciable que protege tu compra cuando:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
                <li>El producto llega vencido o con una vida útil insuficiente para su consumo razonable.</li>
                <li>El envase presenta roturas, filtraciones, signos de manipulación o sellos violados al momento de recibirlo.</li>
                <li>Recibiste un producto o variante distinta a la adquirida.</li>
                <li>El contenido neto es inferior al declarado en la etiqueta o ficha técnica.</li>
                <li>El producto no es apto para el consumo al que está naturalmente destinado.</li>
              </ul>

              <div className="bg-natural-50 p-4 rounded-xl border border-natural-200 space-y-2">
                <p className="text-sm font-bold text-natural-900">
                  Elección libre del consumidor:
                </p>
                <p className="text-xs md:text-sm text-natural-800 leading-relaxed">
                  Ante un producto con falla o no conforme, <strong className="text-natural-950">tú eliges libremente</strong> entre:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-center text-xs font-semibold">
                  <div className="bg-white p-2.5 rounded-lg border border-natural-300 text-natural-900">1. Cambio del producto</div>
                  <div className="bg-white p-2.5 rounded-lg border border-natural-300 text-natural-900">2. Devolución del dinero</div>
                  <div className="bg-white p-2.5 rounded-lg border border-natural-300 text-natural-900">3. Reposición del producto</div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Plazo de garantía en alimentos:</strong> Tratándose de alimentos y productos perecibles, el plazo legal de la garantía corresponde a la fecha de vencimiento impresa en el producto o envoltorio (conforme al art. 21 de la Ley N° 19.496).
                </p>
                <p>
                  <strong className="text-foreground">Costos:</strong> Todos los costos de retiro, traslado, despacho o reemplazo asociados a la garantía legal son asumidos íntegramente por NutraBlue.
                </p>
                <p>
                  <strong className="text-foreground">Cómo hacerla efectiva:</strong> Envíanos fotografías claras del producto y de su número de lote / vencimiento a <a href="mailto:Info.nutra@gmail.com" className="text-primary font-semibold hover:underline">Info.nutra@gmail.com</a>. Te responderemos en un plazo máximo de 2 días hábiles.
                </p>
              </div>
            </section>

            {/* 3. Daño o Extravío en Despacho */}
            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                <PackageCheck className="h-5 w-5 text-primary shrink-0" />
                <span>3. Producto Dañado o Extraviado en el Transporte</span>
              </h2>
              <p className="text-sm md:text-base leading-relaxed text-slate-700">
                Te recomendamos revisar tu encomienda al momento de recibirla. Si el paquete presenta daños visibles por el transporte, comunícate con nosotros dentro de los <strong className="text-foreground">5 días corridos posteriores a la entrega</strong> a <a href="mailto:Info.nutra@gmail.com" className="text-primary font-semibold hover:underline">Info.nutra@gmail.com</a> adjuntando fotografías del embalaje. Procederemos a reponer el producto o reembolsar el dinero según tu preferencia, sin ningún costo adicional.
              </p>
              <p className="text-xs text-muted-foreground">
                Si un envío no llega dentro del plazo comprometido, gestionamos directamente el rastreo ante el courier (Starken, Blue Express o Chilexpress). En caso de extravío confirmado por la empresa logística, se despacha una nueva orden de inmediato o se efectúa el reembolso total.
              </p>
            </section>

            {/* 4. Cambios Voluntarios por Preferencia */}
            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary shrink-0" />
                <span>4. Política Comercial de Cambios por Preferencia</span>
              </h2>
              <p className="text-sm md:text-base leading-relaxed text-slate-700">
                Como beneficio comercial voluntario y complementario a tus derechos legales, si adquiriste un producto y prefieres cambiarlo por otra variedad o presentación de nuestro catálogo dentro de los <strong className="text-foreground">10 días siguientes a la recepción</strong>, podemos realizar el cambio siempre que el envase se mantenga íntegro y sellado. Las diferencias de precio a favor o en contra se liquidarán de forma transparente.
              </p>
            </section>

            {/* 5. Canales de Reclamo Oficial */}
            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-foreground border-b border-border pb-2">
                5. Vías de Consulta y Reclamos
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ante cualquier duda o disconformidad respecto de una solicitud, puedes acudir a los canales institucionales:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs md:text-sm text-muted-foreground">
                <li>
                  <strong className="text-foreground">Servicio Nacional del Consumidor (SERNAC):</strong> Portal web <a href="https://www.sernac.cl" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">www.sernac.cl</a> o línea gratuita 800 700 100.
                </li>
                <li>
                  <strong className="text-foreground">Juzgado de Policía Local:</strong> Correspondiente a la comuna de tu domicilio de conformidad con el procedimiento de la Ley N° 19.496.
                </li>
              </ul>
            </section>

            {/* Contacto Directo */}
            <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/30 p-6 rounded-2xl">
              <div className="space-y-1 text-center sm:text-left">
                <p className="font-bold text-foreground text-sm">¿Necesitas gestionar una devolución o cambio?</p>
                <p className="text-xs text-muted-foreground">Estamos disponibles de Lunes a Viernes de 09:00 a 18:00 hrs.</p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5">
                  <a href="mailto:Info.nutra@gmail.com">
                    <Mail className="h-4 w-4" /> Info.nutra@gmail.com
                  </a>
                </Button>
                <Button asChild size="sm" variant="outline" className="gap-1.5 border-border hover:bg-muted">
                  <a href="https://wa.me/56993493971" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4 text-emerald-600" /> WhatsApp
                  </a>
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

export default ReturnPolicyPage;
