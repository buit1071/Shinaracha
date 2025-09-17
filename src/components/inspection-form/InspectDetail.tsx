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
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { InspectItemsRow } from "@/interfaces/master";

type Props = {
  InspectId: string;
  onBack: () => void;
};

export default function InspectDetail({ InspectId, onBack }: Props) {
  const [groupName, setGroupName] = React.useState<string>("");
  const [rows, setRows] = React.useState<InspectItemsRow[]>([]);
  const [searchText, setSearchText] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [isEdit, setIsEdit] = React.useState(false);
  const [error, setError] = React.useState(false);

  const [formData, setFormData] = React.useState<InspectItemsRow>({
    inspect_id: InspectId,
    inspect_item_id: "",
    inspect_item_name: "",
    is_active: 1,
    created_by: "admin",
    updated_by: "admin",
  });

  const fetchInspectItems = async () => {
    if (!InspectId) return;

    showLoading(true);
    try {
      const res = await fetch("/api/auth/inspection-form/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ function: "inspectItems", inspect_id: InspectId }),
      });

      const result = await res.json();
      if (result.success) {
        setRows(result.data || []);
      } else {
        showAlert("warning", result.message || "ไม่สามารถดึงข้อมูลได้");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      showLoading(false);
    }
  };

  const fetchGroupName = async () => {
    try {
      const res = await fetch("/api/auth/inspection-form/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ function: "groupById", inspect_id: InspectId }),
      });

      const result = await res.json();
      if (result.success && result.data) {
        setGroupName(result.data.inspect_name);
      }
    } catch (err) {
      console.error("fetch group name error:", err);
    }
  };

  React.useEffect(() => {
    if (!InspectId) return;
    fetchGroupName();
    fetchInspectItems();
  }, [InspectId]);

  const handleOpenAdd = () => {
    setIsEdit(false);
    setFormData({
      inspect_id: InspectId,
      inspect_item_id: "",
      inspect_item_name: "",
      is_active: 1,
      created_by: "admin",
      updated_by: "admin",
    });
    setOpen(true);
  };

  const handleOpenEdit = (row: InspectItemsRow) => {
    setIsEdit(true);
    setFormData(row);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm(
      "หากลบแล้วจะไม่สามารถนำกลับมาได้",
      "คุณต้องการลบข้อมูลนี้หรือไม่?"
    );
    if (!confirmed) return;

    showLoading(true);
    try {
      const res = await fetch("/api/auth/inspection-form/delete", {
        method: "POST",                         // ใช้ POST เพราะมี body
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,                                   // id ของ inspect ที่จะลบ
          function: "inspectitems",                  // ชี้ว่าจะลบ entity ประเภทไหน
        }),
      });

      const result = await res.json();
      showLoading(false);

      if (result.success) {
        await showAlert("success", result.message);
        fetchInspectItems();                   // รีเฟรชรายการ
      } else {
        await showAlert("error", result.message || "ลบข้อมูลล้มเหลว");
      }
    } catch (err) {
      console.error("Delete error:", err);
      await showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      showLoading(false);
    }
  };

  const handleClose = () => setOpen(false);

  const handleSave = async () => {
    // validate เบื้องต้น
    if (!formData.inspect_item_name?.trim()) {
      setError(true);
      await showAlert("warning", "กรุณากรอก Inspection Item Name");
      return;
    }

    showLoading(true);
    try {
      const payload = {
        entity: "inspectitems" as const,
        data: {
          inspect_item_id: formData.inspect_item_id || undefined,  // มี = update, ไม่มี = insert
          inspect_id: formData.inspect_id,
          inspect_item_name: formData.inspect_item_name.trim(),
          is_active: formData.is_active ?? 1,
          created_by: formData.created_by || "admin",
          updated_by: formData.updated_by || "admin",
        },
      };

      const res = await fetch("/api/auth/inspection-form/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // cache: "no-store",
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      showLoading(false);

      if (result.success) {
        setOpen(false);                        // ปิด popup เมื่อสำเร็จ
        await showAlert("success", result.message);
        fetchInspectItems();                  // รีเฟรชตาราง
      } else {
        await showAlert("error", result.message || "บันทึกล้มเหลว");
      }
    } catch (err) {
      console.error("Save error:", err);
      setOpen(false);                          // ปิด popup แม้ error
      await showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      showLoading(false);
    }
  };

  const columns: GridColDef<InspectItemsRow>[] = [
    {
      field: "order",
      headerName: "ลำดับ",
      width: 90,
      headerAlign: "center",
      align: "center",
    },
    { field: "inspect_item_name", headerName: "รายการตรวจ", flex: 1, headerAlign: "center", align: "left" },
    {
      field: "actions",
      headerName: "Action",
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      width: 150,
      headerAlign: "center",
      align: "center",
      renderCell: (params: GridRenderCellParams<InspectItemsRow>) => (
        <>
          <IconButton color="primary" onClick={() => handleOpenEdit(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton color="error" onClick={() => handleDelete(params.row.inspect_item_id)}>
            <DeleteIcon />
          </IconButton></>
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
  return (
    <div className="w-full h-[96vh] flex flex-col bg-gray-50">
      {/* Header */}
      <div className="h-[6vh] flex items-center justify-between px-4 py-2 bg-white shadow-md mb-2 rounded-lg">
        <div className="flex items-center">
          <IconButton onClick={onBack} color="primary">
            <ArrowBackIcon />
          </IconButton>
          <h2 className="text-xl font-bold text-gray-800 ml-5">
            หัวข้อ : <span className="text-blue-900">{groupName}</span>
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
            onClick={handleOpenAdd}
          >
            เพิ่มข้อมูล
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1" style={{ minHeight: "90vh"}}>
        <DataGrid
          sx={{
            width: "100%",
            height: "100%",   // จะอ้างอิงตาม div แม่
            borderRadius: "0.5rem",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": {
              outline: "none",
            },
          }}
          rows={filteredRows}
          columns={columns.map((col) => ({ ...col, resizable: false }))}
          initialState={{
            pagination: { paginationModel: { pageSize: 10, page: 0 } },
          }}
          pageSizeOptions={[5, 10, 15]}
          disableRowSelectionOnClick
          getRowId={(row) => row.inspect_item_id}
        />
      </div>
      {/* Dialog Popup */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md" sx={{ zIndex: 1000 }}>
        <DialogTitle>{isEdit ? "แก้ไขข้อมูล" : "เพิ่มข้อมูล"}</DialogTitle>
        <DialogContent dividers>
          {isEdit && (
            <TextField
              size="small"
              margin="dense"
              label="Inspect ID"
              fullWidth
              value={formData.inspect_id}
              disabled
            />
          )}

          <TextField
            size="small"
            margin="dense"
            label="รายการตรวจ"
            fullWidth
            required
            value={formData.inspect_item_name}
            onChange={(e) => {
              setFormData({ ...formData, inspect_item_name: e.target.value });
              if (error) setError(false);
            }}
            error={error && !formData.inspect_item_name}
            helperText={error && !formData.inspect_item_name ? "กรุณากรอก รายการตรวจ" : ""}
          />
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
