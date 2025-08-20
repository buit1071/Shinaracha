"use client";

import * as React from "react";
import {
    DataGrid,
    GridColDef,
    GridRenderCellParams,
} from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import Select from "react-select";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Switch,
} from "@mui/material";
import { showLoading } from "@/lib/loading";
import { TeamRow, ZoneRow, EmployeeRow } from "@/interfaces/master";
import { showAlert, showConfirm } from "@/lib/fetcher";

export default function ProjectListPage() {
    const [rows, setRows] = React.useState<TeamRow[]>([]);
    const [searchText, setSearchText] = React.useState("");
    const [open, setOpen] = React.useState(false);
    const [isEdit, setIsEdit] = React.useState(false);
    const [error, setError] = React.useState(false);
    const [employees, setEmployees] = React.useState<EmployeeRow[]>([]);
    const [zones, setZones] = React.useState<ZoneRow[]>([]);
    const employeesRef = React.useRef<EmployeeRow[]>([]);
    const zonesRef = React.useRef<ZoneRow[]>([]);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);

    const [formData, setFormData] = React.useState<TeamRow>({
        team_id: "",
        team_name: "",
        username: "",
        password: "",
        confirm_password: "",
        uuid: "",
        zone_id: "",
        is_active: 1,
        created_by: "admin",
        updated_by: "admin",
    });

    // โหลดข้อมูลและจัดเรียงใหม่
    const fetchTeam = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/team");
            const data = await res.json();
            if (data.success) {
                updateWithOrder(data.data);
            }
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            showLoading(false);
        }
    };

    const fetchEmployees = async () => {
        const res = await fetch("/api/auth/employee?active=true");
        const data = await res.json();
        if (data.success) {
            setEmployees(data.data);
            employeesRef.current = data.data;   // <<< สำคัญ
        }
    };

    const fetchZones = async () => {
        const res = await fetch("/api/auth/zone?active=true");
        const data = await res.json();
        if (data.success) {
            setZones(data.data);
            zonesRef.current = data.data;   // <<< สำคัญ
        }
    };

    const getZoneName = (zone_id?: string | null) =>
        zonesRef.current.find(z => z.zone_id === zone_id)?.zone_name ?? "-";

    const updateWithOrder = (data: TeamRow[]) => {
        const sorted = [...data].sort(
            (a, b) =>
                new Date(b.updated_date || "").getTime() -
                new Date(a.updated_date || "").getTime()
        );

        const withOrder = sorted.map((row, index) => ({
            ...row,
            zone_name: getZoneName(row.zone_id), // ใส่ชื่อพื้นที่จาก zone_id
            order: index + 1,
        }));

        setRows(withOrder);
    };


    React.useEffect(() => {
        (async () => {
            showLoading(true);
            try {
                await fetchEmployees();
                await fetchZones();
                await fetchTeam();
            } finally {
                showLoading(false);
            }
        })();
    }, []);


    const handleOpenAdd = () => {
        setIsEdit(false);
        setFormData({
            team_id: "",
            team_name: "",
            username: "",
            password: "",
            confirm_password: "",
            uuid: "",
            zone_id: "",
            is_active: 1,
            created_by: "admin",
            updated_by: "admin",
            // emp_list:[],
        });
        setOpen(true);
    };

    const handleOpenEdit = (row: TeamRow) => {
        setIsEdit(true);
        setFormData(row);
        setOpen(true);
    };


    const handleClose = () => setOpen(false);

    const handleSave = async () => {
        if (!formData.team_name) {
            setError(true);
            return;
        }

        try {
            const res = await fetch("/api/auth/team", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const result = await res.json();

            // 👉 ปิด popup ก่อน
            setOpen(false);

            if (result.success) {
                await showAlert("success", result.message);
                fetchTeam();
            } else {
                showAlert("error", result.message || "บันทึกล้มเหลว");
            }
        } catch (err) {
            console.error("Save error:", err);
            setOpen(false); // ปิด popup แม้ error
            showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        }
    };


    const handleDelete = async (team_id: string) => {
        const confirmed = await showConfirm("คุณต้องการลบข้อมูลนี้หรือไม่?", "ลบข้อมูล");
        if (!confirmed) return;

        try {
            const res = await fetch(`/api/auth/team/${team_id}`, {
                method: "DELETE",
            });
            const result = await res.json();

            if (result.success) {
                await showAlert("success", result.message);
                fetchTeam();
            } else {
                showAlert("error", result.message || "ลบข้อมูลล้มเหลว");
            }
        } catch (err) {
            console.error("Delete error:", err);
            showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        }
    };

    const toggleStatus = async (row: TeamRow) => {
        try {
            const res = await fetch("/api/auth/team", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...row,
                    is_active: row.is_active === 1 ? 0 : 1,
                }),
            });
            const result = await res.json();
            if (result.success) {
                fetchTeam();
            }
        } catch (err) {
            console.error("Toggle status error:", err);
        }
    };

    const columns: GridColDef<TeamRow>[] = [
        {
            field: "order",
            headerName: "ลำดับ",
            width: 90,
            headerAlign: "center",
            align: "center",
        },
        { field: "team_id", headerName: "Team ID", flex: 1, headerAlign: "center", align: "center" },
        { field: "team_name", headerName: "ชื่อ", flex: 1, headerAlign: "center", align: "left" },
        { field: "uuid", headerName: "UUID", flex: 1, headerAlign: "center", align: "center" },
        {
            field: "leader_name",
            headerName: "หัวหน้า",
            flex: 1,
            headerAlign: "center",
            align: "left",
            renderCell: (params: GridRenderCellParams<TeamRow>) => (
                <span>{params.row.created_by || "-"}</span>
            ),
        },
        { field: "zone_name", headerName: "พื้นที่", flex: 1, headerAlign: "center", align: "center" },
        {
            field: "is_active",
            headerName: "สถานะ",
            flex: 1,
            headerAlign: "center",
            align: "center",
            renderCell: (params: GridRenderCellParams<TeamRow>) => (
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
            width: 150,
            headerAlign: "center",
            align: "center",
            renderCell: (params: GridRenderCellParams<TeamRow>) => (
                <Box sx={{ display: "flex", justifyContent: "center", gap: 1, width: "100%" }}>
                    <IconButton color="primary" onClick={() => handleOpenEdit(params.row)}>
                        <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(params.row.team_id)}>
                        <DeleteIcon />
                    </IconButton>
                </Box>
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
        <div className="min-h-[94.9vh] grid place-items-center bg-gray-50">
            <div className="h-[6vh] w-full bg-white shadow-md flex items-center justify-between px-4 text-black font-semibold rounded-lg">
                Team
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
                    getRowId={(row) => row.team_id} // ใช้ team_id แทน id
                />
            </div>

            {/* Dialog Popup */}
            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
                <DialogTitle>{isEdit ? "แก้ไขข้อมูล" : "เพิ่มข้อมูล"}</DialogTitle>
                <DialogContent dividers>
                    {isEdit && (
                        <TextField
                            size="small"
                            margin="dense"
                            label="Team ID"
                            fullWidth
                            value={formData.team_id}
                            disabled
                        />
                    )}

                    <TextField
                        size="small"
                        margin="dense"
                        label="ชื่อ"
                        fullWidth
                        required
                        value={formData.team_name}
                        onChange={(e) => {
                            setFormData({ ...formData, team_name: e.target.value });
                            if (error) setError(false);
                        }}
                        error={error && !formData.team_name}
                        helperText={error && !formData.team_name ? "กรุณากรอกชื่อ" : ""}
                    />

                    <TextField
                        size="small"
                        margin="dense"
                        label="Username"
                        fullWidth
                        required
                        value={formData.username}
                        onChange={(e) => {
                            setFormData({ ...formData, username: e.target.value });
                            if (error) setError(false);
                        }}
                        error={error && !formData.username}
                        helperText={error && !formData.username ? "กรุณากรอก Username" : ""}
                    />

                    <Box display="flex" gap={2}>
                        {/* Password */}
                        <TextField
                            size="small"
                            margin="dense"
                            label="Password"
                            type={showPassword ? "text" : "password"}
                            fullWidth
                            required={!formData.team_id}
                            value={formData.password}
                            onChange={(e) => {
                                setFormData({ ...formData, password: e.target.value });
                                if (error) setError(false);
                            }}
                            error={error && !formData.password && !formData.team_id}
                            helperText={
                                error && !formData.password && !formData.team_id
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
                        {!formData.team_id && (
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
                                    if (error) setError(false);
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
                    </Box>

                    <TextField
                        size="small"
                        margin="dense"
                        label="UUID"
                        fullWidth
                        required
                        value={formData.uuid}
                        onChange={(e) => {
                            setFormData({ ...formData, uuid: e.target.value });
                            if (error) setError(false);
                        }}
                        error={error && !formData.uuid}
                        helperText={error && !formData.uuid ? "กรุณากรอก UUID" : ""}
                    />

                    <Box>
                        <label style={{ fontSize: "14px", marginBottom: "4px", display: "block" }}>
                            พื้นที่
                        </label>

                        <Select
                            options={zones.map(p => ({
                                value: p.zone_id,
                                label: p.zone_name,
                            }))}
                            value={
                                zones
                                    .map(p => ({
                                        value: p.zone_id,
                                        label: p.zone_name,
                                    }))
                                    .find(opt => opt.value === formData.zone_id) || null
                            }
                            onChange={(selected) =>
                                setFormData({
                                    ...formData,
                                    zone_id: selected?.value || "",
                                    zone_name: selected?.label || undefined,
                                })
                            }
                            placeholder="-- เลือกพื้นที่ --"
                            isClearable
                            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                            styles={{
                                control: (base, state) => ({
                                    ...base,
                                    backgroundColor: "#fff",
                                    borderColor:
                                        error && !formData.zone_id
                                            ? "#d32f2f" // 🔴 สีแดงเมื่อ error
                                            : state.isFocused
                                                ? "#3b82f6"
                                                : "#d1d5db",
                                    boxShadow: "none",
                                    "&:hover": {
                                        borderColor: error && !formData.zone_id ? "#d32f2f" : "#9ca3af",
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
                        {error && !formData.zone_id && (
                            <span style={{ color: "#d32f2f", fontSize: "12px", marginTop: 4, display: "block" }}>
                                กรุณาเลือกพื้นที่
                            </span>
                        )}

                    </Box>

                    {/* Leader Select (react-select) */}
                    {/* {formData.team_id && (
                        <Box mt={2}>
                            <label style={{ fontSize: "14px", marginBottom: "4px", display: "block" }}>
                                หัวหน้า
                            </label>

                            <Select
                                options={employees.map(c => ({
                                    value: c.emp_id,
                                    label: c.first_name + " " + c.last_name,
                                }))}
                                value={
                                    employees
                                        .map(c => ({ value: c.emp_id, label: c.first_name + " " + c.last_name }))
                                        .find(opt => opt.value === formData.leader_id) || null
                                }
                                onChange={(selected) =>
                                    setFormData({ ...formData, leader_id: selected?.value || "" })
                                }
                                placeholder="-- เลือกหัวหน้า --"
                                isClearable
                                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                styles={{
                                    control: (base, state) => ({
                                        ...base,
                                        backgroundColor: "#fff",
                                        borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
                                        boxShadow: "none",
                                        "&:hover": {
                                            borderColor: "#9ca3af",
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
                    )} */}

                    <Box mt={2} display="flex" alignItems="center" gap={2}>
                        <span>สถานะ:</span>
                        <Switch
                            checked={formData.is_active === 1}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    is_active: e.target.checked ? 1 : 0,
                                })
                            }
                            color="success"
                        />
                        <span>{formData.is_active === 1 ? "ใช้งาน" : "ปิดการใช้งาน"}</span>
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
