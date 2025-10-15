"use client";

import * as React from "react";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import {
    DataGrid,
    GridColDef,
    GridRenderCellParams
} from "@mui/x-data-grid";
import {
    Button,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Switch,
    Box
} from "@mui/material";
import { ServiceRow } from "@/interfaces/master";
import { showLoading } from "@/lib/loading";
import { showAlert } from "@/lib/fetcher";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function InspectionTypePage() {
    const user = useCurrentUser();
    const username = React.useMemo(
        () => (user ? `${user.first_name_th} ${user.last_name_th}` : ""),
        [user]
    );
    const [rows, setRows] = React.useState<ServiceRow[]>([]);
    const [searchText, setSearchText] = React.useState("");
    const [open, setOpen] = React.useState(false);
    const [isEdit, setIsEdit] = React.useState(false);
    const [error, setError] = React.useState(false);

    const [formData, setFormData] = React.useState<ServiceRow>({
        service_id: "",
        service_name: "",
        is_active: 1,
        created_by: "",
        updated_by: "",
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
            created_by: "",
            updated_by: "",
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
        if (!formData.service_name?.trim()) {
            setError(true);
            return;
        }

        showLoading(true);
        try {
            const res = await fetch("/api/auth/inspection-form/patch", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    entity: "service",
                    data: {
                        service_id: formData.service_id,
                        service_name: formData.service_name.trim(),
                        inspection_duration: formData.inspection_duration ?? 0,
                        inspections_per_year: formData.inspections_per_year ?? 0,
                        updated_by: formData.updated_by || username,
                    },
                }),
            });

            const result = await res.json();

            showLoading(false);
            if (result.success) {
                setOpen(false);
                await showAlert("success", result.message);
                fetchService();
            } else {
                await showAlert("error", result.message || "บันทึกล้มเหลว");
            }
        } catch (err) {
            setOpen(false);
            await showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
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
        { field: "service_name", headerName: "บริการ", flex: 1, headerAlign: "center", align: "left" },
        { field: "inspection_duration", headerName: "ระยะเวลาที่ใช้ในการตรวจ (วัน)", flex: 1, headerAlign: "center", align: "center" },
        { field: "inspections_per_year", headerName: "จำนวนครั้งในการตรวจต่อปี (ครั้ง / ปี)", flex: 1, headerAlign: "center", align: "center" },
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
                </>
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
                        disabled
                        value={formData.service_name}
                        onChange={(e) => {
                            setFormData({ ...formData, service_name: e.target.value });
                        }}
                        error={error && !formData.service_name}
                    />

                    {/* ระยะเวลาที่ใช้ในการตรวจ (วัน) */}
                    <TextField
                        size="small"
                        margin="dense"
                        label="ระยะเวลาที่ใช้ในการตรวจ (วัน)"
                        fullWidth
                        type="number"
                        inputProps={{ min: 0, step: 1 }}
                        value={formData.inspection_duration ?? 0}
                        onChange={(e) => {
                            const v = e.target.value;
                            const n = v === "" ? 0 : Math.max(0, parseInt(v, 10) || 0);
                            setFormData({ ...formData, inspection_duration: n });
                        }}
                        error={error && formData.inspection_duration == null}
                    />

                    {/* จำนวนครั้งในการตรวจต่อปี */}
                    <TextField
                        size="small"
                        margin="dense"
                        label="จำนวนครั้งในการตรวจต่อปี (ครั้ง / ปี)"
                        fullWidth
                        type="number"
                        inputProps={{ min: 0, step: 1 }}
                        value={formData.inspections_per_year ?? 0}
                        onChange={(e) => {
                            const v = e.target.value;
                            const n = v === "" ? 0 : Math.max(0, parseInt(v, 10) || 0);
                            setFormData({ ...formData, inspections_per_year: n });
                        }}
                        error={error && formData.inspections_per_year == null}
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
