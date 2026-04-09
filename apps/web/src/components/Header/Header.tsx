import { type ReactElement } from 'react';
import { SiGithub } from '@icons-pack/react-simple-icons';
import { Link } from 'react-router-dom';

const Header = (): ReactElement => {
    return (
        <header className="relative border-b border-border/70 bg-background">
            <div className="mx-auto flex w-full max-w-4xl items-center px-4 py-4 pr-14 sm:px-6 sm:pr-16">
                <Link
                    className="text-2xl font-semibold tracking-tight text-foreground no-underline sm:text-[2rem]"
                    to="/"
                >
                    okay.vote
                </Link>
            </div>
            <a
                aria-label="Open the okay.vote repository on GitHub"
                className="absolute top-1/2 right-4 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-[var(--radius-md)] text-muted-foreground transition-[color,background-color] hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:right-6"
                href="https://github.com/Tenemo/okay-vote"
            >
                <SiGithub className="size-[18px]" />
            </a>
        </header>
    );
};

export default Header;
