import { type ReactElement } from 'react';
import { SiGithub } from '@icons-pack/react-simple-icons';

export const Header = (): ReactElement => {
    return (
        <header className="flex items-center justify-between border-b border-foreground p-2">
            <a className="text-3xl no-underline" href="/">
                okay.vote
            </a>
            <a
                aria-label="Open the okay.vote repository on GitHub"
                className="cursor-pointer pt-1.5"
                href="https://github.com/Tenemo/okay-vote"
            >
                <SiGithub className="size-5" />
            </a>
        </header>
    );
};

export default Header;
