export const API_PREFIX = '/api';

export const POLL_ROUTES = {
    create: `${API_PREFIX}/polls/create`,
    healthCheck: `${API_PREFIX}/health-check`,
    poll: (pollRef: string): string => `${API_PREFIX}/polls/${pollRef}`,
    vote: (pollRef: string): string => `${API_PREFIX}/polls/${pollRef}/vote`,
} as const;
