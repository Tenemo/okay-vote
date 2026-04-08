import { type ComponentProps, type ReactElement } from 'react';

import { cn } from '@/lib/utils';

export const Label = ({
    className,
    children,
    htmlFor,
    ...props
}: ComponentProps<'label'>): ReactElement => {
    return (
        <label
            className={cn(
                'block text-sm leading-6 font-medium text-foreground select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
                className,
            )}
            data-slot="label"
            htmlFor={htmlFor}
            {...props}
        >
            {children}
        </label>
    );
};
