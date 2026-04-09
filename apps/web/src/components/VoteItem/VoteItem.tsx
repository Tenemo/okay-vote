import { type ReactElement } from 'react';

type Props = {
    choiceName: string;
    choiceIndex: number;
    onVote: (choiceName: string, score: number) => void;
    selectedScore?: number;
};

const scoreChoices = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const scoreOptionClasses =
    'flex h-11 w-full min-w-0 cursor-pointer items-center justify-center rounded-[var(--radius-md)] border border-border bg-background px-0 text-base font-medium text-foreground transition-[color,background-color,border-color,box-shadow] [@media(hover:hover)]:hover:border-border [@media(hover:hover)]:hover:bg-accent [@media(hover:hover)]:hover:text-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-foreground/55 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background peer-checked:border-white peer-checked:bg-white peer-checked:text-black';

export const VoteItem = ({
    choiceName,
    choiceIndex,
    onVote,
    selectedScore,
}: Props): ReactElement => {
    const groupName = `choice-${choiceIndex}`;

    return (
        <li className="rounded-[var(--radius-lg)] border border-border/70 bg-accent p-4 sm:p-5">
            <fieldset className="grid gap-4">
                <legend className="max-w-full">
                    <span className="block max-w-full text-lg font-semibold tracking-tight whitespace-normal [overflow-wrap:anywhere] sm:text-xl">
                        {choiceName}
                    </span>
                </legend>
                <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                    {scoreChoices.map((scoreChoice) => {
                        const inputId = `${groupName}-score-${scoreChoice}`;

                        return (
                            <div className="min-w-0" key={scoreChoice}>
                                <input
                                    checked={scoreChoice === selectedScore}
                                    className="peer sr-only"
                                    id={inputId}
                                    name={groupName}
                                    onChange={() =>
                                        onVote(choiceName, scoreChoice)
                                    }
                                    type="radio"
                                    value={scoreChoice}
                                />
                                <label
                                    className={scoreOptionClasses}
                                    htmlFor={inputId}
                                >
                                    {scoreChoice}
                                </label>
                            </div>
                        );
                    })}
                </div>
            </fieldset>
        </li>
    );
};

export default VoteItem;
