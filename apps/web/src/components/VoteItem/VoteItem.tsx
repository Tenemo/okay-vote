import { type ReactElement } from 'react';

import { Button } from '@/components/ui/button';

type Props = {
    choiceName: string;
    onVote: (choiceName: string, score: number) => void;
    selectedScore?: number;
};

const scoreChoices = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const VoteItem = ({
    choiceName,
    onVote,
    selectedScore,
}: Props): ReactElement => {
    return (
        <li className="rounded-xl border border-border/70 bg-background/25 p-4 sm:p-5">
            <div className="space-y-1">
                <h3 className="text-lg font-semibold tracking-tight sm:text-xl">
                    {choiceName}
                </h3>
                <p className="field-note">Choose a score from 1 to 10.</p>
            </div>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                {scoreChoices.map((scoreChoice) => (
                    <Button
                        aria-pressed={scoreChoice === selectedScore}
                        className="h-11 w-full min-w-0 px-0 text-base"
                        key={scoreChoice}
                        onClick={() => onVote(choiceName, scoreChoice)}
                        size="default"
                        variant={
                            scoreChoice === selectedScore
                                ? 'default'
                                : 'outline'
                        }
                    >
                        {scoreChoice}
                    </Button>
                ))}
            </div>
        </li>
    );
};

export default VoteItem;
