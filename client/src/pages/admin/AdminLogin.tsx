import { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { errorMessage } from '../../lib/api';
import Logo from '../../components/Logo';
import { Button, Card, Input } from '../../components/ui';

export default function AdminLogin() {
  const { user, login, loading } = useAuth();
  const { error, success } = useToast();
  const navigate = useNavigate();
  const location = useLocation() as any;
  const [email, setEmail] = useState('admin@hungryhut.in');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/admin" replace />;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      await login(email, password);
      success('Welcome back.');
      navigate(location.state?.from?.pathname || '/admin', { replace: true });
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <img src="/images/kitchen.jpg" alt="" aria-hidden="true" className="h-full w-full scale-105 object-cover opacity-20 blur-[3px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/90 to-ink/80" />
        <div className="absolute -left-24 top-[-10%] h-80 w-80 rounded-full bg-orange/20 blur-[120px]" />
        <div className="absolute -right-20 bottom-[-10%] h-96 w-96 rounded-full bg-yellow/10 blur-[130px]" />
        <div className="absolute inset-0 opacity-[0.2] [background-image:linear-gradient(rgba(255,241,229,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,241,229,0.035)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>
      <Card className="glass-panel-strong relative w-full max-w-md p-7 sm:p-9">
        <div className="mb-7 flex flex-col items-center text-center">
          <Logo />
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-orange/20 bg-ink/40 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-orange backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-orange shadow-[0_0_10px_rgba(255,107,0,0.7)]" />
            Admin Portal
          </div>
          <h1 className="mt-4 text-3xl text-cream sm:text-4xl">Welcome back</h1>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
            Manage the menu, orders, offers and everything that keeps the Hut running.
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <Button type="submit" size="lg" className="mt-2 w-full shadow-glow-orange" loading={submitting}>
            <Lock size={16} /> Sign in
          </Button>
        </form>
        <div className="mt-6 rounded-2xl border border-line bg-neumo/60 p-3 text-center text-xs text-smoke shadow-neumo-inset-sm">
          Demo admin: <span className="font-medium text-muted">admin@hungryhut.in</span> · <span className="font-medium text-muted">HungryHut@2026</span>
        </div>
      </Card>
    </div>
  );
}
