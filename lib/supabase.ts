import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * anonキーはRLSで保護される前提の公開値なのでクライアント同梱で問題ない
 * （Flutter版と同じ判断）。ANTHROPIC_API_KEY等の秘密鍵はここでは一切扱わず、
 * secretary-chat Edge Function側だけが持つ。
 *
 * SUPABASE_URLが未設定（プロジェクト未プロビジョニング）の場合でもアプリ自体は
 * クラッシュさせず、呼び出し側（secretaryService等）でtry/catchしてモック応答に
 * フォールバックする。
 */
export const supabase = createClient(url || "https://placeholder.supabase.co", anonKey || "placeholder");

export const isSupabaseConfigured = url.length > 0 && anonKey.length > 0;
