export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      credentials: "include",
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch (e) {
    const reason = e instanceof Error ? e.message : "network";
    throw new ApiError(
      reason === "Failed to fetch" || reason === "Load failed" ? "network" : `network: ${reason}`,
      0,
      "network"
    );
  }

  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");

  if (!res.ok) {
    if (isJson) {
      const err = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (err.error) throw new ApiError(err.error, res.status, err.error);
      if (err.message) throw new ApiError(err.message, res.status);
    } else {
      const text = (await res.text().catch(() => "")).slice(0, 200);
      throw new ApiError(text || res.statusText || "http", res.status);
    }
    throw new ApiError(res.statusText || "http", res.status);
  }

  if (!isJson) {
    const text = (await res.text().catch(() => "")).slice(0, 120);
    throw new ApiError(
      `Ожидали JSON, получено: ${text || "(пусто)"} — обнови страницу (Ctrl+Shift+R)`,
      res.status
    );
  }

  return res.json() as Promise<T>;
}
