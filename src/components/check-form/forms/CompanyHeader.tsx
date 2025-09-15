import * as React from "react";

type Props = {
  companyTh: string;
  companyEn: string;
  logoUrl?: string;
};

export default function CompanyHeader({ companyTh, companyEn, logoUrl }: Props) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-14 h-14 shrink-0 border rounded-md grid place-items-center overflow-hidden bg-white">
        {logoUrl ? (
          <img src={logoUrl} alt="logo" className="w-full h-full object-contain" />
        ) : (
          <span className="text-xs text-gray-400">LOGO</span>
        )}
      </div>
      <div className="leading-tight">
        <div className="text-lg font-semibold text-gray-900">{companyTh}</div>
        <div className="text-sm text-gray-600">{companyEn}</div>
      </div>
    </div>
  );
}
