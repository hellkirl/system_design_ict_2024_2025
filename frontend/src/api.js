export const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

export async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload/`, {
        method: 'POST',
        body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
}

export async function getStatus(fileId) {
    const res = await fetch(`${API_BASE}/status/${fileId}`);
    if (!res.ok) throw new Error('Status fetch failed');
    return res.json();
}

export async function getResults(fileId) {
    const res = await fetch(`${API_BASE}/results/${fileId}`);
    if (!res.ok) throw new Error('Results fetch failed');
    return res.json();
}
