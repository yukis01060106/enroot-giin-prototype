"use client";

/**
 * Flutter版 shared/utils/not_ready_snackbar.dart の移植。
 * 外部API・実サービス連携が前提でまだ有効化されていない機能をタップした際の
 * 共通フィードバック。プロトタイプ全体で表示文言を統一するために使う。
 *
 * ToastHost（app/layout.tsxに一度だけマウント）がこのモジュール変数に
 * ハンドラーを登録し、以後どのコンポーネントからも import して呼べるようにする
 * （React Contextを都度たどらなくて済むようにするための単純なモジュールシングルトン）。
 */
let handler: ((message: string) => void) | null = null;

export function registerToastHandler(fn: (message: string) => void) {
  handler = fn;
}

export function showNotReady(feature: string) {
  handler?.(`${feature}は近日対応予定です（プロトタイプでは未接続の機能です）`);
}

export function showToast(message: string) {
  handler?.(message);
}
