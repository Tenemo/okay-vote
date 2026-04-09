import { type ReactElement } from 'react';

import type { PollResponse } from '@okay-vote/contracts';
import { Medal, Trophy } from '@/components/ui/icons';
import { Panel } from '@/components/ui/panel';

type Props = {
    results: NonNullable<PollResponse['results']>;
};

const VoteResults = ({ results }: Props): ReactElement => {
    const sortedResults = Object.entries(results);

    sortedResults.sort((a, b) => b[1] - a[1]);

    return (
        <Panel className="space-y-5">
            <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">
                    Results
                </h2>
                <p className="field-note">
                    Ranked by the geometric mean of the submitted scores.
                </p>
            </div>
            {sortedResults.length === 0 ? (
                <p className="empty-state">
                    No votes were submitted before this poll ended.
                </p>
            ) : (
                <ol className="space-y-3">
                    {sortedResults.map(([choiceName, score], index) => (
                        <li
                            className="flex items-start gap-4 rounded-[var(--radius-md)] border border-border bg-card px-4 py-4"
                            key={choiceName}
                        >
                            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center text-foreground">
                                {index === 0 && (
                                    <Trophy
                                        aria-label="Winner"
                                        className="size-5"
                                    />
                                )}
                                {(index === 1 || index === 2) && (
                                    <Medal
                                        aria-label={
                                            index === 1
                                                ? 'Runner-up'
                                                : 'Third place'
                                        }
                                        className="size-5"
                                    />
                                )}
                                {index > 2 && (
                                    <span
                                        aria-hidden="true"
                                        className="size-5"
                                    />
                                )}
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col">
                                <span className="text-base font-medium [overflow-wrap:anywhere]">
                                    {choiceName}
                                </span>
                                <span className="text-sm leading-6 text-secondary">
                                    Score: {score}
                                </span>
                            </span>
                        </li>
                    ))}
                </ol>
            )}
        </Panel>
    );
};

export default VoteResults;
