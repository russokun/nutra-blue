import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, authAvailable } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from || '/account';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!authAvailable) {
      toast.error('Autenticación no disponible. Configura Supabase en el entorno.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Sesión iniciada');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Iniciar Sesión - Nutra Blue</title>
      </Helmet>
      <Header />
      <main className="min-h-screen bg-background py-12">
        <div className="max-w-md mx-auto px-4">
          <h1 className="text-3xl font-bold text-foreground mb-8 text-center" style={{ fontFamily: 'Playfair Display, serif' }}>
            Iniciar Sesión
          </h1>
          <form onSubmit={handleSubmit} className="bg-card rounded-xl p-6 border border-border space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              ¿No tienes cuenta? <Link to="/register" className="text-primary hover:underline">Regístrate</Link>
            </p>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default LoginPage;
