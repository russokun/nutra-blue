import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, authAvailable } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!authAvailable) {
      toast.error('Autenticación no disponible. Configura Supabase en el entorno.');
      return;
    }
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      await register(email, password, name);
      toast.success('Cuenta creada. Revisa tu email para confirmar.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Registro - Nutra Blue</title>
      </Helmet>
      <Header />
      <main className="min-h-screen bg-background py-12">
        <div className="max-w-md mx-auto px-4">
          <h1 className="text-3xl font-bold text-foreground mb-8 text-center" style={{ fontFamily: 'Playfair Display, serif' }}>
            Crear Cuenta
          </h1>
          <form onSubmit={handleSubmit} className="bg-card rounded-xl p-6 border border-border space-y-4">
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="mt-1" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Registrarse'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              ¿Ya tienes cuenta? <Link to="/login" className="text-primary hover:underline">Inicia sesión</Link>
            </p>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default RegisterPage;
