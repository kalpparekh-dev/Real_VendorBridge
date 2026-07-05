import { ReactNode } from "react";
import { motion } from "framer-motion";

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07090D]">

      {/* Background */}
      <div className="absolute inset-0 bg-[#07090D]" />

      {/* Gold Glow */}
      <div className="absolute left-[-180px] top-[-180px] h-[520px] w-[520px] rounded-full bg-amber-400/10 blur-[170px]" />

      {/* Blue Glow */}
      <div className="absolute right-[-180px] bottom-[-180px] h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[180px]" />

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage: `
          linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)
        `,
          backgroundSize: "58px 58px",
        }}
      />

      {/* Noise */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,.18)_65%,rgba(0,0,0,.75)_100%)]" />

      {/* Content */}

      <div className="relative z-20 flex min-h-screen items-center justify-center px-6">

        <motion.div
          initial={{
            opacity: 0,
            y: 35,
            scale: .97,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          transition={{
            duration: .8,
          }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>

      </div>
    </div>
  );
};

export default AuthLayout;