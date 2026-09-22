import React, { useState } from 'react';
import { Helmet } from '@/components/Meta';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const ForgotPasswordPage = () => {
  const { forgotPassword, authAvailable } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!authAvailable) {
      toast.error('Autenticación no disponible. Configura Supabase en el entorno.');
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast.error(err.message || 'No pudimos enviar el correo de recuperación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Recuperar Contraseña - NutraBlue</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Header />
      <main className="min-h-screen bg-background py-12">
        <div className="max-w-md mx-auto px-4">
          <h1 className="text-3xl font-display text-foreground mb-8 text-center">
            Recuperar Contraseña
          </h1>
          <div className="bg-card rounded-xl p-6 border border-border space-y-4">
            {sent ? (
              <p className="text-sm text-center text-muted-foreground">
                Si el email ingresado corresponde a una cuenta, te enviamos un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Ingresa el email de tu cuenta y te enviaremos un enlace para restablecer tu contraseña.
                </p>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </Button>
              </form>
            )}
            <p className="text-sm text-center text-muted-foreground">
              <Link to="/login" className="text-primary hover:underline">Volver a iniciar sesión</Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default ForgotPasswordPage;
