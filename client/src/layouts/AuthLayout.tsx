import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Sparkles, BarChart3 } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-bg-base text-text-primary">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#2563eb33,transparent_38%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(10,12,16,0.2),#0A0C10_75%)]" />

      <motion.div
        initial={{ opacity: 0, y: -80 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
        className="pointer-events-none absolute left-1/2 top-0 h-72 w-[520px] -translate-x-1/2 rounded-b-full bg-accent/20 blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, scaleY: 0.3 }}
        animate={{ opacity: 1, scaleY: 1 }}
        transition={{ duration: 1.1, delay: 0.15 }}
        className="pointer-events-none absolute left-1/2 top-0 h-[460px] w-px origin-top -translate-x-1/2 bg-gradient-to-b from-accent via-accent/40 to-transparent"
      />

      <motion.div
        initial={{ opacity: 0, y: -40, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.25 }}
        className="pointer-events-none absolute left-1/2 top-20 h-20 w-20 -translate-x-1/2 rounded-full border border-accent/30 bg-accent/10 shadow-[0_0_80px_rgba(37,99,235,0.45)]"
      />

      <div className="absolute left-10 top-10 hidden rounded-2xl border border-border bg-bg-surface/70 p-4 backdrop-blur-xl lg:block">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-accent/10 p-2 text-accent">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="text-sm font-medium">Enterprise RBAC</p>
            <p className="text-xs text-text-muted">Secure multi-role access</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 left-10 hidden rounded-2xl border border-border bg-bg-surface/70 p-4 backdrop-blur-xl lg:block">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-success/10 p-2 text-success">
            <BarChart3 size={18} />
          </div>
          <div>
            <p className="text-sm font-medium">Live Analytics</p>
            <p className="text-xs text-text-muted">Spend, RFQs & invoices</p>
          </div>
        </div>
      </div>

      <div className="absolute right-10 top-24 hidden rounded-2xl border border-border bg-bg-surface/70 p-4 backdrop-blur-xl lg:block">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-warning/10 p-2 text-warning">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-sm font-medium">AI Procurement</p>
            <p className="text-xs text-text-muted">Insights & risk alerts</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-[28px] border border-border bg-bg-surface/80 p-6 shadow-2xl backdrop-blur-xl">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;