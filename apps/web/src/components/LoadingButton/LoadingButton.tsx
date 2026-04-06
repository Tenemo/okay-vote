import type { ReactElement, ReactNode } from 'react';
import { Box, Button, CircularProgress } from '@mui/material';
import type { ButtonProps } from '@mui/material';

type LoadingButtonProps = Omit<ButtonProps, 'children'> & {
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
        <Box
            component="span"
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
            }}
        >
            {loading && (
                <CircularProgress color="inherit" size={18} thickness={5} />
            )}
            <Box component="span">
                {loading ? (loadingLabel ?? children) : children}
            </Box>
        </Box>
    </Button>
);

export default LoadingButton;
