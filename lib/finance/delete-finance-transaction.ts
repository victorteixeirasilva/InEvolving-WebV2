import { API_BASE_URL } from "@/lib/constants";

const BASE = "/auth/api/finance/transaction";

export type DeleteFinanceTransactionResult =
  | { kind: "ok" }
  | { kind: "ok_no_body" }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number };

/**
 * DELETE `{API_BASE_URL}/auth/api/finance/transaction/{idTransacao}`. Bearer token.
 */
export async function deleteFinanceTransaction(
  jwtToken: string,
  transactionId: string
): Promise<DeleteFinanceTransactionResult> {
  const id = encodeURIComponent(transactionId.trim());
  if (!id) {
    return { kind: "http_error", status: 400 };
  }

  const base = API_BASE_URL.replace(/\/$/, "");
  const url = `${base}${BASE}/${id}`;

  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
    });

    try {
      await res.text();
    } catch {
      /* ignore */
    }

    if (res.status === 401) {
      return { kind: "unauthorized" };
    }

    if (res.status === 403 || res.status === 404) {
      return { kind: "http_error", status: res.status };
    }

    if (res.ok) {
      if (res.status === 204) {
        return { kind: "ok_no_body" };
      }
      return { kind: "ok" };
    }

    if (res.status >= 500) {
      return { kind: "http_error", status: res.status };
    }

    return { kind: "http_error", status: res.status };
  } catch {
    return { kind: "network_error" };
  }
}
