"use client";

import * as React from "react";
import {
    DataGrid,
    GridColDef,
    GridRenderCellParams,
} from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
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
    Table, TableBody, TableCell, TableHead, TableRow
} from "@mui/material";
import { showLoading } from "@/lib/loading";
import { TeamRow, ZoneRow, EmployeeRow, EmpStatusRow } from "@/interfaces/master";
import { showAlert, showConfirm } from "@/lib/fetcher";

export default function ProjectListPage() {
    const [rows, setRows] = React.useState<TeamRow[]>([]);
    const [searchText, setSearchText] = React.useState("");
    const [open, setOpen] = React.useState(false);
    const [isEdit, setIsEdit] = React.useState(false);
    const [error, setError] = React.useState(false);
    const [employees, setEmployees] = React.useState<EmployeeRow[]>([]);
    const [empStatus, setEmpStatus] = React.useState<EmpStatusRow[]>([]);
    const employeesRef = React.useRef<EmployeeRow[]>([]);
    const empStatussRef = React.useRef<EmpStatusRow[]>([]);
    const zonesRef = React.useRef<ZoneRow[]>([]);
    const [zones, setZones] = React.useState<ZoneRow[]>([]);
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

    const fetchEmpStatus = async () => {
        const res = await fetch("/api/auth/employee/status?active=true");
        const data = await res.json();
        if (data.success) {
            setEmpStatus(data.data);
            empStatussRef.current = data.data;   // <<< สำคัญ
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
                await fetchEmpStatus();
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
        const confirmed = await showConfirm("หากลบแล้วจะไม่สามารถนำกลับมาได้", " คุณต้องการลบข้อมูลนี้หรือไม่?");
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
            filterable: false,
            disableColumnMenu: true,
            width: 150,
            headerAlign: "center",
            align: "center",
            renderCell: (params: GridRenderCellParams<TeamRow>) => (
                <>
                    <IconButton color="primary" onClick={() => handleOpenEdit(params.row)}>
                        <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(params.row.team_id)}>
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

    // ====== Types ======
    type MemberRow = {
        id: string;          // temp id ฝั่ง FE
        dbId?: number | string; // <<< เพิ่ม
        emp_id: string;
        status_id: string;
        name: string;
        editing?: boolean;
        isNew?: boolean;
    };

    // ====== State ตารางพนักงานในทีม ======
    const [members, setMembers] = React.useState<MemberRow[]>([]);

    // ====== options จาก employees / empStatus ======
    const employeeOptions = React.useMemo(
        () =>
            (employees || []).map(e => ({
                value: String(e.emp_id),                          // ให้เป็น string ชัดเจน
                label: `${e.first_name ?? ""} ${e.last_name ?? ""}`.trim() || String(e.emp_id),
            })),
        [employees]
    );

    const empStatusOptions = React.useMemo(
        () =>
            (empStatus || []).map(s => ({
                value: String(s.status_id),                       // string!
                label: s.status_name,
            })),
        [empStatus]
    );

    // ====== Handlers ======
    const handleAddEmployee = () => {
        setMembers(prev => [
            ...prev,
            {
                id: String(Date.now()),
                emp_id: "",
                status_id: "",
                name: "",
                editing: true,
                isNew: true,
            },
        ]);
    };

    // ====== โหลดสมาชิกทีม ======
    React.useEffect(() => {
        if (!formData.team_id) return; // ยังไม่ได้เลือกทีม

        const fetchMembers = async () => {
            try {
                showLoading(true);
                const res = await fetch(`/api/auth/team/employee?team_id=${formData.team_id}`);
                const result = await res.json();

                if (!res.ok || !result?.success) {
                    await showAlert("error", result.message || "โหลดข้อมูลไม่สำเร็จ");
                    return;
                }

                // แปลงข้อมูลจาก API -> MemberRow
                const rows: MemberRow[] = (result.data || []).map((r: any) => ({
                    id: String(r.id),            // ใช้ id จาก DB
                    dbId: r.id,                  // เก็บไว้เวลาอัปเดต/ลบ
                    emp_id: String(r.emp_id),
                    status_id: String(r.status_id),
                    name: (() => {
                        const emp = employees.find(e => String(e.emp_id) === String(r.emp_id));
                        return emp ? `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim() : "-";
                    })(),
                    editing: false,
                    isNew: false,
                }));

                setMembers(rows);
            } catch (err: any) {
                console.error(err);
                await showAlert("error", "เกิดข้อผิดพลาดในการโหลดข้อมูลทีม");
            } finally {
                showLoading(false);
            }
        };

        fetchMembers();
    }, [formData.team_id, employees]);


    const handleChangeMember = (id: string, patch: Partial<MemberRow>) => {
        setMembers((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    };

    const handleSaveMember = async (rowId: string) => {
        const row = members.find(m => m.id === rowId);
        if (!row) return;

        if (!row.emp_id || !row.status_id) return;

        const payload = {
            id: row.dbId,
            team_id: formData.team_id,
            emp_id: row.emp_id,
            status_id: row.status_id,
            is_active: 1,
            created_by: "admin",
            updated_by: "admin",
        };

        try {
            showLoading(true);

            const res = await fetch("/api/auth/team/employee", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const result = await res.json();

            if (!res.ok || !result?.success) {
                await showAlert("error", result?.message || "บันทึกไม่สำเร็จ");
                return;
            }

            const saved = result.data || {};

            setMembers(prev =>
                prev.map(r =>
                    r.id === rowId
                        ? {
                            ...r,
                            dbId: saved.id ?? r.dbId,
                            name:
                                r.name ||
                                (() => {
                                    const emp = employees.find(e => String(e.emp_id) === String(r.emp_id));
                                    return emp ? `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim() : "-";
                                })(),
                            editing: false,
                            isNew: false,
                        }
                        : r
                )
            );

            // success alert
            showLoading(false);
            await showAlert("success", result.message || "บันทึกสำเร็จ");
        } catch (e: any) {
            await showAlert("error", e.message || "เกิดข้อผิดพลาด");
        } finally {
            showLoading(false); // <<< ปิดโหลด ไม่ว่าจะ success/error
        }
    };

    const handleCancelEdit = (id: string) => {
        setMembers((prev) =>
            prev
                .map((r) =>
                    r.id === id
                        ? r.isNew
                            ? null
                            : { ...r, editing: false }
                        : r
                )
                .filter(Boolean) as MemberRow[]
        );
    };

    const handleDeleteMember = async (rowId: string) => {
        const row = members.find(m => m.id === rowId);
        if (!row) return;

        // ✅ popup ยืนยันก่อน
        const confirmed = await showConfirm("หากลบแล้วจะไม่สามารถนำกลับมาได้", " คุณต้องการลบข้อมูลนี้หรือไม่?");
        if (!confirmed) return;

        // ถ้ายังไม่เคย save (ไม่มี dbId) → ลบแค่ state
        if (!row.dbId) {
            setMembers(prev => prev.filter(r => r.id !== rowId));
            return;
        }

        try {
            showLoading(true);
            const res = await fetch(`/api/auth/team/employee/${row.dbId}`, {
                method: "DELETE",
            });
            const result = await res.json();

            if (!res.ok || !result?.success) {
                await showAlert("error", result.message || "ลบไม่สำเร็จ");
                return;
            }
            showLoading(false);
            setMembers(prev => prev.filter(r => r.id !== rowId));
            await showAlert("success", result.message || "ลบข้อมูลเรียบร้อย");
        } catch (err: any) {
            console.error(err);
            await showAlert("error", "เกิดข้อผิดพลาดในการลบข้อมูล");
        } finally {
            showLoading(false);
        }
    };

    // หา status_id ของ "หัวหน้า" จาก master
    const leaderStatusId = React.useMemo(() => {
        const found = (empStatus || []).find(s => s.status_name === "หัวหน้าทีม");
        return found ? String(found.status_id) : "";
    }, [empStatus]);

    return (
        <div className="min-h-[96vh] grid place-items-center bg-gray-50">
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
            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md" sx={{ zIndex: 1000 }}>
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
                    {/* Add Employee to team (react-select) */}
                    {(formData.team_id && formData.is_active === 1) && (
                        <>
                            <div className="w-[100%] h-px bg-black mx-auto m-4"></div>

                            <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                                <label style={{ fontSize: "16px", fontWeight: "bold" }}>พนักงาน</label>

                                <Button
                                    variant="contained"
                                    color="success"
                                    startIcon={<AddIcon />}
                                    onClick={handleAddEmployee}
                                >
                                    เพิ่มข้อมูล
                                </Button>
                            </Box>

                            {/* ตารางพนักงาน */}
                            <Box mt={1} sx={{ bgcolor: "#fff", border: "1px solid #e5e7eb", borderRadius: 1 }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell width={420}>ชื่อ</TableCell>
                                            <TableCell align="center" width={200}>สถานะ</TableCell>
                                            <TableCell align="center" width={160}>Action</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {members.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} align="center" style={{ color: "#6b7280" }}>
                                                    ยังไม่มีข้อมูลพนักงาน
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            members.map(row => (
                                                <TableRow key={row.id} hover>
                                                    {/* ชื่อ */}
                                                    <TableCell>
                                                        {row.editing ? (
                                                            <Select
                                                                options={employeeOptions.filter(
                                                                    o =>
                                                                        // แสดง option ที่ยังไม่ถูกเลือกในแถวอื่น หรือเป็นของ row ปัจจุบันเอง
                                                                        !members.some(m => m.emp_id === o.value && m.id !== row.id)
                                                                )}
                                                                value={employeeOptions.find(o => o.value === row.emp_id) || null}
                                                                onChange={(opt: any) =>
                                                                    handleChangeMember(row.id, {
                                                                        emp_id: opt?.value || "",
                                                                        name: opt?.label || "",
                                                                    })
                                                                }
                                                                placeholder="-- เลือกพนักงาน --"
                                                                isClearable
                                                                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                                                styles={{
                                                                    control: (base: any, state: any) => ({
                                                                        ...base,
                                                                        backgroundColor: "#fff",
                                                                        borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
                                                                        boxShadow: "none",
                                                                        "&:hover": { borderColor: "#9ca3af" },
                                                                        minHeight: 36,
                                                                    }),
                                                                    menu: (base: any) => ({
                                                                        ...base,
                                                                        backgroundColor: "#fff",
                                                                        boxShadow: "0 8px 24px rgba(0,0,0,.2)",
                                                                        border: "1px solid #e5e7eb",
                                                                    }),
                                                                    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
                                                                    menuList: (base: any) => ({ ...base, backgroundColor: "#fff", paddingTop: 0, paddingBottom: 0 }),
                                                                    option: (base: any, state: any) => ({
                                                                        ...base,
                                                                        backgroundColor: state.isSelected ? "#e5f2ff" : state.isFocused ? "#f3f4f6" : "#fff",
                                                                        color: "#000",
                                                                    }),
                                                                    singleValue: (base: any) => ({ ...base, color: "#000" }),
                                                                    input: (base: any) => ({ ...base, color: "#000" }),
                                                                    placeholder: (base: any) => ({ ...base, color: "#6b7280" }),
                                                                }}
                                                            />
                                                        ) : (
                                                            <span>{row.name || "-"}</span>
                                                        )}
                                                    </TableCell>

                                                    {/* สถานะ (ใช้ status_id) */}
                                                    <TableCell align="center">
                                                        {row.editing ? (
                                                            <Select
                                                                options={empStatusOptions.filter(o => {
                                                                    // ซ่อนตัวเลือก "หัวหน้า" ถ้ามีคนอื่นเป็นหัวหน้าแล้ว
                                                                    if (!leaderStatusId) return true; // เผื่อไม่มีข้อมูลใน master
                                                                    if (o.value !== leaderStatusId) return true;
                                                                    // แสดงหัวหน้าได้เฉพาะแถวที่เป็นหัวหน้าอยู่เอง
                                                                    const someoneAlreadyLeader = members.some(m => m.status_id === leaderStatusId);
                                                                    return !someoneAlreadyLeader || row.status_id === leaderStatusId;
                                                                })}
                                                                value={empStatusOptions.find(o => o.value === row.status_id) || null}
                                                                onChange={(opt: any) => handleChangeMember(row.id, { status_id: opt?.value || "" })}
                                                                placeholder="-- เลือกสถานะ --"
                                                                isClearable={false}
                                                                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                                                styles={{
                                                                    control: (base: any, state: any) => ({
                                                                        ...base,
                                                                        backgroundColor: "#fff",
                                                                        borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
                                                                        boxShadow: "none",
                                                                        "&:hover": { borderColor: "#9ca3af" },
                                                                        minHeight: 36,
                                                                        width: 220,
                                                                    }),
                                                                    menu: (base: any) => ({
                                                                        ...base,
                                                                        backgroundColor: "#fff",
                                                                        boxShadow: "0 8px 24px rgba(0,0,0,.2)",
                                                                        border: "1px solid #e5e7eb",
                                                                    }),
                                                                    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
                                                                    menuList: (base: any) => ({ ...base, backgroundColor: "#fff", paddingTop: 0, paddingBottom: 0 }),
                                                                    option: (base: any, state: any) => ({
                                                                        ...base,
                                                                        backgroundColor: state.isSelected ? "#e5f2ff" : state.isFocused ? "#f3f4f6" : "#fff",
                                                                        color: "#000",
                                                                    }),
                                                                    singleValue: (base: any) => ({ ...base, color: "#000" }),
                                                                    input: (base: any) => ({ ...base, color: "#000" }),
                                                                    placeholder: (base: any) => ({ ...base, color: "#6b7280" }),
                                                                }}
                                                            />

                                                        ) : (
                                                            <span>
                                                                {empStatusOptions.find(o => o.value === row.status_id)?.label || "-"}
                                                            </span>
                                                        )}
                                                    </TableCell>

                                                    {/* Action */}
                                                    <TableCell align="center">
                                                        {row.editing ? (
                                                            <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                                                                <IconButton
                                                                    color="success"
                                                                    onClick={() => handleSaveMember(row.id)}
                                                                    disabled={!row.emp_id || !row.status_id}  // <<< เงื่อนไขให้ชัด
                                                                    title="บันทึก"
                                                                >
                                                                    <CheckIcon />
                                                                </IconButton>

                                                                <IconButton color="inherit" onClick={() => handleCancelEdit(row.id)} title="ยกเลิก">
                                                                    <CloseIcon />
                                                                </IconButton>
                                                            </Box>
                                                        ) : (
                                                            <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                                                                <IconButton color="primary" onClick={() => handleChangeMember(row.id, { editing: true })} title="แก้ไข">
                                                                    <EditIcon />
                                                                </IconButton>
                                                                <IconButton color="error" onClick={() => handleDeleteMember(row.id)} title="ลบ">
                                                                    <DeleteIcon />
                                                                </IconButton>
                                                            </Box>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </Box>
                        </>
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
    );
}
