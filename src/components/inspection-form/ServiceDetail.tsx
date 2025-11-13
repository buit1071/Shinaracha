"use client";

import * as React from "react";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import { formatDateTime, showAlert, showConfirm } from "@/lib/fetcher";
import { showLoading } from "@/lib/loading";
// import EditIcon from "@mui/icons-material/Edit";
// import DeleteIcon from "@mui/icons-material/Delete";
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
  Switch
} from "@mui/material";
import { DataZonesRow } from "@/interfaces/master";
import ZoneDetail from "@/components/inspection-form/ZoneDetail";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type Props = {
  serviceId: string;
  onBack: () => void;
};

export default function ServiceDetail({ serviceId, onBack }: Props) {
  const user = useCurrentUser();
  const username = React.useMemo(
    () => (user ? `${user.first_name_th} ${user.last_name_th}` : ""),
    [user]
  );
  const [view, setView] = React.useState<null | { type: "detail"; id: string }>(null);
  // const openDetail = (id: string) => setView({ type: "detail", id });
  const backToList = () => setView(null);
  const [serviceName, setServiceName] = React.useState<string>("");
  const [rows, setRows] = React.useState<DataZonesRow[]>([]);
  const [searchText, setSearchText] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [isEdit, setIsEdit] = React.useState(false);
  const [error, setError] = React.useState(false);

  const [formData, setFormData] = React.useState<DataZonesRow>({
    service_id: serviceId,
    zone_id: "",
    zone_name: "",
    is_active: 1,
    created_by: "",
    updated_by: "",
  });

  const fetchServiceZones = async () => {
    showLoading(true);
    try {
      const res = await fetch("/api/auth/inspection-form/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ function: "zonesByService", service_id: serviceId }),
      });

      const data = await res.json();
      showLoading(false);

      if (data.success) {
        setRows(data.data || []);
      } else {
      }
    } catch (err) {
    }
  };

  const fetchServiceName = async () => {
    try {
      const res = await fetch("/api/auth/inspection-form/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ function: "serviceById", service_id: serviceId }),
      });

      const result = await res.json();
      if (result.success && result.data) {
        setServiceName(result.data.service_name);
      }
    } catch (err) {
    }
  };

  React.useEffect(() => {
    if (!serviceId) return;
    fetchServiceName();
    fetchServiceZones();
  }, [serviceId]);

  const handleOpenAdd = () => {
    setIsEdit(false);
    setFormData({
      service_id: serviceId,
      zone_id: "",
      zone_name: "",
      is_active: 1,
      created_by: "",
      updated_by: "",
    });
    setOpen(true);
  };

  // const handleOpenEdit = (row: DataZonesRow) => {
  //   setIsEdit(true);
  //   setFormData(row);
  //   setOpen(true);
  // };

  // const handleDelete = async (zone_id: string) => {
  //   const confirmed = await showConfirm(
  //     "หากลบแล้วจะไม่สามารถนำกลับมาได้",
  //     "คุณต้องการลบข้อมูลนี้หรือไม่?"
  //   );
  //   if (!confirmed) return;

  //   showLoading(true);
  //   try {
  //     const res = await fetch("/api/auth/inspection-form/delete", {
  //       method: "POST", // ใช้ POST เพราะมี body
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         id: zone_id,
  //         function: "zone", // บอกชนิดที่ลบ
  //       }),
  //     });

  //     const result = await res.json();
  //     showLoading(false);

  //     if (result.success) {
  //       await showAlert("success", result.message);
  //       fetchServiceZones(); // รีเฟรชรายการโซน
  //     } else {
  //       await showAlert("error", result.message || "ลบข้อมูลล้มเหลว");
  //     }
  //   } catch (err) {
  //     await showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
  //   } finally {
  //     showLoading(false);
  //   }
  // };

  const toggleStatus = async (row: DataZonesRow) => {
    showLoading(true);
    try {
      const res = await fetch("/api/auth/inspection-form/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "active",
          data: {
            zone_id: row.zone_id,
            is_active: row.is_active === 1 ? 0 : 1,
            updated_by: username,
          },
        }),
      });

      const result = await res.json();
      showLoading(false);

      if (res.ok && result.success) {
        fetchServiceZones();
        showAlert("success", result.message);
      } else {
      }
    } catch (err) {
      showLoading(false);
    }
  };

  const handleClose = () => setOpen(false);

  const handleSave = async () => {
    // validate เบื้องต้น
    if (!formData.zone_name?.trim() || !formData.service_id?.trim()) {
      setError(true);
      return;
    }

    showLoading(true);
    try {
      const payload = {
        entity: "zone" as const,
        data: {
          zone_id: formData.zone_id || undefined,          // มี = update, ไม่มี = insert
          service_id: formData.service_id,
          zone_name: formData.zone_name.trim(),
          is_active: formData.is_active ?? 1,
          created_by: formData.created_by || username,
          updated_by: formData.updated_by || username,
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
        setOpen(false);                       // ปิด popup เมื่อสำเร็จ
        await showAlert("success", result.message);
        fetchServiceZones();                  // รีเฟรชรายการโซน
      } else {
        await showAlert("error", result.message || "บันทึกล้มเหลว");
      }
    } catch (err) {
      setOpen(false);                         // ปิด popup แม้ error
      await showAlert("error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      showLoading(false);
    }
  };

  const columns: GridColDef<DataZonesRow>[] = [
    {
      field: "order",
      headerName: "ลำดับ",
      width: 90,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "zone_name", headerName: "ฟอร์ม", width: 300, flex: 1, headerAlign: "center", align: "left",
      // renderCell: (params: GridRenderCellParams<DataZonesRow>) => (
      //   <button
      //     onClick={() => openDetail(params.row.zone_id)}
      //     className="hover:no-underline text-blue-900 hover:opacity-80 cursor-pointer"
      //     title="เปิดรายละเอียด"
      //   >
      //     {params.row.zone_name}
      //   </button>
      // ),
    },
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
      renderCell: (params: GridRenderCellParams<DataZonesRow>) => (
        <Switch
          checked={params.row.is_active === 1}
          onChange={() => toggleStatus(params.row)}
          color="success"
        />
      ),
    },
    // {
    //   field: "actions",
    //   headerName: "Action",
    //   sortable: false,
    //   filterable: false,
    //   disableColumnMenu: true,
    //   width: 150,
    //   headerAlign: "center",
    //   align: "center",
    //   renderCell: (params: GridRenderCellParams<DataZonesRow>) => (
    //     <>
    //       <IconButton color="primary" onClick={() => handleOpenEdit(params.row)}>
    //         <EditIcon />
    //       </IconButton>
    //       <IconButton color="error" onClick={() => handleDelete(params.row.zone_id)}>
    //         <DeleteIcon />
    //       </IconButton></>
    //   ),
    // },
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
      {view?.type === "detail" ? (
        <ZoneDetail serviceId={serviceId} zoneId={view.id} onBack={backToList} />
      ) : (
        <>
          {/* Header */}
          <div className="h-[6vh] flex items-center justify-between px-4 py-2 bg-white shadow-md mb-2 rounded-lg">
            <div className="flex items-center">
              <IconButton onClick={onBack} color="primary">
                <ArrowBackIcon />
              </IconButton>
              <h2 className="text-xl font-bold text-gray-800 ml-5">
                บริการ : <span className="text-blue-900">{serviceName}</span>
              </h2>
            </div>
            <div className="flex gap-2 items-center">
              <TextField
                size="small"
                placeholder="ค้นหา..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              {/* <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleOpenAdd}
              >
                เพิ่มข้อมูล
              </Button> */}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <DataGrid
              sx={{
                width: "100%",
                height: "100%",
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
              pageSizeOptions={[5, 10, 25]}
              disableRowSelectionOnClick
              getRowId={(row) => row.zone_id}
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
                  label="Zone ID"
                  fullWidth
                  value={formData.zone_id}
                  disabled
                />
              )}

              <TextField
                size="small"
                margin="dense"
                label="ชื่อฟอร์ม"
                fullWidth
                required
                value={formData.zone_name}
                onChange={(e) => {
                  setFormData({ ...formData, zone_name: e.target.value });
                  if (error) setError(false);
                }}
                error={error && !formData.zone_name}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>ยกเลิก</Button>
              <Button variant="contained" color="primary" onClick={handleSave}>
                บันทึก
              </Button>
            </DialogActions>
          </Dialog></>
      )}
    </div>
  );
}
