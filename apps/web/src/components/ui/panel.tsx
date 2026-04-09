import { cva, type VariantProps } from 'class-variance-authority';
import { type ComponentProps, type ReactElement } from 'react';

import { cn } from '@/lib/utils';

const panelVariants = cva(
    'rounded-[var(--radius-lg)] border border-border/70 bg-card',
    {
        variants: {
            padding: {
                default: 'p-5 sm:p-6',
                compact: 'p-4 sm:p-5',
                none: '',
            },
            tone: {
                default: '',
                subtle: 'bg-accent',
            },
        },
        defaultVariants: {
            padding: 'default',
            tone: 'default',
        },
    },
);

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
