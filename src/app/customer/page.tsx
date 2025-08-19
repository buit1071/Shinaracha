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
import { formatDateTime, showAlert, showConfirm } from "@/lib/fetcher";
import { showLoading } from "@/lib/loading";
import { CustomerRow } from "@/interfaces/master";

export default function CustomersPage() {
  const [rows, setRows] = React.useState<CustomerRow[]>([]);
  const [searchText, setSearchText] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [isEdit, setIsEdit] = React.useState(false);
  const [error, setError] = React.useState(false);

  const [formData, setFormData] = React.useState<CustomerRow>({
    customer_id: "",
    customer_name: "",
    is_active: 1,
    created_by: "admin",
    updated_by: "admin",
  });

  // โหลดข้อมูลและจัดเรียงใหม่
  const fetchCustomers = async () => {
    showLoading(true);
    try {
      const res = await fetch("/api/auth/customer");
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
  const updateWithOrder = (data: CustomerRow[]) => {
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
    fetchCustomers();
  }, []);

  const handleOpenAdd = () => {
    setIsEdit(false);
    setFormData({
      customer_id: "",
      customer_name: "",
      is_active: 1,
      created_by: "admin",
      updated_by: "admin",
    });
    setOpen(true);
  };

  const handleOpenEdit = (row: CustomerRow) => {
    setIsEdit(true);
    setFormData(row);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSave = async () => {
    if (!formData.customer_name) {
      setError(true);
      return;
    }

    try {
      const res = await fetch("/api/auth/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      // 👉 ปิด popup ก่อน
      setOpen(false);

      if (result.success) {
        await showAlert("success", result.message);
        fetchCustomers();
      } else {
        showAlert("error", result.message || "บันทึกล้มเหลว");
      }
    } catch (err) {
      console.error("Save error:", err);
      setOpen(false); // ปิด popup แม้ error
      showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
  };


  const handleDelete = async (customer_id: string) => {
    const confirmed = await showConfirm("คุณต้องการลบข้อมูลนี้หรือไม่?", "ลบข้อมูล");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/auth/customer/${customer_id}`, {
        method: "DELETE",
      });
      const result = await res.json();

      if (result.success) {
        await showAlert("success", result.message);
        fetchCustomers();
      } else {
        showAlert("error", result.message || "ลบข้อมูลล้มเหลว");
      }
    } catch (err) {
      console.error("Delete error:", err);
      showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
  };

  const toggleStatus = async (row: CustomerRow) => {
    try {
      const res = await fetch("/api/auth/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...row,
          is_active: row.is_active === 1 ? 0 : 1,
        }),
      });
      const result = await res.json();
      if (result.success) {
        fetchCustomers();
      }
    } catch (err) {
      console.error("Toggle status error:", err);
    }
  };

  const columns: GridColDef<CustomerRow>[] = [
    {
      field: "order",
      headerName: "ลำดับ",
      width: 90,
      headerAlign: "center",
      align: "center",
    },
    { field: "customer_id", headerName: "รหัสลูกค้า", flex: 1, headerAlign: "center", align: "center" },
    { field: "customer_name", headerName: "ชื่อลูกค้า", flex: 1, headerAlign: "center", align: "left" },
    {
      field: "created_date",
      headerName: "วันที่สร้าง",
      flex: 1,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => formatDateTime(params.row.created_date),
    },
    {
      field: "updated_date",
      headerName: "อัปเดทล่าสุด",
      flex: 1,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => formatDateTime(params.row.updated_date),
    },
    {
      field: "is_active",
      headerName: "สถานะ",
      flex: 1,
      headerAlign: "center",
      align: "center",
      renderCell: (params: GridRenderCellParams<CustomerRow>) => (
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
      width: 150,
      headerAlign: "center",
      align: "center",
      renderCell: (params: GridRenderCellParams<CustomerRow>) => (
        <Box sx={{ display: "flex", justifyContent: "center", gap: 1, width: "100%" }}>
          <IconButton color="primary" onClick={() => handleOpenEdit(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton color="error" onClick={() => handleDelete(params.row.customer_id)}>
            <DeleteIcon />
          </IconButton>
        </Box>
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
    <div className="min-h-[94.9vh] grid place-items-center bg-gray-50 w-full">
      {/* Header Bar */}
      <div className="h-[6vh] w-full bg-white shadow-md flex items-center justify-between px-4 text-black font-semibold rounded-lg">
        Customers
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
          getRowId={(row) => row.customer_id} // ใช้ customer_id แทน id
        />
      </div>

      {/* Dialog Popup */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{isEdit ? "แก้ไขข้อมูล" : "เพิ่มข้อมูล"}</DialogTitle>
        <DialogContent dividers>
          {isEdit && (
            <TextField
              margin="normal"
              label="รหัสลูกค้า"
              fullWidth
              value={formData.customer_id}
              disabled
            />
          )}

          <TextField
            margin="normal"
            label="ชื่อลูกค้า"
            fullWidth
            required
            value={formData.customer_name}
            onChange={(e) => {
              setFormData({ ...formData, customer_name: e.target.value });
              if (error) setError(false);
            }}
            error={error && !formData.customer_name}
            helperText={error && !formData.customer_name ? "กรุณากรอกชื่อลูกค้า" : ""}
          />

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
    </div>
  );
}
