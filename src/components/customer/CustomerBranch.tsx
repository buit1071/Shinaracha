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
import { CustomerBranchRow, CustomerGroupRow } from "@/interfaces/master";
import CustomerBranchDetail from "@/components/customer/CustomerBranchDetail";

type Props = {
    customerId: string;
    onBack: () => void;
};

export default function CustomerBranch({ customerId, onBack }: Props) {
    const [view, setView] = React.useState<null | { type: "detail"; id: string }>(null);
    const openDetail = (id: string) => setView({ type: "detail", id });
    const openCreate = () => setView({ type: "detail", id: "" });
    const backToList = () => setView(null);
    const [customerName, setCustomerName] = React.useState<string>("");
    const [rows, setRows] = React.useState<CustomerBranchRow[]>([]);
    const [groupRows, setGroupRows] = React.useState<CustomerGroupRow[]>([]);
    const [searchText, setSearchText] = React.useState("");
    const [searchTextGroup, setSearchTextGroup] = React.useState("");
    const [openGroup, setOpenGroup] = React.useState(false);
    const [isEditGroup, setIsEditGroup] = React.useState(false);
    const [errorGroup, setErrorGroup] = React.useState(false);

    const [formGroupData, setFormGroupData] = React.useState<CustomerGroupRow>({
        customer_id: customerId,
        group_id: "",
        group_name: "",
        is_active: 1,
        created_by: "admin",
        updated_by: "admin",
    });

    const fetchCustomerBranch = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/customer/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "customerBranch", customer_id: customerId }),
            });

            const result = await res.json();
            if (result.success && result.data) {
                showLoading(false);
                setRows(result.data || []);
            }
        } catch (err) {
            showLoading(false);
            console.error("fetch customer name error:", err);
        }
    };

    const handleBack = async () => {
        await fetchCustomerBranch();
        backToList();
    };

    const fetchCustomerById = async () => {
        try {
            const res = await fetch("/api/auth/customer/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "customerById", customer_id: customerId }),
            });

            const result = await res.json();
            if (result.success && result.data) {
                setCustomerName(result.data.customer_name);
            }
        } catch (err) {
            console.error("fetch customer name error:", err);
        }
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
                setGroupRows(result.data || []);
                showLoading(false);
            }
        } catch (err) {
            showLoading(false);
            console.error("fetch customer name error:", err);
        }
    };

    React.useEffect(() => {
        if (!customerId) return;

        const fetchAll = async () => {
            await fetchCustomerById();
            await fetchCustomerBranch();
            await fetchGroupByCustomerId();
        };

        fetchAll();
    }, [customerId]);

    const columns: GridColDef<CustomerBranchRow>[] = [
        {
            field: "order",
            headerName: "ลำดับ",
            width: 90,
            headerAlign: "center",
            align: "center",
        },
        {
            field: "branch_name", headerName: "สาขา", flex: 1, headerAlign: "center", align: "left",
            renderCell: (params: GridRenderCellParams<CustomerBranchRow>) => (
                <button
                    onClick={() => openDetail(params.row.branch_id)}
                    className="hover:no-underline text-blue-900 hover:opacity-80 cursor-pointer"
                    title="เปิดรายละเอียด"
                >
                    {params.row.branch_name}
                </button>
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
            renderCell: (params: GridRenderCellParams<CustomerBranchRow>) => (
                <>
                    <IconButton color="error" onClick={() => handleDeleteBranch(params.row.branch_id)}>
                        <DeleteIcon />
                    </IconButton>
                </>
            ),
        },
    ];

    const handleOpenAddGroup = () => {
        setIsEditGroup(false);
        setFormGroupData({
            customer_id: "",
            group_id: "",
            group_name: "",
            is_active: 1,
            created_by: "admin",
            updated_by: "admin",
        });
        setOpenGroup(true);
    };

    const handleOpenEditGroup = (row: CustomerGroupRow) => {
        setIsEditGroup(true);
        setFormGroupData(row);
        setOpenGroup(true);
    };

    const handleSaveGroup = async () => {
        if (!formGroupData.group_name) {
            setErrorGroup(true);
            return; // ยังไม่เปิดโหลด เพราะเราเช็คก่อน
        }

        showLoading(true);
        try {
            const payload = {
                entity: "groupCustomer" as const,
                data: {
                    customer_id: customerId,
                    group_id: formGroupData.group_id || undefined,
                    group_name: formGroupData.group_name.trim(),
                    is_active: formGroupData.is_active ?? 1,
                    created_by: formGroupData.created_by || "admin",
                    updated_by: formGroupData.updated_by || "admin",
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
                setOpenGroup(false);
                await showAlert("success", result.message);
                fetchGroupByCustomerId();
            } else {
                showLoading(false);
                setOpenGroup(false);
                await showAlert("error", result.message || "บันทึกล้มเหลว");
            }
        } catch (e) {
            console.error(e);
            showLoading(false);
            setOpenGroup(false);
            await showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            // กันตกหล่น/throw จาก showAlert
            showLoading(false);
        }
    };

    const handleCloseGroup = () => setOpenGroup(false);

    const handleDeleteGroup = async (id: string) => {
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

    const handleDeleteBranch = async (id: string) => {
        const confirmed = await showConfirm("คุณต้องการลบข้อมูลนี้หรือไม่?", "ลบข้อมูล");
        if (!confirmed) return;

        showLoading(true);
        try {
            const res = await fetch(`/api/auth/customer/delete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, function: "branch" }),
            });

            const result = await res.json();
            if (result.success) {
                showLoading(false);
                await showAlert("success", result.message);
                fetchCustomerBranch();
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

    const columnGroups: GridColDef<CustomerGroupRow>[] = [
        {
            field: "order",
            headerName: "ลำดับ",
            width: 90,
            headerAlign: "center",
            align: "center",
        },
        {
            field: "group_name", headerName: "Group", flex: 1, headerAlign: "center", align: "left",
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
            renderCell: (params: GridRenderCellParams<CustomerGroupRow>) => (
                <>
                    <IconButton color="primary" onClick={() => handleOpenEditGroup(params.row)}>
                        <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDeleteGroup(params.row.group_id)}>
                        <DeleteIcon />
                    </IconButton>
                </>
            ),
        },
    ];

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
    const filteredGroupRows = groupRows
        .filter((row) =>
            Object.values(row).some((value) =>
                String(value).toLowerCase().includes(searchTextGroup.toLowerCase())
            )
        )
        .map((row, index) => ({
            ...row,
            order: index + 1,
        }));

    return (
        <div className="w-full h-[96vh] flex flex-col bg-gray-50">
            {!view && (
                <div className="h-[6vh] flex items-center justify-between px-4 py-2 bg-white shadow-md rounded-lg">
                    <div className="flex items-center">
                        <IconButton onClick={onBack} color="primary">
                            <ArrowBackIcon />
                        </IconButton>
                        <h2 className="text-xl font-bold text-gray-800 ml-5">
                            Customer Name : <span className="text-blue-900">{customerName}</span>
                        </h2>
                    </div>
                    <div className="flex gap-2 items-center">
                        <TextField
                            size="small"
                            placeholder="ค้นหา..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={openCreate}
                        >
                            เพิ่มข้อมูล
                        </Button>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 min-h-0 mb-2 rounded-lg">
                {view?.type !== "detail" ? (
                    <div className="w-full min-w-0 space-y-6">
                        <div>
                            <div className="h-[6vh] flex items-center justify-between px-4">
                                <div className="flex items-center">
                                    <h3 className="text-xl font-bold text-gray-800">
                                        สาขา
                                    </h3>
                                </div>
                            </div>
                            <DataGrid
                                rows={filteredRows}
                                columns={columns}
                                getRowId={(row) => row.branch_id}
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
                        </div>

                        <div>
                            <div className="h-[6vh] flex items-center justify-between px-4">
                                <div className="flex items-center">
                                    <h3 className="text-xl font-bold text-gray-800">
                                        Group
                                    </h3>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <TextField
                                        size="small"
                                        placeholder="ค้นหา..."
                                        value={searchTextGroup}
                                        onChange={(e) => setSearchTextGroup(e.target.value)}
                                    />
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<AddIcon />}
                                        onClick={handleOpenAddGroup}
                                    >
                                        เพิ่มข้อมูล
                                    </Button>
                                </div>
                            </div>
                            <DataGrid
                                rows={filteredGroupRows}
                                columns={columnGroups}
                                getRowId={(row) => row.group_id}
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
                        </div>
                    </div>
                ) : (
                    <CustomerBranchDetail customerId={customerId} branchId={view.id} onBack={handleBack} />
                )}
            </div>

            {/* Dialog Popup */}
            <Dialog open={openGroup} onClose={handleCloseGroup} fullWidth maxWidth="md" sx={{ zIndex: 1000 }}>
                <DialogTitle>{isEditGroup ? "แก้ไขข้อมูล" : "เพิ่มข้อมูล"}</DialogTitle>
                <DialogContent dividers>
                    {isEditGroup && (
                        <TextField
                            size="small"
                            margin="dense"
                            label="Group ID"
                            fullWidth
                            value={formGroupData.group_id}
                            disabled
                        />
                    )}

                    <TextField
                        size="small"
                        margin="dense"
                        label="Group Name"
                        fullWidth
                        required
                        value={formGroupData.group_name}
                        onChange={(e) => {
                            setFormGroupData({ ...formGroupData, group_name: e.target.value });
                            if (errorGroup) setErrorGroup(false);
                        }}
                        error={errorGroup && !formGroupData.group_name}
                        helperText={errorGroup && !formGroupData.group_name ? "กรุณากรอก Group Name" : ""}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseGroup}>ยกเลิก</Button>
                    <Button variant="contained" color="primary" onClick={handleSaveGroup}>
                        บันทึก
                    </Button>
                </DialogActions>
            </Dialog>
        </div >
    );
}
