import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart, ShieldCheck, Briefcase, UserCheck, Wallet, Store } from "lucide-react";
import { login } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Label from "../components/ui/Label";
import Card from "../components/ui/Card";
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

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

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

      if (!user || !token) {
        throw new Error("Login response did not include user/token");
      }

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-10 text-center">

  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 0.5 }}
    className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-400 to-amber-600 shadow-[0_0_60px_rgba(251,191,36,.45)]"
  >
    <ShoppingCart size={36} className="text-white" />
  </motion.div>

  <h1 className="text-4xl font-bold tracking-tight text-white">
    VendorBridge
  </h1>

  <p className="mt-3 text-sm tracking-wide text-gray-400">
    Enterprise Procurement Intelligence Platform
  </p>

  <div className="mx-auto mt-6 h-px w-28 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

</div>

        <Card className="border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_25px_80px_rgba(0,0,0,.55)] rounded-3xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    email: e.target.value,
                  })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    password: e.target.value,
                  })
                }
                required
              />
            </div>

            <Button
  type="submit"
  disabled={loading}
  className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold shadow-[0_0_35px_rgba(251,191,36,.35)] hover:scale-[1.02] transition-all duration-300"
>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </Card>

        <div className="mt-6 rounded-card border border-border bg-bg-elevated p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-muted">
            Quick Demo Access
          </p>

          <div className="grid gap-2">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                onClick={() => handleDemoLogin(account.email)}
                disabled={loading}
                className="flex items-center justify-between rounded-xl border border-border bg-bg-surface px-4 py-3 text-left text-sm text-text-secondary hover:border-accent hover:text-accent disabled:opacity-50"
              >
                <span className="flex items-center gap-3">
                  <account.icon size={16} />
                  {account.label}
                </span>
                <span className="text-xs text-text-muted">One-click login</span>
              </button>
            ))}
          </div>

          <p className="mt-3 text-[11px] text-text-muted">
            Demo accounts use sample data only. Credentials are not displayed publicly.
          </p>
        </div>

        <div className="mt-6 text-center text-sm text-text-secondary">
          Vendor registration available for demo testing.{" "}
          <button
            onClick={() => navigate("/register")}
            className="text-accent hover:underline"
          >
            Register as Vendor
          </button>
        </div>
      </motion.div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </AuthLayout>
  );
};

export default Login;