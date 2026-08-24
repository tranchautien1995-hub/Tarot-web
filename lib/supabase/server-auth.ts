import { createClient, type User } from "@supabase/supabase-js";

export function isServerAuthConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

type AuthResult =
  | { ok: true; user: User | null; localMode: boolean }
  | { ok: false; error: string; status: number };

export async function verifyApiUser(request: Request): Promise<AuthResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Local development stays usable until Supabase is configured.
  if (!url || !key) {
    return { ok: true, user: null, localMode: true };
  }

  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

  if (!token) {
    return { ok: false, error: "Bạn cần đăng nhập để sử dụng AI.", status: 401 };
  }

  const supabase = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return { ok: false, error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", status: 401 };
  }

  return { ok: true, user: data.user, localMode: false };
}
