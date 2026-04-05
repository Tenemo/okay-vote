import { Static, Type } from '@sinclair/typebox';

export const CreatePollRequestSchema = Type.Object({
    choices: Type.Array(Type.String()),
    pollName: Type.String(),
});
export type CreatePollRequest = Static<typeof CreatePollRequestSchema>;

export const CreatePollResponseSchema = Type.Object({
    pollName: Type.String(),
    choices: Type.Array(Type.String()),
    id: Type.String(),
    createdAt: Type.String(),
});
export type CreatePollResponse = Static<typeof CreatePollResponseSchema>;

export const PollResponseSchema = Type.Object({
    pollName: Type.String(),
    createdAt: Type.String(),
    choices: Type.Array(Type.String()),
    results: Type.Optional(Type.Record(Type.String(), Type.Number())),
    voters: Type.Array(Type.String()),
});
export type PollResponse = Static<typeof PollResponseSchema>;

export const VoteRequestSchema = Type.Object({
    votes: Type.Record(Type.String(), Type.Number()),
    voterName: Type.String(),
});
export type VoteRequest = Static<typeof VoteRequestSchema>;

export const VoteResponseSchema = Type.String();
export type VoteResponse = Static<typeof VoteResponseSchema>;
