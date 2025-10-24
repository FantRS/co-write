function server_url() {
    return "localhost:5000";
}

export function websocket_url() {
    return `ws://${server_url()}/ws`;
}

export function get_snap_ep() {
    return `http://${server_url()}/documents`;
}

export function create_doc_ep() {
    return `http://${server_url()}/documents/create`;
}
