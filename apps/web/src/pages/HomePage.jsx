import React from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Heart, Sparkles } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';

const HomePage = () => {
  const navigate = useNavigate();

  const pillars = [
    {
      icon: Brain,
      title: 'Salud Cognitiva',
      description: 'Potencia tu claridad mental, enfoque y memoria con nuestros nootrópicos naturales y adaptógenos seleccionados.',
      category: 'Salud Cognitiva',
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=400&fit=crop'
    },
    {
      icon: Heart,
      title: 'Gestión del Estrés',
      description: 'Equilibra tu sistema nervioso y reduce el cortisol con extractos botánicos que promueven la calma y resiliencia.',
      category: 'Gestión del Estrés',
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=400&fit=crop'
    },
    {
      icon: Sparkles,
      title: 'Longevidad',
      description: 'Activa tus vías de longevidad celular con antioxidantes, polifenoles y compuestos que apoyan el envejecimiento saludable.',
      category: 'Longevidad',
      image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=400&fit=crop'
    }
  ];

  const handlePillarClick = (category) => {
    navigate(`/shop?category=${encodeURIComponent(category)}`);
  };

  return (
    <>
      <Helmet>
        <title>Nutra Blue - Biohacking para la Longevidad</title>
        <meta name="description" content="Suplementos funcionales premium para optimizar tu biología. Descubre nuestros productos de salud cognitiva, gestión del estrés y longevidad." />
      </Helmet>

      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&h=600&fit=crop"
              alt="Wellness lifestyle background"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/60 to-background/95" />
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
                style={{ fontFamily: 'Playfair Display, serif', letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
              >
                Biohacking con Nutra Blue
              </h1>
              <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8 leading-relaxed">
                Suplementos funcionales para optimizar tu biología
              </p>
              <Button
                asChild
                size="lg"
                className="bg-accent text-white hover:bg-accent/90 text-lg px-8 py-6 rounded-xl shadow-lg transition-all duration-200 active:scale-[0.98]"
              >
                <Link to="/shop">Explorar Catálogo</Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Pillars Section - 2-column zig-zag layout */}
        <section className="py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2
                className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-4"
                style={{ fontFamily: 'Playfair Display, serif', letterSpacing: '-0.02em' }}
              >
                Tres Pilares de Optimización
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Nuestros productos están diseñados para apoyar las áreas clave de tu bienestar integral
              </p>
            </motion.div>

            <div className="space-y-24">
              {pillars.map((pillar, index) => {
                const Icon = pillar.icon;
                const isEven = index % 2 === 0;

                return (
                  <motion.div
                    key={pillar.category}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
                  >
                    {/* Image */}
                    <div className={`${isEven ? 'md:order-1' : 'md:order-2'}`}>
                      <div className="relative rounded-2xl overflow-hidden shadow-lg group cursor-pointer" onClick={() => handlePillarClick(pillar.category)}>
                        <img
                          src={pillar.image}
                          alt={pillar.title}
                          className="w-full h-[400px] object-cover transition-all duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className={`${isEven ? 'md:order-2' : 'md:order-1'}`}>
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="bg-primary/10 p-3 rounded-xl">
                          <Icon className="h-8 w-8 text-primary" />
                        </div>
                        <h3
                          className="text-2xl md:text-3xl font-semibold text-foreground"
                          style={{ fontFamily: 'Playfair Display, serif' }}
                        >
                          {pillar.title}
                        </h3>
                      </div>
                      <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                        {pillar.description}
                      </p>
                      <Button
                        onClick={() => handlePillarClick(pillar.category)}
                        variant="outline"
                        className="border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                      >
                        Ver Productos
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default HomePage;