"use client";
import * as React from "react";
import type { Form8_1Photos, PhotoItem } from "./types";
import { buildRemoteUrl, renameWithDateTime, uploadIfNeeded } from "./UploadUtils";

type Props = {
  value?: Partial<Form8_1Photos>;
  onChange: (patch: Partial<Form8_1Photos>) => void;
};

function useObjectUrl() {
  const [url, setUrl] = React.useState<string | undefined>();
  React.useEffect(() => () => { if (url?.startsWith("blob:")) URL.revokeObjectURL(url); }, [url]);
  const set = (u?: string) => {
    if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
    setUrl(u);
  };
  return [url, set] as const;
}

function Main1_PhotosComponent({ value, onChange }: Props) {
  const v = value || { gallery: [] };
  const [heroUrl, setHeroUrl] = useObjectUrl();
  const [heroFilename, setHeroFilename] = React.useState<string | undefined>(v.coverPhoto?.url);
  const [signMainUrl, setSignMainUrl] = useObjectUrl();
  const [signMainFilename, setSignMainFilename] = React.useState<string | undefined>(v.signMainPhoto?.url);
  const [setAUrl, setSetAUrl] = React.useState<(string | undefined)[]>([undefined, undefined]);
  const [setAFiles, setSetAFiles] = React.useState<(string | undefined)[]>([v.setAPhotos?.[0]?.url, v.setAPhotos?.[1]?.url]);
  const [setBUrl, setSetBUrl] = React.useState<(string | undefined)[]>(new Array(6).fill(undefined));
  const [setBFiles, setSetBFiles] = React.useState<(string | undefined)[]>(
    [0,1,2,3,4,5].map((i) => v.setBPhotos?.[i]?.url)
  );

  // hydrate initial remote previews if filenames exist
  React.useEffect(() => {
    if (!heroUrl && v.coverPhoto?.url) setHeroUrl(buildRemoteUrl(v.coverPhoto.url));
    if (!signMainUrl && v.signMainPhoto?.url) setSignMainUrl(buildRemoteUrl(v.signMainPhoto.url));
    const a = [0,1].map((i) => v.setAPhotos?.[i]?.url ? buildRemoteUrl(v.setAPhotos![i]!.url!) : undefined);
    if (!setAUrl.filter(Boolean).length && a.some(Boolean)) setSetAUrl(a);
    const b = [0,1,2,3,4,5].map((i) => v.setBPhotos?.[i]?.url ? buildRemoteUrl(v.setBPhotos![i]!.url!) : undefined);
    if (!setBUrl.filter(Boolean).length && b.some(Boolean)) setSetBUrl(b);
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
    if (target === "coverPhoto") {
      setHeroUrl(u);
      setHeroFilename(filename);
      onChange({ coverPhoto: { url: filename } });
      // อัปโหลดทันทีแบบไม่บล็อก แล้วสลับ preview เป็น remote หากสำเร็จ
      void (async () => { const ok = await uploadOne(u, filename); if (ok) setHeroUrl(buildRemoteUrl(filename)); })();
      return;
    }
    if (target === "signMainPhoto") {
      setSignMainUrl(u);
      setSignMainFilename(filename);
      onChange({ signMainPhoto: { url: filename } });
      void (async () => { const ok = await uploadOne(u, filename); if (ok) setSignMainUrl(buildRemoteUrl(filename)); })();
      return;
    }
    if (target.set === "A") {
      const arr = [...setAUrl]; arr[target.idx] = u; setSetAUrl(arr);
      const nameArr = [...setAFiles]; nameArr[target.idx] = filename; setSetAFiles(nameArr);
      const rows = [...(v.setAPhotos || [])]; rows[target.idx] = { url: filename } as PhotoItem; onChange({ setAPhotos: rows });
      void (async () => { const ok = await uploadOne(u, filename); if (ok) { const a=[...setAUrl]; a[target.idx]=buildRemoteUrl(filename); setSetAUrl(a); } })();
      return;
    }
    if (target.set === "B") {
      const arr = [...setBUrl]; arr[target.idx] = u; setSetBUrl(arr);
      const nameArr = [...setBFiles]; nameArr[target.idx] = filename; setSetBFiles(nameArr);
      const rows = [...(v.setBPhotos || new Array(6).fill(undefined))]; rows[target.idx] = { url: filename } as any; onChange({ setBPhotos: rows });
      void (async () => { const ok = await uploadOne(u, filename); if (ok) { const b=[...setBUrl]; b[target.idx]=buildRemoteUrl(filename); setSetBUrl(b); } })();
    }
  };

  const uploadOne = async (previewUrl?: string, filename?: string) => {
    if (!filename) return false;
    return await uploadIfNeeded(previewUrl, filename);
  };

  const remove = (key: "coverPhoto" | "signMainPhoto" | { set: "A" | "B"; idx: number }) => {
    if (key === "coverPhoto") {
      setHeroUrl(undefined);
      setHeroFilename(undefined);
      onChange({ coverPhoto: undefined });
      return;
    }
    if (key === "signMainPhoto") {
      setSignMainUrl(undefined);
      setSignMainFilename(undefined);
      onChange({ signMainPhoto: undefined });
      return;
    }
    if (key.set === "A") {
      const arr = [...(v.setAPhotos || [])]; arr[key.idx] = undefined as any; onChange({ setAPhotos: arr });
      const u=[...setAUrl]; u[key.idx]=undefined; setSetAUrl(u);
      const f=[...setAFiles]; f[key.idx]=undefined; setSetAFiles(f);
      return;
    }
    if (key.set === "B") {
      const arr = [...(v.setBPhotos || [])]; arr[key.idx] = undefined as any; onChange({ setBPhotos: arr });
      const u=[...setBUrl]; u[key.idx]=undefined; setSetBUrl(u);
      const f=[...setBFiles]; f[key.idx]=undefined; setSetBFiles(f);
    }
  };

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
              <button type="button" className="px-3 py-2 rounded-md border border-blue-500 text-blue-600 text-sm hover:bg-blue-50" onClick={async () => {
                const ok = await uploadOne(heroUrl, heroFilename);
                if (ok && heroFilename) setHeroUrl(buildRemoteUrl(heroFilename));
              }}>อัปโหลดรูป</button>
              <button type="button" className="px-3 py-2 rounded-md border border-red-500 text-red-600 text-sm hover:bg-red-50" onClick={() => remove("coverPhoto")}>ลบ</button>
            </>
          ) : (
            <span className="text-sm text-gray-500">ยังไม่มีรูป</span>
          )}
        </div>
      </div>

      <div className="rounded border bg-white p-3">
        <div className="font-medium mb-2">รูปป้ายหลัก</div>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 rounded-md border border-blue-500 text-blue-600 px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer">เลือกรูป
            <input type="file" accept="image/*" className="hidden" onChange={(e) => pickFile(e, "signMainPhoto")} />
          </label>
          {signMainUrl ? (
            <>
              <img src={signMainUrl} className="max-h-40 object-contain" />
              <button type="button" className="px-3 py-2 rounded-md border border-blue-500 text-blue-600 text-sm hover:bg-blue-50" onClick={async () => {
                const ok = await uploadOne(signMainUrl, signMainFilename);
                if (ok && signMainFilename) setSignMainUrl(buildRemoteUrl(signMainFilename));
              }}>อัปโหลดรูป</button>
              <button type="button" className="px-3 py-2 rounded-md border border-red-500 text-red-600 text-sm hover:bg-red-50" onClick={() => remove("signMainPhoto")}>ลบ</button>
            </>
          ) : (
            <span className="text-sm text-gray-500">ยังไม่มีรูป</span>
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
                  <button type="button" className="px-3 py-2 rounded-md border border-blue-500 text-blue-600 text-sm hover:bg-blue-50" onClick={async () => {
                    const ok = await uploadOne(setAUrl[i], setAFiles[i]);
                    if (ok && setAFiles[i]) {
                      const arr = [...setAUrl]; arr[i] = buildRemoteUrl(setAFiles[i]!); setSetAUrl(arr);
                    }
                  }}>อัปโหลดรูป</button>
                  <button type="button" className="px-3 py-2 rounded-md border border-red-500 text-red-600 text-sm hover:bg-red-50" onClick={() => remove({ set: "A", idx: i })}>ลบ</button>
                </>
              ) : (
                <span className="text-sm text-gray-500">ยังไม่มีรูป</span>
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
                  <button type="button" className="px-3 py-2 rounded-md border border-blue-500 text-blue-600 text-sm hover:bg-blue-50" onClick={async () => {
                    const ok = await uploadOne(setBUrl[i], setBFiles[i]);
                    if (ok && setBFiles[i]) {
                      const arr = [...setBUrl]; arr[i] = buildRemoteUrl(setBFiles[i]!); setSetBUrl(arr);
                    }
                  }}>อัปโหลดรูป</button>
                  <button type="button" className="px-3 py-2 rounded-md border border-red-500 text-red-600 text-sm hover:bg-red-50" onClick={() => remove({ set: "B", idx: i })}>ลบ</button>
                </>
              ) : (
                <span className="text-sm text-gray-500">ยังไม่มีรูป</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default React.memo(Main1_PhotosComponent);
