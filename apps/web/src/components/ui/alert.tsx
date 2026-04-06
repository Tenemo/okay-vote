import { type ComponentProps, type ReactElement } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const alertVariants = cva(
    'relative w-full rounded-[4px] border px-4 py-3 text-base',
    {
        variants: {
            variant: {
                default: 'border-border bg-transparent text-foreground',
                destructive:
                    'border-[rgb(211_47_47_/_0.45)] bg-destructive text-destructive-foreground',
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

export const AlertTitle = ({
    className,
    ...props
}: ComponentProps<'div'>): ReactElement => {
    return (
        <div
            className={cn('font-medium', className)}
            data-slot="alert-title"
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
                'grid justify-items-start gap-1 text-[inherit] [&_p]:leading-relaxed',
                className,
            )}
            data-slot="alert-description"
            {...props}
        />
    );
};
