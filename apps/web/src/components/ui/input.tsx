import { type ComponentProps, type ReactElement } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const inputVariants = cva(
    'w-full min-w-0 rounded-[4px] text-base text-foreground outline-none placeholder:text-muted-foreground transition-[background-color,border-color,box-shadow] selection:bg-primary selection:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive',
    {
        variants: {
            variant: {
                outlined:
                    'h-14 border border-border bg-input px-3.5 py-4 hover:border-outline-strong focus:border-white',
                filled: 'h-14 border border-transparent bg-filled px-3.5 py-4 hover:bg-filled-hover focus:border-outline-strong',
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
