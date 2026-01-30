const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const apiFetch = (url: string, options: RequestInit = {}) => {
    const headers: any = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };

    if (options.body instanceof FormData) {
        delete headers["Content-Type"];
    }

    return fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
    });
};

export default API_BASE_URL;
