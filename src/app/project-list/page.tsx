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
import Select from "react-select";
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
import { showLoading } from "@/lib/loading";
import { ProjectRow } from "@/interfaces/master";
import { showAlert, showConfirm, parseToInputDate, formatToThaiDate, formatDate } from "@/lib/fetcher";

export default function ProjectListPage() {
    const [rows, setRows] = React.useState<ProjectRow[]>([]);
    const [searchText, setSearchText] = React.useState("");
    const [open, setOpen] = React.useState(false);
    const [isEdit, setIsEdit] = React.useState(false);
    const [error, setError] = React.useState(false);

    const [formData, setFormData] = React.useState<ProjectRow>({
        project_id: "",
        project_name: "",
        project_description: "",
        start_date: "",
        end_date: "",
        is_active: 1,
        created_by: "admin",
        updated_by: "admin",
    });

    // โหลดข้อมูลและจัดเรียงใหม่
    const fetchProject = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/project-list");
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
        (async () => {
            showLoading(true);
            try {
                await fetchProject();
            } finally {
                showLoading(false);
            }
        })();
    }, []);

    const handleOpenAdd = () => {
        setIsEdit(false);
        setFormData({
            project_id: "",
            project_name: "",
            project_description: "",
            start_date: "",
            end_date: "",
            is_active: 1,
            created_by: "admin",
            updated_by: "admin",
        });
        setOpen(true);
    };

    const handleOpenEdit = (row: ProjectRow) => {
        const start_th = formatToThaiDate(row.start_date);
        const end_th = formatToThaiDate(row.end_date);

        setIsEdit(true);
        setFormData({
            ...row,
            start_date: start_th,
            end_date: end_th,
        });
        setOpen(true);
    };

    const handleClose = () => setOpen(false);

    const handleSave = async () => {
        if (!formData.project_name || !formData.start_date || !formData.end_date) {
            setError(true);
            return;
        }
        showLoading(true);
        try {
            const res = await fetch("/api/auth/project-list", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const result = await res.json();

            // 👉 ปิด popup ก่อน
            showLoading(false);
            setOpen(false);

            if (result.success) {
                await showAlert("success", result.message);
                fetchProject();
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

    const handleDelete = async (project_id: string) => {
        const confirmed = await showConfirm("คุณต้องการลบข้อมูลนี้หรือไม่?", "ลบข้อมูล");
        if (!confirmed) return;
        showLoading(true);
        try {
            const res = await fetch(`/api/auth/project-list/${project_id}`, {
                method: "DELETE",
            });
            const result = await res.json();
            showLoading(false);
            if (result.success) {
                await showAlert("success", result.message);
                fetchProject();
            } else {
                showAlert("error", result.message || "ลบข้อมูลล้มเหลว");
            }
        } catch (err) {
            showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            showLoading(false);
        }
    };

    const toggleStatus = async (row: ProjectRow) => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/project-list", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...row,
                    is_active: row.is_active === 1 ? 0 : 1,
                    skipDate: true,
                }),
            });
            showLoading(false);
            const result = await res.json();
            if (result.success) {
                fetchProject();
            }
        } catch (err) {
        }
    };

    const columns: GridColDef<ProjectRow>[] = [
        {
            field: "order",
            headerName: "ลำดับ",
            width: 90,
            headerAlign: "center",
            align: "center",
        },
        { field: "project_name", headerName: "ชื่อโครงการ", flex: 1, headerAlign: "center", align: "left" },
        {
            field: "start_date",
            headerName: "วันที่เริ่ม",
            flex: 1,
            headerAlign: "center",
            align: "center",
            renderCell: (params) => formatDate(params.row.start_date),
        },
        {
            field: "end_date",
            headerName: "วันที่สิ้นสุด",
            flex: 1,
            headerAlign: "center",
            align: "center",
            renderCell: (params) => formatDate(params.row.end_date),
        },
        {
            field: "is_active",
            headerName: "สถานะ",
            flex: 1,
            headerAlign: "center",
            align: "center",
            renderCell: (params: GridRenderCellParams<ProjectRow>) => (
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
            renderCell: (params: GridRenderCellParams<ProjectRow>) => (
                <>
                    <IconButton color="primary" onClick={() => handleOpenEdit(params.row)}>
                        <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(params.row.project_id)}>
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
            <div className="h-[6vh] w-full bg-white shadow-md flex items-center justify-between px-4 text-black font-semibold rounded-lg">
                โครงการ
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
                    columns={columns}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 5, page: 0 } },
                    }}
                    pageSizeOptions={[5, 10]}
                    disableRowSelectionOnClick
                    getRowId={(row) => row.project_id}
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
                            label="Project ID"
                            fullWidth
                            value={formData.project_id}
                            disabled
                        />
                    )}

                    <TextField
                        size="small"
                        margin="dense"
                        label="ชื่อโครงการ"
                        fullWidth
                        required
                        value={formData.project_name}
                        onChange={(e) => {
                            setFormData({ ...formData, project_name: e.target.value });
                        }}
                        error={error && !formData.project_name}
                    />

                    <TextField
                        size="small"
                        margin="dense"
                        label="รายละเอียด"
                        fullWidth
                        value={formData.project_description}
                        onChange={(e) => {
                            setFormData({ ...formData, project_description: e.target.value });
                        }}
                    />

                    {/* Start & End Date in one row */}
                    <Box display="flex" gap={2} mt={2}>
                        {/* Start Date */}
                        <TextField
                            size="small"
                            label="วันที่เริ่มต้น"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={parseToInputDate(formData.start_date)} // DD/MM/YYYY → YYYY-MM-DD
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    start_date: formatToThaiDate(e.target.value), // YYYY-MM-DD → DD/MM/YYYY
                                })
                            }
                            error={error && !formData.start_date}
                        />

                        {/* End Date */}
                        <TextField
                            size="small"
                            label="วันที่สิ้นสุด"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={parseToInputDate(formData.end_date)}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    end_date: formatToThaiDate(e.target.value),
                                })
                            }
                            error={error && !formData.end_date}
                            // 👇 บรรทัดนี้สำคัญมาก!
                            inputProps={{
                                min: parseToInputDate(formData.start_date),
                            }}
                        />
                    </Box>
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
