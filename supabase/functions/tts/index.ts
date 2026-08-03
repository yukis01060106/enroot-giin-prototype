// AI秘書「藤堂 美咲」の読み上げ音声合成（Google Cloud Text-to-Speech, ja-JP-Neural2-C）。
//
// クライアントから直接Google Cloud APIキーを使うとビルド後のJSに埋め込まれ
// 誰でも抜き取れてしまうため、secretary-chatと同じ理由でこのEdge Function経由にする。
// GOOGLE_TTS_API_KEYはSupabaseのシークレットとしてのみ保持し、クライアントには渡さない。
//
// 事前準備:
//   1. Google Cloudプロジェクトを作成し、Text-to-Speech APIを有効化
//   2. APIキーを発行（無料枠: 標準/Neural2音声は月額の無料クレジット枠あり。
//      料金・上限は Google Cloud の Text-to-Speech 料金ページで要確認）
//   3. supabase secrets set GOOGLE_TTS_API_KEY=AIza...
//   4. supabase functions deploy tts
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_TTS_ENDPOINT = "https://texttospeech.googleapis.com/v1/text:synthesize";
const VOICE_NAME = "ja-JP-Neural2-C"; // 日本語ニューラル音声（女性）
const MAX_TEXT_LENGTH = 600; // 1回の読み上げが長くなりすぎないよう安全側で制限

interface RequestBody {
  text: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GOOGLE_TTS_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GOOGLE_TTS_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body: RequestBody = await req.json();
    if (!body.text || typeof body.text !== "string") {
      return new Response(JSON.stringify({ error: "text is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const text = body.text.slice(0, MAX_TEXT_LENGTH);

    const googleRes = await fetch(`${GOOGLE_TTS_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: "ja-JP", name: VOICE_NAME },
        audioConfig: { audioEncoding: "MP3", speakingRate: 1.0, pitch: 0 },
      }),
    });

    if (!googleRes.ok) {
      const errText = await googleRes.text();
      console.error("Google TTS error:", googleRes.status, errText);
      return new Response(
        JSON.stringify({ error: `Google TTS request failed (${googleRes.status})` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { audioContent } = await googleRes.json();
    return new Response(JSON.stringify({ audioContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("tts error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
