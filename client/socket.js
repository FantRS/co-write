let socket = new WebSocket('ws://localhost:5000/ws')

socket.onopen = () => console.log('WS opened')
socket.onclose = () => console.log('WS closed')
socket.onerror = (e) => console.error(e)
socket.onmessage = (event) => console.log(event.data)

export default socket