
"use client";

import * as React from "react";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import { Box } from "@mui/material";

interface CustomerRow {
  id: number;
  customer_name: string;
  created_by: string;
  updated_by: string;
  status: string;
}

export default function CustomersPage() {
  const [rows, setRows] = React.useState<CustomerRow[]>([
    {
      id: 1,
      customer_name: "บจก. เอ บี ซี",
      created_by: "admin",
      updated_by: "admin",
      status: "ใช้งาน",
    },
    {
      id: 2,
      customer_name: "หจก. ดี อี เอฟ",
      created_by: "user1",
      updated_by: "admin",
      status: "ปิดการใช้งาน",
    },
  ]);

  const handleEdit = (row: CustomerRow) => {
    alert(`แก้ไขลูกค้า: ${row.customer_name}`);
  };

  const handleDelete = (id: number) => {
    if (confirm("คุณต้องการลบข้อมูลนี้หรือไม่?")) {
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const columns: GridColDef<CustomerRow>[] = [
    { field: "id", headerName: "ลำดับ", width: 90, headerAlign: "center", align: "center" },
    { field: "customer_name", headerName: "ชื่อลูกค้า", flex: 1, headerAlign: "center", align: "left" },
    { field: "created_by", headerName: "สร้างโดย", flex: 1, headerAlign: "center", align: "center" },
    { field: "updated_by", headerName: "อัปเดทโดย", flex: 1, headerAlign: "center", align: "center" },
    { field: "status", headerName: "สถานะ", flex: 1, headerAlign: "center", align: "center" },
    {
      field: "actions",
      headerName: "Action",
      sortable: false,
      width: 150,
      headerAlign: "center",
      align: "center",
      renderCell: (params: GridRenderCellParams<CustomerRow>) => (
        <Box sx={{ display: "flex", justifyContent: "center", gap: 1, width: "100%" }}>
          <IconButton color="primary" onClick={() => handleEdit(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton color="error" onClick={() => handleDelete(params.row.id)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];


  return (
    <div className="min-h-[94.9vh] grid place-items-center bg-gray-50 w-full">
      <div className="h-[6vh] w-full bg-white shadow-md flex items-center px-4 text-black font-semibold rounded-lg">
        Customers
      </div>
      <div className="h-[88vh] w-full bg-white">
        <DataGrid
          sx={{
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': {
              outline: 'none', // ตัดเส้นโฟกัส
            },
          }}
          rows={rows}
          columns={columns.map(col => ({ ...col, resizable: false }))}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 5, page: 0 },
            },
          }}
          pageSizeOptions={[5, 10]}
          disableRowSelectionOnClick
        />

      </div>
    </div>
  );
}
