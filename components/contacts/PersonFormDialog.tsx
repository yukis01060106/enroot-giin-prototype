"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/Dialog";
import { useAppStore } from "@/store/appStore";
import type { PersonModel } from "@/types/models";

/**
 * 名刺の手動追加・編集の両方を担う共通ダイアログ（ToDoの編集ダイアログと同じ
 * 「1つのフォームをadd/editで使い回す」パターン）。編集時は削除ボタンも出す。
 */
export function PersonFormDialog({
  open,
  onOpenChange,
  editingPerson,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPerson: PersonModel | null;
}) {
  const router = useRouter();
  const addPerson = useAppStore((s) => s.addPerson);
  const updatePerson = useAppStore((s) => s.updatePerson);
  const removePerson = useAppStore((s) => s.removePerson);
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // 開くたびに、追加なら空・編集なら現在値でフォームを初期化する
  // （レンダー中にstateを更新する「前回値との比較」パターン。このセッションで
  // 一貫して使っているuseEffect回避策）。
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName(editingPerson?.name ?? "");
      setOrganization(editingPerson?.organization ?? "");
      setTitle(editingPerson?.title ?? "");
      setPhone(editingPerson?.phone ?? "");
      setEmail(editingPerson?.email ?? "");
    }
  }

  function save() {
    if (!name.trim()) return;
    const params = {
      name: name.trim(),
      organization: organization.trim() || undefined,
      title: title.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
    };
    if (editingPerson) {
      updatePerson(editingPerson.id, params);
      onOpenChange(false);
    } else {
      const person = addPerson(params);
      onOpenChange(false);
      router.push(`/contacts?id=${person.id}`);
    }
  }

  function handleDelete() {
    if (!editingPerson) return;
    removePerson(editingPerson.id);
    onOpenChange(false);
    router.push("/contacts");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={editingPerson ? "名刺情報を編集" : "手動で追加する"}
      footer={
        <>
          {editingPerson && (
            <button onClick={handleDelete} className="mr-auto px-3 py-2 font-semibold text-error">
              削除
            </button>
          )}
          <button onClick={() => onOpenChange(false)} className="px-3 py-2 text-text-secondary">
            キャンセル
          </button>
          <button onClick={save} disabled={!name.trim()} className="rounded-input bg-brand-green px-4 py-2 font-semibold text-white disabled:opacity-40">
            保存
          </button>
        </>
      }
    >
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="名前 *"
        className="h-tap-target rounded-input bg-neutral-gray px-3 outline-none focus:ring-2 focus:ring-brand-green"
      />
      <input
        value={organization}
        onChange={(e) => setOrganization(e.target.value)}
        placeholder="所属（任意）"
        className="h-tap-target rounded-input bg-neutral-gray px-3 outline-none focus:ring-2 focus:ring-brand-green"
      />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="役職（任意）"
        className="h-tap-target rounded-input bg-neutral-gray px-3 outline-none focus:ring-2 focus:ring-brand-green"
      />
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="電話番号（任意）"
        className="h-tap-target rounded-input bg-neutral-gray px-3 outline-none focus:ring-2 focus:ring-brand-green"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="メール（任意）"
        className="h-tap-target rounded-input bg-neutral-gray px-3 outline-none focus:ring-2 focus:ring-brand-green"
      />
    </Dialog>
  );
}
