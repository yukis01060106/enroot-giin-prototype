import { supabase, isSupabaseConfigured } from "@/lib/supabase";

/**
 * Google Cloud Text-to-Speech（日本語Neural2、無料枠あり）をSupabase Edge
 * Function経由で呼ぶ。ANTHROPIC_API_KEY同様、GOOGLE_TTS_API_KEYもクライアント
 * には一切渡さない（supabase/functions/tts/index.ts参照）。
 *
 * Supabase未設定・Edge Function未デプロイ・APIキー未設定の場合は例外を投げる。
 * 呼び出し側（useSpeakingCharacter）でブラウザ標準TTSにフォールバックする。
 */
export async function synthesizeSpeech(text: string): Promise<string> {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured");

  const { data, error } = await supabase.functions.invoke("tts", {
    body: { text },
  });
  if (error) throw error;
  if (!data?.audioContent || typeof data.audioContent !== "string") {
    throw new Error(`tts returned no audioContent: ${JSON.stringify(data)}`);
  }
  return `data:audio/mp3;base64,${data.audioContent}`;
}
