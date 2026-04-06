import {
    cloneElement,
    createContext,
    isValidElement,
    useContext,
    useEffect,
    useState,
    type ComponentProps,
    type MouseEvent as ReactMouseEvent,
    type ReactElement,
    type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { XIcon } from '@/components/ui/icons';

type DialogContextValue = {
    open: boolean;
    setOpen: (nextOpen: boolean) => void;
};

type DialogEvent<TEvent> = {
    defaultPrevented: boolean;
    nativeEvent: TEvent;
    preventDefault: () => void;
};

const DialogContext = createContext<DialogContextValue | null>(null);

const useDialogContext = (): DialogContextValue => {
    const context = useContext(DialogContext);

    if (!context) {
        throw new Error('Dialog components must be wrapped in Dialog.');
    }

    return context;
};

const createDialogEvent = <TEvent,>(
    nativeEvent: TEvent,
): DialogEvent<TEvent> => {
    const dialogEvent: DialogEvent<TEvent> = {
        defaultPrevented: false,
        nativeEvent,
        preventDefault: () => {
            dialogEvent.defaultPrevented = true;
        },
    };

    return dialogEvent;
};

type DialogProps = {
    children: ReactNode;
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
};

export const Dialog = ({
    children,
    defaultOpen = false,
    open,
    onOpenChange,
}: DialogProps): ReactElement => {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
    const isControlled = open !== undefined;
    const resolvedOpen = open ?? uncontrolledOpen;

    const setOpen = (nextOpen: boolean): void => {
        if (!isControlled) {
            setUncontrolledOpen(nextOpen);
        }

        onOpenChange?.(nextOpen);
    };

    return (
        <DialogContext.Provider
            value={{
                open: resolvedOpen,
                setOpen,
            }}
        >
            {children}
        </DialogContext.Provider>
    );
};

type DialogTriggerProps = ComponentProps<'button'> & {
    asChild?: boolean;
    children: ReactNode;
};

export const DialogTrigger = ({
    asChild,
    children,
    onClick,
    ...props
}: DialogTriggerProps): ReactElement => {
    const { setOpen } = useDialogContext();

    const handleClick = (event: ReactMouseEvent<HTMLElement>): void => {
        setOpen(true);
        onClick?.(event as ReactMouseEvent<HTMLButtonElement>);
    };

    const triggerProps = {
        ...props,
        'data-slot': 'dialog-trigger',
        onClick: handleClick,
    };

    if (asChild && isValidElement(children)) {
        return cloneElement(
            children as ReactElement<Record<string, unknown>>,
            triggerProps,
        );
    }

    return <button {...triggerProps}>{children}</button>;
};

export const DialogPortal = ({
    children,
}: {
    children: ReactNode;
}): ReactElement | null => {
    if (typeof document === 'undefined') {
        return null;
    }

    return createPortal(children, document.body);
};

type DialogCloseProps = ComponentProps<'button'> & {
    asChild?: boolean;
    children: ReactNode;
};

export const DialogClose = ({
    asChild,
    children,
    onClick,
    ...props
}: DialogCloseProps): ReactElement => {
    const { setOpen } = useDialogContext();

    const handleClick = (event: ReactMouseEvent<HTMLElement>): void => {
        setOpen(false);
        onClick?.(event as ReactMouseEvent<HTMLButtonElement>);
    };

    const closeProps = {
        ...props,
        'data-slot': 'dialog-close',
        onClick: handleClick,
    };

    if (asChild && isValidElement(children)) {
        return cloneElement(
            children as ReactElement<Record<string, unknown>>,
            closeProps,
        );
    }

    return <button {...closeProps}>{children}</button>;
};

export const DialogOverlay = ({
    className,
    ...props
}: ComponentProps<'div'>): ReactElement | null => {
    const { open } = useDialogContext();

    if (!open) {
        return null;
    }

    return (
        <div
            className={cn(
                'fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
                className,
            )}
            data-slot="dialog-overlay"
            data-state="open"
            {...props}
        />
    );
};

type DialogContentProps = ComponentProps<'div'> & {
    onEscapeKeyDown?: (event: DialogEvent<KeyboardEvent>) => void;
    onPointerDownOutside?: (event: DialogEvent<PointerEvent>) => void;
    showCloseButton?: boolean;
};

export const DialogContent = ({
    className,
    children,
    onEscapeKeyDown,
    onPointerDownOutside,
    showCloseButton = true,
    ...props
}: DialogContentProps): ReactElement | null => {
    const { open, setOpen } = useDialogContext();

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const previousOverflow = document.body.style.overflow;

        document.body.style.overflow = 'hidden';

        const onKeyDown = (event: KeyboardEvent): void => {
            if (event.key !== 'Escape') {
                return;
            }

            const dialogEvent = createDialogEvent(event);

            onEscapeKeyDown?.(dialogEvent);

            if (!dialogEvent.defaultPrevented) {
                setOpen(false);
            }
        };

        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open, onEscapeKeyDown, setOpen]);

    if (!open) {
        return null;
    }

    return (
        <DialogPortal>
            <DialogOverlay
                onPointerDown={(event) => {
                    const dialogEvent = createDialogEvent(event.nativeEvent);

                    onPointerDownOutside?.(dialogEvent);

                    if (!dialogEvent.defaultPrevented) {
                        setOpen(false);
                    }
                }}
            />
            <div
                aria-modal="true"
                className={cn(
                    'fixed left-1/2 top-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border bg-background p-6 shadow-lg outline-none sm:max-w-lg',
                    className,
                )}
                data-slot="dialog-content"
                role="dialog"
                {...props}
            >
                {children}
                {showCloseButton && (
                    <DialogClose
                        className="absolute right-4 top-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                        type="button"
                    >
                        <XIcon className="size-4" />
                        <span className="sr-only">Close</span>
                    </DialogClose>
                )}
            </div>
        </DialogPortal>
    );
};

export const DialogHeader = ({
    className,
    ...props
}: ComponentProps<'div'>): ReactElement => {
    return (
        <div
            className={cn(
                'flex flex-col gap-2 text-center sm:text-left',
                className,
            )}
            data-slot="dialog-header"
            {...props}
        />
    );
};

type DialogFooterProps = ComponentProps<'div'> & {
    showCloseButton?: boolean;
};

export const DialogFooter = ({
    className,
    showCloseButton = false,
    children,
    ...props
}: DialogFooterProps): ReactElement => {
    return (
        <div
            className={cn(
                'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
                className,
            )}
            data-slot="dialog-footer"
            {...props}
        >
            {children}
            {showCloseButton && (
                <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                </DialogClose>
            )}
        </div>
    );
};

export const DialogTitle = ({
    className,
    children,
    ...props
}: ComponentProps<'h2'>): ReactElement => {
    return (
        <h2
            className={cn('text-lg leading-none font-semibold', className)}
            data-slot="dialog-title"
            {...props}
        >
            {children}
        </h2>
    );
};

export const DialogDescription = ({
    className,
    children,
    ...props
}: ComponentProps<'div'>): ReactElement => {
    return (
        <div
            className={cn('text-sm text-muted-foreground', className)}
            data-slot="dialog-description"
            {...props}
        >
            {children}
        </div>
    );
};
