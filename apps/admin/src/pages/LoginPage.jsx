import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { KeyRound, Mail, ShieldAlert } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, authAvailable } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!authAvailable) {
      toast.error('Autenticación no disponible. Configura Supabase en el entorno.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Sesión iniciada correctamente');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 px-4 relative overflow-hidden">
      {/* Decorative blurred backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-card/60 backdrop-blur-md rounded-2xl p-8 border border-border/40 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-3">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>
            Panel de Control
          </h1>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            Ingresa tus credenciales de administrador para continuar
          </p>
        </div>

        {!authAvailable && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/25 text-destructive rounded-xl flex items-start gap-3 text-sm flex-col">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Atención:</span> Supabase no está configurado localmente. La autenticación fallará.
              </div>
            </div>
            <div className="mt-2 text-xs font-mono bg-black/20 p-2 rounded w-full break-all space-y-1">
              <div>VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL ? `${import.meta.env.VITE_SUPABASE_URL.slice(0, 25)}...` : 'Vacio'}</div>
              <div>VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? `${import.meta.env.VITE_SUPABASE_ANON_KEY.slice(0, 15)}...` : 'Vacio'}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo Electrónico</Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                <Mail className="h-4 w-4" />
              </span>
              <Input
                id="email"
                type="email"
                placeholder="nombre@nutrablue.cl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 bg-background/50 border-border/60 focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="password">Contraseña</Label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                <KeyRound className="h-4 w-4" />
              </span>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 bg-background/50 border-border/60 focus-visible:ring-primary"
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-10 mt-2 font-semibold shadow-lg hover:shadow-primary/10 transition-all duration-200" disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
