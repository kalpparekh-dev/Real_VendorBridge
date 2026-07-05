import { cn } from "../../utils/cn";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex
      items-center
      justify-center
      rounded-2xl
      font-semibold
      transition-all
      duration-300
      active:scale-[0.98]
      disabled:opacity-50
      disabled:pointer-events-none
      focus:outline-none
    `;

    const variants = {
      primary: `
        bg-gradient-to-r
        from-amber-500
        via-yellow-500
        to-amber-600

        text-black

        shadow-[0_10px_35px_rgba(251,191,36,.35)]

        hover:scale-[1.02]
        hover:shadow-[0_15px_45px_rgba(251,191,36,.5)]
      `,

      secondary: `
        border
        border-white/10
        bg-white/[0.05]
        text-white
        backdrop-blur-xl

        hover:bg-white/[0.08]
      `,

      danger: `
        bg-gradient-to-r
        from-red-600
        to-red-500

        text-white

        hover:brightness-110
      `,

      ghost: `
        bg-transparent
        text-gray-300

        hover:bg-white/5
      `,
    };

    const sizes = {
      sm: "h-10 px-4 text-sm",
      md: "h-12 px-5 text-sm",
      lg: "h-14 px-8 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export default Button;