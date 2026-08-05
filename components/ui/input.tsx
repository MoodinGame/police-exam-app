import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, type, ...props }, ref) => (
  <input type={type} ref={ref} className={cn('flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-navy shadow-[0_1px_2px_rgba(15,35,64,0.02)] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-graylight focus:border-accent-cyan focus:ring-4 focus:ring-accent-cyan/15 disabled:cursor-not-allowed disabled:opacity-50', className)} {...props} />
));
Input.displayName = 'Input';
