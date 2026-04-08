import { type ComponentProps, type ReactElement } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const alertVariants = cva(
    'relative grid w-full gap-2 rounded-xl border px-4 py-3 text-left text-sm',
    {
        variants: {
            variant: {
                default: 'border-border bg-accent text-foreground',
                info: 'border-border bg-accent text-foreground',
                success:
                    'border-emerald-500/45 bg-emerald-500/12 text-emerald-100',
                destructive:
                    'border-destructive/60 bg-destructive/10 text-foreground',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

type AlertProps = ComponentProps<'div'> & VariantProps<typeof alertVariants>;

export const Alert = ({
    className,
    variant,
    ...props
}: AlertProps): ReactElement => {
    return (
        <div
            className={cn(alertVariants({ variant }), className)}
            data-slot="alert"
            role="alert"
            {...props}
        />
    );
};

export const AlertDescription = ({
    className,
    ...props
}: ComponentProps<'div'>): ReactElement => {
    return (
        <div
            className={cn(
                'text-sm text-current [&_p]:leading-relaxed',
                className,
            )}
            data-slot="alert-description"
            {...props}
        />
    );
};
