import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Sparkles, Leaf, Users, ShieldAlert, ArrowRight, Zap, Target } from 'lucide-react';
import { toast } from 'sonner';

const ImpactPage = () => {
  return (
    <>
      <Helmet>
        <title>Nuestro Impacto - NutraBlue</title>
        <meta name="description" content="Descubre el impacto y la propuesta de valor de NutraBlue. Impulsamos la longevidad celular, la claridad mental y la salud sustentable en Chile." />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-white overflow-hidden didactic-bg">
        {/* Cinematic Hero Section with Glacial Lake Background */}
        <section className="relative py-28 md:py-40 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src="/impact_bg.png"
              alt="Pristine valley and glacial lake background"
              className="w-full h-full object-cover"
            />
            {/* Smooth transition from dark image overlay to pure white at the bottom */}
            <div className="absolute inset-0 bg-black/40 bg-gradient-to-b from-transparent via-slate-950/50 to-[#ffffff]" />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white border border-white/20 uppercase tracking-widest">
                <Sparkles className="h-3.5 w-3.5 animate-pulse text-accent" /> Redefiniendo la Longevidad
              </span>
              
              <h1
                className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight"
                style={{ fontFamily: 'Playfair Display, serif', letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
              >
                Queremos optimizar el <br />
                <span className="text-accent font-black">
                  Potencial Humano
                </span>
              </h1>

              <p className="text-lg md:text-xl text-white/95 max-w-3xl mx-auto leading-relaxed" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.2)' }}>
                No existimos para vender pastillas; existimos para democratizar el biohacking. 
                Nuestra meta es otorgar claridad mental, equilibrio nervioso y longevidad activa a cada persona en Chile, 
                fusionando la pureza de la naturaleza con el rigor de la ciencia moderna.
              </p>

              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Button asChild size="lg" className="rounded-xl px-8 py-6 text-base bg-accent text-white hover:bg-accent/90 shadow-xl transition-all duration-200 active:scale-[0.98]">
                  <Link to="/shop" className="flex items-center gap-2">
                    Únete a la Revolución <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-xl px-8 py-6 text-base bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 transition-all duration-200 active:scale-[0.98]">
                  <a href="#manifiesto">Leer Manifiesto</a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>        {/* Big Seductive Stat/Metric Callouts on White background */}
        <section className="py-12 border-y border-border/80 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="space-y-1">
                <p className="text-4xl md:text-5xl font-extrabold text-primary">100%</p>
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Ingredientes Bioactivos</p>
                <p className="text-xs text-muted-foreground/80 max-w-xs mx-auto">Sin rellenos, saborizantes artificiales ni excipientes químicos perjudiciales.</p>
              </div>
              <div className="space-y-1 border-y md:border-y-0 md:border-x border-border/60 py-6 md:py-0">
                <p className="text-4xl md:text-5xl font-extrabold text-accent">0%</p>
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Rellenos ni Aditivos Artificiales</p>
                <p className="text-xs text-muted-foreground/80 max-w-xs mx-auto">Fórmulas testeadas en laboratorios independientes para validar su potencia.</p>
              </div>
              <div className="space-y-1">
                <p className="text-4xl md:text-5xl font-extrabold text-primary">10+</p>
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Estudios Clínicos de Respaldo</p>
                <p className="text-xs text-muted-foreground/80 max-w-xs mx-auto">Compuestos con respaldo en la literatura médica y publicaciones indexadas.</p>
              </div>
            </div>
          </div>
        </section>

        {/* The Manifiesto / Seductive Vision Section on White background */}
        <section id="manifiesto" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              {/* Seductive Copy */}
              <motion.div
                initial={{ opacity: 0, x: -35 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="space-y-6"
              >
                <span className="text-sm font-bold text-accent uppercase tracking-widest">El Problema de Hoy</span>
                <h2
                  className="text-3xl md:text-4xl font-bold text-foreground"
                  style={{ letterSpacing: '-0.01em' }}
                >
                  ¿Cansado de pedirle energía prestada a tu cuerpo?
                </h2>
                <p className="text-foreground font-semibold text-base leading-relaxed">
                  Vivimos a un ritmo que nos drena, y los estimulantes sintéticos solo te hacen pagar el precio después con más fatiga. Tu biología no necesita parches, necesita optimización real.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  En NutraBlue, cambiamos los estimulantes por ciencia. Diseñamos fórmulas de alta biodisponibilidad que no solo te despiertan, sino que nutren tu cerebro y restauran tu capacidad de rendir al máximo, de forma natural y constante.
                </p>
                
                <div className="pt-4">
                  <blockquote className="border-l-4 border-accent pl-4 py-2 italic text-foreground bg-accent/5 rounded-r-lg">
                    "No eres tú, es el combustible. Es hora de hackear tu energía desde la raíz."
                  </blockquote>
                </div>
              </motion.div>

              {/* Attractive Bento Grid of Impact Pillars */}
              <motion.div
                initial={{ opacity: 0, x: 35 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-6"
              >
                <Card className="bg-[#fcfbf9] border-border/80 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md">
                  <CardContent className="p-6 space-y-4">
                    <div className="p-3 w-fit rounded-xl bg-primary/10 text-primary">
                      <Brain className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-card-foreground">
                      Optimización Mental
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Fórmulas como *Calm & Focus* y *Matcha Ritual* diseñadas para mejorar el enfoque sostenido, la memoria y la neuroplasticidad sin provocar taquicardias ni rebotes.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-[#fcfbf9] border-border/80 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md">
                  <CardContent className="p-6 space-y-4">
                    <div className="p-3 w-fit rounded-xl bg-accent/10 text-accent">
                      <Zap className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-card-foreground">
                      Resiliencia Física
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Compuestos botánicos (como el *Reishi* y el *Ajo Negro*) tradicionalmente usados para acompañar tu rutina y aportar al bienestar general en tu día a día.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-[#fcfbf9] border-border/80 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md">
                  <CardContent className="p-6 space-y-4">
                    <div className="p-3 w-fit rounded-xl bg-primary/10 text-primary">
                      <Leaf className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-card-foreground">
                      Sustentabilidad
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Empaques ecológicos reciclables y sourcing de materias primas ético, minimizando el impacto ambiental en nuestra cadena de logística a nivel nacional.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-[#fcfbf9] border-border/80 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md">
                  <CardContent className="p-6 space-y-4">
                    <div className="p-3 w-fit rounded-xl bg-accent/10 text-accent">
                      <Users className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-card-foreground">
                      Educación en Salud
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Guiamos de forma gratuita a nuestra comunidad en protocolos de ayuno, higiene del sueño y ejercicio, porque el suplemento es solo una herramienta del ecosistema.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

            </div>
          </div>
        </section>

        {/* Sección: Ciencia, Evidencia y Mecanismos de Acción */}
        <section className="py-24 bg-slate-50 border-t border-border/40 relative overflow-hidden">
          {/* Subtle Molecular SVG Pattern Background */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
                  <circle cx="40" cy="0" r="2" fill="currentColor" />
                  <circle cx="0" cy="40" r="2" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <span className="text-xs font-bold text-accent uppercase tracking-widest block mb-2">Base Científica</span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Estudios y Mecanismos de Acción
              </h2>
              <p className="text-muted-foreground mt-3 max-w-xl mx-auto text-sm md:text-base">
                Respaldamos cada una de nuestras formulaciones con publicaciones científicas internacionales y ensayos clínicos de referencia.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="bg-white rounded-2xl p-6 border border-border/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">Neuroplasticidad</span>
                  <h3 className="text-lg font-bold text-foreground">
                    Hongos Medicinales y NGF (Factor de Crecimiento Nervioso)
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Evaluación del impacto del hongo Hericium erinaceus (Melena de León) en la biosíntesis del factor de crecimiento nervioso y la regeneración celular.
                  </p>
                </div>
                <div className="pt-6 border-t border-border/20 mt-4 flex items-center justify-between">
                  <a href="https://pubmed.ncbi.nlm.nih.gov/" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-accent hover:underline flex items-center gap-1">
                    Leer el Estudio <ArrowRight className="h-3 w-3" />
                  </a>
                  <span className="text-[10px] text-muted-foreground font-semibold">Pubmed ID: 24266378</span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white rounded-2xl p-6 border border-border/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">Longevidad</span>
                  <h3 className="text-lg font-bold text-foreground">
                    Polifenoles y Activación de las Sirtuinas (SIRT1)
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Análisis sobre cómo los antioxidantes de alta pureza activan los genes de la longevidad celular y mejoran la eficiencia metabólica mitocondrial.
                  </p>
                </div>
                <div className="pt-6 border-t border-border/20 mt-4 flex items-center justify-between">
                  <button 
                    onClick={() => toast.info("Mecanismo: Activación enzimática mediante modulación alostérica de SIRT1.")}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    Entender el Mecanismo <ArrowRight className="h-3 w-3" />
                  </button>
                  <span className="text-[10px] text-muted-foreground font-semibold">Respaldo Clínico</span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white rounded-2xl p-6 border border-border/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">Resiliencia</span>
                  <h3 className="text-lg font-bold text-foreground">
                    Fuente Natural de Adaptógenos para tu Bienestar
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Acompaña tu rutina con extractos estandarizados de uso tradicional para el estilo de vida actual.
                  </p>
                </div>
                <div className="pt-6 border-t border-border/20 mt-4 flex items-center justify-between">
                  <button
                    onClick={() => toast.info("Información: Los compuestos seleccionados han sido tradicionalmente usados para aportar al bienestar diario.")}
                    className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
                  >
                    Ver Información Adicional <ArrowRight className="h-3 w-3" />
                  </button>
                  <span className="text-[10px] text-muted-foreground font-semibold">Uso Tradicional</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Conocimiento Basado en Ciencia - La Academia */}
        <section className="py-24 bg-white border-t border-border/40">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 uppercase tracking-widest mb-4">
                La Academia
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Conocimiento Basado en Ciencia
              </h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
                No creemos en falsas promesas. Compartimos información basada en la biología y la medicina de precisión.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  id: 'absorcion-celular',
                  title: '¿Por qué la absorción celular es el secreto de la verdadera energía?',
                  summary: 'La mitocondria es el motor de tu cuerpo, pero sin la biodisponibilidad adecuada de cofactores, la energía nunca llega a tus células.',
                  content: 'Muchos suplementos tradicionales se eliminan sin absorberse. En NutraBlue nos enfocamos en compuestos de alta biodisponibilidad y extractos estandarizados que maximizan la permeabilidad de la membrana celular. Al combinar adaptógenos activos con cofactores naturales, permitimos que tu mitocondria produzca ATP de forma sostenida y eficiente, eliminando el clásico crash de los estimulantes convencionales.'
                },
                {
                  id: 'nutricion-avanzada',
                  title: 'El impacto de la nutrición avanzada en tu enfoque mental diario.',
                  summary: 'Descubre cómo los ingredientes de origen natural pueden acompañar tu día a día.',
                  content: 'El cerebro consume el 20% de la energía metabólica. Acompañar tu rutina con ingredientes funcionales (Melena de León y Reishi) es una práctica tradicional para aportar al bienestar general. Estos ingredientes de origen natural se utilizan habitualmente para complementar un estilo de vida activo y consciente.'
                }
              ].map((article) => (
                <div key={article.id} className="bg-[#fcfbf9] p-8 rounded-2xl border border-border/80 shadow-sm flex flex-col justify-between hover:border-primary/20 transition-all">
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-foreground leading-snug">{article.title}</h3>
                    <p className="text-sm font-semibold text-primary">{article.summary}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{article.content}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-border/20 text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                    Artículos Informativos • Filosofía NutraBlue
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Seductive Callout - The Promise of Pure Formulations */}
        <section className="py-24 bg-slate-50 border-t border-border/50 relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <Target className="h-10 w-10 text-accent mx-auto" />
              <h2
                className="text-3xl md:text-4xl font-bold text-foreground"
              >
                Nuestra Promesa Contigo
              </h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Trabajamos de la mano con biólogos y químicos farmacéuticos. Cada lote de NutraBlue es formulado bajo estándares rigurosos de pureza. 
                Si un compuesto no tiene respaldo científico sólido en ensayos clínicos aleatorizados, no lo incluimos en nuestro catálogo. Así de simple.
              </p>
            </motion.div>

            {/* Guarantees Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="p-5 bg-white rounded-2xl border border-border/60 text-center shadow-sm">
                <h4 className="font-bold text-sm text-foreground mb-1">Sin Excipientes Dañinos</h4>
                <p className="text-[11px] text-muted-foreground">Cero estearato de magnesio, maltodextrinas o azúcares ocultos en los polvos.</p>
              </div>
              <div className="p-5 bg-white rounded-2xl border border-border/60 text-center shadow-sm">
                <h4 className="font-bold text-sm text-foreground mb-1">Dosis Funcionales</h4>
                <p className="text-[11px] text-muted-foreground">Concentraciones que tradicionalmente aportan un impacto medible en tu bienestar.</p>
              </div>
              <div className="p-5 bg-white rounded-2xl border border-border/60 text-center shadow-sm">
                <h4 className="font-bold text-sm text-foreground mb-1">Certificación Local</h4>
                <p className="text-[11px] text-muted-foreground">Elaborados en instalaciones bajo resolución sanitaria y resoluciones vigentes en Chile.</p>
              </div>
            </div>

            {/* Seductive CTA button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="pt-6"
            >
              <Button asChild size="lg" className="rounded-xl px-10 py-7 text-lg bg-accent text-white hover:bg-accent/90 shadow-xl transition-all duration-200 active:scale-[0.98]">
                <Link to="/shop">
                  Empieza tu Transformación
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground mt-3">Envío gratis en compras sobre $50.000 a todo Chile</p>
            </motion.div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
};

export default ImpactPage;
