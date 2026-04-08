import { type ReactElement } from 'react';
import { SiGithub } from '@icons-pack/react-simple-icons';
import { Link } from 'react-router-dom';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const Header = (): ReactElement => {
    return (
        <header className="border-b border-border/70 bg-background">
            <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
                <Link
                    className="text-2xl font-semibold tracking-tight text-foreground no-underline sm:text-[2rem]"
                    to="/"
                >
                    okay.vote
                </Link>
                <a
                    aria-label="Open the okay.vote repository on GitHub"
                    className={cn(
                        buttonVariants({
                            size: 'icon-lg',
                            variant: 'secondary',
                        }),
                    )}
                    href="https://github.com/Tenemo/okay-vote"
                >
                    <SiGithub className="size-4" />
                </a>
            </div>
        </header>
    );
};

export default Header;
