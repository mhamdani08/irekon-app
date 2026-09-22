function getApiUrl(): string {
  if (typeof window !== "undefined") {
    // Relative URL routes through Next.js rewrite proxy (SAME ORIGIN, 0 CORS issues)
    return "";
  }
  return process.env.INTERNAL_API_URL || "http://backend:8000";
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; message: string; data?: T; errors?: any[] }> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const baseUrl = getApiUrl();
    const res = await fetch(`${baseUrl}${endpoint}`, {
      cache: "no-store",
      ...options,
      headers,
    });

    let data: any;
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text || `HTTP ${res.status} ${res.statusText}` };
    }

    if (!res.ok) {
      if (res.status === 401 && typeof window !== "undefined" && !endpoint.includes("/auth/login")) {
        localStorage.removeItem("access_token");
        window.location.href = "/login";
      }
      throw new Error(data.message || `Terjadi kesalahan pada server (${res.status})`);
    }
    return data;
  } catch (error: any) {
    throw new Error(error.message || "Gagal menghubungkan ke server");
  }
}
