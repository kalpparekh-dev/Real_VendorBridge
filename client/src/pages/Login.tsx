import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  ShieldCheck,
  Briefcase,
  UserCheck,
  Wallet,
  Store,
  Sparkles,
  BarChart3,
  LockKeyhole,
  Mail,
  MousePointerClick,
} from "lucide-react";
import { login } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Label from "../components/ui/Label";
import AuthLayout from "../layouts/AuthLayout";
import Toast from "../components/ui/Toast";

const demoAccounts = [
  { label: "Admin Demo", email: "admin@vendorbridge.com", icon: ShieldCheck },
  { label: "Procurement Demo", email: "procurement@vendorbridge.com", icon: Briefcase },
  { label: "Manager Demo", email: "manager@vendorbridge.com", icon: UserCheck },
  { label: "Finance Demo", email: "finance@vendorbridge.com", icon: Wallet },
  { label: "Vendor Demo", email: "vendor1@techsupplies.com", icon: Store },
];

const Login = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [lightOn, setLightOn] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const redirectByRole = (roleValue: string) => {
    const role = roleValue?.toUpperCase();

    const roleRedirects: Record<string, string> = {
      ADMIN: "/admin",
      PROCUREMENT: "/procurement",
      PROCUREMENT_OFFICER: "/procurement",
      MANAGER: "/manager",
      FINANCE: "/finance",
      VENDOR: "/vendor",
    };

    navigate(roleRedirects[role] || "/admin", { replace: true });
  };

  const loginUser = async (email: string, password: string) => {
    setLoading(true);

    try {
      const response = await login(email, password);
      const user = response.user || response.data?.user;
      const token = response.token || response.accessToken || response.data?.token;

      if (!user || !token) throw new Error("Login response did not include user/token");

      setAuth(user, token);
      setToast({ message: "Login successful!", type: "success" });
      redirectByRole(user.role);
    } catch (error: any) {
      setToast({
        message: error.response?.data?.error || error.message || "Login failed",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await loginUser(formData.email, formData.password);
  };

  const handleDemoLogin = async (email: string) => {
    await loginUser(email, "demo123");
  };

  return (
    <AuthLayout>
      {/* Pull String */}
      <button
        onClick={() => setLightOn(true)}
        className="fixed right-10 top-0 z-50 hidden cursor-pointer flex-col items-center lg:flex"
      >
        <motion.div
          animate={lightOn ? { height: 310 } : { height: 250 }}
          transition={{ type: "spring", stiffness: 120, damping: 12 }}
          className="w-px bg-gradient-to-b from-yellow-200/80 to-yellow-700/70"
        />

        <motion.div
          animate={lightOn ? { y: [0, 28, 0], rotate: [0, -10, 8, 0] } : { y: 0 }}
          transition={{ duration: 0.8 }}
          className="h-8 w-4 rounded-full border border-yellow-700 bg-yellow-900 shadow-lg"
        />

        {!lightOn && (
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            className="mt-4 flex items-center gap-2 rounded-full border border-border bg-bg-surface/80 px-4 py-2 text-xs text-text-secondary backdrop-blur-xl"
          >
            <MousePointerClick size={14} className="text-accent" />
            Pull the string to enter
          </motion.div>
        )}
      </button>

      {/* Darkness Overlay */}
      <AnimatePresence>
        {!lightOn && (
          <motion.div
            initial={{ opacity: 0.92 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 z-30 bg-black/90"
          />
        )}
      </AnimatePresence>

      {/* Light Beam */}
      <motion.div
        initial={false}
        animate={
          lightOn
            ? { opacity: 1, scale: 1 }
            : { opacity: 0.08, scale: 0.7 }
        }
        transition={{ duration: 1 }}
        className="pointer-events-none fixed left-1/2 top-24 z-40 h-[720px] w-[680px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.45),rgba(37,99,235,0.16)_35%,transparent_70%)] blur-sm"
      />

      <motion.div
        initial={false}
        animate={lightOn ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0.08, y: 20, scale: 0.96 }}
        transition={{ duration: 0.8 }}
        className="relative z-40"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <motion.div
            animate={lightOn ? { boxShadow: "0 0 70px rgba(37,99,235,0.55)" } : {}}
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent"
          >
            <ShoppingCart size={32} className="text-white" />
          </motion.div>

          <h1 className="text-3xl font-semibold text-text-primary">VendorBridge</h1>

          <p className="mt-2 text-sm text-text-secondary">
            Smarter procurement. Stronger vendor relationships.
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1 rounded-full border border-border bg-bg-elevated px-3 py-1">
              <Sparkles size={13} className="text-accent" />
              AI Insights
            </span>
            <span className="flex items-center gap-1 rounded-full border border-border bg-bg-elevated px-3 py-1">
              <BarChart3 size={13} className="text-success" />
              Live Analytics
            </span>
            <span className="flex items-center gap-1 rounded-full border border-border bg-bg-elevated px-3 py-1">
              <ShieldCheck size={13} className="text-warning" />
              Secure RBAC
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-bg-surface/80 p-5 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-text-muted" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <LockKeyhole size={16} className="absolute left-3 top-3 text-text-muted" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading || !lightOn}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-bg-elevated/80 p-4 backdrop-blur-xl">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-muted">
            Quick Demo Access
          </p>

          <div className="grid gap-2 sm:grid-cols-2">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                onClick={() => handleDemoLogin(account.email)}
                disabled={loading || !lightOn}
                className="flex items-center justify-between rounded-xl border border-border bg-bg-surface px-4 py-3 text-left text-sm text-text-secondary transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="flex items-center gap-3">
                  <account.icon size={16} />
                  {account.label}
                </span>
              </button>
            ))}
          </div>

          <p className="mt-3 text-[11px] text-text-muted">
            Demo accounts use sample data only. Credentials are not displayed publicly.
          </p>
        </div>

        <div className="mt-6 text-center text-sm text-text-secondary">
          Vendor registration available for demo testing.{" "}
          <button onClick={() => navigate("/register")} className="text-accent hover:underline">
            Register as Vendor
          </button>
        </div>
      </motion.div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </AuthLayout>
  );
};

export default Login;