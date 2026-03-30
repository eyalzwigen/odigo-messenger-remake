let host: string = 'http://localhost:8080';

export function setHost(url: string) {
    host = url;
}

export function getHost() {
    return host;
}