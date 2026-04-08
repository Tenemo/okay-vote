import { type ButtonHTMLAttributes, type ReactElement } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-[4px] border border-transparent font-medium whitespace-nowrap uppercase tracking-[0.02857em] transition-[background-color,border-color,color] outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    {
        variants: {
            variant: {
                default:
                    'bg-primary text-primary-foreground hover:bg-primary/92 disabled:bg-disabled-surface disabled:text-disabled',
                destructive:
                    'bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:bg-destructive/60 disabled:text-destructive-foreground/70',
                outline:
                    'border-border bg-transparent text-foreground hover:border-outline-strong hover:bg-accent disabled:border-outline-muted disabled:bg-transparent disabled:text-disabled',
                secondary: 'bg-accent text-foreground hover:bg-accent/90',
                ghost: 'bg-transparent text-foreground hover:bg-accent disabled:text-disabled',
                link: 'border-0 p-0 normal-case tracking-normal text-primary underline-offset-4 hover:underline',
            },
            size: {
                default:
                    'min-h-[36px] min-w-16 px-[15px] py-[5px] text-sm leading-[1.75]',
                xs: 'min-h-6 gap-1 px-2 text-xs leading-[1.66] has-[>svg]:px-1.5 [&_svg:not([class*=size-])]:size-3',
                sm: 'min-h-[30px] min-w-16 gap-1.5 px-[5px] py-[3px] text-sm leading-[1.75] has-[>svg]:px-2.5',
                lg: 'min-h-[42px] min-w-16 px-[22px] py-2 text-[15px] leading-[1.75]',
                icon: 'size-10 rounded-full p-2',
                'icon-xs':
                    'size-8 rounded-full p-1.5 [&_svg:not([class*=size-])]:size-3',
                'icon-sm': 'size-10 rounded-full p-2',
                'icon-lg': 'size-12 rounded-full p-3',
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
