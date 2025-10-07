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
    Typography
} from "@mui/material";
import { showAlert, showConfirm } from "@/lib/fetcher";
import { showLoading } from "@/lib/loading";
import { BuildingRow } from "@/interfaces/master";
import BuildingDetail from "@/components/building/BuildingDetail";

export default function LocationPage() {
    const [view, setView] = React.useState<null | { type: "detail"; id: string, name: string }>(null);
    const openDetail = (id: string, name: string) => setView({ type: "detail", id, name });
    const backToList = () => setView(null);
    const [rows, setRows] = React.useState<BuildingRow[]>([]);
    const [searchText, setSearchText] = React.useState("");
    const [openEdit, setOpenEdit] = React.useState(false);
    const [error, setError] = React.useState(false);

    const [formData, setFormData] = React.useState<BuildingRow>({
        building_id: "",
        building_name: "",
        is_active: 1,
        created_by: "admin",
        updated_by: "admin",
        created_date: "",
        updated_date: "",
        order: undefined,
    });

    // โหลดข้อมูลและจัดเรียงใหม่
    const fecthBuilding = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/building/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // ถ้าต้องการกัน cache ฝั่งเบราว์เซอร์ เพิ่ม cache: "no-store"
                body: JSON.stringify({ function: "building" }),
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
        fecthBuilding();
    }, []);

    const handleOpenAdd = () => {
        setFormData({
            building_id: "",
            building_name: "",
            is_active: 1,
            created_by: "admin",
            updated_by: "admin",
            created_date: "",
            updated_date: "",
            order: undefined,
        });
        setOpenEdit(true);
    };

    const handleOpenEdit = (row: BuildingRow) => {
        setFormData(row);
        setOpenEdit(true);
    };

    const handleClose = () => {
        setOpenEdit(false);
    };

    const handleSave = async () => {
        if (!formData.building_name) {
            setError(true);
            return;
        }
        showLoading(true);

        try {
            const payload = {
                entity: "building" as const,
                data: {
                    building_id: formData.building_id || undefined,
                    building_name: formData.building_name.trim(),
                    is_active: formData.is_active ?? 1,
                    created_by: formData.created_by || "admin",
                    updated_by: formData.updated_by || "admin",
                },
            };

            const res = await fetch("/api/auth/building/post", {
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
                fecthBuilding();
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

    const handleDelete = async (building_id: string) => {
        const confirmed = await showConfirm(
            "หากลบแล้วจะไม่สามารถนำกลับมาได้",
            "คุณต้องการลบข้อมูลนี้หรือไม่?"
        );
        if (!confirmed) return;
        showLoading(true);

        try {
            const res = await fetch(`/api/auth/building/delete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ building_id, function: "building" }),
            });
            const result = await res.json();
            if (result.success) {
                showLoading(false);
                await showAlert("success", result.message);
                fecthBuilding();
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

    const columns: GridColDef<BuildingRow>[] = [
        {
            field: "order",
            headerName: "ลำดับ",
            width: 90,
            headerAlign: "center",
            align: "center",
            resizable: false,
        },
        {
            field: "building_name",
            headerName: "อาคาร",
            flex: 2,              // 👈 กว้างสุด
            minWidth: 260,
            headerAlign: "center",
            align: "left",
            resizable: false,
            renderCell: (params: GridRenderCellParams<BuildingRow>) => (
                <button
                    onClick={() => openDetail(params.row.building_id, params.row.building_name)}
                    className="hover:no-underline text-blue-600 hover:opacity-80 cursor-pointer"
                    title="เปิดรายละเอียด"
                >
                    {params.row.building_name}
                </button>
            ),
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
                        onClick={(e) => { e.stopPropagation(); handleDelete(params.row.building_id); }}
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

    return (
        <div className="w-full h-full flex flex-col bg-gray-50 justify-between">
            {view?.type === "detail" ? (
                <BuildingDetail BuildingId={view.id} BuildingName={view.name} onBack={backToList} />
            ) : (
                <>
                    {/* Header Bar */}
                    <div className="h-[6vh] w-full bg-white shadow-md flex items-center justify-between px-4 text-black font-semibold rounded-lg">
                        สถานที่ติดตั้งอุปกรณ์
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
                            getRowId={(row) => row.building_id}
                        />
                    </div>

                </>
            )
            }
            {/* Dialog Popup */}
            <Dialog open={openEdit} onClose={handleClose} fullWidth maxWidth="md" sx={{ zIndex: 1000 }}>
                <DialogTitle>
                    {formData.building_id ? "แก้ไขข้อมูล" : "เพิ่มข้อมูล"}
                </DialogTitle>
                <DialogContent dividers>
                    <Box>
                        <TextField
                            size="small"
                            margin="dense"
                            label="อาคาร"
                            fullWidth
                            required
                            value={formData.building_name}
                            onChange={(e) => {
                                setFormData({ ...formData, building_name: e.target.value });
                            }}
                            error={error && !formData.building_name}
                            helperText={error && !formData.building_name ? "กรุณากรอกชื่อหรือเลขอาคาร" : ""}
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
