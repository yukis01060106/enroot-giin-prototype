"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronRight, Info, Loader2 } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { googleCalendarService, useGoogleCalendarConnection } from "@/lib/googleCalendarService";
import { showNotReady } from "@/lib/notReady";
import { SettingsSection, SettingsRow } from "@/components/settings/SettingsSection";
import { PlanUsageBar } from "@/components/settings/PlanUsageBar";

const honorifics = ["先生", "さん"];
const briefingTimes = ["06:30", "07:00", "07:30", "08:00", "08:30"];
const reminderDayOptions = [14, 30, 60];

export default function SettingsPage() {
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const persons = useAppStore((s) => s.persons);
  const records = useAppStore((s) => s.records);
  const [googleBusy, setGoogleBusy] = useState(false);
  // Google Identity Servicesはトークンクライアント方式のためセッション自動復元はない。
  // 「連携する」ボタンが押されたときに初めて認可フローが走る。
  const google = useGoogleCalendarConnection();

  async function connectGoogle() {
    setGoogleBusy(true);
    try {
      await googleCalendarService.connect();
    } catch {
      showNotReady("Googleカレンダー連携");
    } finally {
      setGoogleBusy(false);
    }
  }

  function disconnectGoogle() {
    googleCalendarService.disconnect();
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center bg-gradient-primary px-4 text-white">
        <h1 className="text-lg font-bold">設定</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <SettingsSection title="プロフィール">
          <SettingsRow title="名前" trailing={<span>{profile.displayName}</span>} />
          <SettingsRow title="議会名" trailing={<span>{profile.councilName}</span>} />
          <SettingsRow title="議員歴" trailing={<span>{profile.termYears}年目</span>} />
          <SettingsRow
            title="編集する"
            trailing={<ChevronRight size={20} className="text-text-secondary" />}
            onClick={() => router.push("/settings/profile")}
          />
        </SettingsSection>

        <SettingsSection title="プラン">
          <SettingsRow title="現在のプラン" trailing={<span>フリー</span>} />
          <PlanUsageBar label="記録" used={records.length} limit={30} />
          <PlanUsageBar label="名刺管理" used={persons.length} limit={50} />
          <SettingsRow
            title="プランを変更する"
            trailing={<ChevronRight size={20} className="text-text-secondary" />}
            onClick={() => showNotReady("プラン変更")}
          />
        </SettingsSection>

        <SettingsSection title="AI秘書の設定">
          <SettingsRow
            title="呼びかけ方"
            trailing={
              <select
                value={profile.honorific}
                onChange={(e) => updateProfile((p) => ({ ...p, honorific: e.target.value }))}
                className="bg-transparent text-right"
              >
                {honorifics.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            }
          />
          <SettingsRow
            title="朝のお知らせ時刻"
            trailing={
              <select
                value={profile.briefingTime}
                onChange={(e) => updateProfile((p) => ({ ...p, briefingTime: e.target.value }))}
                className="bg-transparent text-right"
              >
                {briefingTimes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            }
          />
          <SettingsRow
            title="朝のお知らせ"
            trailing={
              <input
                type="checkbox"
                checked={profile.briefingEnabled}
                onChange={(e) => updateProfile((p) => ({ ...p, briefingEnabled: e.target.checked }))}
                className="h-5 w-9"
              />
            }
          />
        </SettingsSection>

        <SettingsSection title="通知設定">
          <SettingsRow
            title="朝のブリーフィング"
            trailing={
              <input
                type="checkbox"
                checked={profile.briefingEnabled}
                onChange={(e) => updateProfile((p) => ({ ...p, briefingEnabled: e.target.checked }))}
              />
            }
          />
          <SettingsRow
            title="連絡リマインド"
            trailing={
              <input
                type="checkbox"
                checked={profile.notifyReminder}
                onChange={(e) => updateProfile((p) => ({ ...p, notifyReminder: e.target.checked }))}
              />
            }
          />
          <SettingsRow
            title="ToDo期限通知"
            trailing={
              <input
                type="checkbox"
                checked={profile.notifyTodoDue}
                onChange={(e) => updateProfile((p) => ({ ...p, notifyTodoDue: e.target.checked }))}
              />
            }
          />
          <SettingsRow
            title="ねっこの会案内"
            trailing={
              <input
                type="checkbox"
                checked={profile.notifyNekko}
                onChange={(e) => updateProfile((p) => ({ ...p, notifyNekko: e.target.checked }))}
              />
            }
          />
        </SettingsSection>

        <SettingsSection title="名刺管理の設定">
          <SettingsRow
            title="リマインド日数"
            trailing={
              <select
                value={profile.reminderDays}
                onChange={(e) => updateProfile((p) => ({ ...p, reminderDays: Number(e.target.value) }))}
                className="bg-transparent text-right"
              >
                {reminderDayOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}日
                  </option>
                ))}
              </select>
            }
          />
        </SettingsSection>

        <SettingsSection title="カレンダー連携">
          {!googleCalendarService.isConfigured() ? (
            <SettingsRow
              title="Googleカレンダー"
              subtitle="未設定（管理者側でのAPI連携設定が必要です）"
              trailing={<Info size={18} className="text-text-secondary" />}
            />
          ) : googleBusy ? (
            <SettingsRow title="Googleカレンダー" trailing={<Loader2 size={18} className="animate-spin" />} />
          ) : google.accessToken ? (
            <SettingsRow
              title="Googleカレンダー"
              subtitle="連携中"
              trailing={
                <button onClick={disconnectGoogle} className="font-semibold text-brand-green">
                  連携を解除
                </button>
              }
            />
          ) : (
            <SettingsRow
              title="Googleカレンダー"
              subtitle="連携すると、追加した予定が自動でGoogleカレンダーにも登録されます"
              trailing={
                <button onClick={connectGoogle} className="shrink-0 font-semibold text-primary-blue">
                  連携する
                </button>
              }
            />
          )}
        </SettingsSection>

        <SettingsSection title="マイデータ">
          <SettingsRow
            title="活用レポート"
            subtitle="メモ・繋がり・投稿・経費の月次サマリー"
            trailing={<ChevronRight size={20} className="text-text-secondary" />}
            onClick={() => showNotReady("活用レポート")}
          />
          <SettingsRow
            title="Google Drive連携"
            subtitle="未接続"
            trailing={<ChevronRight size={20} className="text-text-secondary" />}
            onClick={() => showNotReady("Google Drive連携")}
          />
        </SettingsSection>

        <SettingsSection title="アカウント">
          <SettingsRow title="パスワード変更" onClick={() => showNotReady("パスワード変更")} />
          <SettingsRow title="データエクスポート" onClick={() => showNotReady("データエクスポート")} />
          <SettingsRow title="ログアウト" onClick={() => showNotReady("ログアウト")} />
          <SettingsRow title="アカウント削除" danger onClick={() => showNotReady("アカウント削除")} />
        </SettingsSection>

        <SettingsSection title="アプリ情報">
          <SettingsRow title="バージョン" trailing={<span>1.0.0</span>} />
          <SettingsRow title="利用規約 / プライバシーポリシー" onClick={() => showNotReady("利用規約表示")} />
          <SettingsRow title="お問い合わせ" onClick={() => showNotReady("お問い合わせ")} />
        </SettingsSection>
      </div>
    </div>
  );
}
