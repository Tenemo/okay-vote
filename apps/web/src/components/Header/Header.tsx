import { type ReactElement } from 'react';
import { SiGithub } from '@icons-pack/react-simple-icons';
import { Link } from 'react-router-dom';

export const Header = (): ReactElement => {
    return (
        <header className="flex items-center justify-between border-b border-foreground p-2">
            <Link
                className="text-[2.125rem] leading-[1.235] font-normal tracking-[0.00735em] no-underline"
                to="/"
            >
                okay.vote
            </Link>
            <a
                aria-label="Open the okay.vote repository on GitHub"
                className="cursor-pointer pt-1.5 leading-none"
                href="https://github.com/Tenemo/okay-vote"
            >
                <SiGithub className="size-6" />
            </a>
        </header>
    );
};

export default Header;
