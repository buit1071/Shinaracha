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
import Select, { SingleValue } from "react-select";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Switch,
    Typography
} from "@mui/material";
import { showAlert, showConfirm } from "@/lib/fetcher";
import { showLoading } from "@/lib/loading";
import { EquipmentRow, ServiceRow, ZoneRow, MasterProvinceRow, MasterDistrictRow, MasterSubdistrictRow, BuildingRow, FloorRoomRow } from "@/interfaces/master";
import type { IFormStorage } from "@react-form-builder/designer";

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

export default function EquipmentPage() {
    const storageRef = React.useRef<LocalFormStorage | null>(null);
    if (!storageRef.current) {
        storageRef.current = new LocalFormStorage({ components: [] });
    }
    const [rows, setRows] = React.useState<EquipmentRow[]>([]);
    const [searchText, setSearchText] = React.useState("");
    const [openEdit, setOpenEdit] = React.useState(false);
    const [error, setError] = React.useState(false);
    const [provinces, setProvince] = React.useState<MasterProvinceRow[]>([]);
    const [districts, setDistrict] = React.useState<MasterDistrictRow[]>([]);
    const [subDistricts, setSubDistrict] = React.useState<MasterSubdistrictRow[]>([]);
    const [provincesOwn, setOwnProvince] = React.useState<MasterProvinceRow[]>([]);
    const [districtsOwn, setOwnDistrict] = React.useState<MasterDistrictRow[]>([]);
    const [subDistrictsOwn, setOwnSubDistrict] = React.useState<MasterSubdistrictRow[]>([]);
    const [services, setServices] = React.useState<ServiceRow[]>([]);
    const [zones, setZones] = React.useState<ZoneRow[]>([]);
    const [building, setBuilding] = React.useState<BuildingRow[]>([]);
    const [floor, setFloor] = React.useState<FloorRoomRow[]>([]);
    const zonesAbortRef = React.useRef<AbortController | null>(null);
    type Option = { value: string; label: string };

    const [formData, setFormData] = React.useState<EquipmentRow>({
        equipment_id: "",
        equipment_code: "",
        equipment_name: "",
        description: "",
        service_id: "",
        service_name: "",
        zone_id: "",
        zone_name: "",
        is_active: 1,
        created_by: "admin",
        updated_by: "admin",
        created_date: "",
        updated_date: "",
        order: undefined,

        // ที่อยู่สถานที่ติดตั้ง
        address_no: "",
        moo: "",
        alley: "",
        road: "",
        sub_district_id: "",
        district_id: "",
        province_id: "",
        zipcode: "",
        phone: "",
        fax: "",
        building_id: "",
        floor_id: "",

        // เจ้าของ/ผู้ครอบครอง
        owner_name: "",
        owner_address_no: "",
        owner_moo: "",
        owner_alley: "",
        owner_road: "",
        owner_province_id: "",
        owner_district_id: "",
        owner_sub_district_id: "",
        owner_zipcode: "",

        // ข้อมูลติดต่อเจ้าของ
        owner_phone: "",
        owner_fax: "",
        owner_email: "",

        // ผู้ออกแบบโครงสร้าง
        designer_name: "",
        designer_license_no: "",
    });

    const fetchProvince = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/equipment/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // ถ้าต้องการกัน cache ฝั่งเบราว์เซอร์ เพิ่ม cache: "no-store"
                body: JSON.stringify({ function: "ProvinceOption" }),
            });

            const data = await res.json();
            if (data.success) {
                setProvince(data.data || []);
                setOwnProvince(data.data || []);
            } else {
            }
        } catch (err) {
        } finally {
            showLoading(false);
        }
    };

    const fetchDistrict = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/equipment/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // ถ้าต้องการกัน cache ฝั่งเบราว์เซอร์ เพิ่ม cache: "no-store"
                body: JSON.stringify({ function: "DistrictOption" }),
            });

            const data = await res.json();
            if (data.success) {
                setDistrict(data.data || []);
                setOwnDistrict(data.data || []);
            } else {
            }
        } catch (err) {
        } finally {
            showLoading(false);
        }
    };

    const fetchSubDistrict = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/equipment/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // ถ้าต้องการกัน cache ฝั่งเบราว์เซอร์ เพิ่ม cache: "no-store"
                body: JSON.stringify({ function: "SubDistrictOption" }),
            });

            const data = await res.json();
            if (data.success) {
                setSubDistrict(data.data || []);
                setOwnSubDistrict(data.data || []);
            } else {
            }
        } catch (err) {
        } finally {
            showLoading(false);
        }
    };

    const fetchDistrictByProvinceId = async (province_id: string) => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/equipment/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // ถ้าต้องการกัน cache ฝั่งเบราว์เซอร์ เพิ่ม cache: "no-store"
                body: JSON.stringify({ function: "DistrictOptionByProvinceId", province_id }),
            });

            const data = await res.json();
            if (data.success) {
                setDistrict(data.data || []);
            } else {
            }
        } catch (err) {
        } finally {
            showLoading(false);
        }
    };

    const fetchSubDistrictByDistrictId = async (district_id: string) => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/equipment/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // ถ้าต้องการกัน cache ฝั่งเบราว์เซอร์ เพิ่ม cache: "no-store"
                body: JSON.stringify({ function: "SubDistrictOptionByDistrictId", district_id }),
            });

            const data = await res.json();
            if (data.success) {
                setSubDistrict(data.data || []);
            } else {
            }
        } catch (err) {
        } finally {
            showLoading(false);
        }
    };

    const fetchFloorByBuildingId = async (building_id: string) => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/building/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // ถ้าต้องการกัน cache ฝั่งเบราว์เซอร์ เพิ่ม cache: "no-store"
                body: JSON.stringify({ function: "floor", building_id }),
            });

            const data = await res.json();
            if (data.success) {
                setFloor(data.data || []);
            } else {
            }
        } catch (err) {
        } finally {
            showLoading(false);
        }
    };

    const fetchOwnProvince = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/equipment/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // ถ้าต้องการกัน cache ฝั่งเบราว์เซอร์ เพิ่ม cache: "no-store"
                body: JSON.stringify({ function: "ProvinceOption" }),
            });

            const data = await res.json();
            if (data.success) {
                setOwnProvince(data.data || []);
            } else {
            }
        } catch (err) {
        } finally {
            showLoading(false);
        }
    };

    const fetchOwnDistrictByProvinceId = async (owner_province_id: string) => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/equipment/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // ถ้าต้องการกัน cache ฝั่งเบราว์เซอร์ เพิ่ม cache: "no-store"
                body: JSON.stringify({ function: "DistrictOptionByProvinceId", province_id: owner_province_id }),
            });

            const data = await res.json();
            if (data.success) {
                setOwnDistrict(data.data || []);
            } else {
            }
        } catch (err) {
        } finally {
            showLoading(false);
        }
    };

    const fetchOwnSubDistrictByDistrictId = async (owner_district_id: string) => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/equipment/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // ถ้าต้องการกัน cache ฝั่งเบราว์เซอร์ เพิ่ม cache: "no-store"
                body: JSON.stringify({ function: "SubDistrictOptionByDistrictId", district_id: owner_district_id }),
            });

            const data = await res.json();
            if (data.success) {
                setOwnSubDistrict(data.data || []);
            } else {
            }
        } catch (err) {
        } finally {
            showLoading(false);
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
            }
        } catch (err) {
        } finally {
            showLoading(false);
        }
    };

    const fetchZoneAll = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/inspection-form/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "zonesAll" }),
            });

            const result = await res.json();
            if (result.success && result.data) {
                setZones(result.data || []);
                showLoading(false);
            }
        } catch (err) {
            showLoading(false);
        }
    };

    const fetchBuilding = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/building/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "building" }),
            });

            const result = await res.json();
            if (result.success && result.data) {
                setBuilding(result.data || []);
                showLoading(false);
            }
        } catch (err) {
            showLoading(false);
        }
    };

    const fetchZonesByService = async (serviceId: string) => {
        if (zonesAbortRef.current) zonesAbortRef.current.abort();

        // เคลียร์ข้อมูลเก่าเมื่อ service เปลี่ยน
        setZones([]);

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
            }
        } catch (err) {
            if ((err as any).name !== "AbortError") {
                setZones([]);
            }
        } finally {
            showLoading(false);
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
        fetchProvince();
        fetchDistrict();
        fetchSubDistrict();
        fetchOwnProvince();
        fetchBuilding();
        fetchService();
        fetchZoneAll();
        fecthEquipment();
    }, []);

    const handleOpenAdd = () => {
        setFormData({
            equipment_id: "",
            equipment_code: "",
            equipment_name: "",
            description: "",
            service_id: "",
            service_name: "",
            zone_id: "",
            zone_name: "",
            is_active: 1,
            created_by: "admin",
            updated_by: "admin",
            created_date: "",
            updated_date: "",
            order: undefined,

            // ที่อยู่สถานที่ติดตั้ง
            address_no: "",
            moo: "",
            alley: "",
            road: "",
            sub_district_id: "",
            district_id: "",
            province_id: "",
            zipcode: "",
            phone: "",
            fax: "",
            building_id: "",
            floor_id: "",

            // เจ้าของ/ผู้ครอบครอง
            owner_name: "",
            owner_address_no: "",
            owner_moo: "",
            owner_alley: "",
            owner_road: "",
            owner_province_id: "",
            owner_district_id: "",
            owner_sub_district_id: "",
            owner_zipcode: "",

            // ข้อมูลติดต่อเจ้าของ
            owner_phone: "",
            owner_fax: "",
            owner_email: "",

            // ผู้ออกแบบโครงสร้าง
            designer_name: "",
            designer_license_no: "",
        });
        setOpenEdit(true);
    };

    const handleOpenEdit = (row: EquipmentRow) => {
        setFormData(row);
        setOpenEdit(true);
    };

    const handleClose = () => {
        setOpenEdit(false);
    };

    const handleSave = async () => {
        if (
            !formData.equipment_name || !formData.equipment_code || !formData.address_no || !formData.moo ||
            !formData.alley || !formData.road || !formData.sub_district_id || !formData.district_id || !formData.province_id ||
            !formData.zipcode || !formData.phone || !formData.fax || !formData.owner_name || !formData.owner_address_no || !formData.owner_moo ||
            !formData.owner_alley || !formData.owner_road || !formData.owner_province_id || !formData.owner_district_id || !formData.owner_sub_district_id ||
            !formData.owner_zipcode || !formData.owner_phone || !formData.owner_fax || !formData.owner_email || !formData.designer_name ||
            !formData.designer_license_no || !formData.service_id || !formData.zone_id
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
            showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            // กันพลาดกรณี throw ระหว่าง alert
            showLoading(false);
        }
    };

    const toggleStatus = async (row: EquipmentRow) => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/equipment", {
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
                fecthEquipment();
            }
        } catch (err) {
        }
    };

    const columns: GridColDef<EquipmentRow>[] = [
        {
            field: "order",
            headerName: "ลำดับ",
            width: 90,
            headerAlign: "center",
            align: "center",
            resizable: false,
        },
        {
            field: "equipment_name",
            headerName: "อุปกรณ์",
            flex: 2,              // 👈 กว้างสุด
            minWidth: 260,
            headerAlign: "center",
            align: "left",
            resizable: false,
        },
        {
            field: "service_name",
            headerName: "บริการ",
            flex: 1.4,            // 👈 กว้างกว่าทั่วไป
            minWidth: 200,
            headerAlign: "center",
            align: "center",
            resizable: false,
        },
        {
            field: "zone_name",
            headerName: "การตรวจ",
            flex: 1.4,            // 👈 กว้างกว่าทั่วไป
            minWidth: 200,
            headerAlign: "center",
            align: "center",
            resizable: false,
        },
        {
            field: "is_active",
            headerName: "สถานะ",
            width: 120,           // 👈 ควบคุมขนาดตายตัว
            headerAlign: "center",
            align: "center",
            resizable: false,
            renderCell: (params) => (
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
            width: 150,           // 👈 ควบคุมขนาดตายตัว
            headerAlign: "center",
            align: "center",
            resizable: false,
            renderCell: (params) => (
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
                    </IconButton>
                </>
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const subdistrictOptions = subDistricts.map(s => ({
        value: s.sub_district_id,
        label: s.name_th || s.sub_district_id,
        zipcode: s.post_code ?? "",
    }));

    const subdistrictOwnOptions = subDistrictsOwn.map(s => ({
        value: s.sub_district_id,
        label: s.name_th || s.sub_district_id,
        owner_zipcode: s.post_code ?? "",
    }));

    return (
        <div className="w-full h-full flex flex-col bg-gray-50 justify-between">
            {/* Header Bar */}
            <div className="h-[6vh] w-full bg-white shadow-md flex items-center justify-between px-4 text-black font-semibold rounded-lg">
                ระบบ & อุปกรณ์
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
                    rows={filteredRows}
                    columns={columns}
                    sx={{
                        borderRadius: "0.5rem",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                        "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": {
                            outline: "none",
                        },
                    }}
                    initialState={{ pagination: { paginationModel: { pageSize: 5, page: 0 } } }}
                    pageSizeOptions={[5, 10]}
                    disableRowSelectionOnClick
                    getRowId={(row) => row.equipment_id}
                />
            </div>

            {/* Dialog Popup */}
            <Dialog open={openEdit} onClose={handleClose} fullWidth maxWidth="xl" sx={{ zIndex: 1000 }}>
                <DialogTitle>
                    {formData.equipment_id ? "แก้ไขข้อมูล" : "เพิ่มข้อมูล"}
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                        ข้อมูลอุปกรณ์
                    </Typography>
                    {formData.equipment_id && (
                        <TextField
                            size="small"
                            margin="dense"
                            label="รหัสอุปกรณ์"
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
                        }}
                        error={error && !formData.equipment_name}
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

                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                            สถานที่ติดตั้งอุปกรณ์
                        </Typography>

                        {/* แถว 1: เลขที่, หมู่, ตรอก/ซอย, ถนน */}
                        <Box
                            sx={{
                                display: "grid",
                                gap: 2,
                                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
                            }}
                        >
                            <TextField label="เลขที่" size="small" fullWidth name="address_no"
                                value={formData.address_no ?? ""} onChange={handleChange}
                                error={error && !formData.address_no}
                            />
                            <TextField label="หมู่ที่" size="small" fullWidth name="moo"
                                value={formData.moo ?? ""} onChange={handleChange}
                                error={error && !formData.moo}
                            />
                            <TextField label="ตรอก/ซอย" size="small" fullWidth name="alley"
                                value={formData.alley ?? ""} onChange={handleChange}
                                error={error && !formData.alley}
                            />
                            <TextField label="ถนน" size="small" fullWidth name="road"
                                value={formData.road ?? ""} onChange={handleChange}
                                error={error && !formData.road}
                            />
                        </Box>

                        {/* แถว 2: จังหวัด, อำเภอ/เขต, ตำบล/แขวง, รหัสไปรษณีย์  (เก็บเป็น *_id) */}
                        <Box
                            sx={{
                                mt: 2,
                                display: "grid",
                                gap: 2,
                                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
                            }}
                        >
                            <Box>
                                <label style={{ fontSize: 14, marginBottom: 4, display: "block" }}>
                                    จังหวัด
                                </label>
                                <Select menuPlacement="auto"
                                    options={provinces.map(p => ({
                                        value: p.province_id,
                                        label: p.name_th || p.province_id,
                                    }))}

                                    value={
                                        provinces
                                            .map(p => ({
                                                value: p.province_id,
                                                label: p.name_th || p.province_id,
                                            }))
                                            .find(opt => opt.value === formData.province_id) || null
                                    }

                                    onChange={async (selected: Option | null) => {
                                        const province_id = selected?.value ?? "";

                                        // อัปเดตค่า province_id เดิมด้วย handleChange
                                        handleChange({
                                            target: { name: "province_id", value: province_id },
                                        } as any);

                                        // รีเซ็ตอำเภอ/ตำบล/ไปรษณีย์ ให้สอดคล้องกับจังหวัดใหม่
                                        setDistrict([]);
                                        setSubDistrict([]);
                                        setFormData(f => ({
                                            ...f,
                                            district_id: "",
                                            sub_district_id: "",
                                            zipcode: "",
                                        }));

                                        // โหลดอำเภอตามจังหวัดที่เลือก
                                        if (province_id) {
                                            await fetchDistrictByProvinceId(province_id);
                                        }
                                    }}

                                    placeholder="-- เลือกจังหวัด --"
                                    isClearable
                                    menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                    styles={{
                                        control: (base, state) => ({
                                            ...base,
                                            backgroundColor: "#fff",
                                            borderColor:
                                                error && !formData.province_id
                                                    ? "#d32f2f"
                                                    : state.isFocused
                                                        ? "#3b82f6"
                                                        : "#d1d5db",
                                            boxShadow: "none",
                                            "&:hover": {
                                                borderColor: error && !formData.province_id ? "#d32f2f" : "#9ca3af",
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
                                <label style={{ fontSize: 14, marginBottom: 4, display: "block" }}>
                                    อำเภอ/เขต
                                </label>
                                <Select menuPlacement="auto"
                                    options={districts.map(d => ({
                                        value: d.district_id,
                                        label: d.name_th || d.district_id,
                                    }))}

                                    value={
                                        districts
                                            .map(d => ({ value: d.district_id, label: d.name_th || d.district_id }))
                                            .find(opt => opt.value === formData.district_id) || null
                                    }

                                    onChange={async (selected: Option | null) => {
                                        const district_id = selected?.value ?? "";

                                        // อัปเดต district_id ในฟอร์ม
                                        handleChange({
                                            target: { name: "district_id", value: district_id },
                                        } as any);

                                        // รีเซ็ต subdistrict/zipcode ให้สอดคล้องกับเขตใหม่
                                        setSubDistrict([]);
                                        setFormData(f => ({
                                            ...f,
                                            sub_district_id: "",
                                            zipcode: "",
                                        }));

                                        // โหลดตำบลตาม district
                                        if (district_id) {
                                            await fetchSubDistrictByDistrictId(district_id);
                                        }
                                    }}
                                    placeholder="-- เลือกอำเภอ/เขต --"
                                    isClearable
                                    isDisabled={!formData.province_id}
                                    menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                    styles={{
                                        control: (base, state) => ({
                                            ...base,
                                            backgroundColor: "#fff",
                                            borderColor:
                                                error && !formData.district_id
                                                    ? "#d32f2f"
                                                    : state.isFocused
                                                        ? "#3b82f6"
                                                        : "#d1d5db",
                                            boxShadow: "none",
                                            "&:hover": {
                                                borderColor: error && !formData.district_id ? "#d32f2f" : "#9ca3af",
                                            },
                                        }),
                                        menu: (base) => ({
                                            ...base,
                                            backgroundColor: "#fff",
                                            boxShadow: "0 8px 24px rgba(0,0,0,.2)",
                                            border: "1px solid #e5e7eb",
                                        }),
                                        menuPortal: (base) => ({ ...base, zIndex: 2100 }),
                                        option: (base, state) => ({
                                            ...base,
                                            backgroundColor: state.isSelected
                                                ? "#e5f2ff"
                                                : state.isFocused
                                                    ? "#f3f4f6"
                                                    : "#fff",
                                            color: "#111827",
                                        }),
                                        menuList: (base) => ({ ...base, backgroundColor: "#fff", paddingTop: 0, paddingBottom: 0 }),
                                        singleValue: (base) => ({ ...base, color: "#111827" }),
                                    }}
                                />
                            </Box>

                            <Box>
                                <label style={{ fontSize: 14, marginBottom: 4, display: "block" }}>
                                    ตำบล/แขวง
                                </label>
                                <Select menuPlacement="auto"
                                    options={subdistrictOptions}
                                    value={
                                        subdistrictOptions.find(opt => opt.value === formData.sub_district_id) || null
                                    }
                                    onChange={(selected: (typeof subdistrictOptions)[number] | null) => {
                                        const sub_district_id = selected?.value ?? "";
                                        const zipcode = selected?.zipcode ?? "";

                                        // อัปเดตค่าในฟอร์ม
                                        handleChange({ target: { name: "sub_district_id", value: sub_district_id } } as any);

                                        // ใส่รหัสไปรษณีย์อัตโนมัติ (ถ้า clear ให้เป็นค่าว่าง)
                                        handleChange({ target: { name: "zipcode", value: zipcode } } as any);
                                    }}
                                    placeholder="-- เลือกตำบล/แขวง --"
                                    isClearable
                                    isDisabled={!formData.district_id}
                                    menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                    styles={{
                                        control: (base, state) => ({
                                            ...base,
                                            backgroundColor: "#fff",
                                            borderColor:
                                                error && !formData.sub_district_id
                                                    ? "#d32f2f"
                                                    : state.isFocused
                                                        ? "#3b82f6"
                                                        : "#d1d5db",
                                            boxShadow: "none",
                                            "&:hover": {
                                                borderColor: error && !formData.sub_district_id ? "#d32f2f" : "#9ca3af",
                                            },
                                        }),
                                        menu: (base) => ({
                                            ...base,
                                            backgroundColor: "#fff",
                                            boxShadow: "0 8px 24px rgba(0,0,0,.2)",
                                            border: "1px solid #e5e7eb",
                                        }),
                                        menuPortal: (base) => ({ ...base, zIndex: 2100 }),
                                        option: (base, state) => ({
                                            ...base,
                                            backgroundColor: state.isSelected
                                                ? "#e5f2ff"
                                                : state.isFocused
                                                    ? "#f3f4f6"
                                                    : "#fff",
                                            color: "#111827",
                                        }),
                                        menuList: (base) => ({ ...base, backgroundColor: "#fff", paddingTop: 0, paddingBottom: 0 }),
                                        singleValue: (base) => ({ ...base, color: "#111827" }),
                                    }}
                                />
                            </Box>

                            <TextField
                                label="รหัสไปรษณีย์"
                                size="small"
                                fullWidth
                                disabled
                                name="zipcode"
                                inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                                value={formData.zipcode ?? ""}
                                onChange={handleChange}
                                sx={{ alignSelf: "end" }}
                                InputProps={{
                                    sx: { height: 38 },
                                }}
                                error={error && !formData.zipcode}
                            />
                        </Box>

                        {/* แถว 3: โทรศัพท์, โทรสาร, ช่องว่าง 2 ช่อง */}
                        <Box
                            sx={{
                                mt: 2,
                                display: "grid",
                                gap: 2,
                                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
                                alignItems: "flex-end",
                            }}
                        >
                            <TextField label="โทรศัพท์" size="small" fullWidth name="phone"
                                inputProps={{ inputMode: "tel" }}
                                value={formData.phone ?? ""} onChange={handleChange}
                                error={error && !formData.phone}
                            />
                            <TextField label="โทรสาร" size="small" fullWidth name="fax"
                                inputProps={{ inputMode: "tel" }}
                                value={formData.fax ?? ""} onChange={handleChange}
                                error={error && !formData.fax}
                            />
                            <Box>
                                <label style={{ fontSize: 14, marginBottom: 4, display: "block" }}>
                                    อาคาร
                                </label>
                                <Select menuPlacement="auto"
                                    options={building.map(p => ({
                                        value: p.building_id,
                                        label: p.building_name,
                                    }))}

                                    value={
                                        building
                                            .map(p => ({
                                                value: p.building_id,
                                                label: p.building_name,
                                            }))
                                            .find(opt => opt.value === formData.building_id) || null
                                    }

                                    onChange={async (selected: Option | null) => {
                                        const building_id = selected?.value ?? "";

                                        // อัปเดตค่า building_id เดิมด้วย handleChange
                                        handleChange({
                                            target: { name: "building_id", value: building_id },
                                        } as any);

                                        // โหลดอำเภอตามจังหวัดที่เลือก
                                        if (building_id) {
                                            await fetchFloorByBuildingId(building_id);
                                        }
                                    }}

                                    placeholder="-- เลือกอาคาร --"
                                    isClearable
                                    menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                    styles={{
                                        control: (base, state) => ({
                                            ...base,
                                            backgroundColor: "#fff",
                                            borderColor: "#d1d5db",
                                            boxShadow: "none",

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
                                <label style={{ fontSize: 14, marginBottom: 4, display: "block" }}>
                                    ชั้น/ห้อง
                                </label>
                                <Select menuPlacement="auto"
                                    options={floor.map(p => ({
                                        value: p.floor_id,
                                        label: `ชั้น ${p.floor_name} ห้อง ${p.room_name}`,
                                    }))}

                                    value={
                                        floor
                                            .map(p => ({
                                                value: p.floor_id,
                                                label: `ชั้น ${p.floor_name} ห้อง ${p.room_name}`,
                                            }))
                                            .find(opt => opt.value === formData.floor_id) || null
                                    }

                                    onChange={async (selected: Option | null) => {
                                        const floor_id = selected?.value ?? "";

                                        // อัปเดตค่า building_id เดิมด้วย handleChange
                                        handleChange({
                                            target: { name: "floor_id", value: floor_id },
                                        } as any);
                                    }}

                                    placeholder="-- เลือกชั้น/ห้อง --"
                                    isClearable
                                    isDisabled={!formData.building_id}
                                    menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                    styles={{
                                        control: (base, state) => ({
                                            ...base,
                                            backgroundColor: "#fff",
                                            borderColor: "#d1d5db",
                                            boxShadow: "none",

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
                    </Box>

                    <Box sx={{ mt: 3, mb: 3 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                            เจ้าของหรือผู้ครอบครองและผู้ออกแบบด้านวิศวกรรมโครงสร้าง
                        </Typography>

                        {/* แถวที่ 1: ชื่อ, เลขที่, หมู่ที่, ตรอก/ซอย, ถนน */}
                        <Box
                            sx={{
                                display: "grid",
                                gap: 2,
                                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(5, 1fr)" },
                            }}
                        >
                            <TextField label="ชื่อ" size="small" fullWidth name="owner_name"
                                value={formData.owner_name ?? ""} onChange={handleChange}
                                error={error && !formData.owner_name}
                            />
                            <TextField label="เลขที่" size="small" fullWidth name="owner_address_no"
                                value={formData.owner_address_no ?? ""} onChange={handleChange}
                                error={error && !formData.owner_address_no}
                            />
                            <TextField label="หมู่ที่" size="small" fullWidth name="owner_moo"
                                value={formData.owner_moo ?? ""} onChange={handleChange}
                                error={error && !formData.owner_moo}
                            />
                            <TextField label="ตรอก/ซอย" size="small" fullWidth name="owner_alley"
                                value={formData.owner_alley ?? ""} onChange={handleChange}
                                error={error && !formData.owner_alley}
                            />
                            <TextField label="ถนน" size="small" fullWidth name="owner_road"
                                value={formData.owner_road ?? ""} onChange={handleChange}
                                error={error && !formData.owner_road}
                            />
                        </Box>

                        {/* แถวที่ 2: จังหวัด, อำเภอ/เขต, ตำบล/แขวง, รหัสไปรษณีย์ + ช่องว่างท้ายสุด */}
                        <Box
                            sx={{
                                mt: 2,
                                display: "grid",
                                gap: 2,
                                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(5, 1fr)" },
                            }}
                        >
                            <Box>
                                <label style={{ fontSize: 14, marginBottom: 4, display: "block" }}>
                                    จังหวัด
                                </label>
                                <Select menuPlacement="auto"
                                    options={provincesOwn.map(p => ({
                                        value: p.province_id,
                                        label: p.name_th || p.province_id,
                                    }))}

                                    value={
                                        provincesOwn
                                            .map(p => ({
                                                value: p.province_id,
                                                label: p.name_th || p.province_id,
                                            }))
                                            .find(opt => opt.value === formData.owner_province_id) || null
                                    }

                                    onChange={async (selected: Option | null) => {
                                        const owner_province_id = selected?.value ?? "";

                                        // อัปเดตค่า owner_province_id เดิมด้วย handleChange
                                        handleChange({
                                            target: { name: "owner_province_id", value: owner_province_id },
                                        } as any);

                                        // รีเซ็ตอำเภอ/ตำบล/ไปรษณีย์ ให้สอดคล้องกับจังหวัดใหม่
                                        setOwnDistrict([]);
                                        setOwnSubDistrict([]);
                                        setFormData(f => ({
                                            ...f,
                                            owner_district_id: "",
                                            owner_sub_district_id: "",
                                            owner_zipcode: "",
                                        }));

                                        // โหลดอำเภอตามจังหวัดที่เลือก
                                        if (owner_province_id) {
                                            await fetchOwnDistrictByProvinceId(owner_province_id);
                                        }
                                    }}

                                    placeholder="-- เลือกจังหวัด --"
                                    isClearable
                                    menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                    styles={{
                                        control: (base, state) => ({
                                            ...base,
                                            backgroundColor: "#fff",
                                            borderColor:
                                                error && !formData.owner_province_id
                                                    ? "#d32f2f"
                                                    : state.isFocused
                                                        ? "#3b82f6"
                                                        : "#d1d5db",
                                            boxShadow: "none",
                                            "&:hover": {
                                                borderColor: error && !formData.owner_province_id ? "#d32f2f" : "#9ca3af",
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
                                <label style={{ fontSize: 14, marginBottom: 4, display: "block" }}>
                                    อำเภอ/เขต
                                </label>
                                <Select menuPlacement="auto"
                                    options={districtsOwn.map(d => ({
                                        value: d.district_id,
                                        label: d.name_th || d.district_id,
                                    }))}

                                    value={
                                        districtsOwn
                                            .map(d => ({ value: d.district_id, label: d.name_th || d.district_id }))
                                            .find(opt => opt.value === formData.owner_district_id) || null
                                    }

                                    onChange={async (selected: Option | null) => {
                                        const owner_district_id = selected?.value ?? "";

                                        // อัปเดต owner_district_id ในฟอร์ม
                                        handleChange({
                                            target: { name: "owner_district_id", value: owner_district_id },
                                        } as any);

                                        // รีเซ็ต owner_sub_district_id/owner_zipcode ให้สอดคล้องกับเขตใหม่
                                        setOwnSubDistrict([]);
                                        setFormData(f => ({
                                            ...f,
                                            owner_sub_district_id: "",
                                            owner_zipcode: "",
                                        }));

                                        // โหลดตำบลตาม district
                                        if (owner_district_id) {
                                            await fetchOwnSubDistrictByDistrictId(owner_district_id);
                                        }
                                    }}
                                    placeholder="-- เลือกอำเภอ/เขต --"
                                    isClearable
                                    isDisabled={!formData.owner_province_id}
                                    menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                    styles={{
                                        control: (base, state) => ({
                                            ...base,
                                            backgroundColor: "#fff",
                                            borderColor:
                                                error && !formData.owner_district_id
                                                    ? "#d32f2f"
                                                    : state.isFocused
                                                        ? "#3b82f6"
                                                        : "#d1d5db",
                                            boxShadow: "none",
                                            "&:hover": {
                                                borderColor: error && !formData.owner_district_id ? "#d32f2f" : "#9ca3af",
                                            },
                                        }),
                                        menu: (base) => ({
                                            ...base,
                                            backgroundColor: "#fff",
                                            boxShadow: "0 8px 24px rgba(0,0,0,.2)",
                                            border: "1px solid #e5e7eb",
                                        }),
                                        menuPortal: (base) => ({ ...base, zIndex: 2100 }),
                                        option: (base, state) => ({
                                            ...base,
                                            backgroundColor: state.isSelected
                                                ? "#e5f2ff"
                                                : state.isFocused
                                                    ? "#f3f4f6"
                                                    : "#fff",
                                            color: "#111827",
                                        }),
                                        menuList: (base) => ({ ...base, backgroundColor: "#fff", paddingTop: 0, paddingBottom: 0 }),
                                        singleValue: (base) => ({ ...base, color: "#111827" }),
                                    }}
                                />
                            </Box>

                            <Box>
                                <label style={{ fontSize: 14, marginBottom: 4, display: "block" }}>
                                    ตำบล/แขวง
                                </label>
                                <Select menuPlacement="auto"
                                    options={subdistrictOwnOptions}
                                    value={
                                        subdistrictOwnOptions.find(opt => opt.value === formData.owner_sub_district_id) || null
                                    }
                                    onChange={(selected: (typeof subdistrictOwnOptions)[number] | null) => {
                                        const owner_sub_district_id = selected?.value ?? "";
                                        const owner_zipcode = selected?.owner_zipcode ?? "";

                                        // อัปเดตค่าในฟอร์ม
                                        handleChange({ target: { name: "owner_sub_district_id", value: owner_sub_district_id } } as any);

                                        // ใส่รหัสไปรษณีย์อัตโนมัติ (ถ้า clear ให้เป็นค่าว่าง)
                                        handleChange({ target: { name: "owner_zipcode", value: owner_zipcode } } as any);
                                    }}
                                    placeholder="-- เลือกตำบล/แขวง --"
                                    isClearable
                                    isDisabled={!formData.owner_district_id}
                                    menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                    styles={{
                                        control: (base, state) => ({
                                            ...base,
                                            backgroundColor: "#fff",
                                            borderColor:
                                                error && !formData.owner_sub_district_id
                                                    ? "#d32f2f"
                                                    : state.isFocused
                                                        ? "#3b82f6"
                                                        : "#d1d5db",
                                            boxShadow: "none",
                                            "&:hover": {
                                                borderColor: error && !formData.owner_sub_district_id ? "#d32f2f" : "#9ca3af",
                                            },
                                        }),
                                        menu: (base) => ({
                                            ...base,
                                            backgroundColor: "#fff",
                                            boxShadow: "0 8px 24px rgba(0,0,0,.2)",
                                            border: "1px solid #e5e7eb",
                                        }),
                                        menuPortal: (base) => ({ ...base, zIndex: 2100 }),
                                        option: (base, state) => ({
                                            ...base,
                                            backgroundColor: state.isSelected
                                                ? "#e5f2ff"
                                                : state.isFocused
                                                    ? "#f3f4f6"
                                                    : "#fff",
                                            color: "#111827",
                                        }),
                                        menuList: (base) => ({ ...base, backgroundColor: "#fff", paddingTop: 0, paddingBottom: 0 }),
                                        singleValue: (base) => ({ ...base, color: "#111827" }),
                                    }}
                                />
                            </Box>

                            <TextField
                                label="รหัสไปรษณีย์"
                                size="small"
                                fullWidth
                                disabled
                                name="owner_zipcode"
                                inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                                value={formData.owner_zipcode ?? ""}
                                onChange={handleChange}
                                sx={{ alignSelf: "end" }}
                                InputProps={{
                                    sx: { height: 38 },
                                }}
                                error={error && !formData.owner_zipcode}
                            />
                            <Box /> {/* ช่องว่างท้ายสุด */}
                        </Box>

                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2 }}>
                            ข้อมูลติดต่อ
                        </Typography>

                        {/* ข้อมูลติดต่อ: โทรศัพท์, โทรสาร, อีเมล */}
                        <Box
                            sx={{
                                mt: 1,
                                display: "grid",
                                gap: 2,
                                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
                            }}
                        >
                            <TextField label="โทรศัพท์" size="small" fullWidth name="owner_phone"
                                inputProps={{ inputMode: "tel" }}
                                value={formData.owner_phone ?? ""} onChange={handleChange}
                                error={error && !formData.owner_phone}
                            />
                            <TextField label="โทรสาร" size="small" fullWidth name="owner_fax"
                                inputProps={{ inputMode: "tel" }}
                                value={formData.owner_fax ?? ""} onChange={handleChange}
                                error={error && !formData.owner_fax}
                            />
                            <TextField label="อีเมล" size="small" fullWidth name="owner_email" type="email"
                                value={formData.owner_email ?? ""} onChange={handleChange}
                                error={error && !formData.owner_email}
                            />
                        </Box>

                        {/* ผู้ออกแบบด้านวิศวกรรมโครงสร้าง, ใบอนุญาตทะเบียนเลขที่ */}
                        <Box
                            sx={{
                                mt: 2,
                                display: "grid",
                                gap: 2,
                                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(2, 1fr)" },
                            }}
                        >
                            <TextField label="ผู้ออกแบบด้านวิศวกรรมโครงสร้าง" size="small" fullWidth name="designer_name"
                                value={formData.designer_name ?? ""} onChange={handleChange}
                                error={error && !formData.designer_name}
                            />
                            <TextField label="ใบอนุญาตทะเบียนเลขที่" size="small" fullWidth name="designer_license_no"
                                value={formData.designer_license_no ?? ""} onChange={handleChange}
                                error={error && !formData.designer_license_no}
                            />
                        </Box>
                    </Box>

                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                        ข้อมูลแบบฟอร์ม
                    </Typography>

                    <Box>
                        <label style={{ fontSize: "14px", marginBottom: "4px", display: "block" }}>
                            การบริการ
                        </label>
                        <Select menuPlacement="auto"
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
                    </Box>

                    <Box>
                        <label style={{ fontSize: "14px", marginBottom: "4px", display: "block" }}>
                            การตรวจ
                        </label>
                        <Select menuPlacement="auto"
                            options={zones.map(c => ({ value: c.zone_id, label: c.zone_name }))}
                            value={zones.map(c => ({ value: c.zone_id, label: c.zone_name }))
                                .find(opt => opt.value === formData.zone_id) || null}
                            onChange={(selected: SingleValue<Option>) =>
                                setFormData(prev => ({
                                    ...prev,
                                    zone_id: selected?.value ?? "",
                                    zone_name: selected?.label ?? "",
                                }))
                            }
                            placeholder="-- เลือกการตรวจ --"
                            isDisabled={!formData.service_id}
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
