import { websocket_url } from "./paths.js";

let socket = new WebSocket(websocket_url());
export default socket;
