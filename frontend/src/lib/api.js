const BASE_URL = import.meta.env.VITE_API_URL || `${window.location.origin}/Barbeariav2/backend/api`;


function getToken() {
  return localStorage.getItem('auth_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Erro na resposta da API (status ${res.status})`);
  }

  if (!data.success) throw new Error(data.error || 'Erro na API');
  return data.data;
}

export const api = {
  get:    (path)       => request(path),
  post:   (path, body) => request(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (path, body) => request(path, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: (path)       => request(path, { method: 'DELETE' }),
};

export function setToken(token)  { localStorage.setItem('auth_token', token); }
export function clearToken()     { localStorage.removeItem('auth_token'); }
export function getAuthToken()   { return getToken(); }
