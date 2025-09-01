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
    Accordion, AccordionSummary, AccordionDetails, Typography, FormGroup
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Select from "react-select";
import {
    JobsRow,
    TeamRow,
    ServiceRow,
    ProjectRow,
    JobStatusRow,
    ZoneRow,
    InspectGroupRow,
    InspectItemsRow
} from "@/interfaces/master";
import { showLoading } from "@/lib/loading";
import { formatToThaiDate, parseToInputDate, showAlert, showConfirm } from "@/lib/fetcher";

export default function InspectionTypePage() {
    const [rows, setRows] = React.useState<JobsRow[]>([]);
    const [teams, setTeams] = React.useState<TeamRow[]>([]);
    const [services, setServices] = React.useState<ServiceRow[]>([]);
    const [projects, setProjects] = React.useState<ProjectRow[]>([]);
    const [status, setStatus] = React.useState<JobStatusRow[]>([]);
    const [searchText, setSearchText] = React.useState("");
    const [open, setOpen] = React.useState(false);
    const [isEdit, setIsEdit] = React.useState(false);
    const [error, setError] = React.useState(false);

    const [zones, setZones] = React.useState<ZoneRow[]>([]);
    const zonesAbortRef = React.useRef<AbortController | null>(null);
    const [zoneInspects, setZoneInspects] = React.useState<
        Record<string, { loading: boolean; items: InspectGroupRow[] }>
    >({});
    const [expandedInspects, setExpandedInspects] = React.useState<Set<string>>(new Set());
    const [expandedZones, setExpandedZones] = React.useState<Set<string>>(new Set());
    const [selectedInspectsByZone, setSelectedInspectsByZone] = React.useState<Record<string, string[]>>({});

    const [groupItems, setGroupItems] = React.useState<
        Record<string, { loading: boolean; items: InspectItemsRow[] }>
    >({});

    const [selectedItemsByGroup, setSelectedItemsByGroup] = React.useState<
        Record<string, string[]>
    >({});

    const loadInspectsByZone = async (zoneId: string) => {
        if (!zoneId) return;

        // กันยิงซ้ำ: ถ้ามี cache แล้ว ไม่ต้องโหลดใหม่ (ถ้าอยาก force refresh ก็ลบ if นี้)
        if (zoneInspects[zoneId]?.items?.length) return;

        setZoneInspects(prev => ({ ...prev, [zoneId]: { loading: true, items: [], error: null } }));
        try {
            const res = await fetch("/api/auth/inspection-form/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "inspectsByZone", zone_id: zoneId }),
            });
            const result = await res.json();
            const items: InspectGroupRow[] = result?.success ? (result.data || []) : [];
            setZoneInspects(prev => ({ ...prev, [zoneId]: { loading: false, items, error: null } }));
        } catch (err: any) {
            setZoneInspects(prev => ({
                ...prev,
                [zoneId]: { loading: false, items: [], error: err?.message || "fetch error" },
            }));
        }
    };

    const fetchItemsByInspect = async (inspectId: string) => {
        if (!inspectId) return [];
        // ถ้ามีแล้วไม่ต้องโหลดซ้ำ
        if (groupItems[inspectId]?.items?.length) return groupItems[inspectId].items;

        setGroupItems(prev => ({ ...prev, [inspectId]: { loading: true, items: [] } }));
        try {
            const res = await fetch("/api/auth/inspection-form/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "inspectItems", inspect_id: inspectId }),
            });
            const result = await res.json();
            const items: InspectItemsRow[] = result?.success ? (result.data || []) : [];
            setGroupItems(prev => ({ ...prev, [inspectId]: { loading: false, items } }));
            return items;                       // ✅ คืนค่า
        } catch (err) {
            console.error("inspectItems fetch error:", err);
            setGroupItems(prev => ({ ...prev, [inspectId]: { loading: false, items: [] } }));
            return [];                          // ✅ คืนค่า
        }
    };

    const fetchZonesByService = async (serviceId: string) => {
        if (zonesAbortRef.current) zonesAbortRef.current.abort();

        // เคลียร์ข้อมูลเก่าเมื่อ service เปลี่ยน
        setZones([]);
        setZoneInspects({});
        setSelectedInspectsByZone({});
        setExpandedZones(new Set());

        if (!serviceId) return;

        const ctrl = new AbortController();
        zonesAbortRef.current = ctrl;
        showLoading(true);
        try {
            const res = await fetch("/api/auth/inspection-form/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "zonesByService", service_id: serviceId }),
                signal: ctrl.signal,
            });
            const data = await res.json();
            if (data?.success) {
                setZones(data.data || []);
            } else {
                setZones([]);
                console.error("zonesByService error:", data?.message);
            }
        } catch (err) {
            if ((err as any).name !== "AbortError") {
                console.error("zonesByService fetch error:", err);
                setZones([]);
            }
        } finally {
            showLoading(false);
        }
    };

    const fetchInspectsByZone = async (zoneId: string) => {
        if (!zoneId) return [];
        // กันยิงซ้ำถ้ามีแล้ว
        if (zoneInspects[zoneId]?.items?.length) return zoneInspects[zoneId].items;

        setZoneInspects(prev => ({ ...prev, [zoneId]: { loading: true, items: [] } }));
        try {
            const res = await fetch("/api/auth/inspection-form/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "inspectsByZone", zone_id: zoneId }),
            });
            const result = await res.json();
            const items = result?.success ? (result.data || []) : [];
            setZoneInspects(prev => ({ ...prev, [zoneId]: { loading: false, items } }));
            return items;
        } catch (err) {
            console.error("inspectsByZone error:", err);
            setZoneInspects(prev => ({ ...prev, [zoneId]: { loading: false, items: [] } }));
            return [];
        }
    };

    const toggleInspect = async (zoneId: string, inspectId: string) => {
        // สถานะเดิมของกรุ๊ปในโซนนี้
        const prevArr = selectedInspectsByZone[zoneId] || [];
        const isChecked = prevArr.includes(inspectId);

        if (isChecked) {
            // 🔻 ยกเลิกกรุ๊ป -> เอาออกจาก selectedInspectsByZone และเคลียร์ items ของกรุ๊ปนี้
            setSelectedInspectsByZone(prev => ({
                ...prev,
                [zoneId]: prevArr.filter(id => id !== inspectId),
            }));
            setSelectedItemsByGroup(prev => ({ ...prev, [inspectId]: [] }));
        } else {
            // 🔺 เลือกกรุ๊ป -> เติมลง selectedInspectsByZone และเลือก "ทุก item" ในกรุ๊ปนี้
            // ensure ว่ามีรายการ items แล้ว
            const items =
                groupItems[inspectId]?.items?.length
                    ? groupItems[inspectId].items
                    : await fetchItemsByInspect(inspectId);

            const allIds = items.map(it => it.inspect_item_id);

            setSelectedInspectsByZone(prev => ({
                ...prev,
                [zoneId]: [...prevArr, inspectId],
            }));

            setSelectedItemsByGroup(prev => ({
                ...prev,
                [inspectId]: allIds,   // ✅ เลือกทุก item
            }));
        }
    };

    const toggleInspectItem = (inspectId: string, itemId: string) => {
        setSelectedItemsByGroup(prev => {
            const cur = new Set(prev[inspectId] || []);
            cur.has(itemId) ? cur.delete(itemId) : cur.add(itemId);
            const next = { ...prev, [inspectId]: Array.from(cur) };

            // ⤵️ sync group checkbox: ถ้าเลือกครบทุก item -> ติ๊กกรุ๊ป, ถ้าน้อยกว่า -> เอาออก
            const total = groupItems[inspectId]?.items?.length ?? 0;
            if (total > 0) {
                const zoneIdOfThisGroup = formData.zone_id; // หรือ map ย้อน inspectId -> zoneId ถ้ามีหลายโซนพร้อมกัน
                const checkedAll = cur.size === total;

                setSelectedInspectsByZone(prevZone => {
                    const arr = new Set(prevZone[zoneIdOfThisGroup] || []);
                    if (checkedAll) arr.add(inspectId);
                    else arr.delete(inspectId);
                    return { ...prevZone, [zoneIdOfThisGroup]: Array.from(arr) };
                });
            }

            return next;
        });
    };

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
        team_id: "",
        team_name: "",
        service_id: "",
        service_name: "",
        zone_id: "",
        zone_name: "",
        status_id: "",
        status_name: "",
        is_active: 1,
        created_by: "admin",
        updated_by: "admin",
    });

    // Loaders
    const fetchJobs = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/job/get");
            const data = await res.json();
            if (data.success) {
                setRows(data.success || []);
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

    const fetchServices = async () => {
        try {
            const res = await fetch("/api/auth/inspection-form/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "services" }),
            });

            const data = await res.json();
            if (data.success) {
                setServices(data.data || []);
            } else {
                console.error("โหลด services ไม่สำเร็จ:", data.message);
            }
        } catch (err) {
            console.error("fetch error:", err);
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
                await fetchTeam();
                await fetchServices();
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
            team_id: "",
            team_name: "",
            service_id: "",
            service_name: "",
            zone_id: "",
            zone_name: "",
            status_id: "",
            status_name: "",
            is_active: 1,
            created_by: "admin",
            updated_by: "admin",
        });
        setOpen(true);
    };

    const handleOpenEdit = (row: JobsRow) => {
        const start_th = formatToThaiDate(row.job_start_date);
        const end_th = formatToThaiDate(row.job_end_date);

        setIsEdit(true);
        setFormData((prev) => ({
            ...prev,

            job_id: row.job_id ?? "",
            job_name: row.job_name ?? "",

            project_id: row.project_id ?? "",
            project_name: row.project_name ?? "",

            shift_next_jobs: Number(row.shift_next_jobs ?? 0),

            job_start_date: start_th,
            job_end_date: end_th,
            job_start_time: row.job_start_time ?? "",
            job_end_time: row.job_end_time ?? "",

            team_id: row.team_id ?? "",
            team_name: row.team_name ?? "",

            service_id: row.service_id ?? "",
            service_name: row.service_name ?? "",

            in_type_id: row.zone_id ?? (row as any).zone_id ?? "",
            in_type_name: row.zone_name ?? (row as any).zone_name ?? "",

            status_id: row.status_id ?? "",
            status_name: row.status_name ?? "",

            is_active: row.is_active ?? 1,
            created_by: row.created_by ?? "admin",
            updated_by: "admin",
        }));
        setOpen(true);
    };

    const handleClose = () => setOpen(false);

    const handleSave = async () => {
        if (!formData.job_name) {
            setError(true);
            return;
        }

        showLoading(true);
        try {
            const res = await fetch("/api/auth/job/post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
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

    const handleDelete = async (project_id: string) => {
        const confirmed = await showConfirm("คุณต้องการลบข้อมูลนี้หรือไม่?", "ลบข้อมูล");
        if (!confirmed) return;
        showLoading(true);
        try {
            const res = await fetch(`/api/auth/project-list/${project_id}`, { method: "DELETE" });
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
        { field: "job_id", headerName: "ID", flex: 1, headerAlign: "center", align: "center" },
        { field: "job_name", headerName: "งาน", flex: 1, headerAlign: "center", align: "left" },
        { field: "team_name", headerName: "ทีม", flex: 1, headerAlign: "center", align: "left" },
        { field: "project_name", headerName: "โครงการ", flex: 1, headerAlign: "center", align: "left" },
        {
            field: "is_active",
            headerName: "สถานะ",
            flex: 1,
            headerAlign: "center",
            align: "center",
            valueGetter: (v) => (v == null ? "" : v),
            renderCell: ({ row }) => (row.is_active === 1 ? "ใช้งาน" : "ปิด"),
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
                    <IconButton color="error" onClick={() => handleDelete(params.row.project_id)}>
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
                    pageSizeOptions={[5, 10]}
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
                                <label style={{ fontSize: "14px", marginBottom: "-4.5px", display: "block" }}>
                                    ID
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
                                    placeholder="-- เลือกโครงการ --"
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
                            <label style={{ fontSize: "14px", marginBottom: "-4.5px", display: "block" }}>
                                งาน
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

                    {/* row5: แก้ไขวันแล้วเลื่อนงานถัดไปไหม */}
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

                        <Box>
                            <label style={{ fontSize: "14px", marginBottom: "4px", display: "block" }}>
                                การบริการ
                            </label>
                            <Select
                                options={services.map(c => ({ value: c.service_id, label: c.service_name }))}
                                value={services.map(c => ({ value: c.service_id, label: c.service_name }))
                                    .find(opt => opt.value === formData.service_id) || null}
                                onChange={async (selected) => {
                                    const service_id = selected?.value || "";

                                    setFormData({
                                        ...formData,
                                        service_id,
                                    });

                                    // โหลดโซนของบริการ
                                    await fetchZonesByService(service_id);
                                }}
                                placeholder="-- เลือกการบริการ --"
                                isClearable
                                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                styles={{
                                    control: (base, state) => ({
                                        ...base,
                                        backgroundColor: "#fff",
                                        borderColor:
                                            error && !formData.service_id
                                                ? "#d32f2f" // ❌ สีแดงเมื่อ error
                                                : state.isFocused
                                                    ? "#3b82f6"
                                                    : "#d1d5db",
                                        boxShadow: "none",
                                        "&:hover": {
                                            borderColor:
                                                error && !formData.service_id ? "#d32f2f" : "#9ca3af",
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
                            {error && !formData.service_id && (
                                <span
                                    style={{
                                        color: "#d32f2f",
                                        fontSize: "12px",
                                        marginTop: 4,
                                        display: "block",
                                    }}
                                >
                                    กรุณาเลือกการบริการ
                                </span>
                            )}
                        </Box>

                        <Box>
                            <label style={{ fontSize: "14px", marginBottom: "4px", display: "block" }}>
                                การตรวจ
                            </label>
                            <Select
                                options={zones.map(c => ({ value: c.zone_id, label: c.zone_name }))}
                                value={zones.map(c => ({ value: c.zone_id, label: c.zone_name }))
                                    .find(opt => opt.value === formData.zone_id) || null}
                                onChange={async (selected) => {
                                    const zone_id = selected?.value || "";
                                    // reset selections เมื่อเปลี่ยนโซน
                                    setExpandedInspects(new Set());
                                    setSelectedInspectsByZone(prev => ({ ...prev, [zone_id]: [] }));
                                    setSelectedItemsByGroup({});
                                    // ตั้งค่า formData แล้วโหลด inspects
                                    setFormData(prev => ({ ...prev, zone_id }));
                                    if (zone_id) await loadInspectsByZone(zone_id);
                                }}
                                placeholder="-- เลือกการตรวจ --"
                                isClearable
                                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                styles={{
                                    control: (base, state) => ({
                                        ...base,
                                        backgroundColor: "#fff",
                                        borderColor:
                                            error && !formData.zone_id
                                                ? "#d32f2f" // ❌ สีแดงเมื่อ error
                                                : state.isFocused
                                                    ? "#3b82f6"
                                                    : "#d1d5db",
                                        boxShadow: "none",
                                        "&:hover": {
                                            borderColor:
                                                error && !formData.zone_id ? "#d32f2f" : "#9ca3af",
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
                                <span
                                    style={{
                                        color: "#d32f2f",
                                        fontSize: "12px",
                                        marginTop: 4,
                                        display: "block",
                                    }}
                                >
                                    กรุณาเลือกการตรวจ
                                </span>
                            )}
                        </Box>
                    </Box>
                    <Box>
                        <label style={{ fontSize: "14px", marginBottom: "4px", display: "block" }}>
                            Service
                        </label>

                        {/* ถ้ายังไม่เลือกโซน */}
                        {!formData.zone_id && !formData.service_id ? (
                            <Typography variant="body2" color="text.secondary">โปรดเลือกการตรวจ</Typography>
                        ) : (
                            // เมื่อเลือกโซนแล้ว: เรนเดอร์กรุ๊ปของโซนนั้น
                            (() => {
                                const zi = zoneInspects[formData.zone_id];

                                // ถ้ายังไม่มี cache ให้ยิงโหลดครั้งแรกตรงนี้ (lazy load)
                                if (!zi) {
                                    fetchInspectsByZone(formData.zone_id);
                                    return <Typography variant="body2" color="text.secondary">กำลังโหลดรายการ...</Typography>;
                                }

                                if (zi.loading) {
                                    return <Typography variant="body2" color="text.secondary">กำลังโหลดรายการ...</Typography>;
                                }

                                if ((zi.items?.length ?? 0) === 0) {
                                    return <Typography variant="body2" color="text.secondary">ไม่มีรายการ</Typography>;
                                }

                                const selectedGroups = selectedInspectsByZone[formData.zone_id] || [];

                                return (
                                    <FormGroup sx={{ gap: 1 }}>
                                        {zi.items.map((grp: any) => {
                                            const isExpanded = expandedZones.has(grp.inspect_id); // ✅ ตอนนี้เก็บ inspect_id
                                            const groupChecked = selectedGroups.includes(grp.inspect_id);
                                            const itemsPack = groupItems[grp.inspect_id];
                                            const selectedItems = selectedItemsByGroup[grp.inspect_id] || [];

                                            return (
                                                <Accordion
                                                    key={grp.inspect_id}
                                                    expanded={isExpanded}
                                                    onChange={async (_, expand) => {
                                                        setExpandedZones(prev => {
                                                            const next = new Set(prev);
                                                            if (expand) next.add(grp.inspect_id);
                                                            else next.delete(grp.inspect_id);
                                                            return next;
                                                        });

                                                        if (expand) {
                                                            // พอขยายค่อยพรีโหลด items ของกรุ๊ปนี้
                                                            await fetchItemsByInspect(grp.inspect_id);
                                                        }
                                                    }}
                                                    sx={{
                                                        mt: 0.5,
                                                        border: '1px solid',
                                                        borderColor: 'divider',
                                                        boxShadow: 2,
                                                        borderRadius: 2,
                                                        overflow: 'hidden',
                                                        '&:before': { display: 'none' },
                                                    }}
                                                >
                                                    <AccordionSummary
                                                        expandIcon={<ExpandMoreIcon />}
                                                        sx={{
                                                            minHeight: 28,
                                                            px: 1,
                                                            py: 0.5,
                                                            alignItems: "center",
                                                            '&.Mui-expanded': { minHeight: 28 },
                                                            '& .MuiAccordionSummary-content': {
                                                                margin: '5px 0',   // ✅ ลด margin-top / margin-bottom เหลือ 5px
                                                            },
                                                            '& .MuiAccordionSummary-content.Mui-expanded': {
                                                                margin: '5px 0',   // ✅ ตอน expanded ก็ให้เท่าเดิม
                                                            },
                                                        }}
                                                    >
                                                        <FormControlLabel
                                                            onClick={(e) => e.stopPropagation()}
                                                            onFocus={(e) => e.stopPropagation()}
                                                            control={
                                                                <Checkbox
                                                                    checked={groupChecked}
                                                                    onChange={() => toggleInspect(formData.zone_id, grp.inspect_id)}
                                                                    size="small"
                                                                    sx={{
                                                                        p: 0.25,      // ลด padding ของกล่องเช็ค
                                                                        mr: 0.5,      // ระยะขวาของ checkbox (0.5 = ~4px)
                                                                    }}
                                                                />
                                                            }
                                                            label={
                                                                <Typography variant="subtitle2" fontWeight={600} sx={{ m: 0, lineHeight: 1 }}>
                                                                    Inspection Group : {grp.inspect_name}
                                                                </Typography>
                                                            }
                                                            sx={{
                                                                m: 0,
                                                                // ลดช่องว่างที่ MUI ใส่ให้ label (จาก ~8px เหลือ ~4px)
                                                                '& .MuiFormControlLabel-label': { ml: 0.5 },
                                                            }}
                                                        />
                                                    </AccordionSummary>

                                                    <AccordionDetails>
                                                        {!itemsPack ? (
                                                            <Typography variant="body2" color="text.secondary">กำลังโหลดรายการ...</Typography>
                                                        ) : itemsPack.loading ? (
                                                            <Typography variant="body2" color="text.secondary">กำลังโหลดรายการ...</Typography>
                                                        ) : (itemsPack.items?.length ?? 0) === 0 ? (
                                                            <Typography variant="body2" color="text.secondary">ไม่มี Inspection Item</Typography>
                                                        ) : (
                                                            <Box sx={{ pl: 4, mt: -1 }}>
                                                                <FormGroup sx={{ gap: 0 }}>
                                                                    {itemsPack.items.map((itRow: any) => (
                                                                        <FormControlLabel
                                                                            key={itRow.inspect_item_id}
                                                                            control={
                                                                                <Checkbox
                                                                                    checked={selectedItems.includes(itRow.inspect_item_id)}
                                                                                    onChange={() => toggleInspectItem(grp.inspect_id, itRow.inspect_item_id)}
                                                                                    size="small"
                                                                                />
                                                                            }
                                                                            label={`Inspection Item : ${itRow.inspect_item_name}`}
                                                                        />
                                                                    ))}
                                                                </FormGroup>
                                                            </Box>
                                                        )}
                                                    </AccordionDetails>
                                                </Accordion>
                                            );
                                        })}
                                    </FormGroup>
                                );
                            })()
                        )}
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
