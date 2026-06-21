function serverUrl() {
    return "localhost:8080/api";
}

export function webSocketUrl(id, token) {
    return `ws://${serverUrl()}/ws/${id}?token=${encodeURIComponent(token)}`;
}

export function getSnapshotEndpoint() {
    return `http://${serverUrl()}/documents`;
}

export function getDocumentsEndpoint() {
    return `http://${serverUrl()}/documents`;
}

export function createDocEndpoint() {
    return `http://${serverUrl()}/documents/create`;
}

export function getDocumentTitleEndpoint(id) {
    return `http://${serverUrl()}/documents/${id}/title`;
}

export function getExecuteEndpoint(id) {
    return `http://${serverUrl()}/documents/${id}/execute`;
}

export function getTestEndpoint(id) {
    return `http://${serverUrl()}/documents/${id}/test`;
}

export function getFormatEndpoint(id) {
    return `http://${serverUrl()}/documents/${id}/format`;
}

export function getCompleteEndpoint(id) {
    return `http://${serverUrl()}/documents/${id}/complete`;
}

export function getHoverEndpoint(id) {
    return `http://${serverUrl()}/documents/${id}/hover`;
}

export function getMembersEndpoint(id) {
    return `http://${serverUrl()}/documents/${id}/members`;
}

export function removeMemberEndpoint(id, userId) {
    return `http://${serverUrl()}/documents/${id}/members/${userId}`;
}

export function getParticipantsEndpoint(id) {
    return `http://${serverUrl()}/documents/${id}/participants`;
}

export function getExportEndpoint(id) {
    return `http://${serverUrl()}/documents/${id}/export`;
}

export function authRegisterEndpoint() {
    return `http://${serverUrl()}/auth/register`;
}

export function authLoginEndpoint() {
    return `http://${serverUrl()}/auth/login`;
}
