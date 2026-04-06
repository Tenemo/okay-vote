import { type ComponentPropsWithoutRef, type ReactElement } from 'react';

type IconProps = ComponentPropsWithoutRef<'svg'>;

const baseProps = {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 2,
    viewBox: '0 0 24 24',
};

const createIcon = (
    displayName: string,
    children: ReactElement | ReactElement[],
): ((props: IconProps) => ReactElement) => {
    const Icon = (props: IconProps): ReactElement => {
        const {
            'aria-hidden': ariaHidden,
            'aria-label': ariaLabel,
            'aria-labelledby': ariaLabelledBy,
            role,
            ...restProps
        } = props;
        const hasAccessibleName =
            ariaLabel !== undefined || ariaLabelledBy !== undefined;
        const resolvedAriaHidden =
            ariaHidden ?? (hasAccessibleName ? undefined : true);
        const resolvedRole = role ?? (hasAccessibleName ? 'img' : undefined);

        return (
            <svg
                {...baseProps}
                aria-hidden={resolvedAriaHidden}
                aria-label={ariaLabel}
                aria-labelledby={ariaLabelledBy}
                role={resolvedRole}
                {...restProps}
            >
                {children}
            </svg>
        );
    };

    Icon.displayName = displayName;

    return Icon;
};

export const Plus = createIcon(
    'Plus',
    <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
    </>,
);

export const Trash2 = createIcon(
    'Trash2',
    <>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
    </>,
);

export const Copy = createIcon(
    'Copy',
    <>
        <rect height="12" rx="2" width="10" x="9" y="9" />
        <path d="M7 15H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1" />
    </>,
);

export const RotateCw = createIcon(
    'RotateCw',
    <>
        <path d="M21 12a9 9 0 1 1-2.64-6.36" />
        <path d="M21 3v6h-6" />
    </>,
);

export const Trophy = createIcon(
    'Trophy',
    <>
        <path d="M8 21h8" />
        <path d="M12 17v4" />
        <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
        <path d="M17 5h3v1a4 4 0 0 1-4 4h-1" />
        <path d="M7 5H4v1a4 4 0 0 0 4 4h1" />
    </>,
);

export const Medal = createIcon(
    'Medal',
    <>
        <path d="M7 4h4l1 4-3 4-4-8Z" />
        <path d="M13 4h4l-4 8-3-4 1-4Z" />
        <circle cx="12" cy="17" r="4" />
        <path d="m12 15 1 2 2 .2-1.5 1.3.5 2-2-1.1-2 1.1.5-2L9 17.2l2-.2 1-2Z" />
    </>,
);

export const Loader2 = createIcon(
    'Loader2',
    <>
        <path d="M21 12a9 9 0 1 1-6.22-8.56" />
    </>,
);

export const XIcon = createIcon(
    'XIcon',
    <>
        <path d="m18 6-12 12" />
        <path d="m6 6 12 12" />
    </>,
);
