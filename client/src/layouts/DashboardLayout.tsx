import { useState } from "react";
import { Outlet } from "react-router-dom";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const DashboardLayout = ({ children }: { children?: ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#080A0E] text-white">

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-col lg:ml-72">

        <Header
          onMenuClick={() => setSidebarOpen(true)}
          title="Dashboard"
        />

        <motion.main
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex-1 p-6"
        >
          {children ?? <Outlet />}
        </motion.main>

      </div>
    </div>
  );
};

export default DashboardLayout;