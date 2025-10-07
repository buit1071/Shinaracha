"use client";

import * as React from "react";
import {
    DataGrid,
    GridColDef,
    GridRenderCellParams
} from "@mui/x-data-grid";
import {
    TextField,
} from "@mui/material";
import { showLoading } from "@/lib/loading";
import { ProjectRow } from "@/interfaces/master";
import { formatDate } from "@/lib/fetcher";
import ProjectJob from "@/components/project-job/ProjectJob";

export default function ReportPage() {
    const DATE_COL_WIDTH = 300; // ปรับได้ตามชอบ
    const [view, setView] = React.useState<null | { type: "detail"; id: string }>(null);
    const openDetail = (id: string) => setView({ type: "detail", id });
    const backToList = () => setView(null);
    const [rows, setRows] = React.useState<ProjectRow[]>([]);
    const [searchText, setSearchText] = React.useState("");

    // โหลดข้อมูลและจัดเรียงใหม่
    const fetchProject = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/project-list");
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
        (async () => {
            showLoading(true);
            try {
                await fetchProject();
            } finally {
                showLoading(false);
            }
        })();
    }, []);

    const columns: GridColDef<ProjectRow>[] = [
        {
            field: "order",
            headerName: "ลำดับ",
            width: 90,
            headerAlign: "center",
            align: "center",
        },
        {
            field: "project_name",
            headerName: "โครงการ",
            flex: 1,            // ← กินพื้นที่ที่เหลือ
            minWidth: 240,      // กันข้อความบีบเกินไป
            headerAlign: "center",
            align: "left",
            renderCell: (params) => (
                <button
                    onClick={(e) => { e.stopPropagation(); openDetail(params.row.project_id); }}
                    className="hover:no-underline text-blue-600 hover:opacity-80 cursor-pointer"
                    title="เปิดรายละเอียด"
                >
                    {params.row.project_name}
                </button>
            ),
        },
        {
            field: "start_date",
            headerName: "วันที่เริ่ม",
            width: DATE_COL_WIDTH, // ← ขนาดตายตัว
            headerAlign: "center",
            align: "center",
            resizable: false,      // ล็อกไม่ให้ลากขยาย
            renderCell: (params) => formatDate(params.row.start_date),
        },
        {
            field: "end_date",
            headerName: "วันที่สิ้นสุด",
            width: DATE_COL_WIDTH, // ← เท่ากับ start_date
            headerAlign: "center",
            align: "center",
            resizable: false,      // ล็อกไม่ให้ลากขยาย
            renderCell: (params) => formatDate(params.row.end_date),
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
        <div className="min-h-[96vh] bg-gray-50 flex flex-col justify-around">
            {view?.type === "detail" ? (
                <ProjectJob projectId={view.id} onBack={backToList} />
            ) : (
                <>
                    <div className="h-[6vh] w-full bg-white shadow-md flex items-center justify-between px-4 text-black font-semibold rounded-lg">
                        ข้อมูลโครงการ
                        <div className="flex gap-2 items-center">
                            <TextField
                                size="small"
                                placeholder="ค้นหา..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                        </div>
                    </div>

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
                            getRowId={(row) => row.project_id}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
