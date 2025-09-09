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
    FormGroup, Accordion, AccordionSummary, FormControlLabel, Checkbox, AccordionDetails, Autocomplete
} from "@mui/material";
import Select from "react-select";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { CustomerBranchRow, CustomerGroupRow, ServiceEquipmentRow, ServiceRow, ZoneRow, InspectGroupRow, InspectItemsRow, ContactRow, EquipmentBranchRow, EquipmentRow } from "@/interfaces/master";
import { generateId } from "@/lib/fetcher";
import GoogleMapBox from "@/components/google-map/GoogleMapBox";

type Props = {
    customerId: string;
    branchId: string;
    onBack: () => void;
};

export default function CustomerBranchDetail({ customerId, branchId, onBack }: Props) {
    const [services, setServices] = React.useState<ServiceRow[]>([]);
    const [groups, setGroups] = React.useState<CustomerGroupRow[]>([]);
    const [equipments, setEquipments] = React.useState<ServiceEquipmentRow[]>([]);
    const safeArr = <T,>(a?: T[]) => Array.isArray(a) ? a : [];
    const [error, setError] = React.useState(false);
    const [errorContact, setErrorContact] = React.useState(false);
    const [errorEquipment, setErrorEquipment] = React.useState(false);
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
        address: "",
        customer_regional: "",
        customer_province: "",
        group_id: "",
        latitude: "",
        longitude: "",
        is_active: 1,
        created_by: "admin",
        updated_by: "admin",
    });

    const [formEquipmentData, setFormEquipmentData] = React.useState<ServiceEquipmentRow>({
        branch_id: branchId || "",
        service_id: "",
        zone_id: "",
        service_inspec_id: "",
        is_active: 1,
        created_by: "admin",
        updated_by: "admin",
        inspection: [
            {
                inspection_id: "",
                inspection_name: "",
                items: [
                    {
                        inspection_item_id: "",
                        inspection_item_name: ""
                    }
                ]
            }
        ],
    });

    const [contactRows, setContactRows] = React.useState<ContactRow[]>([]);
    const [equipmentRows, setEquipmentRows] = React.useState<EquipmentBranchRow[]>([]);

    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [draft, setDraft] = React.useState<Partial<ContactRow>>({});
    const [draftEquipment, setDraftEquipment] = React.useState<Partial<EquipmentBranchRow>>({});
    const [formContactData, setFormContactData] = React.useState<ContactRow>({
        branch_id: branchId || "",
        contact_id: "",
        name: "",
        email: "",
        tel: "",
        is_active: 1,
        created_by: "admin",
        updated_by: "admin",
    });

    const [equipmentOptions, setEquipmentOptions] = React.useState<EquipmentRow[]>([]);
    const [formEquipmentBranchData, setFormEquipmentBranchData] = React.useState<EquipmentBranchRow>({
        branch_id: branchId || "",
        service_id: "",
        equipment_id: "",
        equipment_name: "",
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
            console.error("Fetch error:", err);
        } finally {
            showLoading(false);
        }
    };

    const fetchEquipmentByBranchId = async (service_id?: string) => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/customer/equipment/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "equipment", branch_id: branchId, service_id: service_id || formEquipmentData.service_id }),
            });

            const result = await res.json();
            if (result.success && result.data) {
                setEquipmentRows(result.data || []);
                showLoading(false);
            }
        } catch (err) {
            showLoading(false);
            console.error("fetch error:", err);
        }
    };

    const handleOpenEditService = (row: ServiceEquipmentRow) => {
        setIsEditEquipment(true);

        // 1) เซ็ตฟอร์มหลัก
        setFormEquipmentData({
            branch_id: row.branch_id || "",
            service_id: row.service_id || "",
            zone_id: row.zone_id || "",
            service_inspec_id: row.service_inspec_id || "",
            is_active: row.is_active ?? 1,
            created_by: row.created_by || "admin",
            updated_by: row.updated_by || "admin",
            inspection: safeArr(row.inspection),
        });

        // 2) preload selections จาก inspection[]
        const groups = safeArr(row.inspection);

        // กลุ่มที่ถูกติ๊กของโซนนี้ (ใช้ inspection_id)
        const groupIds = groups.map(g => g.inspection_id).filter(Boolean);

        // ไอเท็มที่ถูกติ๊กในแต่ละกลุ่ม (key = inspection_id, value = array ของ inspection_item_id)
        const byGroup: Record<string, string[]> = {};
        for (const g of groups) {
            const items = safeArr(g.items).map(it => it.inspection_item_id).filter(Boolean);
            byGroup[g.inspection_id] = items;
        }

        setSelectedInspectsByZone(prev => ({ ...prev, [row.zone_id]: groupIds }));
        setSelectedItemsByGroup(byGroup);

        // 3) ขยาย accordion ของทุก group ที่มีอยู่ เพื่อเห็นรายการตอนเปิดมา
        setExpandedZones(new Set(groupIds));

        // 4) เปิด modal
        setOpenEquipment(true);

        // 5) preload ข้อมูลที่ต้องเรียกเพิ่ม (ถ้าจำเป็น)
        //    - โหลดรายการ zone ของ service นี้ เพื่อให้ Select แสดง zone ถูกต้อง
        if (row.service_id) fetchZonesByService(row.service_id);
        //    - โหลด groups ของ zone นี้เพื่อให้ cache มีข้อมูล (UI จะไม่ขึ้น "กำลังโหลด...")
        if (row.zone_id) fetchInspectsByZone(row.zone_id).then(async (res) => {
            // พรีโหลด items ของทุก group ที่มีเลือกไว้ จะได้ติ๊กโชว์ทันที
            await Promise.all(groupIds.map(id => fetchItemsByInspect(id)));
        });
        fetchEquipmentByBranchId(row.service_id);
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

    const handleDeleteEquipment = async (id: string, branch_id: string, service_id: string) => {
        const confirmed = await showConfirm("คุณต้องการลบข้อมูลนี้หรือไม่?", "ลบข้อมูล");
        if (!confirmed) return;

        showLoading(true);
        try {
            const res = await fetch(`/api/auth/customer/equipment/delete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, branch_id, service_id, function: "equipment" }),
            });

            const result = await res.json();
            showLoading(false);

            // ถ้าไม่เจอใน DB -> ถือว่าสำเร็จ (ลบออกจาก UI เหมือนกัน)
            if (res.status === 400) {
                await showAlert("success", "ลบข้อมูลเรียบร้อย");
                // รีเฟรชรายการ
                fetchEquipmentByBranchId();
                return;
            }

            if (!res.ok || !result.success) {
                showAlert("error", result.message || "ลบข้อมูลล้มเหลว");
                return;
            }

            await showAlert("success", result.message);
            fetchEquipmentByBranchId();
        } catch (err) {
            console.error("Delete error:", err);
            showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            showLoading(false);
        }
    };

    const countSelectedItems = (): number =>
        Object.values(selectedItemsByGroup).reduce((sum, arr) => sum + ((arr as string[] | undefined)?.length || 0), 0);

    const handleSaveEquipment = async () => {
        if (!formEquipmentData.service_id || !formEquipmentData.zone_id) {
            setErrorEquipment(true);
            return;
        }

        // ✅ ต้องมี "item" ถูกเลือกอย่างน้อย 1 รายการ
        if (countSelectedItems() === 0) {
            await showAlert("error", "โปรดเลือก Inspection Item อย่างน้อย 1 รายการ");
            return;
        }

        showLoading(true);
        try {
            const inspection = await buildSelectedInspections();

            setFormEquipmentData((prev) => ({ ...prev, inspection }));

            const payload = {
                entity: "serviceItem" as const,
                data: {
                    branch_id: branchId,
                    service_inspec_id: formEquipmentData.service_inspec_id,
                    service_id: formEquipmentData.service_id,
                    zone_id: formEquipmentData.zone_id,
                    is_active: formEquipmentData.is_active ?? 1,
                    created_by: formEquipmentData.created_by || "admin",
                    updated_by: formEquipmentData.updated_by || "admin",
                    inspection,
                },
            };

            const res = await fetch("/api/auth/customer/equipment/post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            if (result.success) {
                showLoading(false);
                setOpenEquipment(false);
                await showAlert("success", result.message);
                fetchServiceEquipment();
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
            showLoading(false);
        }
    };

    const handleCloseEquipment = () => setOpenEquipment(false);

    const serviceNameById = React.useMemo(
        () => new Map(services.map(z => [z.service_id, z.service_name])),
        [services]
    );

    const columnEquipments: GridColDef<ServiceEquipmentRow>[] = [
        { field: "order", headerName: "ลำดับ", width: 90, headerAlign: "center", align: "center" },
        {
            field: "service_name",
            headerName: "Service",
            flex: 1,
            headerAlign: "center",
            align: "center",
            renderCell: ({ row }) => (
                <>{serviceNameById.get(row.service_id) ?? "-"}</>
            ),
            sortComparator: (v1, v2) => String(v1).localeCompare(String(v2)),
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

    const startEdit = (row: ContactRow) => {
        setEditingId(row.contact_id);
        setDraft({ ...row });
    };

    const startEditEquipment = (row: EquipmentBranchRow) => {
        setEditingId(row.equipment_id);
        setDraftEquipment({ ...row });
    };

    const fetchContactByBranchId = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/customer/contact/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "contact", branch_id: branchId }),
            });

            const result = await res.json();
            if (result.success && result.data) {
                setContactRows(result.data || []);
                showLoading(false);
            }
        } catch (err) {
            showLoading(false);
            console.error("fetch error:", err);
        }
    };

    const fetchBranchDetail = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/customer/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "customerBranchDetail", branch_id: branchId }),
            });

            const result = await res.json();
            if (result.success && result.data) {
                setFormData(result.data || []);
                showLoading(false);
            }
        } catch (err) {
            showLoading(false);
            console.error("fetch error:", err);
        }
    };

    const handleFieldChange = <K extends keyof ContactRow>(key: K, value: ContactRow[K]) => {
        setDraft((p) => ({ ...p, [key]: value }));
    };

    const handleAddContact = () => {
        const nextId = generateId("CT");
        const newRow: ContactRow = {
            branch_id: branchId || "",
            contact_id: nextId,
            name: "",
            email: "",
            tel: "",
            is_active: 1,
            created_by: "admin",
            updated_by: "admin",
        };
        setContactRows((prev) => [...prev, newRow]);
        startEdit(newRow);
    };

    const handleAddEquipment = () => {
        const newRow: EquipmentBranchRow = {
            branch_id: branchId || "",
            service_id: formEquipmentData.service_id,
            equipment_id: "",
            equipment_name: "",
            is_active: 1,
            created_by: "admin",
            updated_by: "admin",
        } as any;

        setEquipmentRows((prev) => [...prev, newRow]);
        startEditEquipment(newRow);
    };

    const handleDeleteContact = async (contact_id: string) => {
        const confirmed = await showConfirm("คุณต้องการลบข้อมูลนี้หรือไม่?", "ลบข้อมูล");
        if (!confirmed) return;

        showLoading(true);
        try {
            const res = await fetch("/api/auth/customer/contact/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "contact", id: contact_id }),
            });

            const result = await res.json();
            showLoading(false);

            // ✅ ถ้า API ตอบ 400 → ถือว่าข้อมูลไม่เจอ แต่ลบออกจาก FE แล้วแจ้ง success
            if (res.status === 400) {
                setContactRows(prev => prev.filter(r => r.contact_id !== contact_id));
                if (editingId === contact_id) {
                    setEditingId(null);
                    setDraft({});
                }
                await showAlert("success", "ลบข้อมูลเรียบร้อย");
                return;
            }

            if (!res.ok || !result.success) {
                throw new Error(result.message || `ลบข้อมูลล้มเหลว (HTTP ${res.status})`);
            }

            // ✅ ลบออกจากตารางใน FE ปกติ
            setContactRows(prev => prev.filter(r => r.contact_id !== contact_id));
            if (editingId === contact_id) {
                setEditingId(null);
                setDraft({});
            }

            await showAlert("success", result.message || "ลบข้อมูลเรียบร้อย");
        } catch (err: any) {
            showLoading(false);
            console.error("Delete error:", err);
            await showAlert("error", err?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            showLoading(false);
        }
    };

    const handleSaveContact = async (contact_id: string) => {
        const name = (draft.name ?? formContactData.name)?.trim() ?? "";
        if (!name) {
            setErrorContact(true);
            return;
        }

        const email = (draft.email ?? formContactData.email)?.trim() ?? "";
        const tel = (draft.tel ?? formContactData.tel)?.trim() ?? "";

        showLoading(true);
        try {
            const id = contact_id || formContactData.contact_id; // ใช้ id ที่ส่งมาเป็นหลัก

            const payload = {
                entity: "contact" as const,
                data: {
                    branch_id: branchId || "",
                    contact_id: id,
                    name,                 // ✅ แก้จาก 'ame'
                    email,
                    tel,
                    is_active: formContactData.is_active ?? 1,
                    created_by: formContactData.created_by || "admin",
                    updated_by: formContactData.updated_by || "admin",
                },
            };

            const res = await fetch("/api/auth/customer/contact/post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            showLoading(false);
            const result = await res.json();
            if (!res.ok || !result.success) {
                throw new Error(result.message || `บันทึกล้มเหลว (HTTP ${res.status})`);
            }

            // อัปเดตแถวในตารางให้ตรงกับที่บันทึกสำเร็จ
            setContactRows(prev => {
                const idx = prev.findIndex(r => r.contact_id === id);
                const updated: ContactRow = {
                    branch_id: branchId || "",
                    contact_id: id,
                    name, email, tel,
                    is_active: formContactData.is_active ?? 1,
                    created_by: formContactData.created_by || "admin",
                    updated_by: formContactData.updated_by || "admin",
                };
                if (idx >= 0) {
                    const next = [...prev];
                    next[idx] = { ...prev[idx], ...updated };
                    return next;
                }
                return [...prev, updated];
            });

            await showAlert("success", result.message ?? "บันทึกสำเร็จ");
            setEditingId(null);
            setDraft({});
            setErrorContact(false);
        } catch (e: any) {
            console.error(e);
            await showAlert("error", e?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            showLoading(false);
        }
    };

    const handleSaveEquipmentBranch = async (equipment_id: string) => {
        showLoading(true);
        try {
            const service_id =
                formEquipmentData.service_id;
            const id =
                equipment_id ||
                draftEquipment.equipment_id ||      // ✅ เอาจาก draft ถ้า param ว่าง
                formEquipmentBranchData.equipment_id;
            const name =
                equipment_id ||
                draftEquipment.equipment_name ||      // ✅ เอาจาก draft ถ้า param ว่าง
                formEquipmentBranchData.equipment_name;

            const payload = {
                entity: "equipment" as const,
                data: {
                    branch_id: branchId || "",
                    service_id: service_id,
                    equipment_id: id,
                    equipment_name: name,
                    is_active: formEquipmentBranchData.is_active ?? 1,
                    created_by: formEquipmentBranchData.created_by || "admin",
                    updated_by: formEquipmentBranchData.updated_by || "admin",
                },
            };

            const res = await fetch("/api/auth/customer/equipment/post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            showLoading(false);
            const result = await res.json();
            if (!res.ok || !result.success) {
                throw new Error(result.message || `บันทึกล้มเหลว (HTTP ${res.status})`);
            }

            setEquipmentRows(prev =>
                prev.map(r =>
                    r.equipment_id === equipment_id
                        ? {
                            ...r,
                            equipment_id: id,
                            equipment_name:
                                draftEquipment.equipment_name ?? r.equipment_name,
                        }
                        : r
                )
            );

            setEditingId(null);

            await showAlert("success", result.message ?? "บันทึกสำเร็จ");
        } catch (e: any) {
            console.error(e);
            await showAlert("error", e?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            showLoading(false);
        }
    };

    const editableCell =
        (field: keyof ContactRow, autoFocus = false) =>
            (params: GridRenderCellParams<ContactRow>) => {
                const isEditing = editingId === params.row.contact_id;
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
                            inputProps={{ style: { textAlign: "center" } }}
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
                params.api.getRowIndexRelativeToVisibleRows(params.id) + 1,
        },
        {
            field: "name",
            headerName: "ชื่อ",
            flex: 1,
            headerAlign: "center",
            align: "center",
            renderCell: editableCell("name", true),
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
                const isEditing = editingId === params.row.contact_id;
                return (
                    <>
                        {isEditing ? (
                            <IconButton onClick={() => handleSaveContact(params.row.contact_id)} color="primary">
                                <SaveIcon />
                            </IconButton>
                        ) : (
                            <IconButton onClick={() => startEdit(params.row)} color="primary">
                                <EditIcon />
                            </IconButton>
                        )}
                        <IconButton onClick={() => handleDeleteContact(params.row.contact_id)} color="error">
                            <DeleteIcon />
                        </IconButton>
                    </>
                );
            },
        },
    ];

    const equipmentNameById = React.useMemo(() => {
        const m = new Map<string, string>();
        for (const o of equipmentOptions) m.set(o.equipment_id, o.equipment_name);
        return m;
    }, [equipmentOptions]);

    const usedEquipIds = React.useMemo(
        () => new Set(equipmentRows.map(r => r.equipment_id)),
        [equipmentRows]
    );

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
                const isEditing = editingId === params.row.equipment_id;

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
                const isEditing = editingId === params.row.equipment_id;
                return (
                    <>
                        {isEditing ? (
                            <IconButton onClick={() => handleSaveEquipmentBranch(params.row.equipment_id)} color="primary">
                                <SaveIcon />
                            </IconButton>
                        ) : (
                            <IconButton onClick={() => startEditEquipment(params.row)} color="primary">
                                <EditIcon />
                            </IconButton>
                        )}
                        <IconButton onClick={() => handleDeleteEquipment(params.row.equipment_id, params.row.branch_id, params.row.service_id || formEquipmentData.service_id)} color="error">
                            <DeleteIcon />
                        </IconButton>
                    </>
                );
            },
        },
    ];

    const handleOpenAddEquipment = () => {
        setIsEditEquipment(false);
        setFormEquipmentData({
            branch_id: branchId || "",
            service_inspec_id: "",
            service_id: "",
            zone_id: "",
            is_active: 1,
            created_by: "admin",
            updated_by: "admin",
            inspection: [],
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
            console.error("fetch error:", err);
        }
    };

    const fetchServiceEquipment = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/customer/equipment/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "serviceItem", branch_id: branchId }),
            });

            const result = await res.json();
            if (result.success && result.data) {
                setEquipments(result.data || []);
                showLoading(false);
            }
        } catch (err) {
            showLoading(false);
            console.error("fetch error:", err);
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

    React.useEffect(() => {
        fetchBranchDetail();
        fetchEquipment();
        fetchEquipmentByBranchId();
        fetchContactByBranchId();
        fetchServiceEquipment();
    }, [branchId]);

    const filteredEquipmentRows = equipments.filter((row) =>
        Object.values(row).some((value) =>
            String(value).toLowerCase().includes(searchTextEquipment.toLowerCase())
        )
    ).map((row, index) => ({
        ...row,
        order: index + 1,
    }));

    const handleSave = async () => {
        const requiredFields = [
            "cus_cost_centre",
            "store_no",
            "customer_format",
            "customer_area",
            "customer_hub",
            "branch_name",
            "branch_tel",
            "address",
            "customer_regional",
            "customer_province",
            "group_id",
        ] as const;

        // helper ปลอดภัยกับ undefined/null
        const safeTrim = (v: unknown) => String(v ?? "").trim();

        // หา field ที่ยังว่าง (หลัง trim)
        const missing = requiredFields.filter((k) => !safeTrim((formData as any)[k]));

        if (missing.length > 0) {
            setError(true);
            return;
        }

        showLoading(true);
        try {
            const payload = {
                entity: "branchDetail" as const,
                data: {
                    customer_id: formData.customer_id || undefined,
                    branch_id: formData.branch_id || undefined,
                    cus_cost_centre: safeTrim(formData.cus_cost_centre),
                    store_no: safeTrim(formData.store_no),
                    customer_format: safeTrim(formData.customer_format),
                    customer_area: safeTrim(formData.customer_area),
                    customer_hub: safeTrim(formData.customer_hub),
                    branch_name: safeTrim(formData.branch_name),
                    branch_tel: safeTrim(formData.branch_tel),
                    address: safeTrim(formData.address),
                    customer_regional: safeTrim(formData.customer_regional),
                    customer_province: safeTrim(formData.customer_province),
                    group_id: formData.group_id,
                    latitude: formData.latitude ?? null,
                    longitude: formData.longitude ?? null,
                    is_active: formData.is_active ?? 1,
                    created_by: formEquipmentData?.created_by || "admin",
                    updated_by: formData.updated_by || "admin",
                },
            };

            const res = await fetch("/api/auth/customer/post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await res.json();
            showLoading(false);

            if (result.success) {
                await showAlert("success", result.message);
                onBack?.();
                // fetchGroupByCustomerId();
            } else {
                await showAlert("error", result.message || "บันทึกล้มเหลว");
            }
        } catch (e) {
            console.error(e);
            await showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            showLoading(false);
        }
    };

    const buildSelectedInspections = async (): Promise<
        {
            inspection_id: string;
            inspection_name: string;
            items: { inspection_item_id: string; inspection_item_name: string }[];
        }[]
    > => {
        const zoneId = formEquipmentData.zone_id;
        const zi = zoneInspects[zoneId];
        if (!zi?.items?.length) return [];

        // โหลด items ของเฉพาะกรุ๊ปที่มีการเลือก item เพื่อดึงชื่อ item
        for (const grp of zi.items as InspectGroupRow[]) {
            const pickedIds = selectedItemsByGroup[grp.inspect_id] || [];
            if (pickedIds.length && !groupItems[grp.inspect_id]?.items) {
                await fetchItemsByInspect(grp.inspect_id);
            }
        }

        const out: {
            inspection_id: string;
            inspection_name: string;
            items: { inspection_item_id: string; inspection_item_name: string }[];
        }[] = [];

        for (const grp of zi.items as InspectGroupRow[]) {
            const pickedIds: string[] = selectedItemsByGroup[grp.inspect_id] || [];
            if (!pickedIds.length) continue; // ⬅️ ไม่มี item ถูกเลือก ข้ามกรุ๊ปนี้

            const itemsList = (groupItems[grp.inspect_id]?.items as InspectItemsRow[] | undefined) || [];
            const items = pickedIds.map((id) => {
                const it = itemsList.find((x) => x.inspect_item_id === id);
                return {
                    inspection_item_id: id,
                    inspection_item_name: it?.inspect_item_name || "",
                };
            });

            out.push({
                inspection_id: grp.inspect_id,
                inspection_name: grp.inspect_name,
                items,
            });
        }

        return out;
    };

    return (
        <div className="w-full h-[96vh] flex flex-col bg-gray-50">
            <div className="h-[6vh] flex items-center justify-between px-4 py-2 bg-white shadow-md mb-2 rounded-lg">
                <div className="flex items-center">
                    <IconButton onClick={onBack} color="primary">
                        <ArrowBackIcon />
                    </IconButton>
                    <h2 className="text-xl font-bold text-gray-800 ml-5">
                        {!branchId
                            ? "เพิ่มข้อมูลสาขา"
                            : `สาขา : ${formData.branch_name || ""}`}
                    </h2>
                </div>
            </div>
            <div className="flex-1 items-center justify-between px-4 py-2 bg-white shadow-md rounded-lg overflow-auto">
                <span className="text-black">ข้อมูลสาขา</span>
                <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                    <TextField
                        size="small"
                        margin="dense"
                        label="Cus Cost Centre"
                        fullWidth
                        value={formData.cus_cost_centre}
                        onChange={(e) => {
                            setFormData({ ...formData, cus_cost_centre: e.target.value });
                        }}
                        error={error && !formData.cus_cost_centre}
                        helperText={error && !formData.cus_cost_centre ? "กรุณากรอก Cus Cost Centre" : ""}
                    />
                    <TextField
                        size="small"
                        margin="dense"
                        label="Store No"
                        fullWidth
                        value={formData.store_no}
                        onChange={(e) => {
                            setFormData({ ...formData, store_no: e.target.value });
                        }}
                        error={error && !formData.store_no}
                        helperText={error && !formData.store_no ? "กรุณากรอก Store No" : ""}
                    />
                    <TextField
                        size="small"
                        margin="dense"
                        label="Customer Format"
                        fullWidth
                        value={formData.customer_format}
                        onChange={(e) => {
                            setFormData({ ...formData, customer_format: e.target.value });
                        }}
                        error={error && !formData.customer_format}
                        helperText={error && !formData.customer_format ? "กรุณากรอก Customer Format" : ""}
                    />
                    <TextField
                        size="small"
                        margin="dense"
                        label="Customer Area"
                        fullWidth
                        value={formData.customer_area}
                        onChange={(e) => {
                            setFormData({ ...formData, customer_area: e.target.value });
                        }}
                        error={error && !formData.customer_area}
                        helperText={error && !formData.customer_area ? "กรุณากรอก Customer Area" : ""}
                    />
                </Box>

                <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                    <TextField
                        size="small"
                        margin="dense"
                        label="Customer Hub"
                        fullWidth
                        value={formData.customer_hub}
                        onChange={(e) => {
                            setFormData({ ...formData, customer_hub: e.target.value });
                        }}
                        error={error && !formData.customer_hub}
                        helperText={error && !formData.customer_hub ? "กรุณากรอก Customer Hub" : ""}
                    />
                    <TextField
                        size="small"
                        margin="dense"
                        label="ชื่อสาขา"
                        fullWidth
                        value={formData.branch_name}
                        onChange={(e) => {
                            setFormData({ ...formData, branch_name: e.target.value });
                        }}
                        error={error && !formData.branch_name}
                        helperText={error && !formData.branch_name ? "กรุณากรอกชื่อสาขา" : ""}
                    />
                    <TextField
                        size="small"
                        margin="dense"
                        label="Branch Tel"
                        fullWidth
                        value={formData.branch_tel}
                        onChange={(e) => {
                            setFormData({ ...formData, branch_tel: e.target.value });
                        }}
                        error={error && !formData.branch_tel}
                        helperText={error && !formData.branch_tel ? "กรุณากรอก Branch Tel" : ""}
                    />
                    <TextField
                        size="small"
                        margin="dense"
                        label="ที่อยู่"
                        fullWidth
                        value={formData.address}
                        onChange={(e) => {
                            setFormData({ ...formData, address: e.target.value });
                        }}
                        error={error && !formData.address}
                        helperText={error && !formData.address ? "กรุณากรอกที่อยู่" : ""}
                    />
                </Box>

                <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                    <TextField
                        size="small"
                        margin="dense"
                        label="Customer Regional"
                        fullWidth
                        value={formData.customer_regional}
                        onChange={(e) => {
                            setFormData({ ...formData, customer_regional: e.target.value });
                        }}
                        error={error && !formData.customer_regional}
                        helperText={error && !formData.customer_regional ? "กรุณากรอก Customer Regional" : ""}
                    />
                    <TextField
                        size="small"
                        margin="dense"
                        label="Customer Province"
                        fullWidth
                        value={formData.customer_province}
                        onChange={(e) => {
                            setFormData({ ...formData, customer_province: e.target.value });
                        }}
                        error={error && !formData.customer_province}
                        helperText={error && !formData.customer_province ? "กรุณากรอก Customer Province" : ""}
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
                        placeholder="-- เลือก Group --"
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

                {branchId && (
                    <Box mt={2}>
                        <div className="w-full">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="text-xl font-bold text-gray-800">
                                    ผู้ติดต่อ
                                </h3>
                                <Button className=" mb-10" variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleAddContact}>
                                    เพิ่มผู้ติดต่อ
                                </Button>
                            </div>
                            <DataGrid
                                rows={contactRows}
                                columns={columns}
                                getRowId={(row) => row.contact_id}
                                disableRowSelectionOnClick
                                pagination
                                hideFooter
                                autoHeight
                                sx={{
                                    "& .MuiDataGrid-cell": { display: "flex", alignItems: "center" },
                                    "& .MuiDataGrid-cell > div": { width: "100%" },
                                    "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": { outline: "none" },
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

                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}>
                    <span className="text-black">พิกัดร้าน :</span>
                    <TextField
                        size="small"
                        margin="dense"
                        label="ละติจูด"
                        type="number"
                        value={formData.latitude}
                        sx={{ flex: 1 }}
                        onChange={(e) => {
                            let val = parseFloat(e.target.value);
                            if (isNaN(val)) {
                                setFormData({ ...formData, latitude: "" });
                                return;
                            }
                            if (val < -90) val = -90;      // ดักไม่ให้ต่ำกว่า -90
                            if (val > 90) val = 90;        // ดักไม่ให้เกิน 90
                            setFormData({ ...formData, latitude: val.toString() });
                        }}
                    />

                    <TextField
                        size="small"
                        margin="dense"
                        label="ลองจิจูด"
                        type="number"
                        value={formData.longitude}
                        sx={{ flex: 1 }}
                        onChange={(e) => {
                            let val = parseFloat(e.target.value);
                            if (isNaN(val)) {
                                setFormData({ ...formData, longitude: "" });
                                return;
                            }
                            if (val < -180) val = -180;    // ดักไม่ให้ต่ำกว่า -180
                            if (val > 180) val = 180;      // ดักไม่ให้เกิน 180
                            setFormData({ ...formData, longitude: val.toString() });
                        }}
                    />
                </Box>

                <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                    <Box sx={{ width: "80%", height: 500, borderRadius: 2, overflow: "hidden" }}>
                        <GoogleMapBox lat={13.7563} lng={100.5018} />
                    </Box>
                </Box>

                {branchId && (
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
                )}

                {/* Dialog Popup */}
                <Dialog open={openEquipment} onClose={handleCloseEquipment} fullWidth maxWidth="xl" sx={{ zIndex: 1000 }}>
                    <DialogTitle>{isEditEquipment ? "แก้ไขข้อมูลการตรวจสอบ" : "เพิ่มข้อมูลการตรวจสอบ"}</DialogTitle>
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
                            <h3 className="text-xl font-bold text-gray-800">
                                Service
                            </h3>

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

                        {isEditEquipment && (
                            <Box mt={2}>
                                <div className="w-full">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="text-xl font-bold text-gray-800">
                                            อุปกรณ์
                                        </h3>
                                        <Button className=" mb-10" variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleAddEquipment}>
                                            เพิ่มอุปกรณ์
                                        </Button>
                                    </div>
                                    <DataGrid
                                        rows={equipmentRows}
                                        columns={equipmentColumns}
                                        getRowId={(row) => row.equipment_id}
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
                        <Button onClick={handleCloseEquipment}>ยกเลิก</Button>
                        <Button variant="contained" color="primary" onClick={handleSaveEquipment}>
                            บันทึก
                        </Button>
                    </DialogActions>
                </Dialog>
                <div className="w-full mt-5 flex justify-end">
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}         // เปลี่ยนเป็นฟังก์ชันของคุณ
                        sx={{
                            bgcolor: "#3b82f6",        // blue-500
                            "&:hover": { bgcolor: "#2563eb" }, // blue-600
                            borderRadius: 2,
                            textTransform: "none",
                            px: 2.5,
                        }}
                    >
                        บันทึก
                    </Button>
                </div>
            </div>
        </div>
    );
}
