export function showToast(message, duration = 2500) {
    toast.textContent = message;
    toast.hidden = false;

    setTimeout(() => {
        toast.hidden = true;
    }, duration);
}
