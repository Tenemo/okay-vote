import { type ReactElement } from 'react';

import { Panel } from '@/components/ui/panel';

type ParticipantsPanelProps = {
    voters: string[];
};

const ParticipantsPanel = ({
    voters,
}: ParticipantsPanelProps): ReactElement => {
    return (
        <Panel padding="compact" tone="subtle">
            <h2 className="text-lg font-semibold tracking-tight">
                Participants
            </h2>
            {voters.length ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                    {voters.map((voterName) => (
                        <li key={voterName}>
                            <span className="inline-flex max-w-full rounded-[var(--radius-md)] border border-border bg-card px-3 py-2 text-sm leading-6 text-foreground break-words">
                                {voterName}
                            </span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="mt-2 text-sm leading-7 text-secondary">
                    No voters yet.
                </p>
            )}
        </Panel>
    );
};

export default ParticipantsPanel;
