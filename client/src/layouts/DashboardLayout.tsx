import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import type { ReactNode } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const DashboardLayout = ({ children }: { children?: ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg-base">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 lg:ml-64">
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          title="Dashboard" 
        />
        <main className="p-4 lg:p-6">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
