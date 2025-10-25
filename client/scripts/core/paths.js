function serverUrl() {
    return "localhost:5000";
}

export function webSocketUrl() {
    return `ws://${serverUrl()}/ws`;
}

export function getSnapshotEndpoint() {
    return `http://${serverUrl()}/documents`;
}

export function createDocEndpoint() {
    return `http://${serverUrl()}/documents/create`;
}
