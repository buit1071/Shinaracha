"use client";

import * as React from "react";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
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
    Autocomplete
} from "@mui/material";
import Select from "react-select";
import {
    JobsRow,
    TeamRow,
    ProjectRow,
    JobStatusRow,
    CustomerRow,
    CustomerBranchRow,
    EquipmentRow,
    EquipmentBranchRow
} from "@/interfaces/master";
import { showLoading } from "@/lib/loading";
import { formatToThaiDate, parseToInputDate, showAlert, showConfirm, formatDate } from "@/lib/fetcher";

export default function JobPage() {
    const DATE_COL_WIDTH = 170;
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
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [equipmentOptions, setEquipmentOptions] = React.useState<EquipmentRow[]>([]);
    const [draftEquipment, setDraftEquipment] = React.useState<Partial<EquipmentBranchRow>>({});
    const [equipmentRows, setEquipmentRows] = React.useState<EquipmentBranchRow[]>([]);

    const [formEquipmentBranchData, setFormEquipmentBranchData] = React.useState<EquipmentBranchRow>({
        row_id: "",
        job_id: "",
        equipment_id: "",
        equipment_name: "",
        is_active: 1,
        created_by: "admin",
        updated_by: "admin",
    });

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
        branch_name: "",
        team_id: "",
        team_name: "",
        status_id: "",
        status_name: "",
        is_active: 1,
        created_by: "admin",
        updated_by: "admin",
    });


    const fetchEquipment = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/equipment");
            const data = await res.json();
            if (data.success) {
                setEquipmentOptions(data.data);
            }
        } catch (err) {
        } finally {
            showLoading(false);
        }
    };

    const fetchEquipmentByJobId = async (job_id?: string) => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/customer/equipment/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "equipment", job_id: job_id || formData.job_id }),
            });

            const result = await res.json();
            if (result.success && result.data) {
                setEquipmentRows(result.data || []);
                showLoading(false);
            }
        } catch (err) {
            showLoading(false);
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
        }
    };

    const fetchProject = async () => {
        try {
            const res = await fetch("/api/auth/project-list");
            const data = await res.json();
            if (data.success) setProjects(data.data || []);
        } catch (err) {
        }
    };

    const fetchStatus = async () => {
        try {
            const res = await fetch("/api/auth/status/get?active=true");
            const data = await res.json();
            if (data.success) setStatus(data.data || []);
        } catch (err) {
        }
    };

    React.useEffect(() => {
        (async () => {
            showLoading(true);
            try {
                await fetchProject();
                await fetchEquipment();
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

            customer_id: row.customer_id ?? "",
            customer_name: row.customer_name ?? "",

            branch_name: row.branch_name ?? "",

            status_id: row.status_id ?? "",
            status_name: row.status_name ?? "",

            is_active: row.is_active ?? 1,
            created_by: row.created_by ?? "admin",
            updated_by: "admin",
        }));

        if (row.job_id) {
            fetchEquipmentByJobId(row.job_id);
        }

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
            !formData.customer_id
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
            showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            showLoading(false);
        }
    };

    const columns: GridColDef<JobsRow>[] = [
        // เล็กลง
        { field: "order", headerName: "ลำดับ", width: 70, headerAlign: "center", align: "center", resizable: false },

        // ใหญ่ขึ้น
        {
            field: "project_name",
            headerName: "โครงการ",
            flex: 2.2, minWidth: 260,
            headerAlign: "center", align: "left", resizable: false,
        },
        {
            field: "job_name",
            headerName: "งาน",
            flex: 2.0, minWidth: 220,
            headerAlign: "center", align: "left", resizable: false,
        },

        // ปานกลาง
        { field: "branch_name", headerName: "ลูกค้า", flex: 1.2, minWidth: 160, headerAlign: "center", align: "left", resizable: false },

        // วันที่: กว้างเท่ากัน ตายตัว
        {
            field: "job_start_date", headerName: "วันเริ่มต้น",
            width: DATE_COL_WIDTH, headerAlign: "center", align: "center", resizable: false,
            renderCell: (params) => formatDate(params.row.job_start_date),
        },
        {
            field: "job_end_date", headerName: "วันสิ้นสุด",
            width: DATE_COL_WIDTH, headerAlign: "center", align: "center", resizable: false,
            renderCell: (params) => formatDate(params.row.job_end_date),
        },

        // เล็กลง
        {
            field: "status_name",
            headerName: "สถานะ",
            width: 110, headerAlign: "center", align: "center", resizable: false,
            renderCell: ({ value }) => (value && String(value).trim() ? value : "-"),
        },
        {
            field: "actions",
            headerName: "Action",
            sortable: false, filterable: false, disableColumnMenu: true,
            width: 120, headerAlign: "center", align: "center", resizable: false,
            renderCell: (params) => (
                <>
                    <IconButton color="primary" onClick={() => handleOpenEdit(params.row)}><EditIcon /></IconButton>
                    <IconButton color="error" onClick={() => handleDelete(params.row.job_id)}><DeleteIcon /></IconButton>
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

    const handleSaveEquipmentJob = async (rowId: string) => {
        showLoading(true);
        try {
            const job_id = formData.job_id;

            // ข้อมูลจากร่างที่กำลังแก้
            const id = draftEquipment.equipment_id || formEquipmentBranchData.equipment_id || "";
            const name = draftEquipment.equipment_name || formEquipmentBranchData.equipment_name || "";

            if (!id || !name) {
                showLoading(false);
                await showAlert("error", "กรุณาเลือกอุปกรณ์และระบุชื่ออุปกรณ์");
                return;
            }

            const payload = {
                entity: "equipment" as const,
                data: {
                    row_id: rowId?.startsWith("TMP-") ? "" : rowId,  // 👈 แถวใหม่ให้ส่งว่าง
                    job_id,
                    equipment_id: id,
                    equipment_name: name,
                    is_active: draftEquipment.is_active ?? 1,
                    created_by: draftEquipment.created_by || "admin",
                    updated_by: draftEquipment.updated_by || "admin",
                },
            };

            const res = await fetch("/api/auth/customer/equipment/post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            if (!res.ok || !result.success) {
                throw new Error(result.message || `บันทึกล้มเหลว (HTTP ${res.status})`);
            }

            // ✅ เซฟเสร็จ รีเฟรชจาก BE เพื่อให้ได้ row_id จริง (แทน TMP-*)
            await fetchEquipmentByJobId(job_id);
            showLoading(false);
            setEditingId(null);
            await showAlert("success", result.message ?? "บันทึกสำเร็จ");
        } catch (e: any) {
            await showAlert("error", e?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            showLoading(false);
        }
    };

    const startEditEquipment = (row: EquipmentBranchRow) => {
        setEditingId(row.row_id!);
        setDraftEquipment({ ...row });
    };

    const handleDeleteEquipment = async (row_id: string) => {
        const confirmed = await showConfirm("คุณต้องการลบข้อมูลนี้หรือไม่?", "ลบข้อมูล");
        if (!confirmed) return;

        showLoading(true);
        try {
            const res = await fetch(`/api/auth/customer/equipment/delete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ row_id, function: "equipment" }),
            });

            const result = await res.json();

            if (!res.ok || !result.success) {
                await showAlert("error", result.message || "ลบข้อมูลล้มเหลว");
                return;
            }
            showLoading(false);
            await showAlert("success", result.message);

            await fetchEquipmentByJobId(formData.job_id);
        } catch (err) {
            showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            showLoading(false);
        }
    };

    const handleAddEquipment = () => {
        const newRow: EquipmentBranchRow = {
            row_id: `TMP-${crypto.randomUUID?.() ?? Date.now()}`, // 👈 temp id
            job_id: formData.job_id,
            equipment_id: "",
            equipment_name: "",
            is_active: 1,
            created_by: "admin",
            updated_by: "admin",
        };
        setEquipmentRows(prev => [newRow, ...prev]); // ใส่บนสุดจะเห็นชัด
        startEditEquipment(newRow);
    };

    const usedEquipIds = React.useMemo(
        () => new Set(equipmentRows.map(r => r.equipment_id)),
        [equipmentRows]
    );

    const equipmentNameById = React.useMemo(() => {
        const m = new Map<string, string>();
        for (const o of equipmentOptions) m.set(o.equipment_id, o.equipment_name);
        return m;
    }, [equipmentOptions]);

    const equipmentColumns: GridColDef<EquipmentBranchRow>[] = [
        {
            field: "order",
            headerName: "ลำดับ",
            width: 90,
            headerAlign: "center",
            align: "center",
            sortable: false,
            renderCell: (params) =>
                params.api.getRowIndexRelativeToVisibleRows(params.id) + 1,
        },
        {
            field: "equipment_name",
            headerName: "ชื่ออุปกรณ์",
            flex: 1,
            headerAlign: "center",
            align: "center",
            sortable: false,
            renderCell: (params) => {
                const isEditing = editingId === params.row.row_id;

                if (!isEditing) {
                    const name =
                        params.row.equipment_name ||
                        equipmentNameById.get(params.row.equipment_id) ||
                        "—";
                    return <span>{name}</span>;
                }

                const currentRowId = params.row.equipment_id;
                const selectedId = draftEquipment.equipment_id ?? currentRowId ?? "";
                const current =
                    equipmentOptions.find(o => o.equipment_id === selectedId) || null;

                return (
                    <Autocomplete
                        options={equipmentOptions}
                        isOptionEqualToValue={(opt, val) => opt.equipment_id === val.equipment_id}
                        getOptionLabel={(o) => o.equipment_name || ""}
                        value={current}
                        onChange={(_, val) =>
                            setDraftEquipment(prev => ({
                                ...prev,
                                equipment_id: val?.equipment_id ?? "",
                                equipment_name: val?.equipment_name ?? "",
                            }))
                        }
                        getOptionDisabled={(opt) =>
                            usedEquipIds.has(opt.equipment_id) && opt.equipment_id !== currentRowId
                        }
                        renderInput={(p) => (
                            <TextField {...p} size="small" placeholder="-- เลือกอุปกรณ์ --" />
                        )}
                        // (ทางเลือก) โชว์ label ว่า “ถูกใช้งานแล้ว” ในเมนู
                        renderOption={(props, option) => {
                            const disabled =
                                usedEquipIds.has(option.equipment_id) &&
                                option.equipment_id !== currentRowId;
                            return (
                                <li {...props} aria-disabled={disabled}>
                                    <span style={{ flex: 1 }}>{option.equipment_name}</span>
                                    {disabled && (
                                        <span style={{ opacity: 0.6, fontSize: 12 }}>ถูกใช้งานแล้ว</span>
                                    )}
                                </li>
                            );
                        }}
                        fullWidth
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            width: "95%",
                            ".MuiInputBase-root": { height: 36 },
                        }}
                    />
                );
            },
        },
        {
            field: "actions",
            headerName: "Action",
            width: 150,
            sortable: false,
            filterable: false,
            disableColumnMenu: true,
            align: "center",
            headerAlign: "center",
            renderCell: (params) => {
                const isEditing = editingId === params.row.row_id;
                return (
                    <>
                        {isEditing ? (
                            <IconButton onClick={() => handleSaveEquipmentJob(params.row.row_id)} color="primary">
                                <SaveIcon />
                            </IconButton>
                        ) : (
                            <IconButton onClick={() => startEditEquipment(params.row)} color="primary">
                                <EditIcon />
                            </IconButton>
                        )}
                        <IconButton onClick={() => handleDeleteEquipment(params.row.row_id)} color="error">
                            <DeleteIcon />
                        </IconButton>
                    </>
                );
            },
        },
    ];

    return (
        <div className="w-full h-full flex flex-col bg-gray-50 justify-between">
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

                                <Select menuPlacement="auto"
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
                            />
                        </Box>

                        <Box>
                            <label style={{ fontSize: "14px", marginBottom: "4px", display: "block" }}>
                                โครงการ
                            </label>

                            <Select menuPlacement="auto"
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
                        </Box>
                    </Box>

                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
                        <Box
                            sx={{
                                mt: 2,
                                display: "grid",
                                // มือถือ: 1 คอลัมน์, แท็บเล็ต: 2 คอลัมน์ (วัน/เวลา), จอใหญ่: 4 คอลัมน์ (วัน,เวลา,วัน,เวลา)
                                gridTemplateColumns: {
                                    xs: "1fr",
                                    sm: "2fr 1fr",
                                    md: "2fr 1fr 2fr 1fr", // เวลาเล็กกว่าวัน (2:1)
                                },
                                gap: 2,
                                alignItems: "center",
                            }}
                        >
                            {/* วันเริ่ม */}
                            <TextField
                                size="small"
                                label="วันที่เริ่มต้น"
                                type="date"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={parseToInputDate(formData.job_start_date ?? "")}
                                onChange={(e) => setFormData({ ...formData, job_start_date: formatToThaiDate(e.target.value) })}
                                error={error && !formData.job_start_date}
                            />

                            {/* เวลาเริ่ม */}
                            <TimePicker
                                label="เวลาเริ่ม"
                                ampm={false}
                                timeSteps={{ hours: 1, minutes: 1 }}
                                value={formData.job_start_time ? dayjs(formData.job_start_time, "HH:mm") : null}
                                onChange={(v) => setFormData({ ...formData, job_start_time: v ? v.format("HH:mm") : "" })}
                                slotProps={{
                                    textField: {
                                        size: "small",
                                        fullWidth: true,
                                        error: error && !formData.job_start_time,
                                    },
                                }}
                            />

                            {/* วันสิ้น */}
                            <TextField
                                size="small"
                                label="วันที่สิ้นสุด"
                                type="date"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={parseToInputDate(formData.job_end_date ?? "")}
                                onChange={(e) => setFormData({ ...formData, job_end_date: formatToThaiDate(e.target.value) })}
                                inputProps={{ min: parseToInputDate(formData.job_start_date ?? "") }}
                                error={error && !formData.job_end_date}
                            />

                            {/* เวลาสิ้น */}
                            <TimePicker
                                label="เวลาสิ้นสุด"
                                ampm={false}
                                timeSteps={{ hours: 1, minutes: 1 }}
                                value={formData.job_end_time ? dayjs(formData.job_end_time, "HH:mm") : null}
                                onChange={(v) => setFormData({ ...formData, job_end_time: v ? v.format("HH:mm") : "" })}
                                slotProps={{
                                    textField: {
                                        size: "small",
                                        fullWidth: true,
                                        error: error && !formData.job_end_time,
                                    },
                                }}
                            />
                        </Box>
                    </LocalizationProvider>

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
                                สาขา
                            </label>
                            <Select menuPlacement="auto"
                                options={branchs.map(c => ({
                                    value: c.customer_id,
                                    label: c.branch_name,
                                }))}
                                value={
                                    branchs
                                        .map(c => ({ value: c.customer_id, label: c.branch_name }))
                                        .find(opt => opt.value === formData.customer_id) || null
                                }
                                onChange={(selected) =>
                                    setFormData({ ...formData, customer_id: selected?.value || "" })
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
                        </Box>

                        <Box>
                            <label style={{ fontSize: "14px", marginBottom: "4px", display: "block" }}>
                                ทีม
                            </label>
                            <Select menuPlacement="auto"
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
                        </Box>
                    </Box>

                    {formData.job_id && (
                        <Box mt={2}>
                            <div className="w-full">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-xl font-bold text-gray-800">
                                        ระบบ & อุปกรณ์
                                    </h3>
                                    <Button className=" mb-10" variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleAddEquipment}>
                                        เพิ่มอุปกรณ์
                                    </Button>
                                </div>
                                <DataGrid
                                    rows={equipmentRows}
                                    columns={equipmentColumns}
                                    getRowId={(row) => row.row_id || `${row.job_id}:${row.equipment_id}`}
                                    disableRowSelectionOnClick
                                    pagination
                                    hideFooter
                                    autoHeight
                                    sx={{
                                        "& .MuiDataGrid-cell": {
                                            display: "flex",
                                            alignItems: "center",
                                            py: 0,
                                        },
                                        "& .MuiDataGrid-cellContent": {
                                            display: "flex",          // 👈 เพิ่ม
                                            alignItems: "center",     // 👈 เพิ่ม (จัดกลางแนวตั้งที่ content จริง)
                                            width: "100%",
                                            height: "100%",
                                        },
                                        "& .MuiDataGrid-cell > div": { width: "100%" },
                                        "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": { outline: "none" },
                                        "& .MuiDataGrid-columnHeader": { py: 0 },
                                        "& .MuiDataGrid-virtualScroller": {
                                            maxHeight: "200px !important",
                                            overflowY: "auto !important",
                                            overflowX: "hidden",
                                        },
                                    }}
                                />
                            </div>
                        </Box>
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
