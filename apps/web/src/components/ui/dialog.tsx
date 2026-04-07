import {
    cloneElement,
    createContext,
    isValidElement,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
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

const focusableElementSelector =
    'a[href], area[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, object, embed, [contenteditable], [tabindex]:not([tabindex="-1"])';

const getFocusableElements = (container: HTMLElement): HTMLElement[] =>
    Array.from(
        container.querySelectorAll<HTMLElement>(focusableElementSelector),
    ).filter(
        (element) =>
            !element.hasAttribute('disabled') &&
            element.getAttribute('aria-hidden') !== 'true',
    );

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

    const setOpen = useCallback(
        (nextOpen: boolean): void => {
            if (!isControlled) {
                setUncontrolledOpen(nextOpen);
            }

            onOpenChange?.(nextOpen);
        },
        [isControlled, onOpenChange],
    );

    const contextValue = useMemo(
        () => ({
            open: resolvedOpen,
            setOpen,
        }),
        [resolvedOpen, setOpen],
    );

    return (
        <DialogContext.Provider value={contextValue}>
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
                'fixed inset-0 z-50 bg-black/60 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
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
    const contentRef = useRef<HTMLDivElement | null>(null);
    const previousActiveElementRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const previousOverflow = document.body.style.overflow;
        previousActiveElementRef.current =
            document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;

        document.body.style.overflow = 'hidden';

        const focusInitialElement = (): void => {
            const content = contentRef.current;

            if (!content) {
                return;
            }

            const autofocusElement = content.querySelector<HTMLElement>(
                '[autofocus], [data-autofocus="true"]',
            );

            if (autofocusElement) {
                autofocusElement.focus();
                return;
            }

            content.focus();
        };

        focusInitialElement();

        const onKeyDown = (event: KeyboardEvent): void => {
            const content = contentRef.current;

            if (event.key !== 'Escape') {
                if (event.key !== 'Tab' || !content) {
                    return;
                }

                const focusableElements = getFocusableElements(content);

                if (focusableElements.length === 0) {
                    event.preventDefault();
                    content.focus();
                    return;
                }

                const firstElement = focusableElements[0];
                const lastElement =
                    focusableElements[focusableElements.length - 1];
                const activeElement =
                    document.activeElement instanceof HTMLElement
                        ? document.activeElement
                        : null;

                if (event.shiftKey && activeElement === firstElement) {
                    event.preventDefault();
                    lastElement.focus();
                    return;
                }

                if (!event.shiftKey && activeElement === lastElement) {
                    event.preventDefault();
                    firstElement.focus();
                }

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
            if (previousActiveElementRef.current?.isConnected) {
                previousActiveElementRef.current.focus();
            }
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
                    'fixed left-1/2 top-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-[4px] bg-popover p-6 shadow-[0_11px_15px_-7px_rgba(0,0,0,0.2),0_24px_38px_3px_rgba(0,0,0,0.14),0_9px_46px_8px_rgba(0,0,0,0.12)] outline-none sm:max-w-[600px]',
                    className,
                )}
                data-slot="dialog-content"
                ref={contentRef}
                role="dialog"
                tabIndex={-1}
                {...props}
            >
                {children}
                {showCloseButton && (
                    <DialogClose
                        className="absolute right-2 top-2 opacity-70 transition-opacity hover:bg-accent hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring disabled:pointer-events-none data-[state=open]:text-muted-foreground"
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
            className={cn('flex flex-col gap-2 text-left', className)}
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
            className={cn(
                'text-xl leading-[1.6] font-medium text-foreground',
                className,
            )}
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
            className={cn('text-base text-foreground', className)}
            data-slot="dialog-description"
            {...props}
        >
            {children}
        </div>
    );
};
