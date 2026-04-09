import { type ComponentProps, type ReactElement } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const inputVariants = cva(
    'w-full min-w-0 rounded-[var(--radius-md)] border text-base text-foreground outline-none placeholder:text-muted-foreground transition-[background-color,border-color,box-shadow] selection:bg-primary selection:text-primary-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/25',
    {
        variants: {
            variant: {
                outlined:
                    'h-12 border-input bg-background px-4 py-3 focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground/55',
                filled: 'h-12 border-border bg-filled px-4 py-3 hover:bg-filled-hover focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground/55',
            },
        },
        defaultVariants: {
            variant: 'outlined',
        },
    },
);

type InputProps = ComponentProps<'input'> & VariantProps<typeof inputVariants>;

export const Input = ({
    className,
    type,
    variant,
    ...props
}: InputProps): ReactElement => {
    return (
        <input
            className={cn(inputVariants({ className, variant }))}
            data-slot="input"
            type={type}
            {...props}
        />
    );
};
