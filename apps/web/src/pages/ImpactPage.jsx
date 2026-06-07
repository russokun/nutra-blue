import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Sparkles, Leaf, Users, ShieldAlert, ArrowRight, Zap, Target } from 'lucide-react';

const ImpactPage = () => {
  return (
    <>
      <Helmet>
        <title>Nuestro Impacto - Nutra Blue</title>
        <meta name="description" content="Descubre el impacto y la propuesta de valor de Nutra Blue. Impulsamos la longevidad celular, la claridad mental y la salud sustentable en Chile." />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background overflow-hidden">
        {/* Seductive Hero Section with Glassmorphism */}
        <section className="relative py-24 md:py-32 flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/5">
          <div className="absolute inset-0 z-0 opacity-30">
            <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-accent/20 blur-3xl" />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 uppercase tracking-widest">
                <Sparkles className="h-3.5 w-3.5 animate-pulse" /> Redefiniendo la Longevidad
              </span>
              
              <h1
                className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-foreground leading-tight tracking-tight"
                style={{ fontFamily: 'Playfair Display, serif', letterSpacing: '-0.02em' }}
              >
                Queremos optimizar el <br />
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Potencial Humano
                </span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                No existimos para vender pastillas; existimos para democratizar el biohacking. 
                Nuestra meta es otorgar claridad mental, equilibrio nervioso y longevidad activa a cada persona en Chile, 
                fusionando la pureza de la naturaleza con el rigor de la ciencia moderna.
              </p>

              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Button asChild size="lg" className="rounded-xl px-8 py-6 text-base shadow-md">
                  <Link to="/shop" className="flex items-center gap-2">
                    Únete a la Revolución <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-xl px-8 py-6 text-base bg-transparent border-primary/45 text-primary hover:bg-primary/5">
                  <a href="#manifiesto">Leer Manifiesto</a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Big Seductive Stat/Metric Callouts */}
        <section className="py-12 border-y border-border bg-card/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="space-y-1">
                <p className="text-4xl md:text-5xl font-extrabold text-primary" style={{ fontFamily: 'Playfair Display, serif' }}>100%</p>
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Ingredientes Bioactivos</p>
                <p className="text-xs text-muted-foreground/80 max-w-xs mx-auto">Sin rellenos, saborizantes artificiales ni excipientes químicos perjudiciales.</p>
              </div>
              <div className="space-y-1 border-y md:border-y-0 md:border-x border-border py-6 md:py-0">
                <p className="text-4xl md:text-5xl font-extrabold text-accent" style={{ fontFamily: 'Playfair Display, serif' }}>0%</p>
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Compromisos con la Calidad</p>
                <p className="text-xs text-muted-foreground/80 max-w-xs mx-auto">Fórmulas testeadas en laboratorios independientes para validar su potencia.</p>
              </div>
              <div className="space-y-1">
                <p className="text-4xl md:text-5xl font-extrabold text-primary" style={{ fontFamily: 'Playfair Display, serif' }}>19%</p>
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">IVA Siempre Incluido</p>
                <p className="text-xs text-muted-foreground/80 max-w-xs mx-auto">Transparencia absoluta en precios, sin sorpresas ni recargos en el checkout.</p>
              </div>
            </div>
          </div>
        </section>

        {/* The Manifiesto / Seductive Vision Section */}
        <section id="manifiesto" className="py-24 bg-card/20">
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
                  style={{ fontFamily: 'Playfair Display, serif', letterSpacing: '-0.01em' }}
                >
                  Vivimos en un mundo que drena tu energía. Nosotros la restauramos.
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  El ritmo actual nos exige rendimiento cognitivo óptimo, resiliencia al estrés extremo y una longevidad libre de enfermedades. 
                  Sin embargo, el mercado tradicional ofrece soluciones rápidas basadas en estimulantes sintéticos (cafeína excesiva, azúcares, energizantes) 
                  que causan colapsos de energía, alteran el sueño e inflaman tus células a largo plazo.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  En **Nutra Blue** abordamos la salud desde el **Biohacking Celular**. 
                  Estudiamos las moléculas que la naturaleza ha diseñado en adaptógenos y nootrópicos, 
                  y las empaquetamos en dosis clínicamente activas. No queremos parchar tus síntomas; 
                  queremos mejorar la eficiencia de tus mitocondrias y nutrir tu cerebro.
                </p>
                
                <div className="pt-4">
                  <blockquote className="border-l-4 border-accent pl-4 py-2 italic text-foreground bg-accent/5 rounded-r-lg">
                    "El envejecimiento no es una condena de declive inevitable. Es un proceso biológico modulable que podemos hackear."
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
                <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md">
                  <CardContent className="p-6 space-y-4">
                    <div className="p-3 w-fit rounded-xl bg-primary/10 text-primary">
                      <Brain className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-card-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>
                      Optimización Mental
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Fórmulas como *Calm & Focus* y *Matcha Ritual* diseñadas para mejorar el enfoque sostenido, la memoria y la neuroplasticidad sin provocar taquicardias ni rebotes.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md">
                  <CardContent className="p-6 space-y-4">
                    <div className="p-3 w-fit rounded-xl bg-accent/10 text-accent">
                      <Zap className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-card-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>
                      Resiliencia Física
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Compuestos botánicos adaptógenos (como el *Reishi* y el *Ajo Negro*) que ayudan a equilibrar el eje HPA (hipotálamo-hipófisis-adrenal) para regular la respuesta fisiológica al estrés cotidiano.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md">
                  <CardContent className="p-6 space-y-4">
                    <div className="p-3 w-fit rounded-xl bg-primary/10 text-primary">
                      <Leaf className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-card-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>
                      Sustentabilidad
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Empaques ecológicos reciclables y sourcing de materias primas ético, minimizando el impacto ambiental en nuestra cadena de logística a nivel nacional.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md">
                  <CardContent className="p-6 space-y-4">
                    <div className="p-3 w-fit rounded-xl bg-accent/10 text-accent">
                      <Users className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-card-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>
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

        {/* Seductive Callout - The Promise of Pure Formulations */}
        <section className="py-24 bg-gradient-to-b from-card to-background relative overflow-hidden">
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
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Nuestra Promesa Contigo
              </h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Trabajamos de la mano con biólogos y químicos farmacéuticos. Cada lote de Nutra Blue es formulado bajo estándares rigurosos de pureza. 
                Si un compuesto no tiene respaldo científico sólido en ensayos clínicos aleatorizados, no lo incluimos en nuestro catálogo. Así de simple.
              </p>
            </motion.div>

            {/* Guarantees Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="p-5 bg-card/60 rounded-2xl border border-border/50 text-center">
                <h4 className="font-bold text-sm text-foreground mb-1">Sin Excipientes Dañinos</h4>
                <p className="text-[11px] text-muted-foreground">Cero estearato de magnesio, maltodextrinas o azúcares ocultos en los polvos.</p>
              </div>
              <div className="p-5 bg-card/60 rounded-2xl border border-border/50 text-center">
                <h4 className="font-bold text-sm text-foreground mb-1">Dosis Terapéuticas</h4>
                <p className="text-[11px] text-muted-foreground">Concentraciones activas que de verdad generan un impacto medible en tu biología.</p>
              </div>
              <div className="p-5 bg-card/60 rounded-2xl border border-border/50 text-center">
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
                  Elige optimizar tu vida hoy
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
