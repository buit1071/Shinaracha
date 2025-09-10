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
    Checkbox,
    FormControlLabel,
} from "@mui/material";
import { formatDateTime, showAlert, showConfirm } from "@/lib/fetcher";
import { showLoading } from "@/lib/loading";
import { PermissionRow, MenuRow } from "@/interfaces/master";

/* =========================
   Permission Page (ครบไฟล์)
   ========================= */
export default function PermissionPage() {
    const [rows, setRows] = React.useState<PermissionRow[]>([]);
    const [menu, setMenu] = React.useState<MenuRow[]>([]);
    const [searchText, setSearchText] = React.useState("");
    const [open, setOpen] = React.useState(false);
    const [isEdit, setIsEdit] = React.useState(false);
    const [error, setError] = React.useState(false);

    const [formData, setFormData] = React.useState<PermissionRow>({
        permission_id: "",
        permission_name: "",
        is_active: 1,
        created_by: "admin",
        updated_by: "admin",
        menu_ids: [],
    });

    // ---------- fetchers ----------
    const fetchPermission = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/permission");
            const data = await res.json();
            if (data.success) {
                updateWithOrder(data.data as PermissionRow[]);
            }
        } catch (err) {
            console.error("Fetch permission error:", err);
        } finally {
            showLoading(false);
        }
    };

    const fetchMenu = async () => {
        try {
            const res = await fetch("/api/auth/menu?active=true");
            const data = await res.json();
            if (data.success) {
                // เรียงตาม group_id -> seq (กันพลาดฝั่ง BE)
                const sorted: MenuRow[] = (data.data as MenuRow[]).sort((a, b) => {
                    if (a.group_id !== b.group_id) return a.group_id - b.group_id;
                    return a.seq - b.seq;
                });
                setMenu(sorted);
            }
        } catch (err) {
            console.error("Fetch menu error:", err);
        }
    };

    // helper: เรียง permission ตาม updated_date ใหม่ทุกครั้ง + ใส่ order
    const updateWithOrder = (data: PermissionRow[]) => {
        const sorted = [...data].sort(
            (a, b) =>
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
        fetchPermission();
        fetchMenu();
    }, []);

    // ---------- dialog handlers ----------
    const handleOpenAdd = () => {
        setIsEdit(false);
        setError(false);
        setFormData({
            permission_id: "",
            permission_name: "",
            is_active: 1,
            created_by: "admin",
            updated_by: "admin",
            menu_ids: [],
        });
        setOpen(true);
    };

    const handleOpenEdit = async (row: PermissionRow) => {
        setIsEdit(true);
        setOpen(true);        // เปิด dialog ได้เลย เผื่อเมนูโหลดไว้แล้ว
        showLoading(true);
        try {
            // ดึง menu_ids ของ permission นี้
            const rsp = await fetch(`/api/auth/permission/${row.permission_id}`);
            const json = await rsp.json();

            if (json?.success) {
                const menu_ids: string[] = Array.isArray(json.data?.menu_ids) ? json.data.menu_ids : [];
                setFormData({
                    ...row,
                    // เผื่อชื่อ/สถานะถูกแก้ ก็ยอมรับจาก BE ถ้าส่งมา
                    permission_name: json.data?.permission_name ?? row.permission_name,
                    is_active: typeof json.data?.is_active === "number" ? json.data.is_active : row.is_active,
                    menu_ids, // <<<<<<<<<< ใส่ค่าเพื่อให้ checkbox ขึ้นสถานะที่เคยเลือก
                });
            } else {
                // fallback ถ้า BE ไม่ส่ง ก็ใช้ของเดิม
                setFormData({
                    ...row,
                    menu_ids: row.menu_ids ?? [],
                });
            }
        } catch (e) {
            console.error(e);
            setFormData({
                ...row,
                menu_ids: row.menu_ids ?? [],
            });
        } finally {
            showLoading(false);
        }
    };

    const handleClose = () => setOpen(false);

    const handleSave = async () => {
        if (!formData.permission_name) {
            setError(true);
            return;
        }

        showLoading(true);
        try {
            const res = await fetch("/api/auth/permission", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const result = await res.json();

            showLoading(false);
            setOpen(false);

            if (result.success) {
                await showAlert("success", result.message);
                fetchPermission();
            } else {
                showAlert("error", result.message || "บันทึกล้มเหลว");
            }
        } catch (err) {
            console.error("Save error:", err);
            setOpen(false);
            showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            showLoading(false);
        }
    };

    const handleDelete = async (permission_id: string) => {
        const confirmed = await showConfirm("คุณต้องการลบข้อมูลนี้หรือไม่?", "ลบข้อมูล");
        if (!confirmed) return;
        showLoading(true);
        try {
            const res = await fetch(`/api/auth/permission/${permission_id}`, {
                method: "DELETE",
            });
            const result = await res.json();
            showLoading(false);
            if (result.success) {
                await showAlert("success", result.message);
                fetchPermission();
            } else {
                showAlert("error", result.message || "ลบข้อมูลล้มเหลว");
            }
        } catch (err) {
            console.error("Delete error:", err);
            showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            showLoading(false);
        }
    };

    const toggleStatus = async (row: PermissionRow) => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/permission", {
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
                fetchPermission();
            }
        } catch (err) {
            console.error("Toggle status error:", err);
        }
    };

    // ---------- table columns ----------
    const columns: GridColDef<PermissionRow>[] = [
        {
            field: "order",
            headerName: "ลำดับ",
            width: 90,
            headerAlign: "center",
            align: "center",
        },
        {
            field: "permission_name",
            headerName: "ชื่อ",
            flex: 1,
            headerAlign: "center",
            align: "left",
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
            renderCell: (params: GridRenderCellParams<PermissionRow>) => (
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
            renderCell: (params: GridRenderCellParams<PermissionRow>) => (
                <>
                    <IconButton color="primary" onClick={() => handleOpenEdit(params.row)}>
                        <EditIcon />
                    </IconButton>
                    <IconButton
                        color="error"
                        onClick={() => handleDelete(params.row.permission_id)}
                    >
                        <DeleteIcon />
                    </IconButton>
                </>
            ),
        },
    ];

    // ---------- search + reindex ----------
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

    // ---------- checkbox helpers ----------
    const toggleMenu = (id: string) => {
        setFormData((prev) => {
            const cur = prev.menu_ids ?? [];
            const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
            return { ...prev, menu_ids: next };
        });
    };

    // คอมโพเนนต์ย่อย แสดงหัวข้อ + กริด checkbox 5 คอลัมน์
    function MenuSection({
        title,
        items,
        selected,
        onToggle,
    }: {
        title: string;
        items: MenuRow[];
        selected: string[];
        onToggle: (id: string) => void;
    }) {
        return (
            <>
                <Box mt={3} mb={1} sx={{ fontWeight: 700 }}>
                    {title}
                </Box>
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(5, minmax(0, 1fr))", // 5 ช่องต่อแถว
                        gap: 1.5,
                    }}
                >
                    {items.map((m) => (
                        <FormControlLabel
                            key={m.menu_id}
                            control={
                                <Checkbox
                                    size="small"
                                    checked={(formData.menu_ids ?? []).includes(m.menu_id)}
                                    onChange={() => onToggle(m.menu_id)}
                                />
                            }
                            label={m.menu_name}
                        />
                    ))}
                </Box>
            </>
        );
    }

    // ---------- render ----------
    return (
        <div className="min-h-[96vh] grid place-items-center bg-gray-50">
            {/* Header Bar */}
            <div className="h-[6vh] w-full bg-white shadow-md flex items-center justify-between px-4 text-black font-semibold rounded-lg">
                สิทธิ์การใช้งาน
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
                    getRowId={(row) => row.permission_id}
                />
            </div>

            {/* Dialog Popup */}
            <Dialog
                open={open}
                onClose={handleClose}
                fullWidth
                maxWidth="md"
                sx={{ zIndex: 1000 }}
            >
                <DialogTitle>{isEdit ? "แก้ไขข้อมูล" : "เพิ่มข้อมูล"}</DialogTitle>
                <DialogContent dividers>
                    {isEdit && (
                        <TextField
                            size="small"
                            margin="dense"
                            label="ID"
                            fullWidth
                            value={formData.permission_id}
                            disabled
                        />
                    )}

                    {/* ชื่อสิทธิ์ */}
                    <TextField
                        size="small"
                        margin="dense"
                        label="ชื่อ"
                        fullWidth
                        required
                        value={formData.permission_name}
                        onChange={(e) => {
                            setFormData({ ...formData, permission_name: e.target.value });
                            if (error) setError(false);
                        }}
                        error={error && !formData.permission_name}
                        helperText={error && !formData.permission_name ? "กรุณากรอกชื่อ" : ""}
                    />

                    {/* เลือกเมนู */}
                    <MenuSection
                        title="โครงการ"
                        items={menu.filter((x) => x.group_id === 1)}
                        selected={formData.menu_ids ?? []}
                        onToggle={toggleMenu}
                    />
                    <MenuSection
                        title="ตั้งค่า"
                        items={menu.filter((x) => x.group_id === 2)}
                        selected={formData.menu_ids ?? []}
                        onToggle={toggleMenu}
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
