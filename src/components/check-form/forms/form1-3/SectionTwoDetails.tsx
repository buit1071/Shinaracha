import * as React from "react";

/* ---------- Reusable Image Upload (single) ---------- */
function ImageField({
    label,
    value,
    onChange,
    hint,
    square = false,
    width = 600,
    height = 300,
    className = "-",
}: {
    label: string;
    value: string | null;
    onChange: (v: string | null) => void;
    hint?: string;
    square?: boolean;
    width?: number;
    height?: number;
    className?: string;
}) {
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const url = URL.createObjectURL(f);
        onChange(url);
    };

    const clear = () => onChange(null);

    // คำนวณขนาดกล่องแสดงรูป
    const boxW = width;
    const boxH = square ? Math.min(width, height) : height;

    return (
        <div className={`space-y-2 ${className}`}>
            <div className="text-sm font-medium text-gray-800">{label}</div>

            <div className="rounded-md p-3 bg-gray-50 flex flex-col items-center">
                <div
                    className="rounded-md bg-gray-200 grid place-items-center overflow-hidden w-full"
                    style={{
                        maxWidth: boxW,   // ความกว้างสูงสุดของกรอบ
                        width: "100%",
                        height: boxH,     // ความสูงกรอบ (เช่น 400)
                        outline: "1px solid rgba(0,0,0,0.08)",
                    }}
                >
                    {value ? (
                        <img
                            src={value}
                            alt={label}
                            className="h-full w-auto max-w-full object-contain"
                            style={{ display: "block" }} // กัน inline-gap เล็กๆ
                        />
                    ) : (
                        <div className="text-gray-600 text-sm text-center px-4">
                            ยังไม่มีรูปอัปโหลด
                            {hint ? <div className="text-xs text-gray-500 mt-1">{hint}</div> : null}
                        </div>
                    )}
                </div>

                <div className="mt-3 flex gap-2">
                    <label className="inline-flex items-center gap-2 rounded-md border border-blue-500 text-blue-600 px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer">
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/*"
                            onChange={pick}
                            className="hidden"
                        />
                        อัปโหลดรูป
                    </label>

                    {value && (
                        <button
                            type="button"
                            onClick={clear}
                            className="ml-2 inline-flex items-center rounded-md px-3 py-2 text-sm
                         border border-red-500 text-red-600 hover:bg-red-50
                         focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1 cursor-pointer"
                        >
                            ล้างรูป
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ---------- Reusable Image Gallery (multi) ---------- */
function ImageGallery({
    label,
    values,
    onChange,
    hint,
    single = false,                 // ✅ เพิ่มโหมด single
}: {
    label: string;
    values: string[];
    onChange: (urls: string[]) => void;
    hint?: string;
    single?: boolean;
}) {
    const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;
        const urls = files.map((f) => URL.createObjectURL(f));
        onChange(single ? [urls[0]] : [...values, ...urls]);  // ✅ โหมด single เก็บรูปเดียว
    };

    const removeAt = (idx: number) => {
        const next = values.slice();
        // URL.revokeObjectURL(next[idx]); // ถ้าต้องการเคลียร์ URL เก่า
        next.splice(idx, 1);
        onChange(next);
    };

    return (
        <div className="space-y-2">
            <div className="text-sm font-medium text-gray-800">{label}</div>
            <div className="rounded-md p-3 bg-gray-50">
                {hint ? <div className="text-xs text-gray-500 mb-2">{hint}</div> : null}

                <div className="flex items-center gap-3 justify-center">
                    {values.slice(0, 1).map((src, i) => (
                        <div key={i} className="relative">
                            <img
                                src={src}
                                alt={`${label}-${i}`}
                                className="w-[220px] h-[160px] object-contain bg-white rounded-md border"
                            />
                            <button
                                type="button"
                                onClick={() => removeAt(i)}
                                className="absolute -top-2 -right-2 rounded-full bg-red-600 text-white w-7 h-7 text-xs cursor-pointer"
                                title="ลบรูป"
                            >
                                ✕
                            </button>
                        </div>
                    ))}

                    {/* ปุ่มเพิ่ม/เปลี่ยนรูป: ซ่อนเมื่อมีรูปแล้วในโหมด single */}
                    {!(single && values.length >= 1) && (
                        <label className="inline-flex items-center gap-2 rounded-md border border-blue-500 text-blue-600 px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer">
                            <input
                                type="file"
                                accept="image/*"
                                multiple={!single}               // ✅ single = ไม่ multiple
                                onChange={pick}
                                className="hidden"
                            />
                            เพิ่มรูป
                        </label>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ========================== SECTION TWO ========================== */
export default function SectionTwoDetails() {
    // 5.1 ข้อมูลป้ายและสถานที่ตั้ง
    const [signName, setSignName] = React.useState("-");
    const [addrNo, setAddrNo] = React.useState("-");
    const [addrAlley, setAddrAlley] = React.useState("-");
    const [addrRoad, setAddrRoad] = React.useState("-");
    const [subDistrict, setSubDistrict] = React.useState("-");
    const [district, setDistrict] = React.useState("-");
    const [province, setProvince] = React.useState("-");
    const [zip, setZip] = React.useState("-");
    const [tel, setTel] = React.useState("-");
    const [fax, setFax] = React.useState("-");
    const [permitDay, setPermitDay] = React.useState("-");
    const [permitMonth, setPermitMonth] = React.useState("-");
    const [permitYear, setPermitYear] = React.useState("-");
    const [inspectDay2, setInspectDay2] = React.useState("-");
    const [inspectMonth2, setInspectMonth2] = React.useState("-");
    const [inspectYear2, setInspectYear2] = React.useState("-");
    const [inspectDay3, setInspectDay3] = React.useState("-");
    const [inspectMonth3, setInspectMonth3] = React.useState("-");
    const [inspectYear3, setInspectYear3] = React.useState("-");
    const [hasOriginalPlan, setHasOriginalPlan] = React.useState<boolean>(false);
    const [noOriginalPlan, setNoOriginalPlan] = React.useState<boolean>(false);
    const [noPermitInfo, setNoPermitInfo] = React.useState<boolean>(false);
    const [noOld, setNoOld] = React.useState<boolean>(false);
    const [signAge, setSignAge] = React.useState<string>("");
    const [mapSketch, setMapSketch] = React.useState<string | null>(null);
    const [shapeSketch, setShapeSketch] = React.useState<string | null>(null);
    const [photosFront, setPhotosFront] = React.useState<string[]>([]);
    const [photosSide, setPhotosSide] = React.useState<string[]>([]);
    const [photosBase, setPhotosBase] = React.useState<string[]>([]);
    const [recorder2, setRecorder2] = React.useState<string>("");
    const [recorder3, setRecorder3] = React.useState<string>("");

    // 5.2 ประเภทของป้าย
    const [typeGround, setTypeGround] = React.useState<boolean>(false); // ✔
    const [typeRooftop, setTypeRooftop] = React.useState<boolean>(false);
    const [typeOnRoof, setTypeOnRoof] = React.useState<boolean>(false);
    const [typeOnBuilding, setTypeOnBuilding] = React.useState<boolean>(false);
    const [typeOtherChecked, setTypeOtherChecked] = React.useState(false);
    const [typeOther, setTypeOther] = React.useState<string>("");

    // 5.3 ข้อมูลเจ้าของ/ผู้ออกแบบ และ 5.3.1 ชื่อผลิตภัณฑ์/ข้อความบนป้าย
    const [productText, setProductText] = React.useState("-");
    const [ownerName, setOwnerName] = React.useState("-");
    const [ownerNo, setOwnerNo] = React.useState("-");
    const [ownerMoo, setOwnerMoo] = React.useState("-");
    const [ownerAlley, setOwnerAlley] = React.useState("-");
    const [ownerRoad, setOwnerRoad] = React.useState("-");
    const [ownerSub, setOwnerSub] = React.useState("-");
    const [ownerDist, setOwnerDist] = React.useState("-");
    const [ownerProv, setOwnerProv] = React.useState("-");
    const [ownerZip, setOwnerZip] = React.useState("-");
    const [ownerTel, setOwnerTel] = React.useState("-");
    const [ownerFax, setOwnerFax] = React.useState("-");
    const [ownerEmail, setOwnerEmail] = React.useState("-");
    const [designerName, setDesignerName] = React.useState("-");
    const [designerLicense, setDesignerLicense] = React.useState("-");

    // 5.4 วัสดุ/รายละเอียด
    const [matSteel, setMatSteel] = React.useState<boolean>(false);
    const [matWood, setMatWood] = React.useState<boolean>(false);
    const [matStainless, setMatStainless] = React.useState<boolean>(false);
    const [matRCC, setMatRCC] = React.useState<boolean>(false);
    const [matOtherChecked, setMatOtherChecked] = React.useState(false);
    const [matOther, setMatOther] = React.useState<string>("");
    const [panelMaterial, setPanelMaterial] = React.useState("-");
    const [panelFaces, setPanelFaces] = React.useState<string>("-");
    const [panelOpenings, setPanelOpenings] = React.useState<"" | "มี" | "ไม่มี">("");
    const [panelOther, setPanelOther] = React.useState<string>("-");
    const [chkMat, setChkMat] = React.useState(false);
    const [chkFaces, setChkFaces] = React.useState(false);
    const [chkOpen, setChkOpen] = React.useState(false);
    const [chkOther, setChkOther] = React.useState(false);

    return (
        <div className="text-black leading-7 space-y-8 p-2">
            <p className="text-sm text-gray-700">
                ข้อมูลทั่วไปของป้ายที่ผู้ตรวจสอบต้องลงบันทึกในหัวข้อต่าง ๆ และอาจเพิ่มเติมได้เพื่อให้ข้อมูลสมบูรณ์ยิ่งขึ้น
                ในบางรายการจะต้องประสานงานกับเจ้าของป้ายและผู้ดูแลป้ายเพื่อให้ได้ข้อมูลเหล่านั้น
            </p>

            {/* 5.1 ข้อมูลป้ายและสถานที่ตั้งป้าย */}
            <section className="space-y-4">
                <h3 className="text-lg font-semibold">5.1 ข้อมูลป้ายและสถานที่ตั้งป้าย</h3>

                <div className="grid md:grid-cols-4 gap-3">
                    {/* แถว 1 */}
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">ชื่อป้าย (ถ้ามี)</label>
                        <input
                            className="w-full border rounded-md px-3 py-2"
                            value={signName}
                            onChange={(e) => setSignName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">เลขที่</label>
                        <input
                            className="w-full border rounded-md px-3 py-2"
                            value={addrNo}
                            onChange={(e) => setAddrNo(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">ตรอก/ซอย</label>
                        <input
                            className="w-full border rounded-md px-3 py-2"
                            value={addrAlley}
                            onChange={(e) => setAddrAlley(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">ถนน</label>
                        <input
                            className="w-full border rounded-md px-3 py-2"
                            value={addrRoad}
                            onChange={(e) => setAddrRoad(e.target.value)}
                        />
                    </div>

                    {/* แถว 2 */}
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">ตำบล/แขวง</label>
                        <input
                            className="w-full border rounded-md px-3 py-2"
                            value={subDistrict}
                            onChange={(e) => setSubDistrict(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">อำเภอ/เขต</label>
                        <input
                            className="w-full border rounded-md px-3 py-2"
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">จังหวัด</label>
                        <input
                            className="w-full border rounded-md px-3 py-2"
                            value={province}
                            onChange={(e) => setProvince(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">รหัสไปรษณีย์</label>
                        <input
                            className="w-full border rounded-md px-3 py-2"
                            value={zip}
                            onChange={(e) => setZip(e.target.value)}
                        />
                    </div>

                    {/* แถว 3 (2 ช่อง + เว้นว่าง 2 ช่อง) */}
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">โทรศัพท์</label>
                        <input
                            className="w-full border rounded-md px-3 py-2"
                            value={tel}
                            onChange={(e) => setTel(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">โทรสาร</label>
                        <input
                            className="w-full border rounded-md px-3 py-2"
                            value={fax}
                            onChange={(e) => setFax(e.target.value)}
                        />
                    </div>
                    <div></div> {/* ช่องว่าง */}
                    <div></div> {/* ช่องว่าง */}
                </div>

                {/* === กล่องข้อมูลใบอนุญาต + เงื่อนไข === */}
                <div className="rounded-md border border-gray-300 p-4 text-gray-800">
                    {/* บรรทัดหัวข้อความยาว */}
                    <div className="text-sm">
                        ได้รับใบอนุญาตก่อสร้างจากเจ้าพนักงานท้องถิ่น
                        <span className="ml-1">เมื่อวันที่</span>

                        {/* อินไลน์: วันที่ / เดือน / พ.ศ. (เส้นปะ) */}
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            className="mx-2 w-12 bg-transparent border-0 border-b border-dashed border-gray-400 
                 focus:outline-none focus:ring-0 text-center placeholder-gray-400"
                            value={permitDay}
                            onChange={(e) => setPermitDay(e.target.value.replace(/\D/g, "-"))}
                        />
                        <span>เดือน</span>
                        <input
                            type="text"
                            className="mx-2 w-36 bg-transparent border-0 border-b border-dashed border-gray-400 
                 focus:outline-none focus:ring-0 text-center placeholder-gray-400"
                            value={permitMonth}
                            onChange={(e) => setPermitMonth(e.target.value)}
                        />
                        <span>พ.ศ.</span>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={4}
                            className="ml-2 w-16 bg-transparent border-0 border-b border-dashed border-gray-400 
                 focus:outline-none focus:ring-0 text-center placeholder-gray-400"
                            value={permitYear}
                            onChange={(e) => setPermitYear(e.target.value.replace(/\D/g, "-"))}
                        />
                    </div>

                    {/* เช็กบ็อกซ์เรียงลงมา */}
                    <div className="mt-3 space-y-2 text-sm">
                        <label className="flex items-start gap-2">
                            <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={hasOriginalPlan}
                                onChange={(e) => setHasOriginalPlan(e.target.checked)}
                            />
                            <span>มีแบบแปลนเดิม</span>
                        </label>

                        <label className="flex items-start gap-2 leading-relaxed">
                            <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={noOriginalPlan}
                                onChange={(e) => setNoOriginalPlan(e.target.checked)}
                            />
                            <span>
                                ไม่มีแบบแปลนเดิม (กรณีที่ไม่มีแบบแปลนหรือแผนผังรายการเกี่ยวกับการก่อสร้าง ให้เจ้าของป้ายจัดหา
                                หรือจัดทำแบบแปลนสำหรับใช้ในการตรวจสอบป้ายและอุปกรณ์ประกอบของป้ายให้กับผู้ตรวจสอบอาคาร)
                            </span>
                        </label>

                        <label className="flex items-start gap-2">
                            <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={noPermitInfo}
                                onChange={(e) => setNoPermitInfo(e.target.checked)}
                            />
                            <span>ไม่มีข้อมูลการได้รับใบอนุญาตก่อสร้างจากเจ้าพนักงานท้องถิ่น</span>
                        </label>

                        {/* อายุของป้าย (เส้นปะ) */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={noOld}
                                onChange={(e) => {
                                    const v = e.target.checked;
                                    setNoOld(v);
                                    if (!v) setSignAge("-");
                                }}
                            />
                            <span>อายุของป้าย</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                className={`w-20 bg-transparent border-0 border-b border-dashed text-center
                    focus:outline-none focus:ring-0
                    ${noOld ? 'border-gray-400' : 'border-gray-200 text-gray-400'}`}
                                value={signAge}
                                onChange={(e) => setSignAge(e.target.value.replace(/\D/g, "-"))}
                                disabled={!noOld}
                            />
                            <span>ปี</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                    <span>วัน/เดือน/ปี ที่ตรวจสอบ</span>
                    {/* วัน */}
                    <input
                        type="text"
                        inputMode="numeric"
                        maxLength={2}
                        className="w-10 bg-transparent border-0 border-b border-dashed border-gray-400
               focus:outline-none focus:ring-0 text-center"
                        value={inspectDay2}
                        onChange={(e) => setInspectDay2(e.target.value.replace(/\D/g, "-"))}
                    />
                    <span>เดือน</span>
                    {/* เดือน */}
                    <input
                        type="text"
                        className="w-28 bg-transparent border-0 border-b border-dashed border-gray-400
               focus:outline-none focus:ring-0 text-center"
                        value={inspectMonth2}
                        onChange={(e) => setInspectMonth2(e.target.value)}
                    />
                    <span>พ.ศ.</span>
                    {/* ปี */}
                    <input
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        className="w-16 bg-transparent border-0 border-b border-dashed border-gray-400
               focus:outline-none focus:ring-0 text-center"
                        value={inspectYear2}
                        onChange={(e) => setInspectYear2(e.target.value.replace(/\D/g, "-"))}
                    />
                    <span>บันทึกโดย</span>
                    <input
                        type="text"
                        className="flex-1 bg-transparent border-0 border-b border-dashed border-gray-400
               focus:outline-none focus:ring-0 px-2"
                        value={recorder2}
                        onChange={(e) => setRecorder2(e.target.value)}
                    />
                </div>
                <ImageField
                    label="แผนที่แสดงตำแหน่งที่ตั้งของป้ายโดยสังเขป"
                    value={mapSketch}
                    onChange={setMapSketch}
                    hint="อัปโหลดภาพแผนที่โดยสังเขป"
                />
            </section>

            <section className="space-y-4">
                <div className="sm:grid-cols-2 gap-3 flex flex-col">
                    <div className="flex items-center gap-2 text-sm">
                        <span>วัน/เดือน/ปี ที่ตรวจสอบ</span>
                        {/* วัน */}
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            className="w-10 bg-transparent border-0 border-b border-dashed border-gray-400
               focus:outline-none focus:ring-0 text-center"
                            value={inspectDay3}
                            onChange={(e) => setInspectDay3(e.target.value.replace(/\D/g, "-"))}
                        />
                        <span>เดือน</span>
                        {/* เดือน */}
                        <input
                            type="text"
                            className="w-28 bg-transparent border-0 border-b border-dashed border-gray-400
               focus:outline-none focus:ring-0 text-center"
                            value={inspectMonth3}
                            onChange={(e) => setInspectMonth3(e.target.value)}
                        />
                        <span>พ.ศ.</span>
                        {/* ปี */}
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={4}
                            className="w-16 bg-transparent border-0 border-b border-dashed border-gray-400
               focus:outline-none focus:ring-0 text-center"
                            value={inspectYear3}
                            onChange={(e) => setInspectYear3(e.target.value.replace(/\D/g, "-"))}
                        />
                        <span>บันทึกโดย</span>
                        <input
                            type="text"
                            className="flex-1 bg-transparent border-0 border-b border-dashed border-gray-400
               focus:outline-none focus:ring-0 px-2"
                            value={recorder3}
                            onChange={(e) => setRecorder3(e.target.value)}
                        />
                    </div>

                    <ImageField
                        label="รูปแบบและขนาดของแผ่นป้าย / สิ่งที่สร้างขึ้น (สเก็ตช์โดยสังเขป)"
                        value={shapeSketch}
                        onChange={setShapeSketch}
                        square
                    />
                </div>
            </section>

            <section className="space-y-4">
                <div className="grid md:grid-cols-3 gap-6">
                    <ImageGallery
                        label="รูปถ่ายป้าย - ด้านหน้าป้าย"
                        values={photosFront}
                        onChange={setPhotosFront}
                        single
                    />
                    <ImageGallery
                        label="รูปถ่ายป้าย - ด้านข้างของป้าย"
                        values={photosSide}
                        onChange={setPhotosSide}
                        single
                    />
                    <ImageGallery
                        label="รูปถ่ายป้าย - ส่วนฐานของป้าย"
                        values={photosBase}
                        onChange={setPhotosBase}
                        single
                    />
                </div>
            </section>

            {/* 5.2 ประเภทของป้าย */}
            <section className="space-y-3">
                <h3 className="text-lg font-semibold">5.2 ประเภทของป้าย</h3>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                    <label className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={typeGround} onChange={(e) => setTypeGround(e.target.checked)} />
                        ป้ายที่ติดตั้งบนพื้นดิน
                    </label>
                    <label className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={typeRooftop} onChange={(e) => setTypeRooftop(e.target.checked)} />
                        ป้ายบนดาดฟ้าอาคาร
                    </label>
                    <label className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={typeOnRoof} onChange={(e) => setTypeOnRoof(e.target.checked)} />
                        ป้ายบนหลังคา
                    </label>
                    <label className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={typeOnBuilding} onChange={(e) => setTypeOnBuilding(e.target.checked)} />
                        ป้ายบนส่วนหนึ่งส่วนใดของอาคาร
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            id="typeOther"
                            type="checkbox"
                            checked={typeOtherChecked}
                            onChange={(e) => {
                                const v = e.target.checked;
                                setTypeOtherChecked(v);
                                if (!v) setTypeOther("-"); // เอาติ๊กออก → เคลียร์ค่า
                            }}
                        />
                        <label htmlFor="typeOther" className="select-none">อื่นๆ (โปรดระบุ)</label>

                        <input
                            type="text"
                            className={`flex-1 bg-transparent border-0 border-b border-dashed
                focus:outline-none focus:ring-0 px-1
                ${typeOtherChecked ? 'border-gray-400' : 'border-gray-200 text-gray-400'}`}
                            value={typeOther}
                            onChange={(e) => setTypeOther(e.target.value)}
                            disabled={!typeOtherChecked}
                        />
                    </div>
                </div>
            </section>

            {/* 5.3 เจ้าของป้าย / ผู้ออกแบบ */}
            <section className="space-y-4">
                <h3 className="text-lg font-semibold">5.3 ชื่อเจ้าของหรือผู้ครอบครองป้าย และผู้ออกแบบด้านวิศวกรรมโครงสร้าง</h3>

                <div>
                    <label className="block text-sm text-gray-600 mb-1">5.3.1 ชื่อผลิตภัณฑ์โฆษณาหรือข้อความในป้าย</label>
                    <textarea
                        rows={3}
                        className="w-full border rounded-md px-3 py-2"
                        value={productText}
                        onChange={(e) => setProductText(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-800">5.3.2 เจ้าของหรือผู้ครอบครองป้าย</div>
                    <div className="grid md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">ชื่อ</label>
                            <input className="w-full border rounded-md px-3 py-2" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">เลขที่</label>
                                <input className="w-full border rounded-md px-3 py-2" value={ownerNo} onChange={(e) => setOwnerNo(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">หมู่ที่</label>
                                <input className="w-full border rounded-md px-3 py-2" value={ownerMoo} onChange={(e) => setOwnerMoo(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">ตรอก/ซอย</label>
                                <input className="w-full border rounded-md px-3 py-2" value={ownerAlley} onChange={(e) => setOwnerAlley(e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">ถนน</label>
                            <input className="w-full border rounded-md px-3 py-2" value={ownerRoad} onChange={(e) => setOwnerRoad(e.target.value)} />
                        </div>
                        <div className="grid md:grid-cols-3 gap-2">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">ตำบล/แขวง</label>
                                <input className="w-full border rounded-md px-3 py-2" value={ownerSub} onChange={(e) => setOwnerSub(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">อำเภอ/เขต</label>
                                <input className="w-full border rounded-md px-3 py-2" value={ownerDist} onChange={(e) => setOwnerDist(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">จังหวัด</label>
                                <input className="w-full border rounded-md px-3 py-2" value={ownerProv} onChange={(e) => setOwnerProv(e.target.value)} />
                            </div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-2">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">รหัสไปรษณีย์</label>
                                <input className="w-full border rounded-md px-3 py-2" value={ownerZip} onChange={(e) => setOwnerZip(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">โทรศัพท์</label>
                                <input className="w-full border rounded-md px-3 py-2" value={ownerTel} onChange={(e) => setOwnerTel(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">โทรสาร</label>
                                <input className="w-full border rounded-md px-3 py-2" value={ownerFax} onChange={(e) => setOwnerFax(e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">อีเมล</label>
                            <input className="w-full border rounded-md px-3 py-2" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">5.3.3 ผู้ออกแบบด้านวิศวกรรมโครงสร้าง (ชื่อ)</label>
                        <input className="w-full border rounded-md px-3 py-2" value={designerName} onChange={(e) => setDesignerName(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">ใบอนุญาตทะเบียนเลขที่</label>
                        <input className="w-full border rounded-md px-3 py-2" value={designerLicense} onChange={(e) => setDesignerLicense(e.target.value)} />
                    </div>
                </div>
            </section>

            {/* 5.4 ประเภทวัสดุ/รายละเอียดแผ่นป้าย */}
            <section className="space-y-4">
                <h3 className="text-lg font-semibold">5.4 ประเภทของวัสดุและรายละเอียดของแผ่นป้าย</h3>

                <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-800">5.4.1 ประเภทวัสดุของสิ่งที่สร้างขึ้นสำหรับติดหรือตั้งป้าย</div>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                        <label className="inline-flex items-center gap-2">
                            <input type="checkbox" checked={matSteel} onChange={(e) => setMatSteel(e.target.checked)} />
                            เหล็กโครงสร้างรูปพรรณ
                        </label>
                        <label className="inline-flex items-center gap-2">
                            <input type="checkbox" checked={matWood} onChange={(e) => setMatWood(e.target.checked)} />
                            ไม้
                        </label>
                        <label className="inline-flex items-center gap-2">
                            <input type="checkbox" checked={matStainless} onChange={(e) => setMatStainless(e.target.checked)} />
                            สเตนเลส
                        </label>
                        <label className="inline-flex items-center gap-2">
                            <input type="checkbox" checked={matRCC} onChange={(e) => setMatRCC(e.target.checked)} />
                            คอนกรีตเสริมเหล็ก
                        </label>
                        <div className="flex items-center gap-2 sm:col-span-2">
                            <input
                                id="matOther"
                                type="checkbox"
                                checked={matOtherChecked}
                                onChange={(e) => {
                                    const v = e.target.checked;
                                    setMatOtherChecked(v);
                                    if (!v) setMatOther(""); // เอาติ๊กออก → เคลียร์ค่า
                                }}
                            />
                            <label htmlFor="matOther" className="select-none">อื่น ๆ</label>

                            <input
                                type="text"
                                placeholder="โปรดระบุ"
                                className={`flex-1 bg-transparent border-0 border-b border-dashed px-1
                focus:outline-none focus:ring-0
                ${matOtherChecked ? 'border-gray-400'
                                        : 'border-gray-200 text-gray-400'}`}
                                value={matOther}
                                onChange={(e) => setMatOther(e.target.value)}
                                disabled={!matOtherChecked}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-800">5.4.2 รายละเอียดของแผ่นป้าย</div>
                    <div className="space-y-2">
                        {/* วัสดุของป้าย */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={chkMat}
                                onChange={(e) => {
                                    const v = e.target.checked;
                                    setChkMat(v);
                                    if (!v) setPanelMaterial("-");
                                }}
                            />
                            <span>วัสดุของป้าย (โปรดระบุ)</span>
                            <input
                                type="text"
                                placeholder=""
                                className={`flex-1 bg-transparent border-0 border-b border-dashed px-1
                  focus:outline-none focus:ring-0
                  ${chkMat ? "border-gray-400" : "border-gray-200 text-gray-400"}`}
                                value={panelMaterial}
                                onChange={(e) => setPanelMaterial(e.target.value)}
                                disabled={!chkMat}
                            />
                        </div>

                        {/* จำนวนด้านที่ติดป้าย */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={chkFaces}
                                onChange={(e) => {
                                    const v = e.target.checked;
                                    setChkFaces(v);
                                    if (!v) setPanelFaces("-");
                                }}
                            />
                            <span>จำนวนด้านที่ติดป้าย ป้าย (โปรดระบุจำนวนด้าน)</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={2}
                                className={`w-16 text-center bg-transparent border-0 border-b border-dashed
                  focus:outline-none focus:ring-0
                  ${chkFaces ? "border-gray-400" : "border-gray-200 text-gray-400"}`}
                                value={panelFaces}
                                onChange={(e) => setPanelFaces(e.target.value.replace(/\D/g, ""))}
                                disabled={!chkFaces}
                            />
                            <span>ด้าน</span>
                        </div>

                        {/* การเจาะช่องเปิดในป้าย */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={chkOpen}
                                    onChange={(e) => {
                                        const v = e.target.checked;
                                        setChkOpen(v);
                                        if (!v) setPanelOpenings("");
                                    }}
                                />
                                <span>การเจาะช่องเปิดในป้าย</span>
                            </div>

                            {/* ทำเป็น checkbox คู่ (เลือกได้ทีละตัว โดยสลับกันเอง) */}
                            <label className="inline-flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    disabled={!chkOpen}
                                    checked={chkOpen && panelOpenings === "มี"}
                                    onChange={(e) =>
                                        setPanelOpenings(e.target.checked ? "มี" : "")
                                    }
                                />
                                มี
                            </label>
                            <label className="inline-flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    disabled={!chkOpen}
                                    checked={chkOpen && panelOpenings === "ไม่มี"}
                                    onChange={(e) =>
                                        setPanelOpenings(e.target.checked ? "ไม่มี" : "")
                                    }
                                />
                                ไม่มี
                            </label>
                        </div>

                        {/* อื่น ๆ */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={chkOther}
                                onChange={(e) => {
                                    const v = e.target.checked;
                                    setChkOther(v);
                                    if (!v) setPanelOther("-");
                                }}
                            />
                            <span>อื่น ๆ (โปรดระบุ)</span>
                            <input
                                type="text"
                                className={`flex-1 bg-transparent border-0 border-b border-dashed px-1
                  focus:outline-none focus:ring-0
                  ${chkOther ? "border-gray-400" : "border-gray-200 text-gray-400"}`}
                                value={panelOther}
                                onChange={(e) => setPanelOther(e.target.value)}
                                disabled={!chkOther}
                            />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
