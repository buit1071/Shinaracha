"use client";

import * as React from "react";
import {
    DataGrid,
    GridColDef,
    GridRenderCellParams,
} from "@mui/x-data-grid";
import { showAlert, showConfirm } from "@/lib/fetcher";
import { showLoading } from "@/lib/loading";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import IconButton from "@mui/material/IconButton";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
} from "@mui/material";
import { FloorRoomRow } from "@/interfaces/master";

type Props = {
    BuildingId: string;
    BuildingName: string;
    onBack: () => void;
};

export default function BuildingDetail({ BuildingId, BuildingName, onBack }: Props) {
    const [rows, setRows] = React.useState<FloorRoomRow[]>([]);
    const [searchText, setSearchText] = React.useState("");
    const [open, setOpen] = React.useState(false);
    const [isEdit, setIsEdit] = React.useState(false);
    const [error, setError] = React.useState(false);

    const [formData, setFormData] = React.useState<FloorRoomRow>({
        building_id: BuildingId,
        floor_id: "",
        floor_name: "",
        room_name: "",
        is_active: 1,
        created_by: "admin",
        updated_by: "admin",
    });

    const fetchFloor = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/building/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "floor", building_id: BuildingId }),
            });

            const data = await res.json();
            showLoading(false);

            if (data.success) {
                setRows(data.data || []);
            } else {
            }
        } catch (err) {
        }
    };


    React.useEffect(() => {
        if (!BuildingId) return;
        fetchFloor();
    }, [BuildingId]);

    const handleOpenAdd = () => {
        setIsEdit(false);
        setFormData({
            building_id: BuildingId,
            floor_id: "",
            floor_name: "",
            room_name: "",
            is_active: 1,
            created_by: "admin",
            updated_by: "admin",
        });
        setOpen(true);
    };

    const handleOpenEdit = (row: FloorRoomRow) => {
        setIsEdit(true);
        setFormData(row);
        setOpen(true);
    };

    const handleDelete = async (floor_id: string) => {
        const confirmed = await showConfirm(
            "หากลบแล้วจะไม่สามารถนำกลับมาได้",
            "คุณต้องการลบข้อมูลนี้หรือไม่?"
        );
        if (!confirmed) return;

        showLoading(true);
        try {
            const res = await fetch("/api/auth/building/delete", {
                method: "POST", // ใช้ POST เพราะมี body
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: floor_id,
                    function: "floor", // บอกชนิดที่ลบ
                }),
            });

            const result = await res.json();
            showLoading(false);

            if (result.success) {
                await showAlert("success", result.message);
                fetchFloor(); // รีเฟรชรายการโซน
            } else {
                await showAlert("error", result.message || "ลบข้อมูลล้มเหลว");
            }
        } catch (err) {
            await showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            showLoading(false);
        }
    };

    const handleClose = () => setOpen(false);

    const handleSave = async () => {
        // validate เบื้องต้น
        if (!formData.room_name?.trim()) {
            setError(true);
            return;
        }

        showLoading(true);
        try {
            const payload = {
                entity: "floor" as const,
                data: {
                    building_id: formData.building_id || BuildingId || undefined,
                    floor_id: formData.floor_id || undefined,
                    floor_name: formData.floor_name.trim(),
                    room_name: formData.room_name.trim(),
                    is_active: formData.is_active ?? 1,
                    created_by: formData.created_by || "admin",
                    updated_by: formData.updated_by || "admin",
                },
            };

            const res = await fetch("/api/auth/building/post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // cache: "no-store",
                body: JSON.stringify(payload),
            });

            const result = await res.json();
            showLoading(false);

            if (result.success) {
                setOpen(false);                       // ปิด popup เมื่อสำเร็จ
                await showAlert("success", result.message);
                fetchFloor();                  // รีเฟรชรายการโซน
            } else {
                await showAlert("error", result.message || "บันทึกล้มเหลว");
            }
        } catch (err) {
            setOpen(false);                         // ปิด popup แม้ error
            await showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            showLoading(false);
        }
    };

    const columns: GridColDef<FloorRoomRow>[] = [
        {
            field: "order",
            headerName: "ลำดับ",
            width: 90,
            headerAlign: "center",
            align: "center",
        },
        {
            field: "floor_name", headerName: "ชั้น", flex: 1, headerAlign: "center", align: "center",
        },
        {
            field: "room_name", headerName: "ห้อง", flex: 1, headerAlign: "center", align: "center",
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
            renderCell: (params: GridRenderCellParams<FloorRoomRow>) => (
                <>
                    <IconButton color="primary" onClick={() => handleOpenEdit(params.row)}>
                        <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(params.row.floor_id)}>
                        <DeleteIcon />
                    </IconButton></>
            ),
        },
    ];

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
        <div className="w-full h-[96vh] flex flex-col bg-gray-50">
            {/* Header */}
            <div className="h-[6vh] flex items-center justify-between px-4 py-2 bg-white shadow-md mb-2 rounded-lg">
                <div className="flex items-center">
                    <IconButton onClick={onBack} color="primary">
                        <ArrowBackIcon />
                    </IconButton>
                    <h2 className="text-xl font-bold text-gray-800 ml-5">
                        อาคาร : <span className="text-blue-900">{BuildingName}</span>
                    </h2>
                </div>
                <div className="flex gap-2 items-center">
                    <TextField
                        size="small"
                        placeholder="ค้นหา..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={handleOpenAdd}
                    >
                        เพิ่มข้อมูล
                    </Button>
                </div>
            </div>

            <div className="flex-1">
                <DataGrid
                    sx={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "0.5rem",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                        "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": {
                            outline: "none",
                        },
                    }}
                    rows={filteredRows}
                    columns={columns.map((col) => ({ ...col, resizable: false }))}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 10, page: 0 } },
                    }}
                    pageSizeOptions={[5, 10, 25]}
                    disableRowSelectionOnClick
                    getRowId={(row) => row.floor_id}
                />
            </div>
            {/* Dialog Popup */}
            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md" sx={{ zIndex: 1000 }}>
                <DialogTitle>{isEdit ? "แก้ไขข้อมูล" : "เพิ่มข้อมูล"}</DialogTitle>
                <DialogContent dividers>
                    <TextField
                        size="small"
                        margin="dense"
                        label="ชั้น"
                        fullWidth
                        value={formData.floor_name}
                        onChange={(e) => {
                            setFormData({ ...formData, floor_name: e.target.value });
                            if (error) setError(false);
                        }}
                    />
                    <TextField
                        size="small"
                        margin="dense"
                        label="ห้อง"
                        fullWidth
                        required
                        value={formData.room_name}
                        onChange={(e) => {
                            setFormData({ ...formData, room_name: e.target.value });
                            if (error) setError(false);
                        }}
                        error={error && !formData.room_name}
                        helperText={error && !formData.room_name ? "กรุณากรอกห้อง" : ""}
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
