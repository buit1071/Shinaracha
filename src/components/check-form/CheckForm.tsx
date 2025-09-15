"use client";

import * as React from "react";
import Select, { SingleValue } from "react-select";
import { showLoading } from "@/lib/loading";
import type { SelectForm } from "@/interfaces/master";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import IconButton from "@mui/material/IconButton";
import CheckLabelForm from "@/components/check-form/forms/CheckLabelForm";

// ---------- Props ----------
type Props = {
    branchId: string;
    onBack: () => void;
};

// ---------- Shared types ----------
type Option = { value: string; label: string };
type FormProps = { branchId: string; onBack: () => void };

// ---------- ตัวอย่างฟอร์ม (แทนที่ด้วยฟอร์มจริงของคุณได้) ----------
// ---------- แผนที่ zone_id -> Component (เพิ่มได้เรื่อยๆ) ----------
const formRegistry: Record<string, React.FC<FormProps>> = {
    "SERZ-65707609": CheckLabelForm,
};

export default function CheckForm({ branchId, onBack }: Props) {
    const [forms, setForms] = React.useState<SelectForm[]>([]);
    const [selectedForm, setSelectedForm] = React.useState<Option | null>(null);
    const [showForm, setShowForm] = React.useState(false);

    // ทำ options ให้ label เป็น string เสมอ
    const formOptions: Option[] = (forms ?? []).map((p) => ({
        value: String(p.zone_id),
        label: String(p.zone_name ?? "ไม่ระบุโซน"),
    }));

    // โหลดรายการฟอร์มตามสาขา
    const fetchServiceZone = React.useCallback(async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/check-form/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "serviceZone", branch_id: branchId }),
            });
            const data = await res.json();
            if (data?.success) setForms(data.data || []);
            else setForms([]);
        } catch (err) {
            console.error("Fetch error:", err);
            setForms([]);
        } finally {
            showLoading(false);
        }
    }, [branchId]);

    // เปลี่ยนสาขา -> รีเซ็ตสถานะ + โหลดใหม่
    React.useEffect(() => {
        if (!branchId) return;
        setSelectedForm(null);
        setShowForm(false);
        fetchServiceZone();
    }, [branchId, fetchServiceZone]);

    const zoneId = selectedForm?.value;
    const ActiveForm = zoneId ? formRegistry[zoneId] : undefined;

    return (
        <>
            {/* Header bar */}
            <div className="h-[6vh] flex items-center justify-between px-4 py-2 bg-white shadow-md mb-2 rounded-lg">
                <div className="flex items-center">
                    <IconButton onClick={onBack} color="primary">
                        <ArrowBackIcon />
                    </IconButton>
                    <h2 className="text-xl font-bold text-gray-800 ml-5">ลงข้อมูลแบบฟอร์ม</h2>
                </div>

                <div className="flex gap-2 items-center">
                    <Select<Option, false>
                        options={formOptions}
                        value={selectedForm}
                        onChange={(opt: SingleValue<Option>) => {
                            setSelectedForm(opt ?? null);
                            setShowForm(!!opt); // เลือก = true, เคลียร์ = false
                        }}
                        placeholder="-- เลือกฟอร์มเอกสาร --"
                        isClearable
                        styles={{
                            container: (base) => ({
                                ...base,
                                width: 400,
                                flex: "0 0 400px",
                            }),
                            control: (base) => ({
                                ...base,
                                minHeight: 40,
                                fontSize: 14,
                            }),
                            option: (base, state) => ({
                                ...base,
                                color: "#000",
                                fontSize: 14,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                backgroundColor: state.isSelected
                                    ? "rgba(30,144,255,0.15)"
                                    : state.isFocused
                                        ? "rgba(30,144,255,0.08)"
                                        : base.backgroundColor,
                            }),
                            singleValue: (base) => ({ ...base, color: "#000", fontSize: 14 }),
                            input: (base) => ({ ...base, color: "#000", fontSize: 14 }),
                            placeholder: (base) => ({ ...base, color: "#666", fontSize: 14 }),
                            menu: (base) => ({ ...base, zIndex: 20 }),
                        }}
                    />
                </div>
            </div>

            {/* Content area */}
            <div className="h-[88vh] w-full bg-white overflow-auto">
                {!showForm ? (
                    <div className="h-full grid place-items-center text-gray-400">
                        เลือกฟอร์มเอกสารเพื่อเริ่มต้น
                    </div>
                ) : ActiveForm ? (
                    <CheckLabelForm />
                ) : (
                    <div className="h-full grid place-items-center text-gray-500">
                        ยังไม่มีฟอร์มสำหรับโซนนี้ ({zoneId})
                    </div>
                )}
            </div>
        </>
    );
}
