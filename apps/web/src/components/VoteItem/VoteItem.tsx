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
        <li className="mb-6 flex flex-col">
            <span className="block text-lg font-semibold">{choiceName}</span>
            <div className="flex flex-wrap">
                {scoreChoices.map((scoreChoice) => (
                    <Button
                        className="m-1 px-2 py-1 text-sm"
                        key={scoreChoice}
                        onClick={() => onVote(choiceName, scoreChoice)}
                        size="sm"
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
