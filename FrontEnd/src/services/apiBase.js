const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

function stripTrailingSlash(value) {
    return value.replace(/\/+$/, '');
}

function normalizeConfiguredUrl(rawValue) {
    const value = (rawValue || '').trim();
    if (!value) return null;

    try {
        const parsed = new URL(value);
        return stripTrailingSlash(parsed.toString());
    } catch {
        return null;
    }
}

export function getApiBaseUrl() {
    const configuredUrl = normalizeConfiguredUrl(import.meta.env.VITE_API_URL);

    if (!configuredUrl) {
        const protocol = window.location.protocol || 'http:';
        const host = window.location.hostname || 'localhost';
        return `${protocol}//${host}:4000`;
    }

    try {
        const parsed = new URL(configuredUrl);
        const browserHost = window.location.hostname;

        if (LOCAL_HOSTS.has(parsed.hostname) && browserHost && !LOCAL_HOSTS.has(browserHost)) {
            parsed.hostname = browserHost;
            return stripTrailingSlash(parsed.toString());
        }

        return stripTrailingSlash(parsed.toString());
    } catch {
        return configuredUrl;
    }
}
