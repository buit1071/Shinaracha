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
import { ZoneRow } from "@/interfaces/master";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function ZonePage() {
    const user = useCurrentUser();
    const username = React.useMemo(
        () => (user ? `${user.first_name_th} ${user.last_name_th}` : ""),
        [user]
    );
    const [rows, setRows] = React.useState<ZoneRow[]>([]);
    const [searchText, setSearchText] = React.useState("");
    const [open, setOpen] = React.useState(false);
    const [isEdit, setIsEdit] = React.useState(false);
    const [error, setError] = React.useState(false);

    const [formData, setFormData] = React.useState<ZoneRow>({
        zone_id: "",
        zone_name: "",
        is_active: 1,
        created_by: "",
        updated_by: "",
    });

    // โหลดข้อมูลและจัดเรียงใหม่
    const fetchZone = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/zone");
            const data = await res.json();
            if (data.success) {
                updateWithOrder(data.data);
            }
        } catch (err) {
        } finally {
            showLoading(false);
        }
    };

    // helper: เรียงใหม่ทุกครั้ง + เพิ่ม order
    const updateWithOrder = (data: ZoneRow[]) => {
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
        fetchZone();
    }, []);

    const handleOpenAdd = () => {
        setIsEdit(false);
        setFormData({
            zone_id: "",
            zone_name: "",
            is_active: 1,
            created_by: "",
            updated_by: "",
        });
        setOpen(true);
    };

    const handleOpenEdit = (row: ZoneRow) => {
        setIsEdit(true);
        setFormData(row);
        setOpen(true);
    };

    const handleClose = () => setOpen(false);

    const handleSave = async () => {
        if (!formData.zone_name) {
            setError(true);
            return;
        }
        showLoading(true);
        try {
            const audit = isEdit
                ? { updated_by: username }
                : { created_by: username, updated_by: username };

            const payload = {
                ...formData,
                ...audit,
            };

            const res = await fetch("/api/auth/zone", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            // 👉 ปิด popup ก่อน
            showLoading(false);
            setOpen(false);

            if (result.success) {
                await showAlert("success", result.message);
                fetchZone();
            } else {
                showAlert("error", result.message || "บันทึกล้มเหลว");
            }
        } catch (err) {
            setOpen(false); // ปิด popup แม้ error
            showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            showLoading(false);
        }
    };


    const handleDelete = async (zone_id: string) => {
        const confirmed = await showConfirm("คุณต้องการลบข้อมูลนี้หรือไม่?", "ลบข้อมูล");
        if (!confirmed) return;
        showLoading(true);
        try {
            const res = await fetch(`/api/auth/zone/${zone_id}`, {
                method: "DELETE",
            });
            const result = await res.json();
            showLoading(false);
            if (result.success) {
                await showAlert("success", result.message);
                fetchZone();
            } else {
                showAlert("error", result.message || "ลบข้อมูลล้มเหลว");
            }
        } catch (err) {
            showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            showLoading(false);
        }
    };

    const toggleStatus = async (row: ZoneRow) => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/zone", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...row,
                    is_active: row.is_active === 1 ? 0 : 1,
                }),
            });
            showLoading(false);
            const result = await res.json();
            if (result.success) {
                fetchZone();
            }
        } catch (err) {
        }
    };

    const columns: GridColDef<ZoneRow>[] = [
        {
            field: "order",
            headerName: "ลำดับ",
            width: 90,
            headerAlign: "center",
            align: "center",
        },
        { field: "zone_name", headerName: "พื้นที่", flex: 1, headerAlign: "center", align: "left" },
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
            renderCell: (params: GridRenderCellParams<ZoneRow>) => (
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
            renderCell: (params: GridRenderCellParams<ZoneRow>) => (
                <>
                    <IconButton color="primary" onClick={() => handleOpenEdit(params.row)}>
                        <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(params.row.zone_id)}>
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
            {/* Header Bar */}
            <div className="h-[6vh] w-full bg-white shadow-md flex items-center justify-between px-4 text-black font-semibold rounded-lg">
                พื้นที่
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
                    getRowId={(row) => row.zone_id} // ใช้ zone_id แทน id
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
                            label="Zone ID"
                            fullWidth
                            value={formData.zone_id}
                            disabled
                        />
                    )}

                    <TextField
                        size="small"
                        margin="dense"
                        label="พื้นที่"
                        fullWidth
                        required
                        value={formData.zone_name}
                        onChange={(e) => {
                            setFormData({ ...formData, zone_name: e.target.value });
                            if (error) setError(false);
                        }}
                        error={error && !formData.zone_name}
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
