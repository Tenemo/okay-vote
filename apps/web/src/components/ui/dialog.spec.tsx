import { fireEvent, render, screen } from '@testing-library/react';
import { useState, type ReactElement } from 'react';

import { Dialog, DialogContent, DialogTitle } from './dialog';

type DialogHarnessProps = {
    onPointerDownOutside?: (event: PointerEvent) => void;
};

const DialogHarness = ({
    onPointerDownOutside,
}: DialogHarnessProps): ReactElement => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button onClick={() => setOpen(true)} type="button">
                Open dialog
            </button>
            <Dialog onOpenChange={setOpen} open={open}>
                <DialogContent onPointerDownOutside={onPointerDownOutside}>
                    <DialogTitle>Dialog title</DialogTitle>
                    <button type="button">First action</button>
                    <button type="button">Second action</button>
                </DialogContent>
            </Dialog>
        </>
    );
};

describe('DialogContent', () => {
    test('focuses the first dialog control on open and restores focus on close', () => {
        render(<DialogHarness />);

        const openButton = screen.getByRole('button', {
            name: 'Open dialog',
        });

        openButton.focus();
        fireEvent.click(openButton);

        const firstAction = screen.getByRole('button', {
            name: 'First action',
        });

        expect(firstAction).toHaveFocus();

        fireEvent.keyDown(document, { key: 'Escape' });

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(openButton).toHaveFocus();
    });

    test('traps tab navigation within the dialog', () => {
        render(<DialogHarness />);

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Open dialog',
            }),
        );

        const firstAction = screen.getByRole('button', {
            name: 'First action',
        });
        const secondAction = screen.getByRole('button', {
            name: 'Second action',
        });

        secondAction.focus();
        fireEvent.keyDown(document, { key: 'Tab' });

        expect(firstAction).toHaveFocus();

        firstAction.focus();
        fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });

        expect(secondAction).toHaveFocus();
    });

    test('handles pointerdown outside interactions and can prevent closing', () => {
        const onPointerDownOutside = vi.fn((event: PointerEvent) =>
            event.preventDefault(),
        );

        render(<DialogHarness onPointerDownOutside={onPointerDownOutside} />);

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Open dialog',
            }),
        );

        fireEvent.pointerDown(document.body);

        expect(onPointerDownOutside).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
});
