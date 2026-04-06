export const API_PREFIX = '/api';

export const POLL_ROUTES = {
    create: `${API_PREFIX}/polls/create`,
    healthCheck: `${API_PREFIX}/health-check`,
    poll: (pollId: string): string => `${API_PREFIX}/polls/${pollId}`,
    vote: (pollId: string): string => `${API_PREFIX}/polls/${pollId}/vote`,
} as const;
