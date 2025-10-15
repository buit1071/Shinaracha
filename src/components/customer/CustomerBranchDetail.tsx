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
    TextField,
} from "@mui/material";
import Select from "react-select";
import { CustomerBranchRow, CustomerGroupRow, ServiceEquipmentRow, ContactRow } from "@/interfaces/master";
import { generateId } from "@/lib/fetcher";
import GoogleMapBox from "@/components/google-map/GoogleMapBox";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type Props = {
    customerId: string;
    onBack: () => void;
};

export default function CustomerBranchDetail({ customerId, onBack }: Props) {
    const user = useCurrentUser();
    const username = React.useMemo(
        () => (user ? `${user.first_name_th} ${user.last_name_th}` : ""),
        [user]
    );
    const [groups, setGroups] = React.useState<CustomerGroupRow[]>([]);
    const [error, setError] = React.useState(false);
    const [errorContact, setErrorContact] = React.useState(false);
    const [formData, setFormData] = React.useState<CustomerBranchRow>({
        customer_id: customerId,
        branch_name: "",
        cus_cost_centre: "",
        store_no: "",
        customer_area: "",
        customer_hub: "",
        branch_tel: "",
        contact_person_id: "",
        address: "",
        group_id: "",
        latitude: "",
        longitude: "",
        is_active: 1,
        created_by: "",
        updated_by: "",
    });

    const [formEquipmentData, setFormEquipmentData] = React.useState<ServiceEquipmentRow>({
        service_id: "",
        zone_id: "",
        service_inspec_id: "",
        is_active: 1,
        created_by: "",
        updated_by: "",
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

    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [draft, setDraft] = React.useState<Partial<ContactRow>>({});
    const [formContactData, setFormContactData] = React.useState<ContactRow>({
        customer_id: customerId || "",
        contact_id: "",
        name: "",
        email: "",
        tel: "",
        is_active: 1,
        created_by: "",
        updated_by: "",
    });

    const startEdit = (row: ContactRow) => {
        setEditingId(row.contact_id);
        setDraft({ ...row });
    };

    const fetchContactByBranchId = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/customer/contact/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "contact", customer_id: customerId }),
            });

            const result = await res.json();
            if (result.success && result.data) {
                setContactRows(result.data || []);
                showLoading(false);
            }
        } catch (err) {
            showLoading(false);
        } finally {
            showLoading(false);
        }
    };

    const fetchBranchDetail = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/customer/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "customerBranchDetail", customer_id: customerId }),
            });

            const result = await res.json();
            if (result.success && result.data) {
                setFormData(result.data || []);
                showLoading(false);
            }
        } catch (err) {
            showLoading(false);
        } finally {
            showLoading(false);
        }
    };

    const handleFieldChange = <K extends keyof ContactRow>(key: K, value: ContactRow[K]) => {
        setDraft((p) => ({ ...p, [key]: value }));
    };

    const handleAddContact = () => {
        const nextId = generateId("CT");
        const newRow: ContactRow = {
            customer_id: customerId || "",
            contact_id: nextId,
            name: "",
            email: "",
            tel: "",
            is_active: 1,
            created_by: "",
            updated_by: "",
        };
        setContactRows((prev) => [...prev, newRow]);
        startEdit(newRow);
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
                    customer_id: customerId || "",
                    contact_id: id,
                    name,                 // ✅ แก้จาก 'ame'
                    email,
                    tel,
                    is_active: formContactData.is_active ?? 1,
                    created_by: formContactData.created_by || username,
                    updated_by: formContactData.updated_by || username,
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
                    customer_id: customerId || "",
                    contact_id: id,
                    name, email, tel,
                    is_active: formContactData.is_active ?? 1,
                    created_by: formContactData.created_by || username,
                    updated_by: formContactData.updated_by || username,
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

    const fetchGroupByCustomerId = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/customer/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "groupByCustomerId" }),
            });

            const result = await res.json();
            if (result.success && result.data) {
                setGroups(result.data || []);
                showLoading(false);
            }
        } catch (err) {
            showLoading(false);
        } finally {
            showLoading(false);
        }
    };

    React.useEffect(() => {
        fetchGroupByCustomerId();
    }, []);

    React.useEffect(() => {
        fetchBranchDetail();
        fetchContactByBranchId();
    }, [customerId]);

    const handleSave = async () => {
        const requiredFields = [
            "cus_cost_centre",
            "store_no",
            "customer_area",
            "customer_hub",
            "branch_name",
            "branch_tel",
            "address",
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
                    cus_cost_centre: safeTrim(formData.cus_cost_centre),
                    store_no: safeTrim(formData.store_no),
                    customer_area: safeTrim(formData.customer_area),
                    customer_hub: safeTrim(formData.customer_hub),
                    branch_name: safeTrim(formData.branch_name),
                    branch_tel: safeTrim(formData.branch_tel),
                    address: safeTrim(formData.address),
                    group_id: formData.group_id,
                    latitude: formData.latitude ?? null,
                    longitude: formData.longitude ?? null,
                    is_active: formData.is_active ?? 1,
                    created_by: formEquipmentData?.created_by || username,
                    updated_by: formData.updated_by || username,
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
            } else {
                await showAlert("error", result.message || "บันทึกล้มเหลว");
            }
        } catch (e) {
            await showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            showLoading(false);
        }
    };

    return (
        <div className="w-full h-[96vh] flex flex-col bg-gray-50">
            <div className="h-[6vh] flex items-center justify-between px-4 py-2 bg-white shadow-md mb-2 rounded-lg">
                <div className="flex items-center">
                    <IconButton onClick={onBack} color="primary">
                        <ArrowBackIcon />
                    </IconButton>
                    <h2 className="text-xl font-bold text-gray-800 ml-5">
                        {!customerId
                            ? "เพิ่มข้อมูลสาขา"
                            : `${formData.branch_name || ""}`}
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
                    />
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
                    />
                </Box>

                <Box sx={{ display: "flex", gap: 2, mt: 1, alignItems: "flex-end", "& > *": { flex: "1 1 0", minWidth: 0 } }}>
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
                    />
                    <Box mb={0.5}>
                        <label className="block mb-1 text-sm text-black">
                            Group
                        </label>

                        <Select
                            menuPlacement="auto"
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
                                            ? "#d32f2f"
                                            : state.isFocused
                                                ? "#3b82f6"
                                                : "#d1d5db",
                                    boxShadow: "none",
                                    minHeight: 40, // ✅ ปรับความสูงเป็น 40px
                                    height: 40,    // ✅ บังคับให้สูงเท่ากันเป๊ะ
                                    "&:hover": {
                                        borderColor:
                                            error && !formData.group_id ? "#d32f2f" : "#9ca3af",
                                    },
                                }),
                                valueContainer: (base) => ({
                                    ...base,
                                    height: 40, // ✅ ให้ข้อความภายในอยู่ตรงกลาง
                                    padding: "0 8px",
                                }),
                                input: (base) => ({
                                    ...base,
                                    margin: 0,
                                    padding: 0,
                                }),
                                indicatorsContainer: (base) => ({
                                    ...base,
                                    height: 40, // ✅ ลูกศร dropdown อยู่กลาง
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

                {customerId && (
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
