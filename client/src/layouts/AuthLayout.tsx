import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
};

export default AuthLayout;
