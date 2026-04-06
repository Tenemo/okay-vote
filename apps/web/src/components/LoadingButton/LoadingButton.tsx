import type { ComponentProps, ReactElement, ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type LoadingButtonProps = Omit<ComponentProps<typeof Button>, 'children'> & {
    children: ReactNode;
    loading: boolean;
    loadingLabel?: string;
};

export const LoadingButton = ({
    children,
    disabled,
    loading,
    loadingLabel,
    ...buttonProps
}: LoadingButtonProps): ReactElement => (
    <Button {...buttonProps} aria-busy={loading} disabled={loading || disabled}>
        <span className="inline-flex items-center gap-2">
            {loading && <Spinner className="size-[18px]" />}
            <span>{loading ? (loadingLabel ?? children) : children}</span>
        </span>
    </Button>
);

export default LoadingButton;
