import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './layouts/DashboardLayout';
import AdminDashboard from './pages/AdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import FinanceDashboard from './pages/FinanceDashboard';
import VendorDashboard from './pages/VendorDashboard';
import ProcurementDashboard from './pages/ProcurementDashboard';
import Reports from './pages/Reports';
import Vendors from './pages/Vendors';
import { useAuthStore } from './store/authStore';

const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.2 }}
  >
    {children}
  </motion.div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore((state) => state.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <PageTransition>{children}</PageTransition>;
};

function App() {
  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          {/* Auth Routes */}
          <Route
            path="/login"
            element={
              <PageTransition>
                <Login />
              </PageTransition>
            }
          />
          <Route
            path="/register"
            element={
              <PageTransition>
                <Register />
              </PageTransition>
            }
          />

          {/* Dashboard Routes */}
          <Route path="/" element={<Navigate to="/admin" replace />} />
          
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/manager"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ManagerDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/finance"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <FinanceDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/vendor"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <VendorDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/procurement"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ProcurementDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Reports />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/vendors"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Vendors />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
}

export default App;
