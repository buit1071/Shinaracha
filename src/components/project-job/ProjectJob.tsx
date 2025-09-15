"use client";

import * as React from "react";
import {
    DataGrid,
    GridColDef,
    GridRenderCellParams,
} from "@mui/x-data-grid";
import CheckForm from "@/components/check-form/CheckForm";
import { showLoading } from "@/lib/loading";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import IconButton from "@mui/material/IconButton";
import {
    TextField,
} from "@mui/material";
import { JobsRow } from "@/interfaces/master";

type Props = {
    projectId: string;
    onBack: () => void;
};

export default function ProjectJob({ projectId, onBack }: Props) {
    const [view, setView] = React.useState<null | { type: "detail"; id: string }>(null);
    const backToList = () => setView(null);
    const [projectName, setProjectName] = React.useState<string>("");
    const [searchText, setSearchText] = React.useState("");
    const [rows, setRows] = React.useState<JobsRow[]>([]);

    const openDetail = React.useCallback((jobId: string) => {
        const row = rows.find(r => r.job_id === jobId);
        if (!row) {
            console.warn("job not found:", jobId);
            return;
        }
        setView({ type: "detail", id: row.branch_id });
    }, [rows]);

    const fetchProjectName = async () => {
        try {
            const res = await fetch("/api/auth/project-list/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "projectById", project_id: projectId }),
            });

            const result = await res.json();
            if (result.success && result.data) {
                setProjectName(result.data.project_name);
            }
        } catch (err) {
            console.error("fetch project name error:", err);
        }
    };

    const fetchJobs = async () => {
        showLoading(true);
        try {
            const res = await fetch("/api/auth/job/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ function: "jobById", project_id: projectId }),
            });
            const data = await res.json();
            if (data.success) {
                setRows(data.data || []);
            }
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            showLoading(false);
        }
    };

    React.useEffect(() => {
        if (!projectId) return;
        fetchProjectName();
        fetchJobs();
    }, [projectId]);

    const columns: GridColDef<JobsRow>[] = [
        { field: "order", headerName: "ลำดับ", width: 90, headerAlign: "center", align: "center" },
        {
            field: "job_name", headerName: "งาน", flex: 1, headerAlign: "center", align: "left",
            renderCell: (params: GridRenderCellParams<JobsRow>) => (
                <button
                    onClick={() => openDetail(params.row.job_id)}
                    className="hover:no-underline text-blue-600 hover:opacity-80 cursor-pointer"
                    title="เปิดรายละเอียด"
                >
                    {params.row.job_name}
                </button>
            ),
        },
        { field: "team_name", headerName: "ทีม", flex: 1, headerAlign: "center", align: "left" },
        { field: "branch_name", headerName: "สถานที่", flex: 1, headerAlign: "center", align: "left" },
        {
            field: "status_name",
            headerName: "สถานะ",
            flex: 1,
            headerAlign: "center",
            align: "center",
            renderCell: ({ value }) => (value && String(value).trim() ? value : "-"),
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
        <div className="w-full h-[96vh] flex flex-col bg-gray-50 justify-around">
            {view?.type === "detail" ? (
                <>
                    <CheckForm branchId={view.id} onBack={backToList} />
                </>
            ) : (
                <>
                    <div className="h-[6vh] flex items-center justify-between px-4 py-2 bg-white shadow-md mb-2 rounded-lg">
                        <div className="flex items-center">
                            <IconButton onClick={onBack} color="primary">
                                <ArrowBackIcon />
                            </IconButton>
                            <h2 className="text-xl font-bold text-gray-800 ml-5">
                                โครงการ : <span className="text-blue-900">{projectName}</span>
                            </h2>
                        </div>
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
                                "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": { outline: "none" },
                            }}
                            rows={filteredRows}
                            columns={columns}
                            initialState={{ pagination: { paginationModel: { pageSize: 5, page: 0 } } }}
                            pageSizeOptions={[5, 10, 15]}
                            disableRowSelectionOnClick
                            getRowId={(row) => row.job_id}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
