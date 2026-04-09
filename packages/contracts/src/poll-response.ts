import { Value } from '@sinclair/typebox/value';

import { PollResponseSchema, type PollResponse } from './polls';

export const isPollResponse = (value: unknown): value is PollResponse =>
    Value.Check(PollResponseSchema, value);
