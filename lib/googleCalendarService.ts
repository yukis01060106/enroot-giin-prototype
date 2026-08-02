"use client";

import { useSyncExternalStore } from "react";
import type { ScheduleModel } from "@/types/models";

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (resp: { access_token?: string; error?: string }) => void;
          }): { requestAccessToken: () => void };
          revoke(token: string, done: () => void): void;
        };
      };
    };
  }
}

interface GoogleCalendarState {
  accessToken: string | null;
  email: string | null;
}

/**
 * Googleカレンダー連携（片方向: このアプリ→Googleカレンダーへの予定作成）。
 * lib/services/google_calendar_service.dart の移植。
 *
 * サービスアカウント方式（鍵をクライアントに同梱する必要があり安全でない）ではなく、
 * Google Identity Services（GIS）のトークンクライアントでユーザー本人のOAuth
 * アクセストークンを取得し、そのトークンでCalendar APIを直接fetchする方式にする
 * （個人の認可トークンはユーザーの同意ごとに発行される一時的な値であり、
 * 静的なAPIキー/シークレットとは扱いが異なるため、クライアント側に保持してよい）。
 */
class GoogleCalendarService {
  private state: GoogleCalendarState = { accessToken: null, email: null };
  private listeners = new Set<() => void>();
  private scriptLoading: Promise<void> | null = null;

  isConfigured(): boolean {
    return clientId.length > 0;
  }

  isConnected(): boolean {
    return this.state.accessToken !== null;
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = () => this.state;

  private setState(next: GoogleCalendarState) {
    this.state = next;
    for (const l of this.listeners) l();
  }

  private loadScript(): Promise<void> {
    if (this.scriptLoading) return this.scriptLoading;
    this.scriptLoading = new Promise((resolve, reject) => {
      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Google Identity Servicesの読み込みに失敗しました"));
      document.head.appendChild(script);
    });
    return this.scriptLoading;
  }

  async connect(): Promise<void> {
    if (!this.isConfigured()) return;
    await this.loadScript();
    return new Promise((resolve, reject) => {
      const client = window.google!.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "https://www.googleapis.com/auth/calendar.events",
        callback: (resp) => {
          if (resp.error || !resp.access_token) {
            reject(new Error(resp.error ?? "認可に失敗しました"));
            return;
          }
          this.setState({ accessToken: resp.access_token, email: null });
          resolve();
        },
      });
      client.requestAccessToken();
    });
  }

  disconnect(): void {
    if (this.state.accessToken && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(this.state.accessToken, () => {});
    }
    this.setState({ accessToken: null, email: null });
  }

  /** ローカルの予定をGoogleカレンダーにも作成する（ベストエフォート）。 */
  async pushEvent(schedule: ScheduleModel): Promise<boolean> {
    if (!this.state.accessToken) return false;
    try {
      const res = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.state.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            summary: schedule.title,
            location: schedule.location,
            start: { dateTime: schedule.startAt, timeZone: "Asia/Tokyo" },
            end: {
              dateTime: schedule.endAt ?? new Date(new Date(schedule.startAt).getTime() + 3600000).toISOString(),
              timeZone: "Asia/Tokyo",
            },
          }),
        }
      );
      return res.ok;
    } catch {
      return false;
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();

// サーバープリレンダー/初回ハイドレーション用の固定スナップショット。
// useSyncExternalStoreの比較はObject.is（参照比較）なので、呼ぶたびに新しい
// オブジェクトを返すとサーバー側と初回クライアント側で参照が食い違い、
// ハイドレーションエラーになる（このセッションで何度も踏んだ罠と同じ）。
const serverSnapshot: GoogleCalendarState = { accessToken: null, email: null };

export function useGoogleCalendarConnection() {
  return useSyncExternalStore(
    googleCalendarService.subscribe,
    googleCalendarService.getSnapshot,
    () => serverSnapshot
  );
}
