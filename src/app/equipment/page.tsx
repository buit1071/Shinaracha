"use client";

import * as React from "react";
import {
    DataGrid,
    GridColDef,
    GridRenderCellParams,
} from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import IconButton from "@mui/material/IconButton";
import Select from "react-select";
import dynamic from "next/dynamic";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Switch,
} from "@mui/material";
import { showAlert, showConfirm } from "@/lib/fetcher";
import { showLoading } from "@/lib/loading";
import { EquipmentRow, ServiceRow, SystemZonesRow } from "@/interfaces/master";
import { builderViewWithCss } from "@react-form-builder/components-rsuite";
import type { IFormStorage } from "@react-form-builder/designer";

const FormBuilder = dynamic(
    () => import("@react-form-builder/designer").then(m => m.FormBuilder),
    { ssr: false }
);

class LocalFormStorage implements IFormStorage {
    private last = "{}";
    private names = ["current"];

    constructor(initial?: object) {
        if (initial) this.last = JSON.stringify(initial);
    }

    async getForm(formName?: string, _options?: any): Promise<string> {
        return this.last;
    }

    async getFormNames(_options?: any): Promise<string[]> {
        return this.names;
    }

    async saveForm(formName: string, formValue: string, _options?: any): Promise<void> {
        this.last = formValue;
        if (!this.names.includes(formName)) this.names.push(formName);
    }

    async removeForm(formName: string, _options?: any): Promise<void> {
        this.names = this.names.filter(n => n !== formName);
    }

    async clear(_options?: any): Promise<void> {
        this.last = "{}";
        this.names = ["current"];
    }

    getCurrentObject() {
        try { return JSON.parse(this.last); } catch { return {}; }
    }
}

export default function InspectionFormPage() {
    const storageRef = React.useRef<LocalFormStorage | null>(null);
    if (!storageRef.current) {
        storageRef.current = new LocalFormStorage({ components: [] });
    }
    const [rows, setRows] = React.useState<EquipmentRow[]>([]);
    const [searchText, setSearchText] = React.useState("");
    const [openEdit, setOpenEdit] = React.useState(false);
    const [openDetail, setOpenDetail] = React.useState(false);
    const [error, setError] = React.useState(false);
    const [services, setServices] = React.useState<ServiceRow[]>([]);
    const [systemZones, setSystemZones] = React.useState<SystemZonesRow[]>([]);

    const [formData, setFormData] = React.useState<EquipmentRow>({
        equipment_id: "",
        equipment_name: "",
        description: "",
        service_id: "",
        service_name: "",
        system_zone_id: "",
        system_zone_name: "",
        image_limit: 0,
        is_active: 1,
        created_by: "admin",
        updated_by: "admin",
    });

    // สร้าง map ไว้ครั้งเดียวต่อการเปลี่ยน state
    const serviceMap = React.useMemo(
        () => new Map(services.map(s => [s.service_id, s.service_name])),
        [services]
    );
    const zoneMap = React.useMemo(
        () => new Map(systemZones.map(z => [z.system_zone_id, z.system_zone_name])),
        [systemZones]
    );

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

    const fetchSystemZones = async () => {
        try {
            const res = await fetch("/api/auth/system-zone");
            const data = await res.json();
            if (data.success) {
                setSystemZones(data.data); // สมมุติ API ส่งเป็น { success, data: [...] }
            } else {
                console.error("โหลด system zone ไม่สำเร็จ:", data.message);
            }
        } catch (err) {
            console.error("fetch error:", err);
        }
    };
    // โหลดข้อมูลและจัดเรียงใหม่
    const fecthEquipment = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/equipment");
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

    // helper: เรียงใหม่ทุกครั้ง + เพิ่ม order
    const updateWithOrder = (data: EquipmentRow[]) => {
        const sorted = [...data].sort((a, b) =>
            new Date(b.updated_date || "").getTime() -
            new Date(a.updated_date || "").getTime()
        );
        const withOrder = sorted.map((row, index) => ({
            ...row,
            order: index + 1,
        }));
        setRows(withOrder);
    };

    React.useEffect(() => {
        fetchServices();
        fetchSystemZones();
        fecthEquipment();
    }, []);

    const handleOpenAdd = () => {
        setFormData({
            equipment_id: "",
            equipment_name: "",
            description: "",
            service_id: "",
            service_name: "",
            system_zone_id: "",
            system_zone_name: "",
            image_limit: 0,
            is_active: 1,
            created_by: "admin",
            updated_by: "admin",
        });
        setOpenEdit(true);
    };

    const handleOpenEdit = (row: EquipmentRow) => {
        setFormData(row);
        setOpenDetail(false);   // ✅ ปิดอีกตัวกันซ้อน
        setOpenEdit(true);
    };

    // const handleOpenEditDetail = (row: EquipmentRow) => {
    //     setFormData(row);
    //     setOpenEdit(false);     // ✅ ปิดอีกตัวกันซ้อน
    //     setOpenDetail(true);
    // };

    const handleClose = () => {
        setOpenEdit(false);
        setOpenDetail(false);
    };

    const handleSave = async () => {
        if (
            !formData.equipment_name ||
            !formData.service_id ||
            !formData.system_zone_id ||
            !formData.image_limit
        ) {
            setError(true);
            return;
        }

        showLoading(true);

        try {
            const res = await fetch("/api/auth/equipment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const result = await res.json();

            // 👉 ปิด popup ก่อน
            setOpenEdit(false);

            if (result.success) {
                showLoading(false);
                await showAlert("success", result.message);
                fecthEquipment();
            } else {
                showAlert("error", result.message || "บันทึกล้มเหลว");
            }
        } catch (err) {
            console.error("Save error:", err);
            setOpenEdit(false); // ปิด popup แม้ error
            showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            showLoading(false);
        }
    };

    const handleDelete = async (equipment_id: string) => {
        const confirmed = await showConfirm(
            "หากลบแล้วจะไม่สามารถนำกลับมาได้",
            "คุณต้องการลบข้อมูลนี้หรือไม่?"
        );
        if (!confirmed) return;
        showLoading(true);

        try {
            const res = await fetch(`/api/auth/equipment/${equipment_id}`, {
                method: "DELETE",
            });
            const result = await res.json();
            if (result.success) {
                showLoading(false);
                await showAlert("success", result.message);
                fecthEquipment();
            } else {
                showLoading(false);
                showAlert("error", result.message || "ลบข้อมูลล้มเหลว");
            }
        } catch (err) {
            console.error("Delete error:", err);
            showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            // กันพลาดกรณี throw ระหว่าง alert
            showLoading(false);
        }
    };

    const toggleStatus = async (row: EquipmentRow) => {
        try {
            const res = await fetch("/api/auth/equipment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...row,
                    is_active: row.is_active === 1 ? 0 : 1,
                }),
            });
            const result = await res.json();
            if (result.success) {
                fecthEquipment();
            }
        } catch (err) {
            console.error("Toggle status error:", err);
        }
    };

    const columns: GridColDef<EquipmentRow>[] = [
        {
            field: "order",
            headerName: "ลำดับ",
            width: 90,
            headerAlign: "center",
            align: "center",
        },
        { field: "equipment_id", headerName: "ID", flex: 1, headerAlign: "center", align: "center" },
        { field: "equipment_name", headerName: "อุปกรณ์", flex: 1, headerAlign: "center", align: "left" },
        {
            field: "service_name",
            headerName: "บริการ",
            flex: 1,
            headerAlign: "center",
            align: "left",
            valueGetter: (_value, row) => serviceMap.get(row.service_id) ?? "-",
        },
        {
            field: "system_zone_name",
            headerName: "Zone",
            flex: 1,
            headerAlign: "center",
            align: "left",
            valueGetter: (_value, row) => zoneMap.get(row.system_zone_id) ?? "-",
        },
        { field: "image_limit", headerName: "จำนวนรูป", flex: 1, headerAlign: "center", align: "center" },
        {
            field: "is_active",
            headerName: "สถานะ",
            flex: 1,
            headerAlign: "center",
            align: "center",
            renderCell: (params: GridRenderCellParams<EquipmentRow>) => (
                <Switch
                    checked={params.row.is_active === 1}
                    onChange={() => toggleStatus(params.row)}
                    color="success"
                />
            ),
        },
        // {
        //     field: "detail",
        //     headerName: "Detail",
        //     sortable: false,
        //     width: 150,
        //     headerAlign: "center",
        //     align: "center",
        //     renderCell: (params: GridRenderCellParams<EquipmentRow>) => (
        //         <IconButton
        //             color="primary"
        //             onClick={(e) => { e.stopPropagation(); handleOpenEditDetail(params.row); }}
        //         >
        //             <EditIcon />
        //         </IconButton>
        //     ),
        // },
        {
            field: "actions",
            headerName: "Action",
            sortable: false,
            filterable: false,
            disableColumnMenu: true,
            width: 150,
            headerAlign: "center",
            align: "center",
            renderCell: (params: GridRenderCellParams<EquipmentRow>) => (
                <>
                    <IconButton
                        color="primary"
                        onClick={(e) => { e.stopPropagation(); handleOpenEdit(params.row); }}
                    >
                        <EditIcon />
                    </IconButton>
                    <IconButton
                        color="error"
                        onClick={(e) => { e.stopPropagation(); handleDelete(params.row.equipment_id); }}
                    >
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
        <div className="min-h-[96vh] grid place-items-center bg-gray-50">
            {/* Header Bar */}
            <div className="h-[6vh] w-full bg-white shadow-md flex items-center justify-between px-4 text-black font-semibold rounded-lg">
                อุปกรณ์
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
                    getRowId={(row) => row.equipment_id}
                />
            </div>

            {/* Dialog Popup */}
            <Dialog open={openEdit} onClose={handleClose} fullWidth maxWidth="md" sx={{ zIndex: 1000 }}>
                <DialogTitle>
                    {formData.equipment_id ? "แก้ไขข้อมูล" : "เพิ่มข้อมูล"}
                </DialogTitle>
                <DialogContent dividers>
                    {formData.equipment_id && (
                        <TextField
                            size="small"
                            margin="dense"
                            label="Service ID"
                            fullWidth
                            value={formData.equipment_id}
                            disabled
                        />
                    )}

                    <TextField
                        size="small"
                        margin="dense"
                        label="อุปกรณ์"
                        fullWidth
                        required
                        value={formData.equipment_name}
                        onChange={(e) => {
                            setFormData({ ...formData, equipment_name: e.target.value });
                            if (error) setError(false);
                        }}
                        error={error && !formData.equipment_name}
                        helperText={error && !formData.equipment_name ? "กรุณากรอกชื่ออุปกรณ์" : ""}
                    />

                    <TextField
                        size="small"
                        margin="dense"
                        label="รายละเอียด"
                        fullWidth
                        multiline
                        minRows={2}                 // เริ่มที่ 3 แถว
                        maxRows={10}                // กำหนดจำนวนบรรทัดสูงสุด (โดยประมาณ)
                        value={formData.description}
                        onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                        }
                        sx={{
                            "& .MuiInputBase-input": {
                                resize: "none",         // กันไม่ให้ drag resize
                                maxHeight: "200px",     // ✅ จำกัดสูงสุด
                                overflowY: "auto",      // ✅ เกินแล้วให้ scrollbar
                            },
                        }}
                    />

                    <Box mt={1}>
                        <label style={{ fontSize: 14, marginBottom: 4, display: "block" }}>
                            การบริการ
                        </label>

                        <Select
                            options={services.map((p) => ({
                                value: p.service_id,
                                label: p.service_name,
                            }))}
                            value={
                                services
                                    .map(p => ({
                                        value: p.service_id,
                                        label: p.service_name,
                                    }))
                                    .find(opt => opt.value === formData.service_id) || null
                            }
                            onChange={(selected) =>
                                setFormData({
                                    ...formData,
                                    service_id: selected?.value || "",
                                    service_name: selected?.label || undefined,
                                })
                            }
                            placeholder="-- เลือกบริการ --"
                            isClearable
                            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                            styles={{
                                control: (base, state) => ({
                                    ...base,
                                    backgroundColor: "#fff",
                                    borderColor:
                                        error && !formData.service_id
                                            ? "#d32f2f" // 🔴 สีแดงเมื่อ error
                                            : state.isFocused
                                                ? "#3b82f6"
                                                : "#d1d5db",
                                    boxShadow: "none",
                                    "&:hover": {
                                        borderColor: error && !formData.service_id ? "#d32f2f" : "#9ca3af",
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
                            <span style={{ color: "#d32f2f", fontSize: "12px", marginTop: 4, display: "block" }}>
                                กรุณาเลือกบริการ
                            </span>
                        )}
                    </Box>

                    <Box mt={1}>
                        <label style={{ fontSize: 14, marginBottom: 4, display: "block" }}>
                            Zone
                        </label>

                        <Select
                            options={systemZones.map((p) => ({
                                value: p.system_zone_id,
                                label: p.system_zone_name,
                            }))}
                            value={
                                systemZones
                                    .map(p => ({
                                        value: p.system_zone_id,
                                        label: p.system_zone_name,
                                    }))
                                    .find(opt => opt.value === formData.system_zone_id) || null
                            }
                            onChange={(selected) =>
                                setFormData({
                                    ...formData,
                                    system_zone_id: selected?.value || "",
                                    system_zone_name: selected?.label || undefined,
                                })
                            }
                            placeholder="-- เลือก Zone --"
                            isClearable
                            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                            styles={{
                                control: (base, state) => ({
                                    ...base,
                                    backgroundColor: "#fff",
                                    borderColor:
                                        error && !formData.system_zone_id
                                            ? "#d32f2f" // 🔴 สีแดงเมื่อ error
                                            : state.isFocused
                                                ? "#3b82f6"
                                                : "#d1d5db",
                                    boxShadow: "none",
                                    "&:hover": {
                                        borderColor: error && !formData.system_zone_id ? "#d32f2f" : "#9ca3af",
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
                        {error && !formData.system_zone_id && (
                            <span style={{ color: "#d32f2f", fontSize: "12px", marginTop: 4, display: "block" }}>
                                กรุณาเลือก Zone
                            </span>
                        )}
                    </Box>

                    <Box mt={1}>
                        <TextField
                            size="small"
                            margin="dense"
                            label="จำนวนรูป"
                            type="number"
                            fullWidth
                            required
                            value={formData.image_limit ?? ""}
                            onChange={(e) => {
                                const value = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
                                setFormData({ ...formData, image_limit: value });
                                if (error) setError(false);
                            }}
                            error={error && !formData.image_limit}
                            helperText={error && !formData.image_limit ? "กรุณาระบุจำนวนรูป" : ""}
                        />
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

                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>ยกเลิก</Button>
                    <Button variant="contained" color="primary" onClick={handleSave}>
                        บันทึก
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog
                open={openDetail}
                onClose={handleClose}
                fullWidth
                // maxWidth="xl"   // ← ไม่ต้องใช้แล้ว
                sx={{ zIndex: 1000 }}
                PaperProps={{
                    sx: {
                        width: "95vw",   // กว้าง 95% ของจอ
                        height: "95vh",  // สูง 95% ของจอ
                        maxWidth: "95vw",
                        maxHeight: "95vh",
                        margin: 0,
                    },
                }}
            >
                <DialogTitle>Form Detail : {formData.equipment_name}</DialogTitle>
                <DialogContent
                    dividers
                    sx={{
                        height: "calc(95vh - 64px - 52px)",
                        overflow: "hidden",
                        p: 2,
                    }}
                >
                    {typeof window !== "undefined" && storageRef.current && (
                        <FormBuilder
                            view={builderViewWithCss}
                            formStorage={storageRef.current}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>ยกเลิก</Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={async () => {
                            const schemaObj = storageRef.current?.getCurrentObject() ?? {};

                            const payload = {
                                equipment_id: formData.equipment_id,
                                equipment_name: formData.equipment_name,
                                schema: schemaObj,
                            };

                            console.log("📦 PAYLOAD:", payload);

                            // await fetch("/api/inspection/form-schema", {
                            //     method: "POST",
                            //     headers: { "Content-Type": "application/json" },
                            //     body: JSON.stringify(payload),
                            // });

                            handleClose();
                        }}
                    >
                        บันทึก
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
