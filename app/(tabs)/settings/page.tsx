"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronRight, Info, Loader2, X, Plus } from "lucide-react";
import { useAppStore, planLimits, planTierLabels } from "@/store/appStore";
import { googleCalendarService, useGoogleCalendarConnection } from "@/lib/googleCalendarService";
import { showNotReady, showToast } from "@/lib/notReady";
import { SettingsSection, SettingsRow } from "@/components/settings/SettingsSection";
import { PlanUsageBar } from "@/components/settings/PlanUsageBar";
import { Dialog } from "@/components/ui/Dialog";
import { expenseCategoryPresets, activeExpenseCategories, type ExpenseCategoryPresetKey } from "@/types/models";

const honorifics = ["先生", "さん"];
const briefingTimes = ["06:30", "07:00", "07:30", "08:00", "08:30"];
const reminderDayOptions = [14, 30, 60];

export default function SettingsPage() {
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const persons = useAppStore((s) => s.persons);
  const records = useAppStore((s) => s.records);
  const planTier = useAppStore((s) => s.planTier);
  const limits = planLimits[planTier];
  const resetAllData = useAppStore((s) => s.resetAllData);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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

  function exportData() {
    const state = useAppStore.getState();
    const data = {
      exportedAt: new Date().toISOString(),
      profile: state.profile,
      records: state.records,
      persons: state.persons,
      schedules: state.schedules,
      todos: state.todos,
      expenses: state.expenses,
      postDrafts: state.postDrafts,
      benchmarkAccounts: state.benchmarkAccounts,
      gikaiTemplates: state.gikaiTemplates,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `enroot-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("データをエクスポートしました");
  }

  function confirmDeleteAccount() {
    setDeleteDialogOpen(false);
    resetAllData();
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
          {profile.electionDay && (
            <SettingsRow title="投票日" trailing={<span>{profile.electionDay}</span>} />
          )}
          <SettingsRow
            title="編集する"
            trailing={<ChevronRight size={20} className="text-text-secondary" />}
            onClick={() => router.push("/settings/profile")}
          />
        </SettingsSection>

        <SettingsSection title="プラン">
          <SettingsRow title="現在のプラン" trailing={<span>{planTierLabels[planTier]}</span>} />
          <PlanUsageBar label="記録" used={records.length} limit={limits.records} />
          <PlanUsageBar label="名刺管理" used={persons.length} limit={limits.persons} />
          <SettingsRow
            title="プランを変更する"
            trailing={<ChevronRight size={20} className="text-text-secondary" />}
            onClick={() => router.push("/settings/plan")}
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
          <SettingsRow
            title="タグ候補の管理"
            subtitle="タグ編集時の候補一覧を追加・削除できます"
            trailing={<ChevronRight size={20} className="text-text-secondary" />}
            onClick={() => router.push("/settings/tags")}
          />
        </SettingsSection>

        <SettingsSection title="経費の設定">
          <ExpenseCategorySettings profile={profile} updateProfile={updateProfile} />
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
            onClick={() => router.push("/settings/report")}
          />
          <SettingsRow
            title="Google Drive連携"
            subtitle="未設定（管理者側でのAPI連携設定が必要です）"
            trailing={<Info size={18} className="text-text-secondary" />}
          />
        </SettingsSection>

        <SettingsSection title="アカウント">
          <SettingsRow title="パスワード変更" onClick={() => router.push("/settings/password")} />
          <SettingsRow title="データエクスポート" subtitle="記録・名刺・経費等をJSONで保存" onClick={exportData} />
          <SettingsRow title="ログアウト" onClick={() => setLogoutDialogOpen(true)} />
          <SettingsRow title="アカウント削除" danger onClick={() => setDeleteDialogOpen(true)} />
        </SettingsSection>

        <SettingsSection title="アプリ情報">
          <SettingsRow title="バージョン" trailing={<span>1.0.0</span>} />
          <SettingsRow title="利用規約 / プライバシーポリシー" onClick={() => router.push("/settings/legal")} />
          <SettingsRow title="お問い合わせ" onClick={() => router.push("/settings/contact")} />
        </SettingsSection>
      </div>

      <Dialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
        title="ログアウト"
        footer={
          <button onClick={() => setLogoutDialogOpen(false)} className="rounded-input bg-brand-green px-4 py-2 font-semibold text-white">
            閉じる
          </button>
        }
      >
        <p className="leading-relaxed">
          このプロトタイプはお一人でお使いいただく前提のため、ログイン機能はありません。実際のサービスでは、ここからログアウトできるようになります。
        </p>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="アカウント削除"
        footer={
          <>
            <button onClick={() => setDeleteDialogOpen(false)} className="px-3 py-2 text-text-secondary">
              キャンセル
            </button>
            <button onClick={confirmDeleteAccount} className="rounded-input bg-error px-4 py-2 font-semibold text-white">
              削除する
            </button>
          </>
        }
      >
        <p className="leading-relaxed">
          記録・名刺管理・経費・ToDo等、このアプリに保存されているすべてのデータが削除され、最初の設定からやり直しになります。この操作は取り消せません。よろしいですか？
        </p>
      </Dialog>
    </div>
  );
}

/**
 * 政務活動費の費目区分は自治体条例ごとに異なる（六費目の簡易セットで足りる議会も
 * あれば、人件費・要請陳情活動費等を分ける議会もある）ため、プリセット切り替え＋
 * カスタム入力に対応する。経費画面（一覧・登録ダイアログ・OCR分類）は
 * activeExpenseCategories(profile)を通じてここでの設定を参照する。
 */
function ExpenseCategorySettings({
  profile,
  updateProfile,
}: {
  profile: ReturnType<typeof useAppStore.getState>["profile"];
  updateProfile: ReturnType<typeof useAppStore.getState>["updateProfile"];
}) {
  const preset = profile.expenseCategoryPreset ?? "generic";
  const [newCategory, setNewCategory] = useState("");
  const customCategories = useMemo(
    () => activeExpenseCategories({ ...profile, expenseCategoryPreset: "custom" }),
    [profile]
  );

  function selectPreset(key: ExpenseCategoryPresetKey) {
    updateProfile((p) => ({
      ...p,
      expenseCategoryPreset: key,
      // customへ初めて切り替えるときは、直前のプリセットの費目を初期値として引き継ぐ
      customExpenseCategories:
        key === "custom" && (!p.customExpenseCategories || p.customExpenseCategories.length === 0)
          ? activeExpenseCategories(p)
          : p.customExpenseCategories,
    }));
  }

  function addCategory() {
    const trimmed = newCategory.trim();
    if (!trimmed || customCategories.includes(trimmed)) return;
    updateProfile((p) => ({ ...p, customExpenseCategories: [...customCategories, trimmed] }));
    setNewCategory("");
  }

  function removeCategory(c: string) {
    updateProfile((p) => ({ ...p, customExpenseCategories: customCategories.filter((x) => x !== c) }));
  }

  return (
    <div className="px-4 py-3.5">
      <p className="mb-2 font-semibold">費目プリセット</p>
      <div className="flex flex-col gap-2">
        {(Object.keys(expenseCategoryPresets) as (keyof typeof expenseCategoryPresets)[]).map((key) => (
          <button
            key={key}
            onClick={() => selectPreset(key)}
            className={`rounded-input border px-3 py-2.5 text-left text-sm ${
              preset === key ? "border-brand-green bg-brand-green/10" : "border-neutral-gray"
            }`}
          >
            <span className="font-semibold">{expenseCategoryPresets[key].label}</span>
            <span className="mt-0.5 block text-xs text-text-secondary">
              {expenseCategoryPresets[key].categories.join(" / ")}
            </span>
          </button>
        ))}
        <button
          onClick={() => selectPreset("custom")}
          className={`rounded-input border px-3 py-2.5 text-left text-sm ${
            preset === "custom" ? "border-brand-green bg-brand-green/10" : "border-neutral-gray"
          }`}
        >
          <span className="font-semibold">カスタム</span>
          <span className="mt-0.5 block text-xs text-text-secondary">実際の議会の条例区分に合わせて自分で設定する</span>
        </button>
      </div>

      {preset === "custom" && (
        <div className="mt-3 rounded-input bg-neutral-gray p-3">
          <div className="flex flex-wrap gap-2">
            {customCategories.map((c) => (
              <span
                key={c}
                className="flex items-center gap-1 rounded-chip bg-white px-2.5 py-1 text-sm shadow-card"
              >
                {c}
                <button onClick={() => removeCategory(c)} aria-label={`${c}を削除`} className="text-text-secondary">
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCategory()}
              placeholder="費目名を入力"
              className="h-9 flex-1 rounded-input border border-neutral-gray bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-brand-green"
            />
            <button
              onClick={addCategory}
              aria-label="費目を追加"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-input bg-brand-green text-white"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
