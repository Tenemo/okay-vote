import {
    createContext,
    type HTMLAttributes,
    type PropsWithChildren,
    type ReactElement,
    useContext,
    useEffect,
    useRef,
} from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/utils';

type DialogContextValue = {
    onOpenChange?: (open: boolean) => void;
    open: boolean;
};

const DialogContext = createContext<DialogContextValue | null>(null);

type DialogProps = PropsWithChildren<{
    onOpenChange?: (open: boolean) => void;
    open?: boolean;
}>;

export const Dialog = ({
    children,
    onOpenChange,
    open = false,
}: DialogProps): ReactElement => (
    <DialogContext.Provider value={{ onOpenChange, open }}>
        {children}
    </DialogContext.Provider>
);

type DialogContentProps = HTMLAttributes<HTMLDivElement> & {
    onEscapeKeyDown?: (event: KeyboardEvent) => void;
    onPointerDownOutside?: (event: MouseEvent) => void;
};

const useDialogContext = (): DialogContextValue => {
    const value = useContext(DialogContext);

    if (!value) {
        throw new Error('Dialog components must be rendered inside Dialog.');
    }

    return value;
};

export const DialogContent = ({
    children,
    className,
    onEscapeKeyDown,
    onPointerDownOutside,
    ...props
}: DialogContentProps): ReactElement | null => {
    const { open, onOpenChange } = useDialogContext();
    const contentRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const { overflow } = document.body.style;
        document.body.style.overflow = 'hidden';
        const handleEscape = (event: KeyboardEvent): void => {
            if (event.key !== 'Escape') {
                return;
            }

            onEscapeKeyDown?.(event);

            if (!event.defaultPrevented) {
                onOpenChange?.(false);
            }
        };
        const handlePointerDown = (event: MouseEvent): void => {
            if (
                !(event.target instanceof Node) ||
                contentRef.current?.contains(event.target)
            ) {
                return;
            }

            onPointerDownOutside?.(event);

            if (!event.defaultPrevented) {
                onOpenChange?.(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        document.addEventListener('mousedown', handlePointerDown);

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('mousedown', handlePointerDown);
            document.body.style.overflow = overflow;
        };
    }, [onEscapeKeyDown, onOpenChange, onPointerDownOutside, open]);

    if (!open) {
        return null;
    }

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div
                aria-modal="true"
                className={cn(
                    'grid w-full max-w-[32rem] gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] outline-none sm:p-6',
                    className,
                )}
                ref={contentRef}
                role="dialog"
                {...props}
            >
                {children}
            </div>
        </div>,
        document.body,
    );
};

export const DialogHeader = ({
    className,
    ...props
}: HTMLAttributes<HTMLDivElement>): ReactElement => (
    <div
        className={cn('flex flex-col gap-2 text-left', className)}
        {...props}
    />
);

export const DialogFooter = ({
    className,
    ...props
}: HTMLAttributes<HTMLDivElement>): ReactElement => (
    <div
        className={cn(
            'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
            className,
        )}
        {...props}
    />
);

export const DialogTitle = ({
    children,
    className,
    ...props
}: HTMLAttributes<HTMLHeadingElement>): ReactElement => (
    <h2
        className={cn(
            'text-2xl leading-tight font-semibold tracking-tight text-foreground',
            className,
        )}
        {...props}
    >
        {children}
    </h2>
);

export const DialogDescription = ({
    className,
    ...props
}: HTMLAttributes<HTMLParagraphElement>): ReactElement => (
    <p
        className={cn('text-sm leading-7 text-secondary', className)}
        {...props}
    />
);
