const $ = (sel) => document.querySelector(sel);
const createBtn = $("#createBtn");
const joinBtn = $("#joinBtn");
const toast = $("#toast");
const editorArea = $("#editorArea")

let socket = new WebSocket('ws://localhost:5000/ws')

socket.onopen = () => console.log('WS opened')
socket.onclose = () => console.log('WS closed')
socket.onerror = (e) => console.error(e)
socket.onmessage = (event) => console.log(event.data)

editorArea.addEventListener("keyup", ({ target }) => {
    socket.send(target.value)
})

createBtn.addEventListener("click", async () => {
    const name = $("#docName").value.trim();

    if (!name) {
        showToast("Введіть назву документу");
        return;
    }

    // const fakeId = Math.random().toString(36).slice(2, 10);
    // const docUrl = `${location.origin}/documents/${fakeId}`;

    // showToast("Документ створено — перенаправлення...");
    // setTimeout(() => {
    //     location.href = docUrl;
    // }, 700);

    const res = await fetch('http://localhost:5000/documents', {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain',
        },
        body: name,
        mode: 'cors',
    })

    const documentId = await res.text()
});

joinBtn.addEventListener("click", () => {
    const url = $("#joinLink").value.trim();
    if (!url) {
        showToast("Вставте посилання або id документа");
        return;
    }
    try {
        const u = new URL(url, location.origin);
        showToast("Перенаправляємо...");
        setTimeout(() => {
            location.href = u.href;
        }, 350);
    } catch (e) {
        showToast("Неправильний URL");
    }
});

["#docName", "#joinLink"].forEach((sel) => {
    const el = document.querySelector(sel);
    el.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            if (sel === "#docName") createBtn.click();
            else joinBtn.click();
        }
    });
});

function showToast(msg, timeout = 2500) {
    toast.hidden = false;
    toast.textContent = msg;
    setTimeout(() => {
        toast.hidden = true;
    }, timeout);
}