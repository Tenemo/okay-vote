const DEFAULT_API_PROXY_TARGET = 'http://127.0.0.1:4000';

export const normalizeApiBaseUrl = (baseUrl: string): string =>
    baseUrl.replace(/\/+$/, '').replace(/\/api$/, '');

export const shouldUseProxyApiBaseUrl = (hostname: string): boolean =>
    hostname === 'okay.vote' ||
    hostname === 'www.okay.vote' ||
    hostname.endsWith('.netlify.app');

export const resolveApiBaseUrl = (
    configuredApiBaseUrl: string | undefined,
    hostname?: string,
): string => {
    const trimmedApiBaseUrl = configuredApiBaseUrl?.trim();

    if (hostname && shouldUseProxyApiBaseUrl(hostname)) {
        return '/';
    }

    return trimmedApiBaseUrl
        ? normalizeApiBaseUrl(trimmedApiBaseUrl) || '/'
        : '/';
};

export const resolveApiProxyTarget = (
    configuredApiBaseUrl: string | undefined,
): string => {
    const trimmedApiBaseUrl = configuredApiBaseUrl?.trim();

    if (!trimmedApiBaseUrl) {
        return DEFAULT_API_PROXY_TARGET;
    }

    try {
        const parsedApiBaseUrl = new URL(trimmedApiBaseUrl);
        const normalizedPathname = parsedApiBaseUrl.pathname
            .replace(/\/+$/, '')
            .replace(/\/api$/, '');

        return `${parsedApiBaseUrl.origin}${normalizedPathname}`;
    } catch {
        return DEFAULT_API_PROXY_TARGET;
    }
};
