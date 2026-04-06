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
    slug: Type.String(),
    createdAt: Type.String(),
});
export type CreatePollResponse = Static<typeof CreatePollResponseSchema>;

export const PollResponseSchema = Type.Object({
    id: Type.String(),
    slug: Type.String(),
    pollName: Type.String(),
    createdAt: Type.String(),
    choices: Type.Array(Type.String()),
    results: Type.Optional(Type.Record(Type.String(), Type.Number())),
    voters: Type.Array(Type.String()),
});
export type PollResponse = Static<typeof PollResponseSchema>;

export const MessageResponseSchema = Type.Object({
    message: Type.String(),
});
export type MessageResponse = Static<typeof MessageResponseSchema>;

export const HealthCheckResponseSchema = Type.Object({
    database: Type.Union([Type.Literal('Failed'), Type.Literal('OK')]),
    service: Type.Literal('OK'),
});
export type HealthCheckResponse = Static<typeof HealthCheckResponseSchema>;

export const VoteRequestSchema = Type.Object({
    votes: Type.Record(
        Type.String(),
        Type.Integer({ minimum: 1, maximum: 10 }),
    ),
    voterName: Type.String(),
});
export type VoteRequest = Static<typeof VoteRequestSchema>;

export const VoteResponseSchema = Type.String();
export type VoteResponse = Static<typeof VoteResponseSchema>;
