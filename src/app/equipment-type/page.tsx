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
} from "@mui/material";
import { showAlert, showConfirm } from "@/lib/fetcher";
import { showLoading } from "@/lib/loading";
import { SystemTypeRow, EquipmentTypeRow } from "@/interfaces/master";

export default function EquipmentTypePage() {
    const [rows, setRows] = React.useState<SystemTypeRow[]>([]);
    const [rowsEq, setRowsEq] = React.useState<EquipmentTypeRow[]>([]);
    const [searchText, setSearchText] = React.useState("");
    const [searchTextEq, setSearchTextEq] = React.useState("");
    const [openEdit, setOpenEdit] = React.useState(false);
    const [openEditEq, setOpenEditEq] = React.useState(false);
    const [error, setError] = React.useState(false);
    const [errorEq, setErrorEq] = React.useState(false);

    const [formData, setFormData] = React.useState<SystemTypeRow>({
        system_type_id: "",
        system_type_name: "",
        is_active: 1,
        created_by: "admin",
        updated_by: "admin",
        created_date: "",
        updated_date: "",
        order: undefined,
    });

    const [formDataEq, setFormDataEq] = React.useState<EquipmentTypeRow>({
        equipment_type_id: "",
        equipment_type_name: "",
        is_active: 1,
        created_by: "admin",
        updated_by: "admin",
        created_date: "",
        updated_date: "",
        order: undefined,
    });

    // โหลดข้อมูลและจัดเรียงใหม่
    const fecthSystemType = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/equipment-type/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // ถ้าต้องการกัน cache ฝั่งเบราว์เซอร์ เพิ่ม cache: "no-store"
                body: JSON.stringify({ function: "system_type" }),
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

    const fecthEquipmentType = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/equipment-type/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // ถ้าต้องการกัน cache ฝั่งเบราว์เซอร์ เพิ่ม cache: "no-store"
                body: JSON.stringify({ function: "equipment_type" }),
            });
            const data = await res.json();
            if (data.success) {
                setRowsEq(data.data);
            }
        } catch (err) {
        } finally {
            showLoading(false);
        }
    };

    React.useEffect(() => {
        fecthSystemType();
        fecthEquipmentType();
    }, []);

    const handleOpenAdd = () => {
        setFormData({
            system_type_id: "",
            system_type_name: "",
            is_active: 1,
            created_by: "admin",
            updated_by: "admin",
            created_date: "",
            updated_date: "",
            order: undefined,
        });
        setOpenEdit(true);
    };

    const handleOpenAddEq = () => {
        setFormDataEq({
            equipment_type_id: "",
            equipment_type_name: "",
            is_active: 1,
            created_by: "admin",
            updated_by: "admin",
            created_date: "",
            updated_date: "",
            order: undefined,
        });
        setOpenEditEq(true);
    };

    const handleOpenEdit = (row: SystemTypeRow) => {
        setFormData(row);
        setOpenEdit(true);
    };

    const handleOpenEditEq = (row: EquipmentTypeRow) => {
        setFormDataEq(row);
        setOpenEditEq(true);
    };

    const handleClose = () => {
        setOpenEdit(false);
    };

    const handleCloseEq = () => {
        setOpenEditEq(false);
    };

    const handleSave = async () => {
        if (!formData.system_type_name) {
            setError(true);
            return;
        }
        showLoading(true);

        try {
            const payload = {
                entity: "system_type" as const,
                data: {
                    system_type_id: formData.system_type_id || undefined,
                    system_type_name: formData.system_type_name.trim(),
                    is_active: formData.is_active ?? 1,
                    created_by: formData.created_by || "admin",
                    updated_by: formData.updated_by || "admin",
                },
            };

            const res = await fetch("/api/auth/equipment-type/post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            // 👉 ปิด popup ก่อน
            setOpenEdit(false);

            if (result.success) {
                showLoading(false);
                await showAlert("success", result.message);
                fecthSystemType();
            } else {
                showAlert("error", result.message || "บันทึกล้มเหลว");
            }
        } catch (err) {
            setOpenEdit(false); // ปิด popup แม้ error
            showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            showLoading(false);
        }
    };

    const handleSaveEq = async () => {
        if (!formDataEq.equipment_type_name) {
            setErrorEq(true);
            return;
        }
        showLoading(true);

        try {
            const payload = {
                entity: "equipment_type" as const,
                data: {
                    equipment_type_id: formDataEq.equipment_type_id || undefined,
                    equipment_type_name: formDataEq.equipment_type_name.trim(),
                    is_active: formDataEq.is_active ?? 1,
                    created_by: formDataEq.created_by || "admin",
                    updated_by: formDataEq.updated_by || "admin",
                },
            };

            const res = await fetch("/api/auth/equipment-type/post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            // 👉 ปิด popup ก่อน
            setOpenEditEq(false);

            if (result.success) {
                showLoading(false);
                await showAlert("success", result.message);
                fecthEquipmentType();
            } else {
                showAlert("error", result.message || "บันทึกล้มเหลว");
            }
        } catch (err) {
            setOpenEditEq(false); // ปิด popup แม้ error
            showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
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
            const res = await fetch(`/api/auth/equipment-type/delete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, function: "system_type" }),
            });
            const result = await res.json();
            if (result.success) {
                showLoading(false);
                await showAlert("success", result.message);
                fecthSystemType();
            } else {
                showLoading(false);
                showAlert("error", result.message || "ลบข้อมูลล้มเหลว");
            }
        } catch (err) {
            showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            // กันพลาดกรณี throw ระหว่าง alert
            showLoading(false);
        }
    };

    const handleDeleteEq = async (id: string) => {
        const confirmed = await showConfirm(
            "หากลบแล้วจะไม่สามารถนำกลับมาได้",
            "คุณต้องการลบข้อมูลนี้หรือไม่?"
        );
        if (!confirmed) return;
        showLoading(true);

        try {
            const res = await fetch(`/api/auth/equipment-type/delete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, function: "equipment_type" }),
            });
            const result = await res.json();
            if (result.success) {
                showLoading(false);
                await showAlert("success", result.message);
                fecthEquipmentType();
            } else {
                showLoading(false);
                showAlert("error", result.message || "ลบข้อมูลล้มเหลว");
            }
        } catch (err) {
            showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            // กันพลาดกรณี throw ระหว่าง alert
            showLoading(false);
        }
    };

    const columns: GridColDef<SystemTypeRow>[] = [
        {
            field: "order",
            headerName: "ลำดับ",
            width: 90,
            headerAlign: "center",
            align: "center",
            resizable: false,
        },
        {
            field: "system_type_name",
            headerName: "ระบบ",
            flex: 2,              // 👈 กว้างสุด
            minWidth: 260,
            headerAlign: "center",
            align: "left",
            resizable: false,
        },
        {
            field: "actions",
            headerName: "Action",
            sortable: false,
            filterable: false,
            disableColumnMenu: true,
            width: 150,           // 👈 ควบคุมขนาดตายตัว
            headerAlign: "center",
            align: "center",
            resizable: false,
            renderCell: (params) => (
                <>
                    <IconButton
                        color="primary"
                        onClick={(e) => { e.stopPropagation(); handleOpenEdit(params.row); }}
                    >
                        <EditIcon />
                    </IconButton>
                    <IconButton
                        color="error"
                        onClick={(e) => { e.stopPropagation(); handleDelete(params.row.system_type_id); }}
                    >
                        <DeleteIcon />
                    </IconButton>
                </>
            ),
        },
    ];

    const columnEq: GridColDef<EquipmentTypeRow>[] = [
        {
            field: "order",
            headerName: "ลำดับ",
            width: 90,
            headerAlign: "center",
            align: "center",
            resizable: false,
        },
        {
            field: "equipment_type_name",
            headerName: "ประเภท",
            flex: 2,              // 👈 กว้างสุด
            minWidth: 260,
            headerAlign: "center",
            align: "left",
            resizable: false,
        },
        {
            field: "actions",
            headerName: "Action",
            sortable: false,
            filterable: false,
            disableColumnMenu: true,
            width: 150,           // 👈 ควบคุมขนาดตายตัว
            headerAlign: "center",
            align: "center",
            resizable: false,
            renderCell: (params) => (
                <>
                    <IconButton
                        color="primary"
                        onClick={(e) => { e.stopPropagation(); handleOpenEditEq(params.row); }}
                    >
                        <EditIcon />
                    </IconButton>
                    <IconButton
                        color="error"
                        onClick={(e) => { e.stopPropagation(); handleDeleteEq(params.row.equipment_type_id); }}
                    >
                        <DeleteIcon />
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

    const filteredRowsEq = rowsEq
        .filter((row) =>
            Object.values(row).some((value) =>
                String(value).toLowerCase().includes(searchTextEq.toLowerCase())
            )
        )
        .map((row, index) => ({
            ...row,
            order: index + 1,
        }));

    return (
        <div className="w-full h-full flex flex-col bg-gray-50">
            {/* Header Bar */}
            <div className="h-[6vh] w-full bg-white shadow-md flex items-center justify-between px-4 text-black font-semibold rounded-lg">
                ประเภทระบบ & อุปกรณ์
            </div>

            <div>
                {/* Table */}
                <div className="h-auto w-full bg-white mt-5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-black text-[20px] font-bold">ประเภทระบบ</span>
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
                    <DataGrid
                        rows={filteredRows}
                        columns={columns}
                        sx={{
                            borderRadius: "0.5rem",
                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                            "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": {
                                outline: "none",
                            },
                        }}
                        initialState={{ pagination: { paginationModel: { pageSize: 5, page: 0 } } }}
                        pageSizeOptions={[5, 10]}
                        disableRowSelectionOnClick
                        getRowId={(row) => row.system_type_id}
                    />
                </div>

                <div className="h-auto w-full bg-white mt-5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-black text-[20px] font-bold">ประเภทอุปกรณ์</span>
                        <div className="flex gap-2 items-center">
                            <TextField
                                size="small"
                                placeholder="ค้นหา..."
                                value={searchTextEq}
                                onChange={(e) => setSearchTextEq(e.target.value)}
                            />
                            <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleOpenAddEq}>
                                เพิ่มข้อมูล
                            </Button>
                        </div>
                    </div>
                    <DataGrid
                        rows={filteredRowsEq}
                        columns={columnEq}
                        sx={{
                            borderRadius: "0.5rem",
                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                            "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": {
                                outline: "none",
                            },
                        }}
                        initialState={{ pagination: { paginationModel: { pageSize: 5, page: 0 } } }}
                        pageSizeOptions={[5, 10]}
                        disableRowSelectionOnClick
                        getRowId={(row) => row.equipment_type_id}
                    />
                </div>
            </div>

            {/* Dialog Popup */}
            <Dialog open={openEdit} onClose={handleClose} fullWidth maxWidth="md" sx={{ zIndex: 1000 }}>
                <DialogTitle>
                    {formData.system_type_id ? "แก้ไขข้อมูล" : "เพิ่มข้อมูล"}
                </DialogTitle>
                <DialogContent dividers>
                    <Box>
                        <TextField
                            size="small"
                            margin="dense"
                            label="ชื่อระบบ"
                            fullWidth
                            required
                            value={formData.system_type_name}
                            onChange={(e) => {
                                setFormData({ ...formData, system_type_name: e.target.value });
                            }}
                            error={error && !formData.system_type_name}
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

            <Dialog open={openEditEq} onClose={handleCloseEq} fullWidth maxWidth="md" sx={{ zIndex: 1000 }}>
                <DialogTitle>
                    {formDataEq.equipment_type_id ? "แก้ไขข้อมูล" : "เพิ่มข้อมูล"}
                </DialogTitle>
                <DialogContent dividers>
                    <Box>
                        <TextField
                            size="small"
                            margin="dense"
                            label="ประเภท"
                            fullWidth
                            required
                            value={formDataEq.equipment_type_name}
                            onChange={(e) => {
                                setFormDataEq({ ...formDataEq, equipment_type_name: e.target.value });
                            }}
                            error={errorEq && !formDataEq.equipment_type_name}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEq}>ยกเลิก</Button>
                    <Button variant="contained" color="primary" onClick={handleSaveEq}>
                        บันทึก
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
