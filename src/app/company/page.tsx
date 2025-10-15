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
import { CompanyRow } from "@/interfaces/master";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function CompanyPage() {
    const user = useCurrentUser();
    const username = React.useMemo(
        () => (user ? `${user.first_name_th} ${user.last_name_th}` : ""),
        [user]
    );
    const [rows, setRows] = React.useState<CompanyRow[]>([]);
    const [searchText, setSearchText] = React.useState("");
    const [open, setOpen] = React.useState(false);
    const [isEdit, setIsEdit] = React.useState(false);
    const [error, setError] = React.useState(false);

    const [formData, setFormData] = React.useState<CompanyRow>({
        company_id: "",
        company_name_th: "",
        company_name_en: "",
        description: "",
        is_active: 1,
        created_by: "",
        updated_by: "",
    });

    // โหลดข้อมูลและจัดเรียงใหม่
    const fetchCompany = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/company/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "company" }),
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
        fetchCompany();
    }, []);

    const handleOpenAdd = () => {
        setIsEdit(false);
        setFormData({
            company_id: "",
            company_name_th: "",
            company_name_en: "",
            description: "",
            is_active: 1,
            created_by: "",
            updated_by: "",
        });
        setOpen(true);
    };

    const handleOpenEdit = (row: CompanyRow) => {
        setIsEdit(true);
        setFormData(row);
        setOpen(true);
    };

    const handleClose = () => setOpen(false);

    const handleSave = async () => {
        if (!formData.company_name_th || !formData.company_name_en) {
            setError(true);
            return;
        }
        showLoading(true);
        try {
            const payload = {
                entity: "company" as const,
                data: {
                    company_id: formData.company_id || undefined,
                    company_name_th: formData.company_name_th.trim(),
                    company_name_en: formData.company_name_en.trim(),
                    description: formData.description.trim(),
                    is_active: formData.is_active ?? 1,
                    created_by: formData.created_by || username,
                    updated_by: formData.updated_by || username,
                },
            };

            const res = await fetch("/api/auth/company/post", {
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
                fetchCompany();
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

    const handleDelete = async (id: string) => {
        const confirmed = await showConfirm("คุณต้องการลบข้อมูลนี้หรือไม่?", "ลบข้อมูล");
        if (!confirmed) return;
        showLoading(true);
        try {
            const res = await fetch(`/api/auth/company/delete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, function: "company" }),
            });
            const result = await res.json();
            showLoading(false);
            if (result.success) {
                await showAlert("success", result.message);
                fetchCompany();
            } else {
                showAlert("error", result.message || "ลบข้อมูลล้มเหลว");
            }
        } catch (err) {
            showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            showLoading(false);
        }
    };

    const toggleStatus = async (row: CompanyRow) => {
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
                fetchCompany();
            }
        } catch (err) {
        }
    };

    const columns: GridColDef<CompanyRow>[] = [
        {
            field: "order",
            headerName: "ลำดับ",
            width: 90,
            headerAlign: "center",
            align: "center",
        },
        { field: "company_name_th", headerName: "ชื่อไทย", flex: 1, headerAlign: "center", align: "left" },
        { field: "company_name_en", headerName: "ชื่ออังกฤษ", flex: 1, headerAlign: "center", align: "left" },
        { field: "description", headerName: "รายละเอียด", flex: 1, headerAlign: "center", align: "left" },
        {
            field: "created_date",
            headerName: "วันที่สร้าง",
            flex: 1,
            headerAlign: "center",
            align: "center",
            renderCell: (params) => formatDateTime(params.row.created_date),
        },
        {
            field: "is_active",
            headerName: "สถานะ",
            flex: 1,
            headerAlign: "center",
            align: "center",
            renderCell: (params: GridRenderCellParams<CompanyRow>) => (
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
            renderCell: (params: GridRenderCellParams<CompanyRow>) => (
                <>
                    <IconButton color="primary" onClick={() => handleOpenEdit(params.row)}>
                        <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(params.row.company_id)}>
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
                บริษัท
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
                        pagination: { paginationModel: { pageSize: 15, page: 0 } },
                    }}
                    pageSizeOptions={[15, 20, 25, 30]}
                    disableRowSelectionOnClick
                    getRowId={(row) => row.company_id} // ใช้ company_id แทน id
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
                            label="ID"
                            fullWidth
                            value={formData.company_id}
                            disabled
                        />
                    )}

                    <TextField
                        size="small"
                        margin="dense"
                        label="ชื่อไทย"
                        fullWidth
                        required
                        value={formData.company_name_th}
                        onChange={(e) => {
                            setFormData({ ...formData, company_name_th: e.target.value });
                            if (error) setError(false);
                        }}
                        error={error && !formData.company_name_th}
                    />

                    <TextField
                        size="small"
                        margin="dense"
                        label="ชื่ออังกฤษ"
                        fullWidth
                        required
                        value={formData.company_name_en}
                        onChange={(e) => {
                            setFormData({ ...formData, company_name_en: e.target.value });
                            if (error) setError(false);
                        }}
                        error={error && !formData.company_name_en}
                    />

                    <TextField
                        size="small"
                        margin="dense"
                        label="รายละเอียด"
                        fullWidth
                        multiline
                        rows={5}
                        value={formData.description ?? ""}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        sx={{
                            "& .MuiOutlinedInput-root": { alignItems: "flex-start" },
                            "& textarea": {
                                resize: "none",
                                overflow: "auto"
                            }
                        }}
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
