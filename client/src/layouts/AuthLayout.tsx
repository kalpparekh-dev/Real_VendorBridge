import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Sparkles, BarChart3, Globe2 } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-bg-base text-text-primary">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#2563eb30,transparent_34%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,#16a34a18,transparent_32%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(10,12,16,0.1),#0A0C10_82%)]" />

      <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:56px_56px]" />

      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
        className="pointer-events-none absolute left-1/2 top-0 h-80 w-[760px] -translate-x-1/2 rounded-b-full bg-accent/20 blur-3xl"
      />

      <div className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="relative hidden min-h-screen flex-col justify-between p-10 lg:flex">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-surface/70 px-4 py-2 text-xs text-text-secondary backdrop-blur-xl">
              <Sparkles size={14} className="text-accent" />
              Enterprise Procurement SaaS
            </div>

            <h1 className="mt-10 max-w-2xl text-5xl font-semibold leading-tight text-text-primary xl:text-6xl">
              Turn procurement chaos into executive clarity.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-text-secondary">
              VendorBridge connects vendors, RFQs, quotations, approvals, purchase orders,
              invoices, payments, audit trails and AI insights inside one command center.
            </p>
          </div>

          <div className="grid max-w-2xl grid-cols-2 gap-4">
            {[
              { label: 'Secure RBAC', value: '5 roles', icon: ShieldCheck, color: 'text-accent' },
              { label: 'Live Analytics', value: 'Real data', icon: BarChart3, color: 'text-success' },
              { label: 'AI Procurement', value: 'Insights', icon: Sparkles, color: 'text-warning' },
              { label: 'Cloud Ready', value: 'Deployed', icon: Globe2, color: 'text-accent' },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + index * 0.08 }}
                className="rounded-2xl border border-border bg-bg-surface/70 p-5 backdrop-blur-xl"
              >
                <item.icon size={20} className={item.color} />
                <p className="mt-4 text-2xl font-semibold text-text-primary">{item.value}</p>
                <p className="mt-1 text-sm text-text-muted">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center p-4 sm:p-8 lg:p-10">
          <div className="w-full max-w-[520px] rounded-[32px] border border-border bg-bg-surface/82 p-5 shadow-2xl backdrop-blur-2xl sm:p-7">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AuthLayout;