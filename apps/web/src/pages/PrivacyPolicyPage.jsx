import React from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, Eye, Lock, FileText } from 'lucide-react';

const PrivacyPolicyPage = () => {
  return (
    <>
      <Helmet>
        <title>Política de Privacidad - NutraBlue</title>
        <meta name="description" content="Política de privacidad de NutraBlue. Conoce cómo protegemos y gestionamos tus datos personales en conformidad con las leyes chilenas." />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Compromiso de Confianza</span>
            <h1
              className="text-4xl md:text-5xl font-bold text-foreground mt-2 mb-4"
              style={{ fontFamily: 'Playfair Display, serif', letterSpacing: '-0.02em' }}
            >
              Política de Privacidad
            </h1>
            <p className="text-muted-foreground mx-auto text-base max-w-2xl">
              En NutraBlue nos tomamos muy en serio la seguridad y privacidad de tus datos.
              A continuación te explicamos en detalle qué información recopilamos, cómo la utilizamos y qué derechos tienes,
              conforme a la Ley N° 19.628 de Protección de la Vida Privada de la República de Chile.
            </p>
            <p className="text-xs text-muted-foreground/80 mt-2">
              Última actualización: 4 de junio de 2026
            </p>
          </div>

          {/* Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="bg-card border-border/60">
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <div className="p-3 rounded-full bg-primary/10 text-primary mb-4">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-card-foreground mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Datos Protegidos
                </h3>
                <p className="text-xs text-muted-foreground">
                  Encriptación SSL avanzada de extremo a extremo para resguardar todas tus transacciones.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border/60">
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <div className="p-3 rounded-full bg-primary/10 text-primary mb-4">
                  <Eye className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-card-foreground mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Uso Exclusivo
                </h3>
                <p className="text-xs text-muted-foreground">
                  Recopilamos tus datos únicamente para procesar tus compras, envíos y personalizar tu experiencia.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border/60">
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <div className="p-3 rounded-full bg-primary/10 text-primary mb-4">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-card-foreground mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Control Total (ARCO)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Puedes ejercer tus derechos de acceso, rectificación, cancelación y oposición enviándonos un correo en cualquier momento.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Legal Content */}
          <div className="prose prose-slate max-w-none text-foreground/90 space-y-8 bg-card border border-border/50 rounded-2xl p-8 md:p-12 shadow-sm">
            
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                <span className="text-primary text-lg">1.</span> Información que Recopilamos
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Para entregarte nuestros suplementos funcionales premium y garantizar el correcto funcionamiento del servicio, recolectamos dos tipos de información:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                <li>
                  <strong className="text-foreground/90">Datos entregados voluntariamente:</strong> Al crear una cuenta, realizar compras, o contactarnos, recopilamos tu nombre completo, RUT, dirección de correo electrónico, teléfono de contacto y dirección de envío/facturación.
                </li>
                <li>
                  <strong className="text-foreground/90">Datos transaccionales y de navegación:</strong> Al interactuar con nuestro catálogo en línea, recopilamos historial de pedidos, productos visitados y preferencias de navegación a través de cookies propias y herramientas analíticas estándar de la industria.
                </li>
              </ul>
              <p className="text-sm text-amber-600/90 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 font-medium">
                Nota Importante: No almacenamos datos sensibles de pago. Las transacciones bancarias se procesan directamente mediante pasarelas de pago seguras y certificadas PCI-DSS.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                <span className="text-primary text-lg">2.</span> Finalidad del Tratamiento de Datos
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Tus datos de carácter personal son procesados para las siguientes finalidades explícitas:
              </p>
              <ol className="list-decimal pl-6 space-y-2 text-sm text-muted-foreground">
                <li>Procesar, validar y facturar tus compras de productos NutraBlue.</li>
                <li>Gestionar los servicios de despacho y entrega a domicilio con transportistas autorizados en todo Chile.</li>
                <li>Enviar notificaciones relativas al estado de tu pedido (confirmación, preparación y despacho).</li>
                <li>Brindar asistencia a través de nuestros canales de soporte y responder tus consultas.</li>
                <li>Enviar boletines y ofertas exclusivas de NutraBlue, previa autorización en el registro (de lo cual podrás darte de baja en cualquier momento).</li>
              </ol>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                <span className="text-primary text-lg">3.</span> Transferencia de Datos a Terceros
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                NutraBlue no vende, comercializa ni arrienda tus datos personales bajo ninguna circunstancia. Solamente compartimos la información estrictamente necesaria con proveedores estratégicos para la operación de tu pedido:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                <li>Empresas de Courier (Starken, Chilexpress, Correos de Chile u otros similares) para completar la entrega física de tus productos.</li>
                <li>Plataformas tecnológicas de orquestación y automatización segura (como n8n) para la sincronización e integraciones internas del negocio.</li>
                <li>Cumplimiento legal ante requerimientos de autoridades judiciales o administrativas en base a la legislación vigente.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                <span className="text-primary text-lg">4.</span> Derechos ARCO de los Usuarios
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                En cumplimiento de la legislación nacional, puedes ejercer plenamente tus derechos sobre tus datos personales:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div className="p-3 bg-muted rounded-lg border border-border">
                  <h4 className="font-semibold text-xs uppercase text-primary mb-1">Acceso y Rectificación</h4>
                  <p className="text-xs text-muted-foreground">Saber qué datos tuyos poseemos y solicitar correcciones en caso de que sean erróneos o incompletos.</p>
                </div>
                <div className="p-3 bg-muted rounded-lg border border-border">
                  <h4 className="font-semibold text-xs uppercase text-primary mb-1">Cancelación y Oposición</h4>
                  <p className="text-xs text-muted-foreground">Solicitar la eliminación total de tus registros en nuestra base de datos cuando ya no desees usar el servicio.</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Para hacer valer cualquiera de estos derechos, simplemente envía una solicitud indicando tu RUT y el derecho a ejercer a nuestro correo de contacto oficial: <a href="mailto:contacto@nutrablue.cl" className="text-primary hover:underline font-medium">contacto@nutrablue.cl</a>. Responderemos tu requerimiento en un plazo máximo de 10 días hábiles.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                <span className="text-primary text-lg">5.</span> Seguridad de la Información
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Adoptamos rigurosas medidas técnicas y administrativas para mitigar riesgos de alteración, pérdida, acceso no autorizado o mal uso de tu información. Nuestro sitio web opera con certificado digital de seguridad SSL (Secure Sockets Layer), garantizando la encriptación de los flujos de datos.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                <span className="text-primary text-lg">6.</span> Uso de Cookies
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Utilizamos cookies funcionales y analíticas temporales para recordar tu carrito de compras, recordar tus sesiones abiertas y analizar las métricas globales de visitas del sitio. Puedes desactivar el almacenamiento de cookies modificando las preferencias de privacidad en la configuración de tu navegador.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                <span className="text-primary text-lg">7.</span> Modificaciones a la Política
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                NutraBlue se reserva el derecho de modificar esta política para adaptarla a futuras actualizaciones normativas en Chile o cambios organizacionales en nuestros servicios. Te sugerimos revisar periódicamente esta página para estar informado de las actualizaciones.
              </p>
            </section>

          </div>

          {/* CTA Box */}
          <div className="mt-8 bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
            <p className="text-sm text-foreground/90 font-medium">
              ¿Tienes dudas o necesitas aclarar algún punto sobre tus datos?
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Contáctanos escribiendo a <a href="mailto:contacto@nutrablue.cl" className="text-primary hover:underline font-semibold">contacto@nutrablue.cl</a> y responderemos con la mayor brevedad.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default PrivacyPolicyPage;
