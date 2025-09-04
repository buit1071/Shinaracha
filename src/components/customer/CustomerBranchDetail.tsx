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
import SaveIcon from "@mui/icons-material/Save";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Typography,
    FormGroup, Accordion, AccordionSummary, FormControlLabel, Checkbox, AccordionDetails
} from "@mui/material";
import Select from "react-select";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { CustomerBranchRow, CustomerGroupRow, ServiceEquipmentRow, ServiceRow, ZoneRow, InspectGroupRow, InspectItemsRow } from "@/interfaces/master";

type Props = {
    customerId: string;
    branchId: string;
    onBack: () => void;
};

type ContactRow = {
    id: number;
    name: string;
    email: string;
    tel: string;
};

export default function CustomerBranchDetail({ customerId, branchId, onBack }: Props) {
    const [view, setView] = React.useState<null | { type: "detail"; id: string }>(null);
    const openDetail = (id: string) => setView({ type: "detail", id });
    const backToList = () => setView(null);
    const [services, setServices] = React.useState<ServiceRow[]>([]);
    const [rows, setRows] = React.useState<CustomerBranchRow[]>([]);
    const [groups, setGroups] = React.useState<CustomerGroupRow[]>([]);
    const [equipments, setEquipments] = React.useState<ServiceEquipmentRow[]>([]);
    const [searchText, setSearchText] = React.useState("");
    const [open, setOpen] = React.useState(false);
    const [isEdit, setIsEdit] = React.useState(false);
    const [error, setError] = React.useState(false);
    const [errorEquipment, setErrorEquipment] = React.useState(false);
    const [errorGroup, setErrorGroup] = React.useState(false);
    const [searchTextEquipment, setSearchTextEquipment] = React.useState("");
    const [isEditEquipment, setIsEditEquipment] = React.useState(false);
    const [openEquipment, setOpenEquipment] = React.useState(false);
    const [zones, setZones] = React.useState<ZoneRow[]>([]);
    const zonesAbortRef = React.useRef<AbortController | null>(null);
    const [zoneInspects, setZoneInspects] = React.useState<
        Record<string, { loading: boolean; items: InspectGroupRow[] }>
    >({});
    const [expandedZones, setExpandedZones] = React.useState<Set<string>>(new Set());
    const [selectedInspectsByZone, setSelectedInspectsByZone] = React.useState<Record<string, string[]>>({});
    const [groupItems, setGroupItems] = React.useState<
        Record<string, { loading: boolean; items: InspectItemsRow[] }>
    >({});
    const [selectedItemsByGroup, setSelectedItemsByGroup] = React.useState<
        Record<string, string[]>
    >({});

    const [formData, setFormData] = React.useState<CustomerBranchRow>({
        customer_id: customerId,
        branch_id: branchId,
        branch_name: "",
        cus_cost_centre: "",
        store_no: "",
        customer_format: "",
        customer_area: "",
        customer_hub: "",
        branch_tel: "",
        contact_person_id: "",
        contact_tel_id: "",
        address: "",
        customer_regional: "",
        customer_province: "",
        customer_email_id: "",
        group_id: "",
        latitude: "",
        longitude: "",
        service_id: "",
        zone_id: "",
        equipment_group_id: "",
        is_active: 1,
        created_by: "admin",
        updated_by: "admin",
    });

    const [formEquipmentData, setFormEquipmentData] = React.useState<ServiceEquipmentRow>({
        branch_id: branchId || "123",
        service_id: "",
        zone_id: "",
        is_active: 1,
        created_by: "admin",
        updated_by: "admin",
    });

    const handleOpenEditService = (row: ServiceEquipmentRow) => {
        setIsEditEquipment(true);
        setFormEquipmentData(row);
        setOpenEquipment(true);
    };

    const handleDeleteService = async (id: string) => {
        const confirmed = await showConfirm("คุณต้องการลบข้อมูลนี้หรือไม่?", "ลบข้อมูล");
        if (!confirmed) return;

        showLoading(true);
        try {
            const res = await fetch(`/api/auth/customer/delete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, function: "group" }),
            });

            const result = await res.json();
            if (result.success) {
                showLoading(false);
                await showAlert("success", result.message);
                fetchGroupByCustomerId();
            } else {
                showLoading(false);
                showAlert("error", result.message || "ลบข้อมูลล้มเหลว");
            }
        } catch (err) {
            console.error("Delete error:", err);
            showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            showLoading(false);
        }
    };

    const handleSaveEquipment = async () => {
        if (!formEquipmentData.service_id && formEquipmentData.zone_id) {
            setErrorEquipment(true);
            return; // ยังไม่เปิดโหลด เพราะเราเช็คก่อน
        }

        showLoading(true);
        try {
            const payload = {
                entity: "groupCustomer" as const,
                data: {
                    branch_id: formEquipmentData.branch_id || undefined,
                    service_id: formEquipmentData.service_id,
                    zone_id: formEquipmentData.zone_id,
                    is_active: formEquipmentData.is_active ?? 1,
                    created_by: formEquipmentData.created_by || "admin",
                    updated_by: formEquipmentData.updated_by || "admin",
                },
            };

            const res = await fetch("/api/auth/customer/post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // cache: "no-store", // ถ้าต้องการกัน cache
                body: JSON.stringify(payload),
            });

            const result = await res.json();
            showLoading(false);

            if (result.success) {
                // ปิดโหลดก่อน แล้วค่อยปิด dialog และค่อยโชว์ swal
                showLoading(false);
                setOpenEquipment(false);
                await showAlert("success", result.message);
                fetchGroupByCustomerId();
            } else {
                showLoading(false);
                setOpenEquipment(false);
                await showAlert("error", result.message || "บันทึกล้มเหลว");
            }
        } catch (e) {
            console.error(e);
            showLoading(false);
            setOpenEquipment(false);
            await showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            // กันตกหล่น/throw จาก showAlert
            showLoading(false);
        }
    };

    const handleCloseEquipment = () => setOpenEquipment(false);

    const columnEquipments: GridColDef<ServiceEquipmentRow>[] = [
        {
            field: "order",
            headerName: "ลำดับ",
            width: 90,
            headerAlign: "center",
            align: "center",
        },
        {
            field: "zone_name", headerName: "Zone", flex: 1, headerAlign: "center", align: "left",
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
            renderCell: (params: GridRenderCellParams<ServiceEquipmentRow>) => (
                <>
                    <IconButton color="primary" onClick={() => handleOpenEditService(params.row)}>
                        <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDeleteService(params.row.zone_id)}>
                        <DeleteIcon />
                    </IconButton>
                </>
            ),
        },
    ];

    const [contactRows, setContactRows] = React.useState<ContactRow[]>([
        { id: 1, name: "สมชาย ใจดี", email: "123@a123.com", tel: "12345679" },
        { id: 2, name: "สมหญิง แก้วใส", email: "46@456.com", tel: "987654321" },
    ]);

    const [editingId, setEditingId] = React.useState<number | null>(null);
    const [draft, setDraft] = React.useState<Partial<ContactRow>>({});

    const startEdit = (row: ContactRow) => {
        setEditingId(row.id);
        setDraft({ ...row });
    };

    const handleFieldChange = <K extends keyof ContactRow>(key: K, value: ContactRow[K]) => {
        setDraft((p) => ({ ...p, [key]: value }));
    };

    const handleAdd = () => {
        const nextId = contactRows.length ? Math.max(...contactRows.map((r) => r.id)) + 1 : 1;
        const newRow: ContactRow = { id: nextId, name: "", email: "", tel: "" };
        setContactRows((prev) => [...prev, newRow]);
        startEdit(newRow);
    };

    const handleDelete = (id: number) => {
        setContactRows((prev) => prev.filter((r) => r.id !== id));
        if (editingId === id) {
            setEditingId(null);
            setDraft({});
        }
    };

    const handleSave = (id: number) => {
        setContactRows((prev) =>
            prev.map((r) => (r.id === id ? { ...r, ...draft } as ContactRow : r))
        );
        setEditingId(null);
        setDraft({});
    };

    const editableCell =
        (field: keyof ContactRow, autoFocus = false) =>
            (params: GridRenderCellParams<ContactRow>) => {
                const isEditing = editingId === params.row.id;
                if (!isEditing) {
                    const v = params.row[field] as string | number | undefined;
                    return <span className="w-full text-center">{v || "—"}</span>;
                }
                const value = (draft[field] as string) ?? "";
                return (
                    <Box sx={{ width: "100%", display: "flex", alignItems: "center" }}>
                        <TextField
                            size="small"
                            fullWidth
                            value={value}
                            onChange={(e) => handleFieldChange(field, e.target.value)}
                            autoFocus={autoFocus}
                            inputProps={{ style: { textAlign: "center" } }}   // ข้อความในช่องอยู่กลาง
                        />
                    </Box>
                );
            };

    const columns: GridColDef<ContactRow>[] = [
        {
            field: "order",
            headerName: "ลำดับ",
            width: 90,
            headerAlign: "center",
            align: "center",
            sortable: false,
            renderCell: (params) =>
                params.api.getRowIndexRelativeToVisibleRows(params.id) + 1
        },
        {
            field: "name",
            headerName: "ชื่อ",
            flex: 1,
            headerAlign: "center",
            align: "center",
            renderCell: editableCell("name", true), // โฟกัสคอลัมน์แรกเวลาเริ่มแก้ไข
        },
        {
            field: "email",
            headerName: "Email",
            flex: 1,
            headerAlign: "center",
            align: "center",
            renderCell: editableCell("email"),
        },
        {
            field: "tel",
            headerName: "เบอร์",
            flex: 1,
            headerAlign: "center",
            align: "center",
            renderCell: editableCell("tel"),
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
            renderCell: (params: GridRenderCellParams<ContactRow>) => {
                const isEditing = editingId === params.row.id;
                return (
                    <>
                        {isEditing ? (
                            <IconButton onClick={() => handleSave(params.row.id)} color="primary">
                                <SaveIcon />
                            </IconButton>
                        ) : (
                            <IconButton onClick={() => startEdit(params.row)} color="primary">
                                <EditIcon />
                            </IconButton>
                        )}
                        <IconButton onClick={() => handleDelete(params.row.id)} color="error">
                            <DeleteIcon />
                        </IconButton>
                    </>
                );
            },
        },
    ];

    const handleOpenAdd = () => {
        setIsEdit(false);
        setFormData({
            customer_id: customerId,
            branch_id: branchId,
            branch_name: "",
            cus_cost_centre: "",
            store_no: "",
            customer_format: "",
            customer_area: "",
            customer_hub: "",
            branch_tel: "",
            contact_person_id: "",
            contact_tel_id: "",
            address: "",
            customer_regional: "",
            customer_province: "",
            customer_email_id: "",
            group_id: "",
            latitude: "",
            longitude: "",
            service_id: "",
            zone_id: "",
            equipment_group_id: "",
            is_active: 1,
            created_by: "admin",
            updated_by: "admin",
        });
        setOpen(true);
    };

    const handleOpenAddEquipment = () => {
        setIsEditEquipment(false);
        setFormEquipmentData({
            branch_id: branchId || "123",
            service_id: "",
            zone_id: "",
            is_active: 1,
            created_by: "admin",
            updated_by: "admin",
        });
        setOpenEquipment(true);
    };

    const fetchGroupByCustomerId = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/customer/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "groupByCustomerId", customer_id: customerId }),
            });

            const result = await res.json();
            if (result.success && result.data) {
                setGroups(result.data || []);
                showLoading(false);
            }
        } catch (err) {
            showLoading(false);
            console.error("fetch customer name error:", err);
        }
    };

    const fetchService = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/inspection-form/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // ถ้าต้องการกัน cache ฝั่งเบราว์เซอร์ เพิ่ม cache: "no-store"
                body: JSON.stringify({ function: "services" }),
            });

            const data = await res.json();
            if (data.success) {
                setServices(data.data || []);
            } else {
                console.error("โหลด services ไม่สำเร็จ:", data.message);
            }
        } catch (err) {
            console.error("Fetch error:", err);
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
                const zoneIdOfThisGroup = formEquipmentData.zone_id; // หรือ map ย้อน inspectId -> zoneId ถ้ามีหลายโซนพร้อมกัน
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

    React.useEffect(() => {
        if (!customerId) return;
        fetchGroupByCustomerId();
        fetchService();
    }, [customerId]);

    const filteredEquipmentRows = equipments.filter((row) =>
            Object.values(row).some((value) =>
                String(value).toLowerCase().includes(searchTextEquipment.toLowerCase())
            )
        ).map((row, index) => ({
            ...row,
            order: index + 1,
        }));

    return (
        <div className="w-full h-[96vh] flex flex-col bg-gray-50">
            <div className="h-[6vh] flex items-center justify-between px-4 py-2 bg-white shadow-md mb-2 rounded-lg">
                <div className="flex items-center">
                    <IconButton onClick={onBack} color="primary">
                        <ArrowBackIcon />
                    </IconButton>
                    <h2 className="text-xl font-bold text-gray-800 ml-5">
                        เพิ่มข้อมูลสาขา
                    </h2>
                </div>
            </div>
            <div className="flex-1 items-center justify-between px-4 py-2 bg-white shadow-md mb-2 rounded-lg overflow-auto">
                <span className="text-black">ข้อมูลสาขา</span>
                <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                    <TextField
                        size="small"
                        margin="dense"
                        label="Cus Cost Centre"
                        fullWidth
                        value={formData.branch_name}
                    />
                    <TextField
                        size="small"
                        margin="dense"
                        label="Store No"
                        fullWidth
                        value={formData.store_no}
                    />
                    <TextField
                        size="small"
                        margin="dense"
                        label="Customer Format"
                        fullWidth
                        value={formData.customer_format}
                    />
                    <TextField
                        size="small"
                        margin="dense"
                        label="Customer Area"
                        fullWidth
                        value={formData.customer_area}
                    />
                </Box>

                <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                    <TextField
                        size="small"
                        margin="dense"
                        label="Customer Hub"
                        fullWidth
                        value={formData.customer_hub}
                    />
                    <TextField
                        size="small"
                        margin="dense"
                        label="ชื่อ สาขา"
                        fullWidth
                        value={formData.branch_name}
                    />
                    <TextField
                        size="small"
                        margin="dense"
                        label="Branch Tel"
                        fullWidth
                        value={formData.branch_tel}
                    />
                    <TextField
                        size="small"
                        margin="dense"
                        label="ที่อยู่"
                        fullWidth
                        value={formData.address}
                    />
                </Box>

                <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                    <TextField
                        size="small"
                        margin="dense"
                        label="Customer Regional"
                        fullWidth
                        value={formData.customer_regional}
                    />
                    <TextField
                        size="small"
                        margin="dense"
                        label="Customer Province"
                        fullWidth
                        value={formData.customer_province}
                    />
                </Box>

                <Box mt={1}>
                    <label className="block mb-1 text-sm text-black">
                        Group
                    </label>

                    <Select
                        options={groups.map(c => ({
                            value: c.group_id,
                            label: c.group_name,
                        }))}
                        value={
                            groups
                                .map(c => ({ value: c.group_id, label: c.group_name }))
                                .find(opt => opt.value === formData.group_id) || null
                        }
                        onChange={(selected) =>
                            setFormData({ ...formData, group_id: selected?.value || "" })
                        }
                        placeholder="-- เลือกโครงการ --"
                        isClearable
                        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                        styles={{
                            control: (base, state) => ({
                                ...base,
                                backgroundColor: "#fff",
                                borderColor:
                                    error && !formData.group_id
                                        ? "#d32f2f" // ❌ สีแดงเมื่อ error
                                        : state.isFocused
                                            ? "#3b82f6"
                                            : "#d1d5db",
                                boxShadow: "none",
                                "&:hover": {
                                    borderColor:
                                        error && !formData.group_id ? "#d32f2f" : "#9ca3af",
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
                    {error && !formData.group_id && (
                        <span
                            style={{
                                color: "#d32f2f",
                                fontSize: "12px",
                                marginTop: 4,
                                display: "block",
                            }}
                        >
                            กรุณาเลือก Group
                        </span>
                    )}
                </Box>

                <Box mt={2}>
                    <div className="w-full">
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-xl font-bold text-gray-800">
                                ผู้ติดต่อ
                            </h3>
                            <Button className=" mb-10" variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleAdd}>
                                เพิ่มผู้ติดต่อ
                            </Button>
                        </div>
                        <DataGrid
                            rows={contactRows}
                            columns={columns}
                            disableRowSelectionOnClick
                            pagination
                            hideFooter
                            autoHeight
                            sx={{
                                "& .MuiDataGrid-cell": { display: "flex", alignItems: "center" },
                                "& .MuiDataGrid-cell > div": { width: "100%" },
                                "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": { outline: "none" },

                                // ✅ เลื่อนเฉพาะบอดี้เมื่อเกิน 400px
                                "& .MuiDataGrid-virtualScroller": {
                                    maxHeight: "200px !important",
                                    overflowY: "auto !important",
                                    overflowX: "hidden",
                                },
                            }}
                        />
                    </div>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}>
                    <span className="text-black">พิกัดร้าน :</span>
                    <TextField
                        size="small"
                        margin="dense"
                        label="ละติจูด"
                        value={formData.latitude}
                        sx={{ flex: 1 }}
                    />
                    <TextField
                        size="small"
                        margin="dense"
                        label="ลองจิจูด"
                        value={formData.longitude}
                        sx={{ flex: 1 }}
                    />
                </Box>

                <Box mt={2}>
                    <div className="h-[6vh] flex items-center justify-between">
                        <div className="flex items-center">
                            <h3 className="text-xl font-bold text-gray-800">
                                ข้อมูลการตรวจสอบ
                            </h3>
                        </div>
                        <div className="flex gap-2 items-center">
                            <TextField
                                size="small"
                                placeholder="ค้นหา..."
                                value={searchTextEquipment}
                                onChange={(e) => setSearchTextEquipment(e.target.value)}
                            />
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<AddIcon />}
                                onClick={handleOpenAddEquipment}
                            >
                                เพิ่มข้อมูล
                            </Button>
                        </div>
                    </div>
                    <DataGrid
                        rows={filteredEquipmentRows}
                        columns={columnEquipments}
                        getRowId={(row) => row.zone_id}
                        disableRowSelectionOnClick
                        autoHeight
                        initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
                        pageSizeOptions={[5, 10, 25]}
                        sx={{
                            width: "100%",
                            borderRadius: "0.5rem",
                            boxShadow: "0 4px 6px rgba(0,0,0,.1)",
                            "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": { outline: "none" },
                        }}
                    />
                </Box>

                {/* Dialog Popup */}
                <Dialog open={openEquipment} onClose={handleCloseEquipment} fullWidth maxWidth="xl" sx={{ zIndex: 1000 }}>
                    <DialogTitle>{isEditEquipment ? "แก้ไขข้อมูล" : "เพิ่มข้อมูล"}</DialogTitle>
                    <DialogContent dividers>
                        <Box>
                            <label style={{ fontSize: "14px", marginBottom: "4px", display: "block" }}>
                                การบริการ
                            </label>
                            <Select
                                options={services.map(c => ({ value: c.service_id, label: c.service_name }))}
                                value={services.map(c => ({ value: c.service_id, label: c.service_name }))
                                    .find(opt => opt.value === formEquipmentData.service_id) || null}
                                onChange={async (selected) => {
                                    const service_id = selected?.value || "";

                                    setFormEquipmentData({
                                        ...formEquipmentData,
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
                                            error && !formEquipmentData.service_id
                                                ? "#d32f2f" // ❌ สีแดงเมื่อ error
                                                : state.isFocused
                                                    ? "#3b82f6"
                                                    : "#d1d5db",
                                        boxShadow: "none",
                                        "&:hover": {
                                            borderColor:
                                                error && !formEquipmentData.service_id ? "#d32f2f" : "#9ca3af",
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
                            {errorEquipment && !formEquipmentData.service_id && (
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
                                    .find(opt => opt.value === formEquipmentData.zone_id) || null}
                                onChange={async (selected) => {
                                    const zone_id = selected?.value || "";
                                    // reset selections เมื่อเปลี่ยนโซน
                                    setSelectedInspectsByZone(prev => ({ ...prev, [zone_id]: [] }));
                                    setSelectedItemsByGroup({});
                                    // ตั้งค่า formEquipmentData แล้วโหลด inspects
                                    setFormEquipmentData(prev => ({ ...prev, zone_id }));
                                    if (zone_id) await loadInspectsByZone(zone_id);
                                }}
                                placeholder="-- เลือกการตรวจ --"
                                isDisabled={!formEquipmentData.service_id}
                                isClearable
                                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                styles={{
                                    control: (base, state) => ({
                                        ...base,
                                        backgroundColor: "#fff",
                                        borderColor:
                                            error && !formEquipmentData.zone_id
                                                ? "#d32f2f" // ❌ สีแดงเมื่อ error
                                                : state.isFocused
                                                    ? "#3b82f6"
                                                    : "#d1d5db",
                                        boxShadow: "none",
                                        "&:hover": {
                                            borderColor:
                                                error && !formEquipmentData.zone_id ? "#d32f2f" : "#9ca3af",
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
                            {error && !formEquipmentData.zone_id && (
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

                        <Box mt={2}>
                            <label style={{ fontSize: "14px", marginBottom: "4px", display: "block" }}>
                                Service
                            </label>

                            {/* ถ้ายังไม่เลือกโซน */}
                            {!formEquipmentData.zone_id && !formEquipmentData.service_id ? (
                                <Typography variant="body2" color="text.secondary">โปรดเลือกการตรวจ</Typography>
                            ) : (
                                // เมื่อเลือกโซนแล้ว: เรนเดอร์กรุ๊ปของโซนนั้น
                                (() => {
                                    const zi = zoneInspects[formEquipmentData.zone_id];

                                    // ถ้ายังไม่มี cache ให้ยิงโหลดครั้งแรกตรงนี้ (lazy load)
                                    if (!zi) {
                                        fetchInspectsByZone(formEquipmentData.zone_id);
                                        return <Typography variant="body2" color="text.secondary">กำลังโหลดรายการ...</Typography>;
                                    }

                                    if (zi.loading) {
                                        return <Typography variant="body2" color="text.secondary">กำลังโหลดรายการ...</Typography>;
                                    }

                                    if ((zi.items?.length ?? 0) === 0) {
                                        return <Typography variant="body2" color="text.secondary">ไม่มีรายการ</Typography>;
                                    }

                                    const selectedGroups = selectedInspectsByZone[formEquipmentData.zone_id] || [];

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
                                                                        onChange={() => toggleInspect(formEquipmentData.zone_id, grp.inspect_id)}
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
                        <Button onClick={handleCloseEquipment}>ยกเลิก</Button>
                        <Button variant="contained" color="primary" onClick={handleSaveEquipment}>
                            บันทึก
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>

        </div>
    );
}
