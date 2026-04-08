import { cva, type VariantProps } from 'class-variance-authority';
import { type ComponentProps, type ReactElement } from 'react';

import { cn } from '@/lib/utils';

const panelVariants = cva('rounded-2xl border border-border/70', {
    variants: {
        padding: {
            default: 'p-5 sm:p-6',
            compact: 'p-4 sm:p-5',
            none: '',
        },
        tone: {
            default: 'bg-card',
            subtle: 'bg-background',
        },
    },
    defaultVariants: {
        padding: 'default',
        tone: 'default',
    },
});

type PanelProps = ComponentProps<'section'> &
    VariantProps<typeof panelVariants>;

export const Panel = ({
    className,
    padding,
    tone,
    ...props
}: PanelProps): ReactElement => (
    <section
        className={cn(panelVariants({ className, padding, tone }))}
        {...props}
    />
);
