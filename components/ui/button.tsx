import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-navy text-white shadow-sm hover:-translate-y-px hover:bg-navy/90 hover:shadow-md',
        secondary: 'bg-slate-100 text-navy hover:bg-slate-200',
        outline: 'border border-line bg-white text-navy hover:-translate-y-px hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm',
        ghost: 'text-graydark hover:bg-slate-100 hover:text-navy',
        accent: 'bg-accent-cyan text-white shadow-sm hover:bg-cyan-600',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-11 px-5',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
));
Button.displayName = 'Button';

export { buttonVariants };
