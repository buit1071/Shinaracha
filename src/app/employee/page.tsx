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
    Avatar
} from "@mui/material";
import { showAlert, showConfirm } from "@/lib/fetcher";
import { showLoading } from "@/lib/loading";
import { EmployeeRow, PermissionRow, CompanyRow } from "@/interfaces/master";

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
    const [masterCompany, setCompany] = React.useState<CompanyRow[]>([]);

    const [formData, setFormData] = React.useState<EmployeeRow>({
        image_url: "",
        company_id: "",
        emp_id: "",
        first_name_th: "",
        first_name_en: "",
        last_name_th: "",
        last_name_en: "",
        email: "",
        password: "",
        permission_id: "",
        is_active: 1,
        created_by: "admin",
        updated_by: "admin",
    });

    const fileRef = React.useRef<HTMLInputElement | null>(null);
    const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
    const [avatarChanged, setAvatarChanged] = React.useState(false);
    const [avatarPreview, setAvatarPreview] = React.useState<string | null>(
        formData.image_url || null
    );

    const handlePickAvatar = () => fileRef.current?.click();

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarFile(file);
        setAvatarChanged(true); // ✅ มีการเปลี่ยนรูป
        setAvatarPreview(URL.createObjectURL(file));
    };

    React.useEffect(() => {
        return () => {
            if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
        };
    }, [avatarPreview]);

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
        }
    };

    const fetchCompany = async () => {
        try {
            const res = await fetch("/api/auth/company/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "company" }),
            });
            const data = await res.json();
            setCompany(data.data);
        } catch (err) {
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
        fetchCompany();
    }, []);

    const handleOpenAdd = () => {
        setIsEdit(false);
        setFormData({
            image_url: "",
            company_id: "",
            emp_id: "",
            first_name_th: "",
            first_name_en: "",
            last_name_th: "",
            last_name_en: "",
            email: "",
            password: "",
            permission_id: "",
            is_active: 1,
            created_by: "admin",
            updated_by: "admin",
        });
        setAvatarPreview("/images/user-empty.png");
        setOpen(true);
    };

    const handleOpenEdit = (row: EmployeeRow) => {
        setIsEdit(true);
        setFormData(row);
        setAvatarChanged(false);     // ✅ เริ่มต้นถือว่ายังไม่เปลี่ยน
        setAvatarFile(null);
        setAvatarPreview(row.image_url ? `/images/profile/${row.image_url}` : "/images/user-empty.png");
        setOpen(true);
    };

    const handleClose = () => setOpen(false);

    const handleSave = async () => {
        // --- Validate ---
        let hasError = false;
        const fail = (cond: boolean) => {
            if (cond) {
                hasError = true;
                setError(true);
            }
        };

        // ฟิลด์จำเป็น
        fail(!formData.emp_id);
        fail(!formData.company_id);
        fail(!formData.first_name_th);
        fail(!formData.last_name_th);
        fail(!formData.first_name_en);
        fail(!formData.last_name_en);
        fail(!formData.permission_id);

        // ✅ เพิ่มเท่านั้น: password ต้องไม่ว่างและตรงกัน
        if (!isEdit) {
            fail(!formData.password);
            fail(!formData.confirm_password);
            fail(
                !!formData.password &&
                !!formData.confirm_password &&
                formData.password !== formData.confirm_password
            );
        }

        if (hasError) return;

        showLoading(true);
        try {
            // 1) อัปโหลดรูปเฉพาะเมื่อมีการเปลี่ยนรูปจริง ๆ
            let imageFileName = formData.image_url || ""; // เก็บ "ชื่อไฟล์" เท่านั้น
            if (avatarChanged && avatarFile) {
                const fd = new FormData();
                fd.append("file", avatarFile);
                fd.append("filename", avatarFile.name);
                // (ถ้าต้องใช้ตั้งชื่อไฟล์ฝั่ง server)
                fd.append("company_id", formData.company_id || "");
                fd.append("emp_id", formData.emp_id || "");

                const up = await fetch("/api/auth/upload/profile/post", {
                    method: "POST",
                    body: fd,
                });
                const upJson = await up.json();
                if (!up.ok || !upJson.success) {
                    throw new Error(upJson.message || "อัปโหลดรูปไม่สำเร็จ");
                }
                imageFileName = upJson.filename; // ✅ ได้ชื่อไฟล์ใหม่จาก server
            }
            // ถ้าไม่ได้เปลี่ยนรูป: ใช้ค่าเดิมใน formData.image_url ไปเลย

            // 2) บันทึกข้อมูลพนักงาน
            const payload = { ...formData, image_url: imageFileName };
            const res = await fetch("/api/auth/employee", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            let result: { success: boolean; message?: string } = { success: res.ok };
            const ct = res.headers.get("content-type") || "";
            if (ct.includes("application/json")) {
                result = await res.json();
            } else if (!res.ok) {
                result.message = `บันทึกล้มเหลว (HTTP ${res.status})`;
            }

            showLoading(false);
            setOpen(false);

            if (result.success) {
                await showAlert("success", result.message || "บันทึกสำเร็จ");
                fetchEmployees();
            } else {
                await showAlert("error", result.message || "บันทึกล้มเหลว");
            }
        } catch (err) {
            showLoading(false);
            setOpen(false);
            await showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
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
                <span>{`${params.row.first_name_th ?? ""} ${params.row.last_name_th ?? ""}`}</span>
            ),
        },
        { field: "email", headerName: "Email", flex: 1, headerAlign: "center", align: "left" },
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
                    <Box display="flex" justifyContent="center" mt={1} mb={2}>
                        <Box textAlign="center">
                            <Avatar
                                src={avatarPreview || "/images/user-empty.png"} // 👈 ใส่ path ของ placeholder
                                sx={{ width: 112, height: 112, bgcolor: "#e5e7eb" }}
                                imgProps={{ style: { objectFit: "cover" } }}   // ✅ ครอบพอดีวงกลม
                                onClick={handlePickAvatar}
                            />
                            <Button size="small" variant="outlined" sx={{ mt: 1 }} onClick={handlePickAvatar}>
                                อัปโหลดรูป
                            </Button>
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={handleAvatarChange}
                            />
                        </Box>
                    </Box>
                    <Box display="flex" gap={2} mt={1}>
                        <TextField
                            size="small"
                            margin="dense"
                            label="รหัสพนักงาน"
                            fullWidth
                            required
                            value={formData.emp_id}
                            onChange={(e) => {
                                setFormData({ ...formData, emp_id: e.target.value });
                            }}
                            error={error && !formData.emp_id}
                        />
                    </Box>

                    <Box mt={1}>
                        <div>
                            <label style={{ fontSize: 14, marginBottom: 4, display: "block" }}>
                                บริษัท
                            </label>

                            <Select menuPlacement="auto"
                                options={masterCompany.map(p => ({
                                    value: p.company_id,
                                    label: p.company_name_th || p.company_id,
                                }))}
                                value={
                                    masterCompany
                                        .map(p => ({
                                            value: p.company_id,
                                            label: p.company_name_th || p.company_id,
                                        }))
                                        .find(opt => opt.value === formData.company_id) || null
                                }
                                onChange={(selected) =>
                                    setFormData({
                                        ...formData,
                                        company_id: selected?.value || "",
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
                                            error && !formData.company_id
                                                ? "#d32f2f" // 🔴 สีแดงเมื่อ error
                                                : state.isFocused
                                                    ? "#3b82f6"
                                                    : "#d1d5db",
                                        boxShadow: "none",
                                        "&:hover": {
                                            borderColor: error && !formData.company_id ? "#d32f2f" : "#9ca3af",
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
                        </div>
                    </Box>

                    <Box display="flex" gap={2} mt={1}>
                        <TextField
                            size="small"
                            margin="dense"
                            label="ชื่ออังกฤษ"
                            fullWidth
                            required
                            value={formData.first_name_en}
                            onChange={(e) => {
                                setFormData({ ...formData, first_name_en: e.target.value });
                            }}
                            error={error && !formData.first_name_en}
                        />
                        <TextField
                            size="small"
                            margin="dense"
                            label="นามสกุลอังกฤษ"
                            fullWidth
                            required
                            value={formData.last_name_en}
                            onChange={(e) => {
                                setFormData({ ...formData, last_name_en: e.target.value });
                            }}
                            error={error && !formData.last_name_en}
                        />
                    </Box>

                    <Box display="flex" gap={2} mt={1}>
                        <TextField
                            size="small"
                            margin="dense"
                            label="ชื่อไทย"
                            fullWidth
                            required
                            value={formData.first_name_th}
                            onChange={(e) => {
                                setFormData({ ...formData, first_name_th: e.target.value });
                            }}
                            error={error && !formData.first_name_th}
                        />
                        <TextField
                            size="small"
                            margin="dense"
                            label="นามสกุลไทย"
                            fullWidth
                            required
                            value={formData.last_name_th}
                            onChange={(e) => {
                                setFormData({ ...formData, last_name_th: e.target.value });
                            }}
                            error={error && !formData.last_name_th}
                        />
                    </Box>
                    <Box mt={1}>
                        <label style={{ fontSize: 14, marginBottom: 4, display: "block" }}>
                            หน้าที่
                        </label>

                        <Select menuPlacement="auto"
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
                    </Box>

                    <Box mt={1}>
                        <TextField
                            size="small"
                            margin="dense"
                            label="Email"
                            fullWidth
                            value={formData.email}
                            onChange={(e) => {
                                setFormData({ ...formData, email: e.target.value });
                            }}

                        />
                    </Box>

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
                        error={error && !formData.password}
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
                    {!isEdit && (
                        <TextField
                            size="small"
                            margin="dense"
                            label="Confirm Password"
                            type={showConfirmPassword ? "text" : "password"}
                            fullWidth
                            required
                            value={formData.confirm_password}
                            onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                            error={
                                error &&
                                (!formData.confirm_password || formData.password !== formData.confirm_password)
                            }
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowConfirmPassword((prev) => !prev)} edge="end">
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