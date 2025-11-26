"use client";
import * as React from "react";
import type { Form8_1Photos, PhotoItem } from "./types";
import { buildRemoteUrl, renameWithDateTime } from "./UploadUtils";

type Props = {
  value?: Partial<Form8_1Photos>;
  onChange: (patch: Partial<Form8_1Photos>) => void;
};

const PENDING_NOTE = "รูปใหม่จะอัปโหลดเมื่อกดบันทึก";

function useObjectUrl() {
  const [url, setUrl] = React.useState<string | undefined>();
  React.useEffect(() => () => {
    if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
  }, [url]);
  const set = (u?: string) => {
    if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
    setUrl(u);
  };
  return [url, set] as const;
}

const previewFromPhoto = (p?: PhotoItem): string | undefined =>
  p?.localPreview || (p?.url ? buildRemoteUrl(p.url) : undefined);

function Main1_PhotosComponent({ value, onChange }: Props) {
  const v = value || { gallery: [] };
  const [heroUrl, setHeroUrl] = useObjectUrl();
  const [signMainUrl, setSignMainUrl] = useObjectUrl();
  const [setAUrl, setSetAUrl] = React.useState<(string | undefined)[]>([
    previewFromPhoto(v.setAPhotos?.[0]),
    previewFromPhoto(v.setAPhotos?.[1]),
  ]);
  const [setBUrl, setSetBUrl] = React.useState<(string | undefined)[]>(
    [0, 1, 2, 3, 4, 5].map((i) => previewFromPhoto(v.setBPhotos?.[i]))
  );

  // hydrate initial remote/local previews on first mount
  React.useEffect(() => {
    if (!heroUrl) setHeroUrl(previewFromPhoto(v.coverPhoto));
    if (!signMainUrl) setSignMainUrl(previewFromPhoto(v.signMainPhoto));
    if (!setAUrl.filter(Boolean).length) {
      setSetAUrl([
        previewFromPhoto(v.setAPhotos?.[0]),
        previewFromPhoto(v.setAPhotos?.[1]),
      ]);
    }
    if (!setBUrl.filter(Boolean).length) {
      setSetBUrl([0, 1, 2, 3, 4, 5].map((i) => previewFromPhoto(v.setBPhotos?.[i])));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "coverPhoto" | "signMainPhoto" | { set: "A" | "B"; idx: number }
  ) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const { filename } = renameWithDateTime(f);
    const u = URL.createObjectURL(f);
    const base: PhotoItem = { url: filename, localFile: f, localPreview: u, uploaded: false };
    if (target === "coverPhoto") {
      setHeroUrl(u);
      onChange({ coverPhoto: base });
      return;
    }
    if (target === "signMainPhoto") {
      setSignMainUrl(u);
      onChange({ signMainPhoto: base });
      return;
    }
    if (target.set === "A") {
      const arr = [...setAUrl]; arr[target.idx] = u; setSetAUrl(arr);
      const rows = [...(v.setAPhotos || [])];
      rows[target.idx] = base as PhotoItem;
      onChange({ setAPhotos: rows });
      return;
    }
    if (target.set === "B") {
      const arr = [...setBUrl]; arr[target.idx] = u; setSetBUrl(arr);
      const rows = [...(v.setBPhotos || new Array(6).fill(undefined))];
      rows[target.idx] = base as any;
      onChange({ setBPhotos: rows });
    }
  };

  const remove = (key: "coverPhoto" | "signMainPhoto" | { set: "A" | "B"; idx: number }) => {
    if (key === "coverPhoto") {
      setHeroUrl(undefined);
      onChange({ coverPhoto: undefined });
      return;
    }
    if (key === "signMainPhoto") {
      setSignMainUrl(undefined);
      onChange({ signMainPhoto: undefined });
      return;
    }
    if (key.set === "A") {
      const rows = [...(v.setAPhotos || [])]; rows[key.idx] = undefined as any; onChange({ setAPhotos: rows });
      const u = [...setAUrl]; u[key.idx] = undefined; setSetAUrl(u);
      return;
    }
    if (key.set === "B") {
      const rows = [...(v.setBPhotos || [])]; rows[key.idx] = undefined as any; onChange({ setBPhotos: rows });
      const u = [...setBUrl]; u[key.idx] = undefined; setSetBUrl(u);
    }
  };

  const renderPendingNote = (
    <span className="text-xs text-gray-500">{PENDING_NOTE}</span>
  );

  return (
    <section className="space-y-6">
      <div className="rounded border bg-white p-3">
        <div className="font-medium mb-2">รูปปก/รูปหลัก</div>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 rounded-md border border-blue-500 text-blue-600 px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer">เลือกรูป
            <input type="file" accept="image/*" className="hidden" onChange={(e) => pickFile(e, "coverPhoto")} />
          </label>
          {heroUrl ? (
            <>
              <img src={heroUrl} className="max-h-40 object-contain" />
              {renderPendingNote}
              <button type="button" className="px-3 py-2 rounded-md border border-red-500 text-red-600 text-sm hover:bg-red-50" onClick={() => remove("coverPhoto")}>ลบ</button>
            </>
          ) : (
            <span className="text-sm text-gray-500">ยังไม่เลือกรูป</span>
          )}
        </div>
      </div>

      <div className="rounded border bg-white p-3">
        <div className="font-medium mb-2">รูปภาพหลัก</div>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 rounded-md border border-blue-500 text-blue-600 px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer">เลือกรูป
            <input type="file" accept="image/*" className="hidden" onChange={(e) => pickFile(e, "signMainPhoto")} />
          </label>
          {signMainUrl ? (
            <>
              <img src={signMainUrl} className="max-h-40 object-contain" />
              {renderPendingNote}
              <button type="button" className="px-3 py-2 rounded-md border border-red-500 text-red-600 text-sm hover:bg-red-50" onClick={() => remove("signMainPhoto")}>ลบ</button>
            </>
          ) : (
            <span className="text-sm text-gray-500">ยังไม่เลือกรูป</span>
          )}
        </div>
      </div>

      <div className="rounded border bg-white p-3">
        <div className="font-medium mb-2">ชุด A (2 รูป)</div>
        <div className="grid grid-cols-2 gap-3">
          {[0,1].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 rounded-md border border-blue-500 text-blue-600 px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer">เลือกรูป
                <input type="file" accept="image/*" className="hidden" onChange={(e) => pickFile(e, { set: "A", idx: i })} />
              </label>
              {setAUrl[i] ? (
                <>
                  <img src={setAUrl[i]} className="max-h-28 object-contain" />
                  {renderPendingNote}
                  <button type="button" className="px-3 py-2 rounded-md border border-red-500 text-red-600 text-sm hover:bg-red-50" onClick={() => remove({ set: "A", idx: i })}>ลบ</button>
                </>
              ) : (
                <span className="text-sm text-gray-500">ยังไม่เลือกรูป</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded border bg-white p-3">
        <div className="font-medium mb-2">ชุด B (6 รูป)</div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[0,1,2,3,4,5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 rounded-md border border-blue-500 text-blue-600 px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer">เลือกรูป
                <input type="file" accept="image/*" className="hidden" onChange={(e) => pickFile(e, { set: "B", idx: i })} />
              </label>
              {setBUrl[i] ? (
                <>
                  <img src={setBUrl[i]} className="max-h-28 object-contain" />
                  {renderPendingNote}
                  <button type="button" className="px-3 py-2 rounded-md border border-red-500 text-red-600 text-sm hover:bg-red-50" onClick={() => remove({ set: "B", idx: i })}>ลบ</button>
                </>
              ) : (
                <span className="text-sm text-gray-500">ยังไม่เลือกรูป</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default React.memo(Main1_PhotosComponent);
