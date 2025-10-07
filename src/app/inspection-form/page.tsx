"use client";

import * as React from "react";
import {
    DataGrid,
    GridColDef,
    GridRenderCellParams,
} from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import IconButton from "@mui/material/IconButton";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Switch,
} from "@mui/material";
import { formatDateTime, showAlert, showConfirm } from "@/lib/fetcher";
import { showLoading } from "@/lib/loading";
import { ServiceRow } from "@/interfaces/master";
import ServiceDetail from "@/components/inspection-form/ServiceDetail";

export default function InspectionFormPage() {
    const [view, setView] = React.useState<null | { type: "detail"; id: string }>(null);
    const openDetail = (id: string) => setView({ type: "detail", id });
    const backToList = () => setView(null);
    const [rows, setRows] = React.useState<ServiceRow[]>([]);
    const [searchText, setSearchText] = React.useState("");
    const [open, setOpen] = React.useState(false);
    const [isEdit, setIsEdit] = React.useState(false);
    const [error, setError] = React.useState(false);

    const [formData, setFormData] = React.useState<ServiceRow>({
        service_id: "",
        service_name: "",
        is_active: 1,
        created_by: "admin",
        updated_by: "admin",
    });

    // โหลดข้อมูลและจัดเรียงใหม่
    const fetchService = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/inspection-form/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // ถ้าต้องการกัน cache ฝั่งเบราว์เซอร์ เพิ่ม cache: "no-store"
                body: JSON.stringify({ function: "services" }),
            });

            const data = await res.json();
            if (data.success) {
                updateWithOrder(data.data || []);
            } else {
            }
        } catch (err) {
        } finally {
            showLoading(false);
        }
    };

    const updateWithOrder = (data: ServiceRow[]) => {
        const sorted = [...data].sort((a, b) =>
            new Date(b.updated_date || "").getTime() -
            new Date(a.updated_date || "").getTime()
        );
        const withOrder = sorted.map((row, index) => ({
            ...row,
            order: index + 1,
        }));
        setRows(withOrder);
    };

    React.useEffect(() => {
        fetchService();
    }, []);

    const handleOpenAdd = () => {
        setIsEdit(false);
        setFormData({
            service_id: "",
            service_name: "",
            is_active: 1,
            created_by: "admin",
            updated_by: "admin",
        });
        setOpen(true);
    };

    const handleOpenEdit = (row: ServiceRow) => {
        setIsEdit(true);
        setFormData(row);
        setOpen(true);
    };

    const handleClose = () => setOpen(false);

    const handleSave = async () => {
        // validate เบื้องต้น
        if (!formData.service_name?.trim()) {
            setError(true);
            return;
        }

        showLoading(true);
        try {
            const payload = {
                entity: "service" as const,
                data: {
                    service_id: formData.service_id || undefined, // มี = update, ไม่มี = insert
                    service_name: formData.service_name.trim(),
                    is_active: formData.is_active ?? 1,
                    created_by: formData.created_by || "admin",
                    updated_by: formData.updated_by || "admin",
                },
            };

            const res = await fetch("/api/auth/inspection-form/post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // cache: "no-store", // ถ้าต้องการกัน cache
                body: JSON.stringify(payload),
            });

            const result = await res.json();
            showLoading(false);

            if (result.success) {
                setOpen(false);                 // ปิด popup เมื่อสำเร็จ
                await showAlert("success", result.message);
                fetchService();                 // refresh ตาราง
            } else {
                await showAlert("error", result.message || "บันทึกล้มเหลว");
            }
        } catch (err) {
            setOpen(false);                   // ปิด popup แม้ error
            await showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            showLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = await showConfirm(
            "หากลบแล้วจะไม่สามารถนำกลับมาได้",
            "คุณต้องการลบข้อมูลนี้หรือไม่?"
        );
        if (!confirmed) return;
        showLoading(true);

        try {
            const res = await fetch(`/api/auth/inspection-form/delete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, function: "service" }),
            });

            const result = await res.json();
            if (result.success) {
                showLoading(false);
                await showAlert("success", result.message);
                fetchService();
            } else {
                showLoading(false);
                showAlert("error", result.message || "ลบข้อมูลล้มเหลว");
            }
        } catch (err) {
            showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            showLoading(false);
        }
    };

    const toggleStatus = async (row: ServiceRow) => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/inspection-form/post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    entity: "serviceActive",
                    data: {
                        service_id: row.service_id,
                        is_active: row.is_active === 1 ? 0 : 1,
                        updated_by: "admin",
                    },
                }),
            });

            const result = await res.json();
            showLoading(false);

            if (res.ok && result.success) {
                fetchService();
            } else {
            }
        } catch (err) {
            showLoading(false);
        }
    };

    const columns: GridColDef<ServiceRow>[] = [
        {
            field: "order",
            headerName: "ลำดับ",
            width: 90,
            headerAlign: "center",
            align: "center",
        },
        {
            field: "service_name",
            headerName: "บริการ",
            flex: 1,
            headerAlign: "center",
            align: "center",
            renderCell: (params: GridRenderCellParams<ServiceRow>) => (
                <button
                    onClick={() => openDetail(params.row.service_id)}
                    className="hover:no-underline text-blue-600 hover:opacity-80 cursor-pointer"
                    title="เปิดรายละเอียด"
                >
                    {params.row.service_name}
                </button>
            ),
        },
        {
            field: "created_date",
            headerName: "วันที่สร้าง",
            flex: 1,
            headerAlign: "center",
            align: "center",
            renderCell: (params) => formatDateTime(params.row.created_date),
        },
        {
            field: "updated_date",
            headerName: "อัปเดทล่าสุด",
            flex: 1,
            headerAlign: "center",
            align: "center",
            renderCell: (params) => formatDateTime(params.row.updated_date),
        },
        {
            field: "is_active",
            headerName: "สถานะ",
            flex: 1,
            headerAlign: "center",
            align: "center",
            renderCell: (params: GridRenderCellParams<ServiceRow>) => (
                <Switch
                    checked={params.row.is_active === 1}
                    onChange={() => toggleStatus(params.row)}
                    color="success"
                />
            ),
        },
        {
            field: "actions",
            headerName: "Action",
            sortable: false,
            filterable: false,
            disableColumnMenu: true,
            width: 150,
            headerAlign: "center",
            align: "center",
            renderCell: (params: GridRenderCellParams<ServiceRow>) => (
                <>
                    <IconButton color="primary" onClick={() => handleOpenEdit(params.row)}>
                        <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(params.row.service_id)}>
                        <DeleteIcon />
                    </IconButton></>
            ),
        },
    ];

    // Filter + reindex ใหม่
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
        <div className="w-full h-full flex flex-col bg-gray-50 justify-between">
            {view?.type === "detail" ? (
                <ServiceDetail serviceId={view.id} onBack={backToList} />
            ) : (
                <>
                    {/* Header Bar */}
                    <div className="h-[6vh] w-full bg-white shadow-md flex items-center justify-between px-4 text-black font-semibold rounded-lg">
                        บริการ
                        <div className="flex gap-2 items-center">
                            <TextField
                                size="small"
                                placeholder="ค้นหา..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                            <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleOpenAdd}>
                                เพิ่มข้อมูล
                            </Button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="h-[88vh] w-full bg-white">
                        <DataGrid
                            sx={{
                                borderRadius: "0.5rem",
                                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                                "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": {
                                    outline: "none",
                                },
                            }}
                            rows={filteredRows}
                            columns={columns.map((col) => ({ ...col, resizable: false }))}
                            initialState={{
                                pagination: { paginationModel: { pageSize: 5, page: 0 } },
                            }}
                            pageSizeOptions={[5, 10]}
                            disableRowSelectionOnClick
                            getRowId={(row) => row.service_id} // ใช้ service_id แทน id
                        />
                    </div>

                    {/* Dialog Popup */}
                    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md" sx={{ zIndex: 1000 }}>
                        <DialogTitle>{isEdit ? "แก้ไขข้อมูล" : "เพิ่มข้อมูล"}</DialogTitle>
                        <DialogContent dividers>
                            {isEdit && (
                                <TextField
                                    size="small"
                                    margin="dense"
                                    label="Service ID"
                                    fullWidth
                                    value={formData.service_id}
                                    disabled
                                />
                            )}

                            <TextField
                                size="small"
                                margin="dense"
                                label="บริการ"
                                fullWidth
                                required
                                value={formData.service_name}
                                onChange={(e) => {
                                    setFormData({ ...formData, service_name: e.target.value });
                                    if (error) setError(false);
                                }}
                                error={error && !formData.service_name}
                            />

                            <Box mt={2} display="flex" alignItems="center" gap={2}>
                                <span>สถานะ:</span>
                                <Switch
                                    checked={formData.is_active === 1}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            is_active: e.target.checked ? 1 : 0,
                                        })
                                    }
                                    color="success"
                                />
                                <span>{formData.is_active === 1 ? "ใช้งาน" : "ปิดการใช้งาน"}</span>
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleClose}>ยกเลิก</Button>
                            <Button variant="contained" color="primary" onClick={handleSave}>
                                บันทึก
                            </Button>
                        </DialogActions>
                    </Dialog>
                </>
            )}
        </div>
    );
}
