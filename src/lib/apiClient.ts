let envApiUrl = import.meta.env.VITE_API_URL;
if (envApiUrl && !envApiUrl.startsWith('http') && !envApiUrl.startsWith('/')) {
  envApiUrl = '/' + envApiUrl;
}
const API_URL = envApiUrl || (import.meta.env.PROD ? '/api/v1' : 'http://localhost:3001/api/v1');

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('sigt_auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('sigt_auth_token');
  }

  getToken() {
    if (!this.token) {
      this.token = localStorage.getItem('sigt_auth_token');
    }
    return this.token;
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    
    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      credentials: 'omit', // JWT via header ao invés de cookie pra simplificar MVP
    });

    if (res.status === 401) {
      // No futuro podemos implementar refresh token flow aqui
      this.clearToken();
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/cadastro') {
        window.location.href = '/login';
      }
      throw new Error('Session expired');
    }

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || 'API Error');
    }

    // Retorna vazio se não for JSON
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return res.json();
    }
    
    return {} as T;
  }

  get<T>(path: string, options?: RequestInit) {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  post<T>(path: string, body: any, options?: RequestInit) {
    return this.request<T>(path, { ...options, method: 'POST', body: JSON.stringify(body) });
  }

  put<T>(path: string, body: any, options?: RequestInit) {
    return this.request<T>(path, { ...options, method: 'PUT', body: JSON.stringify(body) });
  }

  patch<T>(path: string, body: any, options?: RequestInit) {
    return this.request<T>(path, { ...options, method: 'PATCH', body: JSON.stringify(body) });
  }

  delete<T>(path: string, options?: RequestInit) {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }

  upload<T>(path: string, formData: FormData, options?: RequestInit) {
    // Para FormData, NÃO podemos forçar application/json. O fetch define automaticamente o multipart/form-data + boundary
    const headers = new Headers(options?.headers);
    if (headers.has('Content-Type')) {
      headers.delete('Content-Type');
    }

    const token = this.getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return fetch(`${API_URL}${path}`, {
      ...options,
      method: 'POST',
      headers,
      body: formData,
      credentials: 'omit',
    }).then(async (res) => {
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'API Error');
      }
      return res.json() as Promise<T>;
    });
  }

  async download(path: string, options?: RequestInit): Promise<{ blob: Blob; filename: string | null }> {
    const headers = new Headers(options?.headers);
    const token = this.getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      method: 'GET',
      headers,
      credentials: 'omit',
    });

    if (res.status === 401) {
      this.clearToken();
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/cadastro') {
        window.location.href = '/login';
      }
      throw new Error('Session expired');
    }

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || 'API Error');
    }

    const disposition = res.headers.get('content-disposition') || '';
    const match = disposition.match(/filename="?([^"]+)"?/i);
    return {
      blob: await res.blob(),
      filename: match?.[1] ? decodeURIComponent(match[1]) : null,
    };
  }
}

export const api = new ApiClient();
