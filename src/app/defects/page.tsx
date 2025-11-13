"use client";

import * as React from "react";
import {
    DataGrid,
    GridColDef,
} from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import IconButton from "@mui/material/IconButton";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
} from "@mui/material";
import Select from "react-select";
import { showAlert, showConfirm } from "@/lib/fetcher";
import { showLoading } from "@/lib/loading";
import { ProblemRow, DefectRow } from "@/interfaces/master";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function DefectsPage() {
    const user = useCurrentUser();
    const username = React.useMemo(
        () => (user ? `${user.first_name_th} ${user.last_name_th}` : ""),
        [user]
    );
    const [rows, setRows] = React.useState<ProblemRow[]>([]);
    const [defects, setDefects] = React.useState<DefectRow[]>([]);
    const [searchText, setSearchText] = React.useState("");
    const [openEdit, setOpenEdit] = React.useState(false);
    const [error, setError] = React.useState(false);

    const [formData, setFormData] = React.useState<ProblemRow>({
        problem_id: "",
        problem_name: "",
        defect: null,
        is_active: 1,
        created_by: "",
        updated_by: "",
        created_date: "",
        updated_date: "",
        order: undefined,
    });

    // โหลดข้อมูลและจัดเรียงใหม่
    const fecthDefect = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/legal-regulations/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "defect" }),
            });
            const data = await res.json();
            if (data.success) {
                setDefects(data.data);
            }
        } catch (err) {
        } finally {
            showLoading(false);
        }
    };

    const fecthProblem = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/legal-regulations/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "problem" }),
            });
            const data = await res.json();
            if (data.success) {
                setRows(data.data);
            }
        } catch (err) {
        } finally {
            showLoading(false);
        }
    };

    React.useEffect(() => {
        fecthDefect();
        fecthProblem();
    }, []);

    const handleOpenAdd = () => {
        setFormData({
            problem_id: "",
            problem_name: "",
            defect: null,
            is_active: 1,
            created_by: "",
            updated_by: "",
            created_date: "",
            updated_date: "",
            order: undefined,
        });
        setOpenEdit(true);
    };

    const handleOpenEdit = (row: ProblemRow) => {
        setFormData(row);
        setOpenEdit(true);
    };

    const handleClose = () => {
        setOpenEdit(false);
    };

    const handleSave = async () => {
        if (!formData.defect) {
            setError(true);
            return;
        }
        showLoading(true);

        try {
            const payload = {
                entity: "problem" as const,
                data: {
                    problem_id: formData.problem_id,
                    problem_name: formData.problem_name.trim() || undefined,
                    defect: formData.defect || null,
                    is_active: formData.is_active ?? 1,
                    created_by: formData.created_by || username,
                    updated_by: formData.updated_by || username,
                },
            };

            const res = await fetch("/api/auth/legal-regulations/post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            // 👉 ปิด popup ก่อน
            setOpenEdit(false);

            if (result.success) {
                showLoading(false);
                await showAlert("success", result.message);
                fecthProblem();
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

    const handleDelete = async (id: string) => {
        const confirmed = await showConfirm(
            "หากลบแล้วจะไม่สามารถนำกลับมาได้",
            "คุณต้องการลบข้อมูลนี้หรือไม่?"
        );
        if (!confirmed) return;
        showLoading(true);

        try {
            const res = await fetch(`/api/auth/legal-regulations/delete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, function: "problem" }),
            });
            const result = await res.json();
            if (result.success) {
                showLoading(false);
                await showAlert("success", result.message);
                fecthProblem();
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

    const columns: GridColDef<ProblemRow>[] = [
        {
            field: "order",
            headerName: "ลำดับ",
            width: 90,
            headerAlign: "center",
            align: "center",
        },
        {
            field: "problem_name",
            headerName: "รายการ",
            flex: 2,
            minWidth: 400,
            headerAlign: "center",
            align: "left",
            resizable: false,
        },
        {
            field: "defect_name",
            headerName: "มาตรา",
            flex: 2,
            minWidth: 400,
            headerAlign: "center",
            align: "left",
            resizable: false,
            renderCell: (params) => {
                const match = defects.find(d => d.id === params.row.defect);
                return match ? match.defect : "";
            },
        },
        {
            field: "actions",
            headerName: "Action",
            sortable: false,
            filterable: false,
            disableColumnMenu: true,
            width: 100,
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
                        onClick={(e) => {
                            e.stopPropagation();
                            if (params.row.problem_id) handleDelete(params.row.problem_id);
                        }}
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

    return (
        <div className="w-full h-full flex flex-col bg-gray-50 justify-between">
            <div className="h-[6vh] w-full bg-white shadow-md flex items-center justify-between px-4 text-black font-semibold rounded-lg">
                ข้อบังคับกฎหมาย
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
                    initialState={{ pagination: { paginationModel: { pageSize: 15, page: 0 } } }}
                    pageSizeOptions={[15, 20, 30]}
                    disableRowSelectionOnClick
                    getRowId={(row) => row.problem_id ?? row.defect}
                />
            </div>
            {/* Dialog Popup */}
            <Dialog open={openEdit} onClose={handleClose} fullWidth maxWidth="md" sx={{ zIndex: 1000 }}>
                <DialogTitle>
                    {formData.problem_id ? "แก้ไขข้อมูล" : "เพิ่มข้อมูล"}
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <Box sx={{ display: "flex", gap: 2 }}>
                            <TextField
                                size="small"
                                label="ปัญหา"
                                fullWidth
                                required
                                value={formData.problem_name}
                                onChange={(e) => setFormData({ ...formData, problem_name: e.target.value })}
                                error={error && !formData.problem_name}
                            />
                        </Box>

                        <Box mt={1}>
                            <label style={{ fontSize: 14, marginBottom: 4, display: "block" }}>
                                ข้อกฎหมาย
                            </label>

                            <Select menuPlacement="auto"
                                options={defects.map(p => ({
                                    value: p.id,
                                    label: p.defect,
                                }))}
                                value={
                                    defects
                                        .map(p => ({
                                            value: p.id,
                                            label: p.defect,
                                        }))
                                        .find(opt => opt.value === formData.defect) || null
                                }
                                onChange={(selected) =>
                                    setFormData({
                                        ...formData,
                                        defect: selected?.value || null,
                                        defect_name: selected?.label || undefined,
                                    })
                                }
                                placeholder="-- เลือกข้อกฎหมาย --"
                                isClearable
                                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                                styles={{
                                    control: (base, state) => ({
                                        ...base,
                                        backgroundColor: "#fff",
                                        borderColor:
                                            error && !formData.defect
                                                ? "#d32f2f" // 🔴 สีแดงเมื่อ error
                                                : state.isFocused
                                                    ? "#3b82f6"
                                                    : "#d1d5db",
                                        boxShadow: "none",
                                        "&:hover": {
                                            borderColor: error && !formData.defect ? "#d32f2f" : "#9ca3af",
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
