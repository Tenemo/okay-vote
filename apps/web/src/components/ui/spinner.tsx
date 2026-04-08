import { type ComponentPropsWithoutRef, type ReactElement } from 'react';

import { Loader2 } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

type SpinnerProps = ComponentPropsWithoutRef<'span'> & {
    label?: string | null;
};

export const Spinner = ({
    className,
    label = 'Loading',
    ...props
}: SpinnerProps): ReactElement => {
    if (label === null) {
        return (
            <span {...props} aria-hidden="true">
                <Loader2 className={cn('size-4 animate-spin', className)} />
            </span>
        );
    }

    return (
        <span {...props} aria-label={label} role="status">
            <Loader2 className={cn('size-4 animate-spin', className)} />
        </span>
    );
};
