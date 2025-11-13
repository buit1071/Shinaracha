"use client";

import * as React from "react";
import { showLoading } from "@/lib/loading";
import type { EquipmentRow, ServiceRow } from "@/interfaces/master";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import IconButton from "@mui/material/IconButton";
import {
    DataGrid,
    GridColDef,
    GridRenderCellParams
} from "@mui/x-data-grid";
import { TextField } from "@mui/material";
import CheckLabelForm from "@/components/check-form/forms/form1-3/CheckLabelForm";

// ---------- Props ----------
type Props = {
    jobId: string;
    onBack: () => void;
};

// ---------- Shared types ----------
type Option = { value: string; label: string };

export default function CheckForm({ jobId, onBack }: Props) {
    const backToList = () => setView(null);
    const [jobName, setjobName] = React.useState<string>("");
    const [selectedForm, setSelectedForm] = React.useState<Option | null>(null);
    const [rows, setRows] = React.useState<EquipmentRow[]>([]);
    const [searchText, setSearchText] = React.useState("");
    const [view, setView] = React.useState<null | { type: "detail"; id: string; equipment_id: string; name: string }>(null);

    const fetchJobName = async () => {
        try {
            const res = await fetch("/api/auth/job/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "jobById", job_id: jobId }),
            });

            const result = await res.json();
            if (result.success && result.data) {
                setjobName(result.data.job_name);
            }
        } catch (err) {
        }
    };

    const fecthEquipmentByJobId = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/job/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "equipmentByJobId", job_id: jobId }),
            });
            const data = await res.json();
            if (data.success) {
                setRows(data.data);
            }
        } catch (err) {
        } finally {
            showLoading(false);
        }
    };

    React.useEffect(() => {
        if (!jobId) return;
        fetchJobName();
        fecthEquipmentByJobId();
    }, [jobId]);

    const openDetail = React.useCallback((zone_id: string) => {
        const row = rows.find(r => r.zone_id === zone_id);
        if (!row) return;
        setView({ type: "detail", id: row.zone_id, equipment_id: row.equipment_id, name: row.equipment_name });
    }, [rows]);

    // เปิดฟอร์มตามที่เลือก (รองรับหลายฟอร์มในหน้าเดียว)
    const openForm = React.useCallback((row: EquipmentRow, formId: string) => {
        setView({ type: "detail", id: formId, equipment_id: row.equipment_id, name: row.equipment_name });
    }, []);

    const columns: GridColDef<EquipmentRow>[] = [
        {
            field: "order",
            headerName: "ลำดับ",
            width: 90,
            headerAlign: "center",
            align: "center",
            resizable: false,
        },
        {
            field: "equipment_name",
            headerName: "อุปกรณ์",
            flex: 2,              // 👈 กว้างสุด
            minWidth: 260,
            headerAlign: "center",
            align: "left",
            resizable: false,
            renderCell: (params: GridRenderCellParams<EquipmentRow>) => (
                <button
                    onClick={() => openDetail(params.row.zone_id)}
                    className="hover:no-underline text-blue-600 hover:opacity-80 cursor-pointer"
                    title="เปิดรายละเอียด"
                >
                    {params.row.equipment_name}
                </button>
            ),
        },
        {
            field: "zone_name",
            headerName: "การตรวจ",
            flex: 1.4,            // 👈 กว้างกว่าทั่วไป
            minWidth: 200,
            headerAlign: "center",
            align: "center",
            resizable: false,
        },
        {
            field: "actions",
            headerName: "การตรวจ",
            flex: 1.6,
            minWidth: 230,
            headerAlign: "center",
            align: "center",
            sortable: false,
            filterable: false,
            disableColumnMenu: true,
            renderCell: (params: GridRenderCellParams<EquipmentRow>) => (
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => openForm(params.row, "FORM-67554643")}
                        className="px-2 py-1 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs shadow cursor-pointer"
                        title="เปิดแบบฟอร์ม 1_3"
                    >
                        FORM 1_3
                    </button>
                    <button
                        type="button"
                        onClick={() => openForm(params.row, "FORM-62864268")}
                        className="px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs shadow cursor-pointer"
                        title="เปิดแบบฟอร์ม 1_9"
                    >
                        FORM 1_9
                    </button>
                </div>
            ),
        },
    ];

    // แก้ Encoding ของหัวคอลัมน์ให้เป็นภาษาไทยอ่านง่าย
    const columnsTh: GridColDef<EquipmentRow>[] = columns.map((c) => {
        if (c.field === "order") return { ...c, headerName: "ลำดับ" } as GridColDef<EquipmentRow>;
        if (c.field === "equipment_name") return { ...c, headerName: "อุปกรณ์" } as GridColDef<EquipmentRow>;
        if (c.field === "zone_name") return { ...c, headerName: "โซน" } as GridColDef<EquipmentRow>;
        if (c.field === "actions") return { ...c, headerName: "การตรวจ" } as GridColDef<EquipmentRow>;
        return c;
    });

    const filteredRows = rows
        .filter((row) =>
            Object.values(row).some((value) =>
                String(value).toLowerCase().includes(searchText.toLowerCase())
            )
        )
        .map((row, index) => ({
            ...row,
            order: index + 1,
        }));

    return (
        <>
            {view?.type === "detail" ? (
                <>
                    <CheckLabelForm formId={view.id} jobId={jobId} equipment_id={view.equipment_id} name={view.name} onBack={backToList} />
                </>
            ) : (
                <>
                    {/* Header bar */}
                    <div className="h-[6vh] flex items-center justify-between px-4 py-2 bg-white shadow-md mb-2 rounded-lg">
                        <div className="flex items-center">
                            <IconButton onClick={onBack} color="primary">
                                <ArrowBackIcon />
                            </IconButton>
                            <h2 className="text-xl font-bold text-blue-900 ml-5">{jobName}</h2>
                        </div>
                        <div className="flex gap-2 items-center">
                            <TextField
                                size="small"
                                placeholder="ค้นหา..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Content area */}
                    <div className="h-[88vh] w-full bg-white overflow-auto">
                        <DataGrid
                            sx={{
                                borderRadius: "0.5rem",
                                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                                "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": { outline: "none" },
                            }}
                            rows={filteredRows}
                            columns={columnsTh}
                            initialState={{ pagination: { paginationModel: { pageSize: 5, page: 0 } } }}
                            pageSizeOptions={[5, 10, 15]}
                            disableRowSelectionOnClick
                            getRowId={(row) => row.equipment_id}
                        />
                    </div>
                </>
            )}
        </>
    );
}

