import { type ComponentProps, type ReactElement } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const alertVariants = cva(
    'relative grid w-full gap-2 rounded-xl border px-4 py-3 text-left text-sm',
    {
        variants: {
            variant: {
                default: 'border-border bg-accent text-foreground',
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

type AlertAnnouncement = 'assertive' | 'off' | 'polite';

type AlertProps = Omit<
    ComponentProps<'div'>,
    'aria-atomic' | 'aria-live' | 'role'
> &
    VariantProps<typeof alertVariants> & {
        announcement?: AlertAnnouncement;
    };

export const Alert = ({
    announcement = 'off',
    className,
    variant,
    ...props
}: AlertProps): ReactElement => {
    const accessibilityProps =
        announcement === 'assertive'
            ? {
                  'aria-atomic': 'true' as const,
                  'aria-live': 'assertive' as const,
                  role: 'alert' as const,
              }
            : announcement === 'polite'
              ? {
                    'aria-atomic': 'true' as const,
                    'aria-live': 'polite' as const,
                    role: 'status' as const,
                }
              : {};

    return (
        <div
            {...accessibilityProps}
            className={cn(alertVariants({ variant }), className)}
            data-slot="alert"
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
