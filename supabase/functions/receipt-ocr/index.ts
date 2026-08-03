// レシート画像の文字起こし（Google Cloud Vision API, TEXT_DETECTION）。
//
// クライアントから直接Google Cloud APIキーを使うとビルド後のJSに埋め込まれ
// 誰でも抜き取れてしまうため、tts/secretary-chatと同じ理由でこのEdge Function経由にする。
// GOOGLE_VISION_API_KEYはSupabaseのシークレットとしてのみ保持し、クライアントには渡さない。
//
// 事前準備:
//   1. Google Cloudプロジェクトを作成し、Cloud Vision APIを有効化
//   2. APIキーを発行（無料枠: 月1,000ユニットまで無料。それ以降は従量課金。
//      料金・上限は Google Cloud の Cloud Vision 料金ページで要確認）
//   3. supabase secrets set GOOGLE_VISION_API_KEY=AIza...
//   4. supabase functions deploy receipt-ocr
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_VISION_ENDPOINT = "https://vision.googleapis.com/v1/images:annotate";
// 保存されているレシート写真はdata URLをそのまま持つため、上限を大きめに取る
// （Visionのリクエストサイズ上限は約20MB。ここでは異常入力の弾き用に緩めに制限）
const MAX_IMAGE_BASE64_LENGTH = 15_000_000;

interface RequestBody {
  imageBase64: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GOOGLE_VISION_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GOOGLE_VISION_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body: RequestBody = await req.json();
    if (!body.imageBase64 || typeof body.imageBase64 !== "string") {
      return new Response(JSON.stringify({ error: "imageBase64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (body.imageBase64.length > MAX_IMAGE_BASE64_LENGTH) {
      return new Response(JSON.stringify({ error: "imageBase64 is too large" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const googleRes = await fetch(`${GOOGLE_VISION_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: body.imageBase64 },
            features: [{ type: "TEXT_DETECTION" }],
            imageContext: { languageHints: ["ja"] },
          },
        ],
      }),
    });

    if (!googleRes.ok) {
      const errText = await googleRes.text();
      console.error("Google Vision error:", googleRes.status, errText);
      return new Response(
        JSON.stringify({ error: `Google Vision request failed (${googleRes.status})` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const json = await googleRes.json();
    const responseError = json?.responses?.[0]?.error;
    if (responseError) {
      console.error("Google Vision response error:", responseError);
      return new Response(JSON.stringify({ error: responseError.message ?? "Vision API error" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const text: string = json?.responses?.[0]?.fullTextAnnotation?.text ?? "";
    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("receipt-ocr error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
