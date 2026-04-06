import { randomUUID } from 'node:crypto';

export const pollIdGenerator = {
    generate: (): string => randomUUID(),
};

export const generatePollId = (): string => pollIdGenerator.generate();
