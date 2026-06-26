import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { login } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Label from "../components/ui/Label";
import Card from "../components/ui/Card";
import AuthLayout from "../layouts/AuthLayout";
import Toast from "../components/ui/Toast";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await login(formData.email, formData.password);
      const user = response.user || response.data?.user;
      const token = response.token || response.accessToken || response.data?.token;

      if (!user || !token) {
        throw new Error('Login response did not include user/token');
      }

      setAuth(user, token);
      setToast({ message: 'Login successful!', type: 'success' });

      const role = user.role?.toUpperCase();
      const roleRedirects: Record<string, string> = {
        ADMIN: '/admin',
        PROCUREMENT: '/procurement',
        PROCUREMENT_OFFICER: '/procurement',
        MANAGER: '/manager',
        FINANCE: '/finance',
        VENDOR: '/vendor',
      };

      navigate(roleRedirects[role] || '/admin', { replace: true });
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || error.message || 'Login failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
            <ShoppingCart size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-text-primary">
            VendorBridge
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Sign in to your account
          </p>
        </div>

        <Card>
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </Card>

        <div className="mt-6 text-center text-sm text-text-secondary">
          Don&apos;t have an account?{" "}
          <button
            onClick={() => navigate("/register")}
            className="text-accent hover:underline"
          >
            Register as Vendor
          </button>
        </div>

        <div className="mt-8 rounded-card border border-border bg-bg-elevated p-4">
          <p className="mb-2 text-xs font-medium text-text-muted">
            Demo Credentials:
          </p>

          <div className="space-y-1 text-xs text-text-secondary">
            <p>Admin: admin@vendorbridge.com / demo123</p>
            <p>Procurement: procurement@vendorbridge.com / demo123</p>
            <p>Manager: manager@vendorbridge.com / demo123</p>
            <p>Finance: finance@vendorbridge.com / demo123</p>
            <p>Vendor: vendor1@techsupplies.com / demo123</p>
          </div>
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