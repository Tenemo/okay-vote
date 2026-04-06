import {
    cloneElement,
    createContext,
    isValidElement,
    useContext,
    useId,
    useMemo,
    useState,
    type ComponentProps,
    type FocusEvent as ReactFocusEvent,
    type MouseEventHandler,
    type PointerEvent as ReactPointerEvent,
    type ReactElement,
    type ReactNode,
} from 'react';

import { cn } from '@/lib/utils';

type TooltipProviderProps = {
    children: ReactNode;
    delayDuration?: number;
};

type TooltipContextValue = {
    contentId: string;
    open: boolean;
    setOpen: (nextOpen: boolean) => void;
};

const TooltipContext = createContext<TooltipContextValue | null>(null);

const useTooltipContext = (): TooltipContextValue => {
    const context = useContext(TooltipContext);

    if (!context) {
        throw new Error('Tooltip components must be wrapped in Tooltip.');
    }

    return context;
};

const callHandler = <T,>(
    handler: ((event: T) => void) | undefined,
    event: T,
): void => {
    handler?.(event);
};

export const TooltipProvider = ({
    children,
}: TooltipProviderProps): ReactElement => {
    return <>{children}</>;
};

export const Tooltip = ({
    children,
}: {
    children: ReactNode;
}): ReactElement => {
    const contentId = useId();
    const [open, setOpen] = useState(false);
    const value = useMemo(
        () => ({ contentId, open, setOpen }),
        [contentId, open],
    );

    return (
        <TooltipContext.Provider value={value}>
            {children}
        </TooltipContext.Provider>
    );
};

type TooltipTriggerProps = ComponentProps<'button'> & {
    asChild?: boolean;
    children: ReactNode;
};

export const TooltipTrigger = ({
    asChild,
    children,
    onBlur,
    onFocus,
    onMouseEnter,
    onMouseLeave,
    onPointerDown,
    'aria-describedby': ariaDescribedBy,
    ...props
}: TooltipTriggerProps): ReactElement => {
    const { contentId, open, setOpen } = useTooltipContext();
    const resolvedAriaDescribedBy = open
        ? [ariaDescribedBy, contentId].filter(Boolean).join(' ')
        : ariaDescribedBy;

    const handleMouseEnter: MouseEventHandler<HTMLElement> = (event) => {
        setOpen(true);
        callHandler(onMouseEnter as typeof handleMouseEnter | undefined, event);
    };

    const handleMouseLeave: MouseEventHandler<HTMLElement> = (event) => {
        setOpen(false);
        callHandler(onMouseLeave as typeof handleMouseLeave | undefined, event);
    };

    const triggerProps = {
        ...props,
        'aria-describedby':
            resolvedAriaDescribedBy && resolvedAriaDescribedBy.length > 0
                ? resolvedAriaDescribedBy
                : undefined,
        'data-slot': 'tooltip-trigger',
        onBlur: (event: ReactFocusEvent<HTMLElement>) => {
            setOpen(false);
            onBlur?.(event as ReactFocusEvent<HTMLButtonElement>);
        },
        onFocus: (event: ReactFocusEvent<HTMLElement>) => {
            setOpen(true);
            onFocus?.(event as ReactFocusEvent<HTMLButtonElement>);
        },
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
            setOpen(false);
            onPointerDown?.(event as ReactPointerEvent<HTMLButtonElement>);
        },
    };

    if (asChild && isValidElement(children)) {
        return cloneElement(
            children as ReactElement<Record<string, unknown>>,
            triggerProps,
        );
    }

    return <button {...triggerProps}>{children}</button>;
};

type TooltipContentProps = ComponentProps<'div'> & {
    sideOffset?: number;
};

export const TooltipContent = ({
    className,
    sideOffset = 0,
    ...props
}: TooltipContentProps): ReactElement | null => {
    const { contentId, open } = useTooltipContext();

    if (!open) {
        return null;
    }

    return (
        <div
            className={cn(
                'absolute right-0 top-full z-50 mt-2 w-fit rounded-md bg-foreground px-3 py-1.5 text-xs text-background shadow-lg',
                className,
            )}
            data-slot="tooltip-content"
            id={contentId}
            role="tooltip"
            style={{ marginTop: `${sideOffset + 8}px` }}
            {...props}
        />
    );
};
