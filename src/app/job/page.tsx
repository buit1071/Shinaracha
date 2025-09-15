"use client";

import * as React from "react";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/th';
dayjs.extend(customParseFormat);
import {
    DataGrid,
    GridColDef,
    GridRenderCellParams,
} from "@mui/x-data-grid";
import {
    Box,
    Button,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Checkbox,
} from "@mui/material";
import Select from "react-select";
import {
    JobsRow,
    TeamRow,
    ProjectRow,
    JobStatusRow,
    CustomerRow,
    CustomerBranchRow
} from "@/interfaces/master";
import { showLoading } from "@/lib/loading";
import { formatToThaiDate, parseToInputDate, showAlert, showConfirm } from "@/lib/fetcher";

export default function InspectionTypePage() {
    const [rows, setRows] = React.useState<JobsRow[]>([]);
    const [teams, setTeams] = React.useState<TeamRow[]>([]);
    const [customers, setCustomers] = React.useState<CustomerRow[]>([]);
    const customersRef = React.useRef<CustomerRow[]>([]);
    const [branchs, setBranchs] = React.useState<CustomerBranchRow[]>([]);
    const [projects, setProjects] = React.useState<ProjectRow[]>([]);
    const [status, setStatus] = React.useState<JobStatusRow[]>([]);
    const [searchText, setSearchText] = React.useState("");
    const [open, setOpen] = React.useState(false);
    const [isEdit, setIsEdit] = React.useState(false);
    const [error, setError] = React.useState(false);

    // form
    const [formData, setFormData] = React.useState({
        job_id: "",
        job_name: "",
        project_id: "",
        project_name: "",
        shift_next_jobs: 1,
        job_start_date: "",
        job_end_date: "",
        job_start_time: "",
        job_end_time: "",
        customer_id: "",
        customer_name: "",
        branch_id: "",
        branch_name: "",
        team_id: "",
        team_name: "",
        status_id: "",
        status_name: "",
        is_active: 1,
        created_by: "admin",
        updated_by: "admin",
    });

    const fetchCustomers = async () => {
        const res = await fetch("/api/auth/customer?active=true");
        const data = await res.json();
        if (data.success) {
            setCustomers(data.data);
            customersRef.current = data.data;   // <<< สำคัญ
        }
    };

    const fetchCustomerBranch = async (customer_id: string) => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/customer/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "customerBranch", customer_id: customer_id }),
            });

            const result = await res.json();
            if (result.success && result.data) {
                showLoading(false);
                setBranchs(result.data || []);
            }
        } catch (err) {
            showLoading(false);
            console.error("fetch customer name error:", err);
        }
    };

    const fetchCustomerBranchAll = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/customer/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "customerBranchAll" }),
            });

            const result = await res.json();
            if (result.success && result.data) {
                showLoading(false);
                setBranchs(result.data || []);
            }
        } catch (err) {
            showLoading(false);
            console.error("fetch customer name error:", err);
        }
    };
    // Loaders
    const fetchJobs = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/job/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "job" }),
            });
            const data = await res.json();
            if (data.success) {
                setRows(data.data || []);
            }
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            showLoading(false);
        }
    };

    const fetchTeam = async () => {
        try {
            const res = await fetch("/api/auth/team");
            const data = await res.json();
            if (data.success) setTeams(data.data || []);
        } catch (err) {
            console.error("Fetch error:", err);
        }
    };

    const fetchProject = async () => {
        try {
            const res = await fetch("/api/auth/project-list");
            const data = await res.json();
            if (data.success) setProjects(data.data || []);
        } catch (err) {
            console.error("Fetch error:", err);
        }
    };

    const fetchStatus = async () => {
        try {
            const res = await fetch("/api/auth/status/get?active=true");
            const data = await res.json();
            if (data.success) setStatus(data.data || []);
        } catch (err) {
            console.error("Fetch error:", err);
        }
    };

    React.useEffect(() => {
        (async () => {
            showLoading(true);
            try {
                await fetchProject();
                await fetchCustomers();
                await fetchCustomerBranchAll();
                await fetchTeam();
                await fetchStatus();
                await fetchJobs();
            } finally {
                showLoading(false);
            }
        })();
    }, []);

    const handleOpenAdd = () => {
        setIsEdit(false);
        setFormData({
            job_id: "",
            job_name: "",
            project_id: "",
            project_name: "",
            shift_next_jobs: 1,
            job_start_date: "",
            job_end_date: "",
            job_start_time: "",
            job_end_time: "",
            customer_id: "",
            customer_name: "",
            branch_id: "",
            branch_name: "",
            team_id: "",
            team_name: "",
            status_id: "",
            status_name: "",
            is_active: 1,
            created_by: "admin",
            updated_by: "admin",
        });
        setOpen(true);
    };

    const handleOpenEdit = (row: JobsRow) => {
        const startISO = row.job_start_date ? String(row.job_start_date).slice(0, 10) : ""; // YYYY-MM-DD
        const endISO = row.job_end_date ? String(row.job_end_date).slice(0, 10) : "";

        setIsEdit(true);
        setFormData(prev => ({
            ...prev,

            job_id: row.job_id ?? "",
            job_name: row.job_name ?? "",

            project_id: row.project_id ?? "",
            project_name: row.project_name ?? "",

            shift_next_jobs: Number(row.shift_next_jobs ?? 0),

            job_start_date: startISO,  // ← เก็บ ISO
            job_end_date: endISO,      // ← เก็บ ISO
            job_start_time: (row.job_start_time ?? "").slice(0, 5), // "HH:mm"
            job_end_time: (row.job_end_time ?? "").slice(0, 5),

            team_id: row.team_id ?? "",
            team_name: row.team_name ?? "",

            status_id: row.status_id ?? "",
            status_name: row.status_name ?? "",

            customer_id: row.customer_id ?? "",
            customer_name: row.customer_name ?? "",
            branch_id: row.branch_id ?? "",
            branch_name: row.branch_name ?? "",

            is_active: row.is_active ?? 1,
            created_by: row.created_by ?? "admin",
            updated_by: "admin",
        }));
        setOpen(true);
    };

    const handleClose = () => setOpen(false);

    const handleSave = async () => {
        if (
            !formData.job_name ||
            !formData.project_id ||
            !formData.job_start_date ||
            !formData.job_end_date ||
            !formData.job_start_time ||
            !formData.job_end_time ||
            !formData.team_id ||
            !formData.customer_id ||
            !formData.branch_id
        ) {
            setError(true);
            return;
        }

        showLoading(true);
        try {
            const payload = {
                entity: "job" as const,
                data: {
                    job_id: formData.job_id || "",
                    job_name: formData.job_name.trim(),
                    project_id: formData.project_id,
                    shift_next_jobs: formData.shift_next_jobs,
                    job_start_date: formData.job_start_date,
                    job_end_date: formData.job_end_date,
                    job_start_time: formData.job_start_time,
                    job_end_time: formData.job_end_time,
                    team_id: formData.team_id,
                    status_id: formData.status_id,
                    customer_id: formData.customer_id,
                    branch_id: formData.branch_id,
                    is_active: formData.is_active ?? 1,
                    created_by: formData.created_by || "admin",
                    updated_by: formData.updated_by || "admin",
                },
            };

            const res = await fetch("/api/auth/job/post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await res.json();
            showLoading(false);
            setOpen(false);
            if (result.success) {
                await showAlert("success", result.message);
                fetchJobs();
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

    const handleDelete = async (job_id: string) => {
        const confirmed = await showConfirm("คุณต้องการลบข้อมูลนี้หรือไม่?", "ลบข้อมูล");
        if (!confirmed) return;
        showLoading(true);
        try {
            const res = await fetch(`/api/auth/job/delete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: job_id, function: "job" }),
            });
            const result = await res.json();
            showLoading(false);
            if (result.success) {
                await showAlert("success", result.message);
                fetchJobs();
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

    const columns: GridColDef<JobsRow>[] = [
        { field: "order", headerName: "ลำดับ", width: 90, headerAlign: "center", align: "center" },
        { field: "project_name", headerName: "โครงการ", flex: 1, headerAlign: "center", align: "left" },
        { field: "job_name", headerName: "งาน", flex: 1, headerAlign: "center", align: "left" },
        { field: "team_name", headerName: "ทีม", flex: 1, headerAlign: "center", align: "left" },
        {
            field: "status_name",
            headerName: "สถานะ",
            flex: 1,
            headerAlign: "center",
            align: "center",
            renderCell: ({ value }) => (value && String(value).trim() ? value : "-"),
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
            renderCell: (params: GridRenderCellParams<JobsRow>) => (
                <>
                    <IconButton color="primary" onClick={() => handleOpenEdit(params.row)}>
                        <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(params.row.job_id)}>
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
                String(value ?? "").toLowerCase().includes(searchText.toLowerCase())
            )
        )
        .map((row, index) => ({ ...row, order: index + 1 }));

    return (
        <div className="min-h-[96vh] grid place-items-center bg-gray-50">
            <div className="h-[6vh] w-full bg-white shadow-md flex items-center justify-between px-4 text-black font-semibold rounded-lg">
                Jobs
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
                        "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": { outline: "none" },
                    }}
                    rows={filteredRows}
                    columns={columns.map((col) => ({ ...col, resizable: false }))}
                    initialState={{ pagination: { paginationModel: { pageSize: 5, page: 0 } } }}
                    pageSizeOptions={[5, 10, 15]}
                    disableRowSelectionOnClick
                    getRowId={(row) => row.job_id}
                />
            </div>

            {/* Dialog Popup */}
            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xl" sx={{ zIndex: 1000 }}>
                <DialogTitle>{isEdit ? "แก้ไขข้อมูล" : "เพิ่มข้อมูล"}</DialogTitle>
                <DialogContent dividers>
                    {isEdit && (
                        <Box
                            sx={{
                                mt: 2,
                                display: "grid",
                                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                                gap: 2,
                            }}
                        >
                            <Box>
                                <label style={{ fontSize: "14px", marginBottom: "16px", display: "block" }}>

                                </label>
                                <TextField
                                    size="small"
                                    margin="dense"
                                    label="Job ID"
                                    fullWidth
                                    value={formData.job_id ?? ""}
                                    disabled
                                />
                            </Box>
                            <Box>
                                <label style={{ fontSize: "14px", marginBottom: "4px", display: "block" }}>
                                    สถานะ
                                </label>

                                <Select
                                    options={status.map(c => ({
                                        value: c.status_id,
                                        label: c.status_name,
                                    }))}
                                    value={
                                        status
                                            .map(c => ({ value: c.status_id, label: c.status_name }))
                                            .find(opt => opt.value === formData.status_id) || null
                                    }
                                    onChange={(selected) =>
                                        setFormData({ ...formData, status_id: selected?.value || "" })
                                    }
                                    placeholder="-- เลือกสถานะ --"
                                    isClearable
                                    menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                    styles={{
                                        control: (base, state) => ({
                                            ...base,
                                            backgroundColor: "#fff",
                                            borderColor:
                                                error && !formData.status_id
                                                    ? "#d32f2f" // ❌ สีแดงเมื่อ error
                                                    : state.isFocused
                                                        ? "#3b82f6"
                                                        : "#d1d5db",
                                            boxShadow: "none",
                                            "&:hover": {
                                                borderColor:
                                                    error && !formData.status_id ? "#d32f2f" : "#9ca3af",
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
                                {error && !formData.status_id && (
                                    <span
                                        style={{
                                            color: "#d32f2f",
                                            fontSize: "12px",
                                            marginTop: 4,
                                            display: "block",
                                        }}
                                    >
                                        กรุณาเลือกสถานะ
                                    </span>
                                )}
                            </Box>
                        </Box>
                    )}
                    <Box
                        sx={{
                            mt: 2,
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                            gap: 2,
                        }}
                    >
                        <Box>
                            <label style={{ fontSize: "14px", marginBottom: "16px", display: "block" }}>

                            </label>
                            <TextField
                                size="small"
                                margin="dense"
                                label="ชื่องาน"
                                fullWidth
                                required
                                value={formData.job_name ?? ""}
                                onChange={(e) => setFormData({ ...formData, job_name: e.target.value })}
                                error={error && !formData.job_name}
                                helperText={error && !formData.job_name ? "กรุณาเลือกวันที่เริ่มต้น" : ""}
                            />
                        </Box>

                        <Box>
                            <label style={{ fontSize: "14px", marginBottom: "4px", display: "block" }}>
                                โครงการ
                            </label>

                            <Select
                                options={projects.map(c => ({
                                    value: c.project_id,
                                    label: c.project_name,
                                }))}
                                value={
                                    projects
                                        .map(c => ({ value: c.project_id, label: c.project_name }))
                                        .find(opt => opt.value === formData.project_id) || null
                                }
                                onChange={(selected) =>
                                    setFormData({ ...formData, project_id: selected?.value || "" })
                                }
                                placeholder="-- เลือกโครงการ --"
                                isClearable
                                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                styles={{
                                    control: (base, state) => ({
                                        ...base,
                                        backgroundColor: "#fff",
                                        borderColor:
                                            error && !formData.project_id
                                                ? "#d32f2f" // ❌ สีแดงเมื่อ error
                                                : state.isFocused
                                                    ? "#3b82f6"
                                                    : "#d1d5db",
                                        boxShadow: "none",
                                        "&:hover": {
                                            borderColor:
                                                error && !formData.project_id ? "#d32f2f" : "#9ca3af",
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
                            {error && !formData.project_id && (
                                <span
                                    style={{
                                        color: "#d32f2f",
                                        fontSize: "12px",
                                        marginTop: 4,
                                        display: "block",
                                    }}
                                >
                                    กรุณาเลือกโครงการ
                                </span>
                            )}
                        </Box>
                    </Box>

                    <Box
                        sx={{
                            mt: 2,
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            gap: 2,
                        }}
                    >
                        <TextField
                            size="small"
                            label="วันที่เริ่มต้น"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={parseToInputDate(formData.job_start_date ?? "")}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    job_start_date: formatToThaiDate(e.target.value),
                                })
                            }
                            error={error && !formData.job_start_date}
                            helperText={error && !formData.job_start_date ? "กรุณาเลือกวันที่เริ่มต้น" : ""}
                        />

                        <TextField
                            size="small"
                            label="วันที่สิ้นสุด"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={parseToInputDate(formData.job_end_date ?? "")}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    job_end_date: formatToThaiDate(e.target.value),
                                })
                            }
                            error={error && !formData.job_end_date}
                            helperText={error && !formData.job_end_date ? "กรุณาเลือกวันที่สิ้นสุด" : ""}
                        />
                        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                                <TimePicker
                                    label="เวลาเริ่ม"
                                    ampm={false}                // ✅ บังคับ 24 ชม.
                                    timeSteps={{ hours: 1, minutes: 1 }}
                                    value={formData.job_start_time ? dayjs(formData.job_start_time, 'HH:mm') : null}
                                    onChange={(v) => setFormData({ ...formData, job_start_time: v ? v.format('HH:mm') : '' })}
                                    slotProps={{
                                        textField: {
                                            size: 'small',
                                            fullWidth: true,
                                            error: error && !formData.job_start_time,
                                            helperText: error && !formData.job_start_time ? 'กรุณาเลือกเวลาเริ่มต้น' : '',
                                        },
                                    }}
                                />

                                <TimePicker
                                    label="เวลาสิ้นสุด"
                                    ampm={false}                // ✅ ไม่มี AM/PM
                                    timeSteps={{ hours: 1, minutes: 1 }}
                                    value={formData.job_end_time ? dayjs(formData.job_end_time, 'HH:mm') : null}
                                    onChange={(v) => setFormData({ ...formData, job_end_time: v ? v.format('HH:mm') : '' })}
                                    slotProps={{
                                        textField: {
                                            size: 'small',
                                            fullWidth: true,
                                            error: error && !formData.job_end_time,
                                            helperText: error && !formData.job_end_time ? 'กรุณาเลือกเวลาสิ้นสุด' : '',
                                        },
                                    }}
                                />
                            </Box>
                        </LocalizationProvider>
                    </Box>

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={!!formData.shift_next_jobs}
                                onChange={(e) =>
                                    setFormData({ ...formData, shift_next_jobs: e.target.checked ? 1 : 0 })
                                }
                            />
                        }
                        label="กรณีแก้ไขวันที่ของงาน ให้เลื่อนงานที่อยู่ถัดไปด้วย"
                    />
                    <Box
                        sx={{
                            mt: 1,
                            mb: 2,
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            gap: 2,
                        }}
                    >
                        <Box>
                            <label style={{ fontSize: "14px", marginBottom: "4px", display: "block" }}>
                                ลูกค้า
                            </label>
                            <Select
                                options={customers.map(c => ({
                                    value: c.customer_id,
                                    label: c.customer_name,
                                }))}
                                value={
                                    customers
                                        .map(c => ({ value: c.customer_id, label: c.customer_name }))
                                        .find(opt => opt.value === formData.customer_id) || null
                                }
                                onChange={(selected) => {
                                    const id = selected?.value || "";

                                    setFormData(prev => ({ ...prev, customer_id: id }));

                                    if (id) {
                                        fetchCustomerBranch(id);
                                    } else {
                                        setBranchs?.([]);
                                    }
                                }}
                                placeholder="-- เลือกลูกค้า --"
                                isClearable
                                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                styles={{
                                    control: (base, state) => ({
                                        ...base,
                                        backgroundColor: "#fff",
                                        borderColor:
                                            error && !formData.customer_id
                                                ? "#d32f2f" // ❌ สีแดงเมื่อ error
                                                : state.isFocused
                                                    ? "#3b82f6"
                                                    : "#d1d5db",
                                        boxShadow: "none",
                                        "&:hover": {
                                            borderColor:
                                                error && !formData.customer_id ? "#d32f2f" : "#9ca3af",
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
                            {error && !formData.customer_id && (
                                <span
                                    style={{
                                        color: "#d32f2f",
                                        fontSize: "12px",
                                        marginTop: 4,
                                        display: "block",
                                    }}
                                >
                                    กรุณาเลือกลูกค้า
                                </span>
                            )}
                        </Box>

                        <Box>
                            <label style={{ fontSize: "14px", marginBottom: "4px", display: "block" }}>
                                สาขา
                            </label>
                            <Select
                                options={branchs.map(c => ({
                                    value: c.branch_id,
                                    label: c.branch_name,
                                }))}
                                value={
                                    branchs
                                        .map(c => ({ value: c.branch_id, label: c.branch_name }))
                                        .find(opt => opt.value === formData.branch_id) || null
                                }
                                onChange={(selected) =>
                                    setFormData({ ...formData, branch_id: selected?.value || "" })
                                }
                                placeholder="-- เลือกสาขา --"
                                isClearable
                                isDisabled={!formData.customer_id}
                                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                styles={{
                                    control: (base, state) => ({
                                        ...base,
                                        backgroundColor: "#fff",
                                        borderColor:
                                            error && !formData.branch_id
                                                ? "#d32f2f" // ❌ สีแดงเมื่อ error
                                                : state.isFocused
                                                    ? "#3b82f6"
                                                    : "#d1d5db",
                                        boxShadow: "none",
                                        "&:hover": {
                                            borderColor:
                                                error && !formData.branch_id ? "#d32f2f" : "#9ca3af",
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
                            {error && !formData.branch_id && (
                                <span
                                    style={{
                                        color: "#d32f2f",
                                        fontSize: "12px",
                                        marginTop: 4,
                                        display: "block",
                                    }}
                                >
                                    กรุณาเลือกสาขา
                                </span>
                            )}
                        </Box>

                        <Box>
                            <label style={{ fontSize: "14px", marginBottom: "4px", display: "block" }}>
                                ทีม
                            </label>
                            <Select
                                options={teams.map(c => ({
                                    value: c.team_id,
                                    label: c.team_name,
                                }))}
                                value={
                                    teams
                                        .map(c => ({ value: c.team_id, label: c.team_name }))
                                        .find(opt => opt.value === formData.team_id) || null
                                }
                                onChange={(selected) =>
                                    setFormData({ ...formData, team_id: selected?.value || "" })
                                }
                                placeholder="-- เลือกทีม --"
                                isClearable
                                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                styles={{
                                    control: (base, state) => ({
                                        ...base,
                                        backgroundColor: "#fff",
                                        borderColor:
                                            error && !formData.team_id
                                                ? "#d32f2f" // ❌ สีแดงเมื่อ error
                                                : state.isFocused
                                                    ? "#3b82f6"
                                                    : "#d1d5db",
                                        boxShadow: "none",
                                        "&:hover": {
                                            borderColor:
                                                error && !formData.team_id ? "#d32f2f" : "#9ca3af",
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
                            {error && !formData.team_id && (
                                <span
                                    style={{
                                        color: "#d32f2f",
                                        fontSize: "12px",
                                        marginTop: 4,
                                        display: "block",
                                    }}
                                >
                                    กรุณาเลือกทีม
                                </span>
                            )}
                        </Box>
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
