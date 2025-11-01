function serverUrl() {
    return "localhost:8080/api";
}

export function webSocketUrl(id) {
    return `ws://${serverUrl()}/ws/${id}`;
}

export function getSnapshotEndpoint() {
    return `http://${serverUrl()}/documents`;
}

export function createDocEndpoint() {
    return `http://${serverUrl()}/documents/create`;
}

export function getDocumentTitleEndpoint(id) {
    return `http://${serverUrl()}/documents/${id}/title`;
}
