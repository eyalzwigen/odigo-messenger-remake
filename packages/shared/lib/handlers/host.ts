// Manages the base URL of the Express server so all HTTP and Socket.IO
// requests in the shared library point to the right host.
//
// The host is set once at startup by each app that uses this library
// (web client, browser extension) and then read wherever a request is made.

/** Module-level host string, defaults to localhost for development */
let host: string = 'http://localhost:8080';

/**
 * Overrides the default host URL.
 * Call this once at application startup, before any requests are made.
 *
 * @param url - The base URL of the Express server (e.g. "https://api.example.com")
 */
export function setHost(url: string) {
    host = url;
}

/**
 * Returns the currently configured host URL.
 * Used by all handler functions that need to build a request URL.
 *
 * @returns The base server URL string
 */
export function getHost() {
    return host;
}
