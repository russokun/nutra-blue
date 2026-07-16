import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Heart, Sparkles, BookOpen, ArrowRight, X, Check, ShoppingBag } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import dataClient from '@/lib/dataClient';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import SectionCarousel from '@/components/common/SectionCarousel';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';

// Estilos de Swiper
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const HomePage = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeArticle, setActiveArticle] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupEmail, setPopupEmail] = useState('');
  const [heroProducts, setHeroProducts] = useState([]);
  const [loadingHero, setLoadingHero] = useState(true);
  const [saleProducts, setSaleProducts] = useState([]);

  useEffect(() => {
    const fetchHeroProducts = async () => {
      try {
        const res = await fetch('/hcgi/api/products/hero-carousel');
        if (!res.ok) throw new Error();
        const data = await res.json();
        setHeroProducts(data);
      } catch (err) {
        console.warn('Failed to fetch hero products, using mock:', err);
        setHeroProducts([
          {
            id: 'calm-and-focus',
            name: 'Calm & Focus',
            price: 18990,
            image_url: 'https://horizons-cdn.hostinger.com/b35461a0-e424-4767-bd53-3b70fb21c1bf/947065a3f4ef376351578339a9ba0e35.jpg',
            benefit_tag: 'Enfoque Sostenido'
          },
          {
            id: 'dark-cacao',
            name: 'Dark Cacao',
            price: 22500,
            image_url: 'https://horizons-cdn.hostinger.com/b35461a0-e424-4767-bd53-3b70fb21c1bf/8b9759abb5ce079dcc1b31532e0e3ce2.jpg',
            benefit_tag: 'Antioxidante Potente'
          },
          {
            id: 'matcha-ritual',
            name: 'Matcha Ritual',
            price: 24990,
            image_url: 'https://horizons-cdn.hostinger.com/b35461a0-e424-4767-bd53-3b70fb21c1bf/db395fe43818aef950855c1429a35f3f.jpg',
            benefit_tag: 'Energía sin Crash'
          }
        ]);
      } finally {
        setLoadingHero(false);
      }
    };
    fetchHeroProducts();
  }, []);

  useEffect(() => {
    // Verificar si fue descartado en las últimas 24 horas
    const dismissedAt = localStorage.getItem('nutra_blue_popup_dismissed_at');
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      const hours24 = 24 * 60 * 60 * 1000;
      if (elapsed < hours24) return; // Aún dentro de la ventana de 24h
    }

    // Trigger 1: Timed (4 segundos)
    const timer = setTimeout(() => {
      setShowPopup(true);
    }, 4000);

    // Trigger 2: Exit Intent
    const handleMouseLeave = (e) => {
      if (e.clientY < 50) {
        setShowPopup(true);
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const handlePopupSubmit = async (e) => {
    e.preventDefault();
    if (!popupEmail) return;
    
    try {
      await dataClient.collection('leads').create({
        email: popupEmail,
        source: 'Pop-up Magnet'
      });
    } catch (err) {
      console.warn('Failed to save subscriber to database:', err);
    }
    
    const subscribers = JSON.parse(localStorage.getItem('nutra_blue_subscribers') || '[]');
    if (!subscribers.includes(popupEmail)) {
      subscribers.push(popupEmail);
      localStorage.setItem('nutra_blue_subscribers', JSON.stringify(subscribers));
    }
    
    localStorage.setItem('nutra_blue_popup_dismissed_at', Date.now().toString());
    setShowPopup(false);
    toast.success('¡Excelente! Código de 15% de descuento enviado a tu correo.');
  };

  const handleClosePopup = () => {
    localStorage.setItem('nutra_blue_popup_dismissed_at', Date.now().toString());
    setShowPopup(false);
  };


  const pillars = [
    {
      icon: Brain,
      title: 'Energía Sostenida',
      cta: 'Mejorar mi Enfoque',
      description: 'Vence la fatiga sin los bajones del café.',
      category: 'Salud Cognitiva',
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=400&fit=crop'
    },
    {
      icon: Heart,
      title: 'Enfoque Inquebrantable',
      cta: 'Reducir mi Cortisol',
      description: 'Claridad mental para un mundo lleno de distractions.',
      category: 'Gestión del Estrés',
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=400&fit=crop'
    },
    {
      icon: Sparkles,
      title: 'Recuperación Profunda',
      cta: 'Activar mi Longevidad',
      description: 'Descanso reparador para rendir al máximo al día siguiente.',
      category: 'Longevidad',
      image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=400&fit=crop'
    }
  ];

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const list = await dataClient.collection('products').getFullList({
          $autoCancel: false
        });
        
        // Destacados (Los 3 primeros)
        setFeaturedProducts(list.slice(0, 3));
        
        // Filtrar Ofertas y Packs con la misma lógica de ShopPage
        const filtered = list.filter(p => {
          const isSale = p.price < 18000;
          const isPack = p.name.toLowerCase().includes('mix') || 
                         p.name.toLowerCase().includes('blend') || 
                         p.name.toLowerCase().includes('tea') || 
                         p.name.toLowerCase().includes('pack') || 
                         p.name.toLowerCase().includes('desde');
          return (isSale || isPack) && p.name !== '__SYSTEM_SYNC_LOG__';
        });
        
        setSaleProducts(filtered.slice(0, 10)); // Limitar a las 10 mejores ofertas/packs
      } catch (e) {
        console.error('Failed to load products for homepage:', e);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const handlePillarClick = (category) => {
    navigate(`/shop?category=${encodeURIComponent(category)}`);
  };

  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    addToCart(product, 1);
    toast.success(`${product.name} añadido al carrito`);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <>
      <Helmet>
        <title>NutraBlue — Alimentos naturales y funcionales para tu salud</title>
        <meta name="description" content="Alimentos naturales y funcionales seleccionados para mejorar tu salud: energía, concentración, descanso y longevidad. Empresa familiar chilena, despacho a todo Chile." />
        <meta name="keywords" content="alimentos naturales, alimentos funcionales, longevidad, salud, energía, concentración, Chile" />
        <meta property="og:title" content="NutraBlue — Alimentos naturales y funcionales para tu salud" />
        <meta property="og:description" content="Alimentos naturales y funcionales seleccionados para mejorar tu salud: energía, concentración, descanso y longevidad. Empresa familiar chilena, despacho a todo Chile." />
        <meta property="og:image" content="/og-image.jpg" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://nutrablue-test.vercel.app" />
      </Helmet>

      <Header />

      <main className="overflow-x-hidden bg-background">
        {/* Carrusel de Confianza (Trust Bar) - Ahora arriba del Hero */}
        <section className="bg-slate-950 border-b border-white/15 py-4 text-white/90 overflow-hidden relative w-full select-none">
          <div className="w-full">
            <div className="animate-marquee-ltr flex items-center whitespace-nowrap gap-12 text-xs md:text-sm font-semibold tracking-wide py-1">
              
              {/* Copy 1 */}
              <div className="flex items-center gap-12">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚡</span>
                  <span>Envío Rápido</span>
                </div>
                <span className="text-white/20">|</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🛡️</span>
                  <span>Calidad Premium (Ingredientes testeados)</span>
                </div>
                <span className="text-white/20">|</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🧪</span>
                  <span>Fórmulas de Nutrición Avanzada</span>
                </div>
                <span className="text-white/20">|</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg">📦</span>
                  <span>Envío Gratis (Sobre $50.000)</span>
                </div>
                <span className="text-white/20">|</span>
              </div>

              {/* Copy 2 */}
              <div className="flex items-center gap-12">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚡</span>
                  <span>Envío Rápido</span>
                </div>
                <span className="text-white/20">|</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🛡️</span>
                  <span>Calidad Premium (Ingredientes testeados)</span>
                </div>
                <span className="text-white/20">|</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🧪</span>
                  <span>Fórmulas de Nutrición Avanzada</span>
                </div>
                <span className="text-white/20">|</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg">📦</span>
                  <span>Envío Gratis (Sobre $50.000)</span>
                </div>
                <span className="text-white/20">|</span>
              </div>

            </div>
          </div>
        </section>

        {/* Hero Product Showcase Carousel Section */}
        <section className="relative min-h-[70vh] flex items-center justify-center bg-white py-16 md:py-24 border-b border-slate-100 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 w-full text-center">
            


            {/* Centered Carousel (30% larger, max-w-7xl) */}
            <div className="w-full overflow-hidden min-h-[510px] relative px-4">
              {loadingHero ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Skeleton className="h-[490px] w-full rounded-2xl" />
                  <Skeleton className="h-[490px] w-full rounded-2xl hidden sm:block" />
                  <Skeleton className="h-[490px] w-full rounded-2xl hidden lg:block" />
                </div>
              ) : (
                <Swiper
                  modules={[Autoplay, Pagination, Navigation]}
                  autoplay={{ delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true }}
                  pagination={{ clickable: true, el: '.swiper-custom-pagination' }}
                  navigation={{ nextEl: '.swiper-button-next-custom', prevEl: '.swiper-button-prev-custom' }}
                  spaceBetween={24}
                  slidesPerView={1}
                  breakpoints={{
                    640: { slidesPerView: 1 },
                    768: { slidesPerView: 2 },
                    1024: { slidesPerView: 3 }
                  }}
                  className="hero-swiper pb-12"
                >
                  {heroProducts.map((product) => (
                    <SwiperSlide key={product.id}>
                      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between h-[490px] text-center relative overflow-hidden group">
                        
                        <Link to={`/product/${product.id}`} className="block flex-grow flex flex-col text-left h-full">
                          {/* Image Container with Fixed Dimensions (30% Larger: h-60 / 240px) */}
                          <div className="relative w-full h-60 flex items-center justify-center bg-slate-50 rounded-xl overflow-hidden mb-4">
                            <img
                              src={product.image_url}
                              alt={product.name}
                              loading="lazy"
                              className="max-h-52 object-contain transition-transform duration-500 group-hover:scale-105"
                              style={{ width: 'auto', height: '208px' }}
                            />
                            <span className="absolute top-2 left-2 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#0284c7]/10 text-[#0284c7] uppercase tracking-wider">
                              {product.benefit_tag}
                            </span>
                          </div>

                          {/* Card Body */}
                          <div className="space-y-2 flex-grow flex flex-col justify-center text-center">
                            <h3 className="font-bold text-slate-800 text-lg group-hover:text-[#0284c7] transition-colors line-clamp-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                              {product.name}
                            </h3>
                            <p className="text-xl font-black text-slate-900">
                              {formatPrice(product.price)}
                            </p>
                          </div>
                        </Link>

                        {/* Double Buttons Footer: Click to go to product details and click to add to cart */}
                        <div className="mt-4 flex gap-3 relative z-10">
                          <Button
                            asChild
                            variant="outline"
                            className="flex-1 border-[#0284c7]/30 text-[#0284c7] hover:bg-[#0284c7]/5 font-bold py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98] text-xs md:text-sm"
                          >
                            <Link to={`/product/${product.id}`}>Ver Detalle</Link>
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              addToCart(product, 1);
                              toast.success(`¡${product.name} agregado al carrito!`);
                            }}
                            className="flex-1 bg-[#0284c7] hover:bg-[#0284c7]/90 text-white font-bold py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98] text-xs md:text-sm"
                          >
                            Llevar Ahora
                          </Button>
                        </div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              )}

              {/* Custom Navigation buttons */}
              {!loadingHero && heroProducts.length > 1 && (
                <>
                  <button className="swiper-button-prev-custom absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors">
                    <span className="text-slate-600 text-base">◀</span>
                  </button>
                  <button className="swiper-button-next-custom absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors">
                    <span className="text-slate-600 text-base">▶</span>
                  </button>
                </>
              )}
              
              {/* Custom Pagination container */}
              <div className="swiper-custom-pagination flex justify-center gap-1.5 mt-4" />
            </div>

          </div>
        </section>

        {/* Ofertas y Packs Exclusivos Section */}
        <section className="py-20 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="mb-12">
              <span className="text-primary font-bold text-xs tracking-wider uppercase bg-primary/10 px-3 py-1.5 rounded-full">
                Descuentos y Combos
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-3" style={{ fontFamily: 'Playfair Display, serif' }}>
                Ofertas y Packs Exclusivos
              </h2>
              <p className="text-slate-600 max-w-xl mx-auto mt-2 text-sm">
                Optimiza tu rendimiento al mejor precio con nuestras selecciones y combos especiales.
              </p>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-card rounded-2xl p-4 border border-border space-y-4">
                    <div className="w-full h-44 bg-muted rounded-xl animate-pulse" />
                    <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                    <div className="h-10 w-full bg-muted rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <SectionCarousel products={saleProducts} />
            )}
          </div>
        </section>

        {/* Pillars Section */}
        <section className="py-24 bg-background didactic-bg">
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
                style={{ letterSpacing: '-0.02em' }}
              >
                Tres Pilares de Optimización
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Nuestras formulaciones premium atacan los desafíos clave de la biología humana moderna.
              </p>
            </motion.div>

            <div className="space-y-20">
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
                      <div className="relative rounded-2xl overflow-hidden shadow-md group cursor-pointer" onClick={() => handlePillarClick(pillar.category)}>
                        <img
                          src={pillar.image}
                          alt={pillar.title}
                          className="w-full h-[350px] object-cover transition-all duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className={`${isEven ? 'md:order-2' : 'md:order-1'}`}>
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="bg-primary/10 p-3 rounded-xl">
                          <Icon className="h-7 w-7 text-primary" />
                        </div>
                        <h3
                          className="text-2xl md:text-3xl font-semibold text-foreground"
                        >
                          {pillar.title}
                        </h3>
                      </div>
                      <p className="text-base text-muted-foreground leading-relaxed mb-6">
                        {pillar.description}
                      </p>
                      <Button
                        onClick={() => handlePillarClick(pillar.category)}
                        variant="outline"
                        className="border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                      >
                        {pillar.cta}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Descubrir Categorías */}
        <section className="py-20 bg-[#f8f7f5] border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Descubrir Categorías
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                Explora suplementos especializados para tus metas de biohacking
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  name: 'Salud Cognitiva',
                  desc: 'Potencia tu memoria, enfoque y claridad mental',
                  image: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=600&h=400&fit=crop',
                  tag: 'Enfoque'
                },
                {
                  name: 'Gestión del Estrés',
                  desc: 'Equilibra tu sistema nervioso y reduce cortisol',
                  image: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=600&h=400&fit=crop',
                  tag: 'Calma'
                },
                {
                  name: 'Longevidad',
                  desc: 'Activa tus vías de optimización celular',
                  image: 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?w=600&h=400&fit=crop',
                  tag: 'Celular'
                }
              ].map((cat) => (
                <div
                  key={cat.name}
                  onClick={() => navigate(`/shop?category=${encodeURIComponent(cat.name)}`)}
                  className="relative rounded-2xl overflow-hidden aspect-[4/3] cursor-pointer group shadow-sm border border-border"
                >
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="bg-accent text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {cat.tag}
                    </span>
                  </div>
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <h3 className="text-lg font-bold mb-1">{cat.name}</h3>
                    <p className="text-xs text-white/85 line-clamp-1">{cat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Section - Los Más Vendidos (Horizontal Scroll on Mobile) */}
        <section className="py-24 bg-background border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 uppercase tracking-widest mb-4">
                Únete a +2.000 personas optimizando su biología
              </span>
              <h2
                className="text-3xl md:text-4xl font-bold text-foreground mb-4"
                style={{ letterSpacing: '-0.02em' }}
              >
                Los Más Vendidos
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Formulaciones premium de alta biodisponibilidad más deseadas por nuestra comunidad.
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-card rounded-2xl p-4 border border-border space-y-4">
                    <div className="w-full h-56 bg-muted rounded-xl animate-pulse" />
                    <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                    <div className="h-10 w-full bg-muted rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none pb-6 gap-6 md:grid md:grid-cols-3 md:overflow-x-visible">
                {featuredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="min-w-[290px] md:min-w-0 snap-center bg-card rounded-2xl p-6 border border-border hover:border-primary/30 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 shadow-sm cursor-pointer"
                  >
                    <div>
                      {/* Floating Product Image Container */}
                      <div className="relative h-48 flex items-center justify-center bg-transparent mb-4">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          loading="lazy"
                          className="h-full w-auto object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.08)] group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-0 left-0 max-w-[50%] truncate bg-primary/10 text-primary border border-primary/20 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {product.category}
                        </span>
                        <span className="absolute top-0 right-0 max-w-[50%] truncate bg-amber-500/10 text-amber-700 border border-amber-500/20 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Stock Limitado
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-lg font-black text-primary">
                        {formatPrice(product.price)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <Button
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/product/${product.id}`);
                        }}
                        className="w-full text-xs py-3 rounded-xl transition-all duration-200"
                      >
                        Ver Detalles
                      </Button>
                      <Button
                        onClick={(e) => handleAddToCart(product, e)}
                        disabled={product.stock === 0}
                        className="w-full text-xs bg-accent text-white hover:bg-accent/90 py-3 rounded-xl transition-all duration-200 shadow-sm"
                      >
                        {product.stock === 0 ? 'Agotado' : 'Añadir a mi Rutina'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Lead Magnet Pop-up */}
      <AnimatePresence>
        {showPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-white/10 rounded-3xl p-8 text-white shadow-2xl overflow-hidden"
            >
              {/* Blur elements */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

              <button
                onClick={handleClosePopup}
                className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="space-y-6 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center text-accent">
                  <Sparkles className="h-6 w-6" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Optimiza tu rendimiento desde hoy
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
                    Suscríbete y desbloquea un <strong className="text-accent">15% de descuento</strong> en tu primera compra. Además, recibe nuestras guías de optimización biológica directo en tu bandeja de entrada.
                  </p>
                </div>

                <form onSubmit={handlePopupSubmit} className="space-y-3 max-w-sm mx-auto">
                  <input
                    type="email"
                    required
                    value={popupEmail}
                    onChange={(e) => setPopupEmail(e.target.value)}
                    placeholder="Tu correo electrónico"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-white/25 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  <Button
                    type="submit"
                    className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all duration-200"
                  >
                    Quiero mi descuento y optimizarme
                  </Button>
                </form>

                <p className="text-[10px] text-slate-500">
                  Respetamos tu privacidad. Puedes darte de baja cuando quieras.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </>
  );
};

export default HomePage;
// Force deployment trigger in Vercel staging environment

