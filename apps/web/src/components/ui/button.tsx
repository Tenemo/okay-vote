import { type ButtonHTMLAttributes, type ReactElement } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-transparent text-center text-sm font-medium transition-[color,background-color,border-color,box-shadow] outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    {
        variants: {
            variant: {
                default:
                    'bg-primary text-primary-foreground hover:bg-primary/85 focus-visible:ring-foreground/55 disabled:bg-primary/60 disabled:text-primary-foreground/80 disabled:opacity-100',
                outline:
                    'border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-foreground/35 disabled:border-border/90 disabled:bg-card disabled:text-secondary disabled:opacity-100',
                ghost: 'border-transparent bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-foreground/30',
            },
            size: {
                default: 'h-10 px-4 py-2',
                lg: 'h-12 gap-2.5 px-5 py-2.5 text-base',
                icon: 'size-9',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
    VariantProps<typeof buttonVariants>;

export const Button = ({
    className,
    type = 'button',
    variant = 'default',
    size = 'default',
    ...props
}: ButtonProps): ReactElement => {
    return (
        <button
            className={cn(buttonVariants({ variant, size, className }))}
            data-size={size}
            data-slot="button"
            data-variant={variant}
            type={type}
            {...props}
        />
    );
};

export { buttonVariants };
