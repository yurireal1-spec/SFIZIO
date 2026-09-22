const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace(/\/+$/, '');
export const API_BASE_URL = rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl}/api/v1`;

class ApiService {
  private getHeaders() {
    return {
      'Content-Type': 'application/json',
    };
  }

  async get(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include',
    });
    return this.handleResponse(response);
  }

  async post(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async put(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async patch(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async delete(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      credentials: 'include',
    });
    return this.handleResponse(response);
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') {
          window.location.href = '/admin/login';
        }
      }
      const error = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
      
      let errorMessage = 'Erro na requisição';
      if (Array.isArray(error.detail)) {
        // FastAPI 422 validation errors
        errorMessage = error.detail.map((err: any) => `${err.loc[err.loc.length - 1]}: ${err.msg}`).join(', ');
      } else if (error.detail) {
        errorMessage = typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail);
      }
      
      throw new Error(errorMessage);
    }
    if (response.status === 204) return null;
    return response.json();
  }
}

export const api = new ApiService();
