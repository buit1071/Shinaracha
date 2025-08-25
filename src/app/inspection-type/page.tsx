"use client";

import * as React from "react";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import {
    DataGrid,
    GridColDef,
    GridRenderCellParams,
} from "@mui/x-data-grid";
import {
    Button,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
} from "@mui/material";
import { InspectionTypeRow, ServiceRow } from "@/interfaces/master";
import { showLoading } from "@/lib/loading";
import { showAlert, showConfirm } from "@/lib/fetcher";

export default function InspectionTypePage() {
    const [services, setServices] = React.useState<ServiceRow[]>([]);
    const [typesByService, setTypesByService] = React.useState<Record<string, InspectionTypeRow[]>>({});
    const [searchTexts, setSearchTexts] = React.useState<Record<string, string>>({});
    const [open, setOpen] = React.useState(false);
    const [isEdit, setIsEdit] = React.useState(false);
    const [error, setError] = React.useState(false);

    const [formData, setFormData] = React.useState<InspectionTypeRow>({
        in_type_id: "",
        service_id: "",
        name: "",
        inspection_duration: 0,
        inspections_per_year: 0,
        is_active: 1,
        created_by: "admin",
        updated_by: "admin",
    });

    const handleSave = async () => {
        const invalidName = !formData.name?.trim();
        const invalidDuration =
            !Number.isFinite(formData.inspection_duration) || formData.inspection_duration <= 0;
        const invalidPerYear =
            !Number.isFinite(formData.inspections_per_year) || formData.inspections_per_year <= 0;
        const missingService = !formData.service_id?.trim(); // กันลืมผูก service

        if (invalidName || invalidDuration || invalidPerYear || missingService) {
            setError(true);
            if (missingService) await showAlert("warning", "ไม่พบ Service ของรายการนี้");
            else if (invalidName) await showAlert("warning", "กรุณากรอกชื่อ");
            else if (invalidDuration) await showAlert("warning", "กรุณากรอกระยะเวลาที่ใช้ในการตรวจมากกว่า 0");
            else if (invalidPerYear) await showAlert("warning", "กรุณากรอกจำนวนครั้งในการตรวจต่อปีมากกว่า 0");
            return;
        }

        showLoading(true);
        try {
            const res = await fetch("/api/auth/inspection-type", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const result = await res.json();
            showLoading(false);
            setOpen(false);

            if (result.success) {
                await showAlert("success", result.message);
                fetchInspectionData();
            } else {
                showAlert("error", result.message || "บันทึกล้มเหลว");
            }
        } catch (err) {
            console.error("Save error:", err);
            showLoading(false);
            setOpen(false);
            showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            showLoading(false);
        }
    };


    const handleOpenAdd = (service_id: string) => {
        setIsEdit(false);
        setError(false);
        setFormData({
            in_type_id: "",
            service_id,
            name: "",
            inspection_duration: 0,
            inspections_per_year: 0,
            is_active: 1,
            created_by: "admin",
            updated_by: "admin",
        });
        setOpen(true);
    };

    const handleOpenEdit = (row: InspectionTypeRow, service_id: string) => {
        setIsEdit(true);
        setError(false);
        setFormData({
            ...row,
            service_id,
            updated_by: "admin",
        });
        setOpen(true);
    };

    const handleClose = () => setOpen(false);

    const handleDelete = async (in_type_id: string) => {
        const confirmed = await showConfirm(
            "หากลบแล้วจะไม่สามารถนำกลับมาได้",
            "คุณต้องการลบข้อมูลนี้หรือไม่?"
        );
        if (!confirmed) return;
        showLoading(true);

        try {
            const res = await fetch(`/api/auth/inspection-type/${in_type_id}`, {
                method: "DELETE",
            });
            const result = await res.json();
            if (result.success) {
                showLoading(false);
                await showAlert("success", result.message);
                fetchInspectionData();
            } else {
                showLoading(false);
                showAlert("error", result.message || "ลบข้อมูลล้มเหลว");
            }
        } catch (err) {
            console.error("Delete error:", err);
            showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            // กันพลาดกรณี throw ระหว่าง alert
            showLoading(false);
        }
    };

    const getColumns = React.useCallback(
        (serviceId: string): GridColDef<InspectionTypeRow>[] => [
            {
                field: "name",
                headerName: "ชื่อ",
                flex: 1,
                minWidth: 300,
                headerAlign: "center",
                align: "left",
            },
            {
                field: "inspection_duration",
                headerName: "ระยะเวลาที่ใช้ (วัน)",
                minWidth: 200,
                headerAlign: "center",
                align: "center",
                valueGetter: (_v, r) => r.inspection_duration ?? 0,
            },
            {
                field: "inspections_per_year",
                headerName: "จำนวนครั้งในการตรวจต่อปี (ครั้ง/ปี)",
                minWidth: 250,
                headerAlign: "center",
                align: "center",
                valueGetter: (_v, r) => r.inspections_per_year ?? 0,
            },
            {
                field: "actions",
                headerName: "Action",
                sortable: false,
                width: 150,
                headerAlign: "center",
                align: "center",
                renderCell: (params) => (
                    <>
                        <IconButton color="primary" onClick={() => handleOpenEdit(params.row, serviceId)}>
                            <EditIcon />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleDelete(params.row.in_type_id)}>
                            <DeleteIcon />
                        </IconButton>
                    </>
                ),
            },
        ],
        [handleOpenEdit, handleDelete]
    );

    const fetchInspectionData = React.useCallback(async () => {
        showLoading(true);

        // ✅ ปล่อยเฟรมให้ DOM วาด overlay ให้ทัน
        await new Promise(requestAnimationFrame);

        const ctrl = new AbortController();
        try {
            const [srvRes, typeRes] = await Promise.all([
                fetch("/api/auth/inspection-form?active=true", { cache: "no-store", signal: ctrl.signal }),
                fetch("/api/auth/inspection-type?active=true", { cache: "no-store", signal: ctrl.signal }),
            ]);

            if (!srvRes.ok) throw new Error(`Service HTTP ${srvRes.status}`);
            if (!typeRes.ok) throw new Error(`Type HTTP ${typeRes.status}`);

            const [srvJson, typeJson] = await Promise.all([srvRes.json(), typeRes.json()]);

            const serviceRows: ServiceRow[] = Array.isArray(srvJson?.data)
                ? srvJson.data.map((d: any) => ({
                    service_id: d.service_id,
                    service_name: d.service_name ?? "",
                    is_active: Number(d.is_active ?? 0),
                    created_by: String(d.created_by ?? ""),
                    updated_by: String(d.updated_by ?? ""),
                    created_date: d.created_date,
                    updated_date: d.updated_date,
                    order: d.order ?? undefined,
                }))
                : [];

            const typeRows: InspectionTypeRow[] = Array.isArray(typeJson?.data)
                ? typeJson.data.map((d: any) => ({
                    in_type_id: d.in_type_id,
                    service_id: d.service_id,
                    name: d.name ?? d.inspection_type_name ?? "",
                    inspection_duration: Number(d.inspection_duration ?? 0),
                    inspections_per_year: Number(d.inspections_per_year ?? 0),
                    is_active: Number(d.is_active ?? 0),
                    created_by: String(d.created_by ?? ""),
                    updated_by: String(d.updated_by ?? ""),
                    created_date: d.created_date,
                    updated_date: d.updated_date,
                    order: d.order ?? undefined,
                }))
                : [];

            const grouped: Record<string, InspectionTypeRow[]> = {};
            for (const t of typeRows) {
                (grouped[t.service_id] ||= []).push(t);
            }

            setServices(serviceRows);
            setTypesByService(grouped);
        } catch (err: any) {
            if (err?.name !== "AbortError") {
                showAlert("error", err?.message || "โหลดข้อมูลไม่สำเร็จ");
            }
        } finally {
            showLoading(false); // ✅ ปิดโหลดเสมอ
        }

        // optional: return abort fn ถ้าจะใช้ร่วมกับ useEffect
        return () => ctrl.abort();
    }, [setServices, setTypesByService]);

    React.useEffect(() => {
        let cleanup: any;
        (async () => {
            cleanup = await fetchInspectionData();
        })();
        return () => {
            if (typeof cleanup === "function") cleanup();
        };
    }, [fetchInspectionData]);

    const getFilteredRows = React.useCallback(
        (serviceId: string): InspectionTypeRow[] => {
            const rows = typesByService[serviceId] || [];
            const q = (searchTexts[serviceId] || "").trim().toLowerCase();  // ⬅️ ใช้ของตัวเอง
            if (!q) return rows;
            return rows.filter(
                (r) =>
                    r.name.toLowerCase().includes(q) ||
                    String(r.inspection_duration ?? "").includes(q) ||
                    String(r.inspections_per_year ?? "").includes(q)
            );
        },
        [typesByService, searchTexts]
    );

    return (
        <div className="min-h-[94.9vh] bg-gray-50">
            <div className="grid gap-3 max-h-[calc(94.9vh-16px)] overflow-y-auto pr-2">
                {services.map((s) => {
                    const rows = getFilteredRows(s.service_id);
                    return (
                        <div
                            key={s.service_id}
                            className="bg-white rounded-lg shadow-md border border-gray-100"
                        >
                            <div className="h-[6vh] w-full bg-white shadow-sm flex items-center justify-between px-4 text-black font-semibold rounded-t-lg">
                                <span>Service : {s.service_name}</span>
                                <div className="flex gap-2 items-center">
                                    <TextField
                                        size="small"
                                        placeholder="ค้นหา..."
                                        value={searchTexts[s.service_id] ?? ""}  // ⬅️ state แยกต่อ service
                                        onChange={(e) =>
                                            setSearchTexts((prev) => ({ ...prev, [s.service_id]: e.target.value }))
                                        }
                                    />
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<AddIcon />}
                                        onClick={() => handleOpenAdd(s.service_id)}
                                    >
                                        เพิ่มข้อมูล
                                    </Button>
                                </div>
                            </div>

                            {/* ตารางลูกของ service นี้ */}
                            <div className="w-full bg-white p-3">
                                <DataGrid
                                    autoHeight
                                    rows={rows}
                                    columns={getColumns(s.service_id)}
                                    getRowId={(r) =>
                                        `${r.in_type_id}::${r.name}::${r.inspection_duration}::${r.inspections_per_year}`
                                    }
                                    disableRowSelectionOnClick
                                    density="compact"
                                    pageSizeOptions={[5, 10, 25, 50]}
                                    initialState={{
                                        pagination: { paginationModel: { pageSize: 10, page: 0 } },
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* Dialog Popup */}
            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md" sx={{ zIndex: 1000 }}>
                <DialogTitle>{isEdit ? "แก้ไขข้อมูล" : "เพิ่มข้อมูล"}</DialogTitle>
                <DialogContent dividers>
                    {isEdit && (
                        <TextField
                            size="small"
                            margin="dense"
                            label="ID"
                            fullWidth
                            value={formData.in_type_id}
                            disabled
                        />
                    )}

                    <TextField
                        size="small"
                        margin="dense"
                        label="ชื่อ"
                        fullWidth
                        required
                        value={formData.name}
                        onChange={(e) => {
                            setFormData({ ...formData, name: e.target.value });
                            if (error) setError(false);
                        }}
                        error={error && !formData.name}
                        helperText={error && !formData.name ? "กรุณากรอกชื่อ" : ""}
                    />
                    <TextField
                        size="small"
                        margin="dense"
                        label="ระยะเวลาที่ใช้ในการตรวจ (วัน)"
                        fullWidth
                        required
                        type="number"
                        inputProps={{ min: 1 }} // ป้องกันเลขติดลบ/ศูนย์จาก UI
                        value={formData.inspection_duration}
                        onChange={(e) => {
                            setFormData({ ...formData, inspection_duration: Number(e.target.value) });
                            if (error) setError(false);
                        }}
                        error={error && (!Number.isFinite(formData.inspection_duration) || formData.inspection_duration <= 0)}
                        helperText={
                            error && (!Number.isFinite(formData.inspection_duration) || formData.inspection_duration <= 0)
                                ? "กรุณากรอกระยะเวลาที่ใช้ในการตรวจมากกว่า 0"
                                : ""
                        }
                    />

                    <TextField
                        size="small"
                        margin="dense"
                        label="จำนวนครั้งในการตรวจต่อปี (ครั้ง/ปี)"
                        fullWidth
                        required
                        type="number"
                        inputProps={{ min: 1 }}
                        value={formData.inspections_per_year}
                        onChange={(e) => {
                            setFormData({ ...formData, inspections_per_year: Number(e.target.value) });
                            if (error) setError(false);
                        }}
                        error={error && (!Number.isFinite(formData.inspections_per_year) || formData.inspections_per_year <= 0)}
                        helperText={
                            error && (!Number.isFinite(formData.inspections_per_year) || formData.inspections_per_year <= 0)
                                ? "กรุณากรอกจำนวนครั้งในการตรวจต่อปีมากกว่า 0"
                                : ""
                        }
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>ยกเลิก</Button>
                    <Button variant="contained" color="primary" onClick={handleSave}>
                        บันทึก
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
