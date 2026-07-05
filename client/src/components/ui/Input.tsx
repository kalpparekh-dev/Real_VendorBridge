import { cn } from "../../utils/cn";
import { forwardRef, InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          `
          w-full
          rounded-2xl
          border
          border-white/10
          bg-white/[0.04]
          px-4
          py-3

          text-sm
          text-white

          placeholder:text-gray-500

          backdrop-blur-xl

          shadow-[0_8px_30px_rgba(0,0,0,.35)]

          transition-all
          duration-300

          focus:border-amber-400
          focus:bg-white/[0.06]
          focus:ring-4
          focus:ring-amber-400/15
          focus:shadow-[0_0_30px_rgba(251,191,36,.25)]
          focus:outline-none

          disabled:cursor-not-allowed
          disabled:opacity-50
          `,
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export default Input;