"use client";

import * as React from "react";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useState } from "react";
import {
    DataGrid,
    GridColDef,
    GridRenderCellParams,
} from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import Select from "react-select";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Switch,
} from "@mui/material";
import { showAlert, showConfirm } from "@/lib/fetcher";
import { showLoading } from "@/lib/loading";
import { EmployeeRow, PermissionRow } from "@/interfaces/master";

export default function EmployeePage() {
    const [rows, setRows] = React.useState<EmployeeRow[]>([]);
    const [permissions, setPermissions] = React.useState<PermissionRow[]>([]);
    const [searchText, setSearchText] = React.useState("");
    const [open, setOpen] = React.useState(false);
    const [isEdit, setIsEdit] = React.useState(false);
    const [error, setError] = React.useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [employeesRaw, setEmployeesRaw] = React.useState<EmployeeRow[]>([]);

    const [formData, setFormData] = React.useState<EmployeeRow>({
        emp_id: "",
        first_name: "",
        last_name: "",
        username: "",
        password: "",
        permission_id: "",
        is_active: 1,
        created_by: "admin",
        updated_by: "admin",
    });

    // โหลดข้อมูลและจัดเรียงใหม่
    const fetchEmployees = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/employee");
            const data = await res.json();
            if (data.success) {
                setEmployeesRaw(data.data);
                updateWithOrder(data.data);
            }
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            showLoading(false);
        }
    };

    // 👉 เมื่อ permissions เปลี่ยน ให้ re-map อีกรอบ
    React.useEffect(() => {
        if (employeesRaw.length) {
            updateWithOrder(employeesRaw);
        }
    }, [permissions]);

    const fetchPermissions = async () => {
        try {
            const res = await fetch("/api/auth/permission?active=true");
            const data = await res.json();
            if (data.success) setPermissions(data.data as PermissionRow[]);
        } catch (err) {
            console.error("fetchPermissions error:", err);
        }
    };

    const updateWithOrder = (data: EmployeeRow[]) => {
        const sorted = [...data].sort(
            (a, b) =>
                new Date(b.updated_date || "").getTime() -
                new Date(a.updated_date || "").getTime()
        );

        const withOrder = sorted.map((row, index) => {
            const p = permissions.find(x => x.permission_id === row.permission_id);
            return {
                ...row,
                permission_name: p ? p.permission_name : row.permission_name ?? "-",
                order: index + 1,
            };
        });

        setRows(withOrder);
    };

    React.useEffect(() => {
        fetchEmployees();
        fetchPermissions();
    }, []);

    const handleOpenAdd = () => {
        setIsEdit(false);
        setFormData({
            emp_id: "",
            first_name: "",
            last_name: "",
            username: "",
            password: "",
            permission_id: "",
            is_active: 1,
            created_by: "admin",
            updated_by: "admin",
        });
        setOpen(true);
    };

    const handleOpenEdit = (row: EmployeeRow) => {
        setIsEdit(true);
        setFormData(row);
        setOpen(true);
    };

    const handleClose = () => setOpen(false);

    const handleSave = async () => {
        // --- Validate ก่อน ยังไม่ต้องเปิดโหลด ---
        if (!formData.first_name || !formData.last_name) {
            setError(true);
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.username)) {
            setError(true);
            return;
        }
        // เพิ่มเท่านั้น: password ต้องไม่ว่าง และต้องตรงกัน
        if (!formData.emp_id) {
            if (!formData.password || !formData.confirm_password) {
                setError(true);
                return;
            }
            if (formData.password !== formData.confirm_password) {
                setError(true);
                return;
            }
        }

        showLoading(true);
        try {
            const res = await fetch("/api/auth/employee", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            let result: { success: boolean; message?: string } = { success: res.ok };
            const ct = res.headers.get("content-type") || "";
            if (ct.includes("application/json")) {
                result = await res.json();
            } else if (!res.ok) {
                result.message = `บันทึกล้มเหลว (HTTP ${res.status})`;
            }

            // ปิดโหลดก่อน แล้วค่อยปิด popup/โชว์ alert
            showLoading(false);
            setOpen(false);

            if (result.success) {
                await showAlert("success", result.message || "บันทึกสำเร็จ");
                fetchEmployees();
            } else {
                await showAlert("error", result.message || "บันทึกล้มเหลว");
            }
        } catch (err) {
            console.error("Save error:", err);
            showLoading(false);
            setOpen(false);
            await showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            // กันพลาดกรณี throw ระหว่าง alert
            showLoading(false);
        }
    };

    const handleDelete = async (emp_id: string) => {
        const confirmed = await showConfirm(
            "หากลบแล้วจะไม่สามารถนำกลับมาได้",
            "คุณต้องการลบข้อมูลนี้หรือไม่?"
        );
        if (!confirmed) return;

        showLoading(true);
        try {
            const res = await fetch(`/api/auth/employee/${emp_id}`, { method: "DELETE" });

            // บาง API ลบแล้วตอบ 204 No Content -> ห้าม res.json()
            let result: { success: boolean; message?: string } = { success: res.ok };

            const contentType = res.headers.get("content-type") || "";
            const contentLength = res.headers.get("content-length");

            const hasJsonBody =
                (contentLength && contentLength !== "0") || !contentLength
                    ? contentType.includes("application/json")
                    : false;

            if (hasJsonBody) {
                result = await res.json();
            } else if (!res.ok) {
                result.message = `ลบข้อมูลล้มเหลว (HTTP ${res.status})`;
            }

            // ปิดโหลดก่อน แล้วค่อยแสดง alert
            showLoading(false);

            if (result.success) {
                await showAlert("success", result.message || "ลบข้อมูลสำเร็จ");
                fetchEmployees();
            } else {
                await showAlert("error", result.message || "ลบข้อมูลล้มเหลว");
            }
        } catch (err) {
            console.error("Delete error:", err);
            showLoading(false);
            await showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            // กันพลาดกรณี throw ระหว่าง alert
            showLoading(false);
        }
    };

    const toggleStatus = async (row: EmployeeRow) => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/employee", {
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
                fetchEmployees();
            }
        } catch (err) {
            console.error("Toggle status error:", err);
        }
    };

    const columns: GridColDef<EmployeeRow>[] = [
        {
            field: "order",
            headerName: "ลำดับ",
            width: 90,
            headerAlign: "center",
            align: "center",
        },
        { field: "emp_id", headerName: "รหัสพนักงาน", flex: 1, headerAlign: "center", align: "center" },
        {
            field: "full_name",
            headerName: "ชื่อ-นามสกุล",
            flex: 1,
            headerAlign: "center",
            align: "left",
            renderCell: (params) => (
                <span>{`${params.row.first_name ?? ""} ${params.row.last_name ?? ""}`}</span>
            ),
        },
        { field: "username", headerName: "Email", flex: 1, headerAlign: "center", align: "left" },
        { field: "permission_name", headerName: "หน้าที่", flex: 1, headerAlign: "center", align: "center" },
        {
            field: "is_active",
            headerName: "สถานะ",
            flex: 1,
            headerAlign: "center",
            align: "center",
            renderCell: (params: GridRenderCellParams<EmployeeRow>) => (
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
            renderCell: (params: GridRenderCellParams<EmployeeRow>) => (
                <>
                    <IconButton color="primary" onClick={() => handleOpenEdit(params.row)}>
                        <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(params.row.emp_id)}>
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
                พนักงาน
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
                    getRowId={(row) => row.emp_id}
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
                            label="รหัสพนักงาน"
                            fullWidth
                            value={formData.emp_id}
                            disabled
                        />
                    )}
                    <Box display="flex" gap={2} mt={2}>
                        <TextField
                            size="small"
                            margin="dense"
                            label="ชื่อ"
                            fullWidth
                            required
                            value={formData.first_name}
                            onChange={(e) => {
                                setFormData({ ...formData, first_name: e.target.value });
                            }}
                            error={error && !formData.first_name}
                            helperText={error && !formData.first_name ? "กรุณากรอกชื่อ" : ""}
                        />
                        <TextField
                            size="small"
                            margin="dense"
                            label="นามสกุล"
                            fullWidth
                            required
                            value={formData.last_name}
                            onChange={(e) => {
                                setFormData({ ...formData, last_name: e.target.value });
                            }}
                            error={error && !formData.last_name}
                            helperText={error && !formData.last_name ? "กรุณากรอกนามสกุล" : ""}
                        />
                    </Box>
                    <Box mt={1}>
                        <label style={{ fontSize: 14, marginBottom: 4, display: "block" }}>
                            หน้าที่
                        </label>

                        <Select
                            options={permissions.map(p => ({
                                value: p.permission_id,
                                label: p.permission_name || p.permission_id,
                            }))}
                            value={
                                permissions
                                    .map(p => ({
                                        value: p.permission_id,
                                        label: p.permission_name || p.permission_id,
                                    }))
                                    .find(opt => opt.value === formData.permission_id) || null
                            }
                            onChange={(selected) =>
                                setFormData({
                                    ...formData,
                                    permission_id: selected?.value || "",
                                    permission_name: selected?.label || undefined,
                                })
                            }
                            placeholder="-- เลือกหน้าที่ --"
                            isClearable
                            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                            styles={{
                                control: (base, state) => ({
                                    ...base,
                                    backgroundColor: "#fff",
                                    borderColor:
                                        error && !formData.permission_id
                                            ? "#d32f2f" // 🔴 สีแดงเมื่อ error
                                            : state.isFocused
                                                ? "#3b82f6"
                                                : "#d1d5db",
                                    boxShadow: "none",
                                    "&:hover": {
                                        borderColor: error && !formData.permission_id ? "#d32f2f" : "#9ca3af",
                                    },
                                }),
                                menu: (base) => ({
                                    ...base,
                                    backgroundColor: "#fff",
                                    boxShadow: "0 8px 24px rgba(0,0,0,.2)",
                                    border: "1px solid #e5e7eb",
                                }),
                                menuPortal: (base) => ({
                                    ...base,
                                    zIndex: 2100,
                                }),
                                option: (base, state) => ({
                                    ...base,
                                    backgroundColor: state.isSelected
                                        ? "#e5f2ff"
                                        : state.isFocused
                                            ? "#f3f4f6"
                                            : "#fff",
                                    color: "#111827",
                                }),
                                menuList: (base) => ({
                                    ...base,
                                    backgroundColor: "#fff",
                                    paddingTop: 0,
                                    paddingBottom: 0,
                                }),
                                singleValue: (base) => ({
                                    ...base,
                                    color: "#111827",
                                }),
                            }}
                        />

                        {/* ✅ helperText */}
                        {error && !formData.permission_id && (
                            <span style={{ color: "#d32f2f", fontSize: "12px", marginTop: 4, display: "block" }}>
                                กรุณาเลือกหน้าที่
                            </span>
                        )}
                    </Box>


                    <TextField
                        size="small"
                        margin="dense"
                        label="Email"
                        fullWidth
                        required
                        value={formData.username}
                        onChange={(e) => {
                            setFormData({ ...formData, username: e.target.value });
                        }}
                        error={
                            error &&
                            (!formData.username ||
                                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.username))
                        }
                        helperText={
                            !error
                                ? ""
                                : !formData.username
                                    ? "กรุณากรอก email"
                                    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.username)
                                        ? "รูปแบบ email ไม่ถูกต้อง"
                                        : ""
                        }
                    />

                    {/* Password */}
                    <TextField
                        size="small"
                        margin="dense"
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        fullWidth
                        required={!formData.emp_id}
                        value={formData.password}
                        onChange={(e) => {
                            setFormData({ ...formData, password: e.target.value });
                        }}
                        error={error && !formData.password && !formData.emp_id}
                        helperText={
                            error && !formData.password && !formData.emp_id
                                ? "กรุณากรอก password"
                                : ""
                        }
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    {/* Confirm Password (เฉพาะตอนเพิ่ม) */}
                    {!formData.emp_id && (
                        <TextField
                            size="small"
                            margin="dense"
                            label="Confirm Password"
                            type={showConfirmPassword ? "text" : "password"}
                            fullWidth
                            required
                            value={formData.confirm_password}
                            onChange={(e) => {
                                setFormData({ ...formData, confirm_password: e.target.value });
                            }}
                            error={
                                error &&
                                (!formData.confirm_password ||
                                    formData.password !== formData.confirm_password)
                            }
                            helperText={
                                !error
                                    ? ""
                                    : !formData.confirm_password
                                        ? "กรุณากรอก confirm password"
                                        : formData.password !== formData.confirm_password
                                            ? "รหัสผ่านไม่ตรงกัน"
                                            : ""
                            }
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                                            edge="end"
                                        >
                                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    )}
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