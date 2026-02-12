
/**
 * universal backend URL resolution.
 * This helper determines the backend URL dynamically based on the current window location.
 * This allows the app to work seamlessly on localhost, network IPs (for mobile testing), and tunnels.
 */

// If VITE_BACKEND_SERVER_URL is explicitly set in .env, it takes precedence.
// Otherwise, we derive it from the window.location.
const getBackendUrl = (): string => {
    const envUrl = import.meta.env.VITE_BACKEND_SERVER_URL;

    // If env var is set and not empty, use it.
    if (envUrl && envUrl.trim() !== '') {
        return envUrl;
    }

    // Check if we are in a browser environment
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;

        // If we are on a network IP or localhost, assume backend is on the same host at port 8998.
        // This works for:
        // - localhost:5173 -> localhost:8998
        // - 192.168.1.x:5173 -> 192.168.1.x:8998
        // - 10.x.x.x:5173 -> 10.x.x.x:8998
        return `${protocol}//${hostname}:8998/`;
    }

    // Fallback default
    return "http://localhost:8998/";
}

export const BACKEND_SERVER_URL = getBackendUrl();
