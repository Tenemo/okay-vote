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
        <li className="surface-card space-y-4">
            <div className="space-y-1">
                <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                    {choiceName}
                </h2>
                <p className="field-note">Choose a score from 1 to 10.</p>
            </div>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                {scoreChoices.map((scoreChoice) => (
                    <Button
                        className="min-w-0 w-full rounded-xl px-0 normal-case text-base tracking-normal"
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
