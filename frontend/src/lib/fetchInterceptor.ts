
let isRefreshing = false;
let failedRequestsQueue: { resolve: (token: string) => void; reject: (err: any) => void; }[] = [];

const originalFetch = window.fetch;

const processQueue = (error: any, token: string | null = null) => {
    failedRequestsQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token as string);
        }
    });
    failedRequestsQueue = [];
};

export const setupFetchInterceptor = () => {
    window.fetch = async (input, init) => {
        const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : input.toString());

        // Skip auth requests to avoid loops
        if (url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/register')) {
            return originalFetch(input, init);
        }

        let response = await originalFetch(input, init);

        if (response.status === 401) {
            if (isRefreshing) {
                return new Promise<string>((resolve, reject) => {
                    failedRequestsQueue.push({ resolve, reject });
                }).then(token => {
                    // Retry with new token
                    const newInit = { ...init } as RequestInit;
                    const headers = new Headers(newInit.headers || {});
                    headers.set('Authorization', `Bearer ${token}`);
                    newInit.headers = headers;
                    return originalFetch(input, newInit);
                });
            }

            isRefreshing = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    throw new Error("No refresh token");
                }

                // Call refresh endpoint
                const refreshResponse = await originalFetch('/api/auth/refresh', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken })
                });

                if (refreshResponse.ok) {
                    const data = await refreshResponse.json();
                    const newAccessToken = data.accessToken;
                    localStorage.setItem('token', newAccessToken);

                    processQueue(null, newAccessToken);

                    // Retry original request
                    const newInit = { ...init } as RequestInit;
                    const headers = new Headers(newInit.headers || {});
                    headers.set('Authorization', `Bearer ${newAccessToken}`);
                    newInit.headers = headers;

                    return originalFetch(input, newInit);
                } else {
                    throw new Error("Refresh failed");
                }

            } catch (error) {
                processQueue(error, null);
                // Logout logic
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('hrms_user');
                window.location.href = '/login';
                return Promise.reject(error);
            } finally {
                isRefreshing = false;
            }
        }

        return response;
    };
};
