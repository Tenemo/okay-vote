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
        <div className="mt-4 flex flex-col items-center rounded-[4px] bg-accent p-2">
            <h2 className="px-4 py-2 text-2xl font-normal leading-[1.334]">
                Results
            </h2>
            <ul className="w-full">
                {sortedResults.map(([choiceName, score], index) => (
                    <li
                        className="flex items-start gap-4 py-2"
                        key={choiceName}
                    >
                        <span className="flex min-h-6 min-w-10 items-center justify-center">
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
                        <span className="flex flex-col">
                            <span className="font-medium">{choiceName}</span>
                            <span className="text-sm text-muted-foreground">
                                Score: {score}
                            </span>
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default VoteResults;
