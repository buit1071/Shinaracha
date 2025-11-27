"use client";
import * as React from "react";
import { PencilIcon } from "@heroicons/react/24/outline";
import NoteModal from "./NoteModal";

type Props = {
  note?: string;
  placeholder?: string;
  onSave: (text: string) => void;
};

export default function RemarkCell({ note, placeholder = "หมายเหตุ (ถ้ามี)", onSave }: Props) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(note || "");

  React.useEffect(() => { setDraft(note || ""); }, [note]);

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="min-w-0 block max-w-[150px] sm:max-w-[180px] md:max-w-[220px] truncate text-gray-800">
        {note && note.trim() !== "" ? note : <span className="text-gray-400">{placeholder}</span>}
      </span>
      <button
        type="button"
        title="แก้ไขหมายเหตุ"
        onClick={() => setOpen(true)}
        className="p-1 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
      >
        <PencilIcon className="h-4 w-4 md:h-5 md:w-5" />
      </button>

      <NoteModal
        open={open}
        value={draft}
        onChange={setDraft}
        onCancel={() => { setOpen(false); setDraft(note || ""); }}
        onSave={() => { onSave(draft); setOpen(false); }}
      />
    </div>
  );
}
