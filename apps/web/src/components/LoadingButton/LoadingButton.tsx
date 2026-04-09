import type { ComponentProps, ReactElement, ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type LoadingButtonProps = Omit<ComponentProps<typeof Button>, 'children'> & {
    children: ReactNode;
    loading: boolean;
    loadingLabel?: string;
};

const LoadingButton = ({
    children,
    disabled,
    loading,
    loadingLabel,
    ...buttonProps
}: LoadingButtonProps): ReactElement => (
    <Button {...buttonProps} aria-busy={loading} disabled={loading || disabled}>
        <span className="grid grid-cols-[1.25rem_auto_1.25rem] items-center gap-2">
            {loading ? (
                <Spinner className="size-5" label={null} />
            ) : (
                <span aria-hidden="true" className="size-5" />
            )}
            <span>{loading ? (loadingLabel ?? children) : children}</span>
            <span aria-hidden="true" className="size-5" />
        </span>
    </Button>
);

export default LoadingButton;
