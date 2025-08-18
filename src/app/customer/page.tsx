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

interface CustomerRow {
  id: number;
  customer_name: string;
  created_by: string;
  updated_by: string;
  status: string; // "ใช้งาน" หรือ "ปิดการใช้งาน"
}

export default function CustomersPage() {
  const [rows, setRows] = React.useState<CustomerRow[]>([
    { id: 1, customer_name: "บจก. เอ บี ซี", created_by: "admin", updated_by: "admin", status: "ใช้งาน" },
    { id: 2, customer_name: "หจก. ดี อี เอฟ", created_by: "user1", updated_by: "admin", status: "ปิดการใช้งาน" },
  ]);

  // Search
  const [searchText, setSearchText] = React.useState("");

  // Dialog
  const [open, setOpen] = React.useState(false);
  const [isEdit, setIsEdit] = React.useState(false);
  const [formData, setFormData] = React.useState<CustomerRow>({
    id: 0,
    customer_name: "",
    created_by: "",
    updated_by: "",
    status: "ใช้งาน",
  });

  const handleOpenAdd = () => {
    setIsEdit(false);
    setFormData({ id: 0, customer_name: "", created_by: "", updated_by: "", status: "ใช้งาน" });
    setOpen(true);
  };

  const handleOpenEdit = (row: CustomerRow) => {
    setIsEdit(true);
    setFormData(row);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSave = () => {
    if (isEdit) {
      setRows((prev) => prev.map((r) => (r.id === formData.id ? formData : r)));
    } else {
      const newId = rows.length ? Math.max(...rows.map((r) => r.id)) + 1 : 1;
      setRows((prev) => [...prev, { ...formData, id: newId }]);
    }
    setOpen(false);
  };

  const handleDelete = (id: number) => {
    if (confirm("คุณต้องการลบข้อมูลนี้หรือไม่?")) {
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const toggleStatus = (id: number) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: r.status === "ใช้งาน" ? "ปิดการใช้งาน" : "ใช้งาน" }
          : r
      )
    );
  };

  const columns: GridColDef<CustomerRow>[] = [
    { field: "id", headerName: "ลำดับ", width: 90, headerAlign: "center", align: "center" },
    { field: "customer_name", headerName: "ชื่อลูกค้า", flex: 1, headerAlign: "center", align: "left" },
    { field: "created_by", headerName: "สร้างโดย", flex: 1, headerAlign: "center", align: "center" },
    { field: "updated_by", headerName: "อัปเดทโดย", flex: 1, headerAlign: "center", align: "center" },
    {
      field: "status",
      headerName: "สถานะ",
      flex: 1,
      headerAlign: "center",
      align: "center",
      renderCell: (params: GridRenderCellParams<CustomerRow>) => (
        <Switch
          checked={params.row.status === "ใช้งาน"}
          onChange={() => toggleStatus(params.row.id)}
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
          <IconButton color="error" onClick={() => handleDelete(params.row.id)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  // Filter rows by search
  const filteredRows = rows.filter((row) =>
    Object.values(row).some((value) =>
      String(value).toLowerCase().includes(searchText.toLowerCase())
    )
  );

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
            เพิ่มลูกค้า
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
        />
      </div>

      {/* Dialog Popup */}
      <Dialog
        open={open}
        // ล็อคไม่ให้ปิดด้วยการกด backdrop หรือ ESC
        onClose={(_, reason) => {
          if (reason === "backdropClick" || reason === "escapeKeyDown") {
            return;
          }
          handleClose();
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{isEdit ? "แก้ไขลูกค้า" : "เพิ่มลูกค้า"}</DialogTitle>
        <DialogContent dividers>
          <TextField
            margin="normal"
            label="ชื่อลูกค้า"
            fullWidth
            value={formData.customer_name}
            onChange={(e) =>
              setFormData({ ...formData, customer_name: e.target.value })
            }
          />

          <Box mt={2} display="flex" alignItems="center" gap={2}>
            <span>สถานะ:</span>
            <Switch
              checked={formData.status === "ใช้งาน"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.checked ? "ใช้งาน" : "ปิดการใช้งาน",
                })
              }
              color="success"
            />
            <span>{formData.status}</span>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSave} color="primary">
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>

    </div>
  );
}
