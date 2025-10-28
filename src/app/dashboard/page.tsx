"use client";

import * as React from "react";

import { showLoading } from "@/lib/loading";
import { ProjectRow, JobsRow, CustomerBranchRow } from "@/interfaces/master";

export default function DashboardPage() {
  const [projects, setProjects] = React.useState<ProjectRow[]>([]);
  const [jobs, setJobs] = React.useState<JobsRow[]>([]);
  const [customers, setCustomers] = React.useState<CustomerBranchRow[]>([]);
  const [time, setTime] = React.useState(new Date());
  React.useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const dateStr = time.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = time.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const fetchProject = async () => {
    try {
      const res = await fetch("/api/auth/project-list");
      const data = await res.json();
      if (data.success) setProjects(data.data || []);
    } catch (err) {
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/auth/job/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ function: "job" }),
      });
      const data = await res.json();
      if (data.success) {
        setJobs(data.data || []);
      }
    } catch (err) {
    }
  };

  const fetchCustomerBranch = async () => {
    try {
      const res = await fetch("/api/auth/customer/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ function: "customerBranch" }),
      });

      const result = await res.json();
      if (result.success && result.data) {
        setCustomers(result.data || []);
      }
    } catch (err) {
    }
  };

  React.useEffect(() => {
    const fetchAll = async () => {
      showLoading(true);
      await fetchProject();
      await fetchJobs();
      await fetchCustomerBranch();
      showLoading(false);
    };

    fetchAll();
  }, []);

  return (
    <div className="w-full flex flex-col bg-gray-50">
      <div className="mx-auto flex justify-between items-center mb-3 
      w-full h-[70px] border border-gray-200 shadow-md rounded-lg 
      px-6 bg-white/90 backdrop-blur-sm">
        <h1 className="text-2xl font-bold text-gray-800">
          Dashboard
        </h1>
        <div className="text-right text-gray-500 text-l font-bold">
          <div className="flex items-center justify-end gap-2">
            <span>{dateStr}</span>
            <CalendarIcon className="h-4 w-4 opacity-70" aria-hidden="true" />
          </div>
          <div className="flex items-center justify-end gap-2">
            <span className="font-medium">{timeStr}</span>
            <ClockIcon className="h-4 w-4 opacity-70" aria-hidden="true" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="โครงการทั้งหมด"
          value={projects.length.toString()}
          unit="โครงการ"
          gradient="from-sky-500 to-blue-600"
          Icon={FolderIcon}
        />
        <StatsCard
          title="งานทั้งหมด"
          value={jobs.length.toString()}
          unit="งาน"
          gradient="from-amber-400 to-yellow-600"
          Icon={ClipboardIcon}
        />
        <StatsCard
          title="ลูกค้าทั้งหมด"
          value={customers.length.toString()}
          unit="สาขา"
          gradient="from-emerald-500 to-green-600"
          Icon={UserGroupIcon}
        />
      </div>
    </div>
  );
}

/* -------------------- Components -------------------- */
type CardProps = {
  title: string;
  value: string;
  unit?: string;
  gradient: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
};

function StatsCard({ title, value, unit, gradient, Icon }: CardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 text-white 
        bg-gradient-to-tr ${gradient} shadow-lg transition-transform 
        hover:scale-[1.02] duration-200`}
    >
      {/* Icon */}
      <div className="absolute right-5 top-5 opacity-90">
        <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur grid place-items-center">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-1">
        <div className="text-xl text-white/90">{title}</div>
        <div className="text-3xl font-bold">{value}</div>
        {unit && <div className="text-l text-white/80">{unit}</div>}
      </div>

      {/* Soft light */}
      <div className="pointer-events-none absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
    </div>
  );
}

/* -------------------- Icons -------------------- */
const FolderIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <path
      d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"
      strokeWidth="1.8"
    />
  </svg>
);

const ClipboardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <rect x="8" y="2" width="8" height="4" rx="1" strokeWidth="1.8" />
    <path
      d="M9 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-4"
      strokeWidth="1.8"
    />
  </svg>
);

const UserGroupIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <path d="M16 11a4 4 0 1 0-8 0" strokeWidth="1.8" />
    <path d="M3 21a7 7 0 0 1 18 0" strokeWidth="1.8" />
    <path d="M17 5a3 3 0 1 1 0 6" strokeWidth="1.8" />
    <path d="M21 21a6 6 0 0 0-7-5.8" strokeWidth="1.8" />
  </svg>
);

const CalendarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <rect x="3" y="4" width="18" height="17" rx="2" strokeWidth="1.8" />
    <path d="M8 2v4M16 2v4M3 9h18" strokeWidth="1.8" />
    <path d="M7.5 13.5h3m3 0h3m-9 4h3m3 0h3" strokeWidth="1.8" />
  </svg>
);

const ClockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
    <path d="M12 7v5l3 2" strokeWidth="1.8" />
  </svg>
);