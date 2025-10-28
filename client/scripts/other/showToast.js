export function showToast(message, duration = 2500) {
    const toast = document.getElementById("toast");
    if (!toast) {
        console.error("Toast element not found");
        return;
    }
    
    const messageElement = toast.querySelector(".toast-message");
    if (messageElement) {
        messageElement.textContent = message;
    } else {
        toast.textContent = message;
    }
    
    toast.hidden = false;

    setTimeout(() => {
        toast.hidden = true;
    }, duration);
}
