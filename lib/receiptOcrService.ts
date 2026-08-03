import { supabase, isSupabaseConfigured } from "@/lib/supabase";

/**
 * レシート画像をGoogle Cloud Vision（OCR）に投げて、写っている文字をそのまま
 * 返す。GOOGLE_VISION_API_KEYはクライアントには一切渡さない
 * （supabase/functions/receipt-ocr/index.ts参照）。
 *
 * Supabase未設定・Edge Function未デプロイ・APIキー未設定の場合は例外を投げる。
 * 呼び出し側（scan/page.tsx）でモックの読み取り結果にフォールバックする。
 */
export async function extractReceiptText(imageBase64: string): Promise<string> {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured");

  const { data, error } = await supabase.functions.invoke("receipt-ocr", {
    body: { imageBase64 },
  });
  if (error) throw error;
  if (typeof data?.text !== "string") {
    throw new Error(`receipt-ocr returned no text: ${JSON.stringify(data)}`);
  }
  return data.text;
}
