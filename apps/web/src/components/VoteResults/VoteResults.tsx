import { type ReactElement } from 'react';

import type { PollResponse } from '@okay-vote/contracts';
import { Medal, Trophy } from '@/components/ui/icons';

type Props = {
    results: NonNullable<PollResponse['results']>;
};

export const VoteResults = ({ results }: Props): ReactElement => {
    const sortedResults = Object.entries(results);

    sortedResults.sort((a, b) => b[1] - a[1]);

    return (
        <section className="surface-card space-y-5">
            <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">
                    Results
                </h2>
                <p className="field-note">
                    Ranked by the geometric mean of the submitted scores.
                </p>
            </div>
            <ul className="grid gap-3">
                {sortedResults.map(([choiceName, score], index) => (
                    <li
                        className="flex items-center gap-4 rounded-xl border border-border/70 bg-background/35 px-4 py-3"
                        key={choiceName}
                    >
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent">
                            {index === 0 && (
                                <Trophy
                                    aria-label="Winner"
                                    className="size-6"
                                />
                            )}
                            {(index === 1 || index === 2) && (
                                <Medal
                                    aria-label={
                                        index === 1
                                            ? 'Runner-up'
                                            : 'Third place'
                                    }
                                    className="size-6"
                                />
                            )}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                            <span className="text-base font-semibold">
                                {choiceName}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                Score: {score}
                            </span>
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default VoteResults;
