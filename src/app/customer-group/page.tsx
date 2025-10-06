"use client";

import * as React from "react";
import { IconButton, TextField } from "@mui/material";
import {
    DataGrid,
    GridColDef,
    GridRenderCellParams,
} from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Switch,
    Avatar
} from "@mui/material";
import { showAlert, showConfirm } from "@/lib/fetcher";
import { showLoading } from "@/lib/loading";
import { CustomerGroupRow } from "@/interfaces/master";

export default function CustomerGroupPage() {
    const [searchText, setSearchText] = React.useState("");
    const [open, setOpen] = React.useState(false);
    const [isEdit, setIsEdit] = React.useState(false);
    const [error, setError] = React.useState(false);
    const [groupRows, setGroupRows] = React.useState<CustomerGroupRow[]>([]);

    const [formData, setFormData] = React.useState<CustomerGroupRow>({
        group_id: "",
        group_name: "",
        is_active: 1,
        created_by: "admin",
        updated_by: "admin",
    });

    const fetchGroup = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/customer/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "groupByCustomerId" }),
            });

            const result = await res.json();
            if (result.success && result.data) {
                setGroupRows(result.data || []);
                showLoading(false);
            }
        } catch (err) {
            showLoading(false);
            console.error("fetch customer name error:", err);
        }
    };

    React.useEffect(() => {
        fetchGroup();
    }, []);

    const handleSave = async () => {
        if (!formData.group_name) {
            setError(true);
            return; // ยังไม่เปิดโหลด เพราะเราเช็คก่อน
        }

        showLoading(true);
        try {
            const payload = {
                entity: "groupCustomer" as const,
                data: {
                    group_id: formData.group_id || undefined,
                    group_name: formData.group_name.trim(),
                    is_active: formData.is_active ?? 1,
                    created_by: formData.created_by || "admin",
                    updated_by: formData.updated_by || "admin",
                },
            };

            const res = await fetch("/api/auth/customer/post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // cache: "no-store", // ถ้าต้องการกัน cache
                body: JSON.stringify(payload),
            });

            const result = await res.json();
            showLoading(false);

            if (result.success) {
                // ปิดโหลดก่อน แล้วค่อยปิด dialog และค่อยโชว์ swal
                showLoading(false);
                setOpen(false);
                await showAlert("success", result.message);
                fetchGroup();
            } else {
                showLoading(false);
                setOpen(false);
                await showAlert("error", result.message || "บันทึกล้มเหลว");
            }
        } catch (e) {
            console.error(e);
            showLoading(false);
            setOpen(false);
            await showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            // กันตกหล่น/throw จาก showAlert
            showLoading(false);
        }
    };

    const handleOpenAdd = () => {
        setIsEdit(false);
        setFormData({
            group_id: "",
            group_name: "",
            is_active: 1,
            created_by: "admin",
            updated_by: "admin",
        });
        setOpen(true);
    };

    const handleOpenEdit = (row: CustomerGroupRow) => {
        setIsEdit(true);
        setFormData(row);
        setOpen(true);
    };

    const handleDelete = async (id: string) => {
        const confirmed = await showConfirm("คุณต้องการลบข้อมูลนี้หรือไม่?", "ลบข้อมูล");
        if (!confirmed) return;

        showLoading(true);
        try {
            const res = await fetch(`/api/auth/customer/delete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, function: "group" }),
            });

            const result = await res.json();
            if (result.success) {
                showLoading(false);
                await showAlert("success", result.message);
                fetchGroup();
            } else {
                showLoading(false);
                showAlert("error", result.message || "ลบข้อมูลล้มเหลว");
            }
        } catch (err) {
            console.error("Delete error:", err);
            showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            showLoading(false);
        }
    };

    const handleClose = () => setOpen(false);

    const column: GridColDef<CustomerGroupRow>[] = [
        {
            field: "order",
            headerName: "ลำดับ",
            width: 90,
            headerAlign: "center",
            align: "center",
        },
        {
            field: "group_name", headerName: "Group", flex: 1, headerAlign: "center", align: "left",
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
            renderCell: (params: GridRenderCellParams<CustomerGroupRow>) => (
                <>
                    <IconButton color="primary" onClick={() => handleOpenEdit(params.row)}>
                        <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(params.row.group_id)}>
                        <DeleteIcon />
                    </IconButton>
                </>
            ),
        },
    ];

    const filteredRows = groupRows
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
                กลุ่มลูกค้า
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
                    rows={filteredRows}
                    columns={column}
                    getRowId={(row) => row.group_id}
                    disableRowSelectionOnClick
                    autoHeight
                    initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
                    pageSizeOptions={[5, 10, 25]}
                    sx={{
                        width: "100%",
                        borderRadius: "0.5rem",
                        boxShadow: "0 4px 6px rgba(0,0,0,.1)",
                        "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": { outline: "none" },
                    }}
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
                            label="Group ID"
                            fullWidth
                            value={formData.group_id}
                            disabled
                        />
                    )}

                    <TextField
                        size="small"
                        margin="dense"
                        label="Group Name"
                        fullWidth
                        required
                        value={formData.group_name}
                        onChange={(e) => {
                            setFormData({ ...formData, group_name: e.target.value });
                            if (error) setError(false);
                        }}
                        error={error && !formData.group_name}
                        helperText={error && !formData.group_name ? "กรุณากรอก Group Name" : ""}
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
    )
}