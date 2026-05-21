const DEFAULT_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

export function normalizeOrigin(origin?: string): string | null {
    if (!origin) return null;

    try {
        return new URL(origin).origin;
    } catch {
        return null;
    }
}

function stripQuotes(value: string): string {
    return value.trim().replace(/^['\"]|['\"]$/g, '');
}

function parseOriginValues(rawValue?: string): string[] {
    if (!rawValue) return [];

    return rawValue
        .split(/[|,\n]/)
        .map(stripQuotes)
        .filter(Boolean);
}

function isPrivateIpv4(hostname: string): boolean {
    const match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (!match) return false;

    const octets = match.slice(1).map((part) => Number(part));
    if (octets.some((num) => Number.isNaN(num) || num < 0 || num > 255)) return false;

    const [a, b] = octets;
    if (a === 10) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    return false;
}

function shouldAllowLanOrigins(): boolean {
    const fromEnv = process.env.ALLOW_LAN_ORIGINS;
    if (fromEnv) {
        return fromEnv.toLowerCase() === 'true';
    }
    return process.env.NODE_ENV !== 'production';
}

function isLanOrigin(origin: string): boolean {
    try {
        const parsed = new URL(origin);
        if (!['http:', 'https:'].includes(parsed.protocol)) return false;
        return isPrivateIpv4(parsed.hostname);
    } catch {
        return false;
    }
}

export function getAllowedOrigins(): string[] {
    const configuredOrigins = [
        ...parseOriginValues(process.env.FRONTEND_URL),
        ...parseOriginValues(process.env.FRONTEND_URLS),
    ]
        .map((origin) => normalizeOrigin(origin))
        .filter((origin): origin is string => !!origin);

    return Array.from(new Set([...DEFAULT_ORIGINS, ...configuredOrigins]))
        .map((origin) => normalizeOrigin(origin))
        .filter((origin): origin is string => !!origin);
}

export function isAllowedOrigin(origin?: string): boolean {
    const normalizedOrigin = normalizeOrigin(origin);
    if (!origin || !normalizedOrigin) return !origin;

    const allowedOrigins = getAllowedOrigins();
    if (allowedOrigins.includes(normalizedOrigin)) return true;

    return shouldAllowLanOrigins() && isLanOrigin(normalizedOrigin);
}
