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
import { CustomerBranchRow } from "@/interfaces/master";
import CustomerBranchDetail from "@/components/customer/CustomerBranchDetail";

export default function CustomerBranch() {
    const [view, setView] = React.useState<null | { type: "detail"; id: string }>(null);
    const openDetail = (id: string) => setView({ type: "detail", id, });
    const openCreate = () => setView({ type: "detail", id: "" });
    const backToList = () => setView(null);
    const [customerName, setCustomerName] = React.useState<string>("");
    const [rows, setRows] = React.useState<CustomerBranchRow[]>([]);
    const [searchText, setSearchText] = React.useState("");

    const fetchCustomerBranch = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/customer/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "customerBranch" }),
            });

            const result = await res.json();
            if (result.success && result.data) {
                showLoading(false);
                setRows(result.data || []);
            }
        } catch (err) {
            showLoading(false);
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
                body: JSON.stringify({ function: "customerById" }),
            });

            const result = await res.json();
            if (result.success && result.data) {
                setCustomerName(result.data.customer_name);
            }
        } catch (err) {
        }
    };

    React.useEffect(() => {
        const fetchAll = async () => {
            showLoading(true);
            await fetchCustomerById();
            await fetchCustomerBranch();
            showLoading(false);
        };

        fetchAll();
    },[]);

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
                    onClick={() => openDetail(params.row.customer_id)}
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
                    <IconButton color="error" onClick={() => handleDeleteBranch(params.row.customer_id)}>
                        <DeleteIcon />
                    </IconButton>
                </>
            ),
        },
    ];


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
            showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            showLoading(false);
        }
    };

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
        <div className="w-full h-[94vh] flex flex-col bg-gray-50">
            {!view && (
                <div className="h-[6vh] flex items-center justify-between px-4 py-2 bg-white shadow-md rounded-lg">
                    <div className="flex items-center">
                        <h2 className="text-xl font-bold text-gray-800 ml-5">
                            ข้อมูลลูกค้า
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
                        <div className="mt-5">
                            <DataGrid
                                rows={filteredRows}
                                columns={columns}
                                getRowId={(row) => row.customer_id}
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
                    <CustomerBranchDetail customerId={view.id} onBack={handleBack} />
                )}
            </div>
        </div >
    );
}
