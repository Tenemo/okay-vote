import { type ComponentPropsWithoutRef, type ReactElement } from 'react';

import { Loader2 } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

export const Spinner = ({
    className,
    ...props
}: ComponentPropsWithoutRef<'span'>): ReactElement => {
    return (
        <span {...props} role="status">
            <Loader2 className={cn('size-4 animate-spin', className)} />
        </span>
    );
};
