# En Root ─ 議員エディション（Next.js版）

地方議員のための活動管理・AI秘書アプリ。Flutter製プロトタイプ（`~/Documents/enroot_giin`）からNext.js（React/TypeScript, SSG）へ全面移行したもの。Flutter版はそのまま参照・フォールバックとして残っている。

## 技術スタック

- Next.js 16 (App Router) + TypeScript、`output: 'export'`（静的サイト生成、サーバーランタイムなし）
- Tailwind CSS v4（デザイントークンはFlutter版 `theme.dart` から1:1移植、`app/globals.css`）
- Zustand（`store/appStore.ts`。Flutter版 `AppDataNotifier` の移植。モックデータは毎回リセット、`profile`と初回起動フラグのみ`localStorage`永続化）
- Supabase JS（AI秘書チャットのClaude APIプロキシ呼び出しのみ。DB自体は未接続）
- Google Identity Services（Googleカレンダー連携、クライアント完結のOAuth）

## セットアップ

```bash
npm install
cp .env.example .env.local  # 値を埋める（未設定でもアプリ自体は動く。詳細は下記）
npm run dev
```

静的ビルド:

```bash
npm run build   # out/ に出力
npx serve out   # or 任意の静的サーバー
```

## 外部連携（未設定でもアプリは壊れない。以下は有効化したい場合のみ）

### AI秘書チャット（Claude API）

`output:'export'`はサーバーAPIルートを持てないため、Claude APIの呼び出しはSupabase Edge Function（`supabase/functions/secretary-chat`※Flutter版リポジトリに実装済み、そのまま流用）経由にしている。

1. Supabaseプロジェクトを作成
2. `supabase secrets set ANTHROPIC_API_KEY=...` → `supabase functions deploy secretary-chat`
3. `.env.local` に `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定

未設定の間は、キーワード一致しない自由入力に対して定型文にフォールバックする（クラッシュしない）。

### Googleカレンダー連携

1. Google Cloud ConsoleでOAuthクライアントID（ウェブ）を発行し、承認済みJavaScript生成元にデプロイ先オリジンを登録
2. `.env.local` に `NEXT_PUBLIC_GOOGLE_CLIENT_ID` を設定（値自体は公開前提のOAuthクライアントIDなので、これだけは秘密鍵ではない）

未設定の間は設定画面に「未設定」と表示されるだけ。

### 読み上げ音声（Google Cloud Text-to-Speech）

ブラウザ内蔵TTS（Web Speech API）は無料だが声が機械的なため、Google Cloud TTS（`ja-JP-Neural2-C`、無料枠あり）をSupabase Edge Function経由で呼び、より自然な声で読み上げる。secretary-chatと同じ理由（APIキーをクライアントに渡さない）でEdge Function経由にしている。

1. Google CloudプロジェクトでText-to-Speech APIを有効化し、APIキーを発行（無料枠・料金は[Cloud Text-to-Speech料金ページ](https://cloud.google.com/text-to-speech/pricing)で要確認。Neural2音声は月100万文字まで無料）
2. `supabase secrets set GOOGLE_TTS_API_KEY=...` → `supabase functions deploy tts`（`supabase/functions/tts`、このリポジトリに実装済み）
3. `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` はAI秘書チャットと共通（上記参照、追加設定不要）

未設定・Edge Function呼び出し失敗の間は、自動的にブラウザ内蔵TTSにフォールバックする（クラッシュしない）。

## AIキャラクター（リップシンク）

`components/character/SpeakingCharacter.tsx` — 1枚の人物写真（`public/images/secretary_misaki.png`）に、口の位置へ重ねたCSS楕円を開閉させる簡易リップシンク。`lib/useSpeakingCharacter.ts`が発話の駆動元を2段構えで持つ:

1. Google Cloud TTSが使える場合 → 実際の音声を再生し、Web Audio APIのAnalyserNodeで実際の音量を取得して口を開閉する（本物の音量連動リップシンク）
2. 使えない場合 → ブラウザ内蔵TTSにフォールバックし、単語境界イベント（対応ブラウザ）または一定間隔のパルス（非対応ブラウザ）で疑似的に口を動かす

- `/dev-character` — バックエンド非依存の単体確認ページ
- 将来MuseTalk等の本格的なAIリップシンクに差し替える場合も、`SpeakingCharacter`の`{isSpeaking, viseme}` props契約を保ったまま`useSpeakingCharacter`フックの中身だけ差し替えればよい設計にしてある

## スコープについて

このNext.js移行は、Flutter版の**モックデータ忠実度での1:1移植**（未実装スタブ・「準備中」トースト等も含めて再現）。以下は意図的にスコープ外（Flutter版でも未実装だったもの）:

- Supabaseの4テーブル未実装分（expenses / post_drafts / benchmark_accounts / gikai_templates）— 現状は全てクライアント側モックデータ
- 実カメラ撮影（名刺・レシート）、実音声認識・録音、OCR — 全てモック（フェイク遅延＋ダミーデータ）

## ディレクトリ構成の要点

- `app/(tabs)/` — ボトムナビ4タブ（秒書・ホーム・議会準備・設定）。それぞれ実URLを持つ（Flutter版はローカルstateのみでURLがなかった、意図的な改善）
- `app/[feature]/` — タブ外の各機能（カレンダー・名刺管理・議会準備の各ウィザード・経費・発信・会議・ToDo・検索・オンボーディング）
- クエリ文字列ベースのmaster-detail（例: `/contacts?id=xxx`）— `output:'export'`は実行時に決まるIDを`[id]`動的ルートで静的に列挙できないため、`lib/useDetailId.ts` + `components/SuspenseBoundary.tsx` の規約で統一
- `store/appStore.ts` — 状態の単一ソース。配列・オブジェクトを返す派生ゲッターは必ず`useShallow`でラップした専用フック（`usePendingTodos()`等）経由で読むこと。直接`useAppStore(s => s.foo())`のように呼ぶと無限レンダーになる（Zustand + useSyncExternalStoreの既知の罠、このリポジトリで複数回踏んで修正済み）
- `components/HydrationGate.tsx` — ルートレイアウトでアプリ全体を包み、クライアント側のリハイドレーション完了まで何も描画しない。モックデータが`new Date()`基準の相対値を含むため、これがないとビルド時刻と閲覧時刻のズレでハイドレーションエラーになる
