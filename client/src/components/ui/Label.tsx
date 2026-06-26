import { cn } from '../../utils/cn';
import { LabelHTMLAttributes, forwardRef } from 'react';

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn('text-sm font-medium text-text-secondary', className)}
        {...props}
      />
    );
  }
);

Label.displayName = 'Label';

export default Label;
