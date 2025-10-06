export interface CurrentUser {
  emp_id: string;
  company_id: string;
  first_name_th: string;
  first_name_en: string;
  last_name_th: string;
  last_name_en: string;
  email: string;
  permission_id: string;
  permission_name?: string;
  image_url?: string;
  role?: string;        // ใส่เพิ่มเผื่อ JWT role
}

export interface ProjectRow {
    project_id: string;
    project_name: string;
    project_description: string;
    start_date: string;
    end_date: string;
    is_active: number;
    created_by: string;
    updated_by: string;
    created_date?: string;
    updated_date?: string;
    order?: number;
}
export interface CustomerRow {
    customer_id: string;
    customer_name: string;
    service_id: string,
    service_name?: string,
    zone_id: string,
    zone_name?: string,
    is_active: number;
    created_by: string;
    updated_by: string;
    created_date?: string;
    updated_date?: string;
    order?: number;
}
export interface ServiceRow {
    service_id: string;
    service_name: string;
    inspection_duration?: number;
    inspections_per_year?: number;
    is_active: number;
    created_by: string;
    updated_by: string;
    created_date?: string;
    updated_date?: string;
    order?: number;
}
export interface ZoneRow {
    zone_id: string;
    zone_name: string;
    is_active: number;
    created_by: string;
    updated_by: string;
    created_date?: string;
    updated_date?: string;
    order?: number;
}
export interface EmployeeRow {
    image_url: string;
    emp_id: string;
    company_id: string;
    first_name_th: string;
    first_name_en: string;
    last_name_th: string;
    last_name_en: string;
    email: string;
    password: string;
    confirm_password?: string;
    permission_id: string;
    permission_name?: string;
    is_active: number;
    created_by: string;
    updated_by: string;
    created_date?: string;
    updated_date?: string;
    order?: number;
}
export interface CompanyRow {
    company_id: string;
    company_name_th: string;
    company_name_en: string;
    description: string;
    is_active: number;
    created_by: string;
    updated_by: string;
    created_date?: string;
    updated_date?: string;
    order?: number;
}
export interface EmpStatusRow {
    status_id: string;
    status_name: string;
    is_active: number;
    created_by: string;
    updated_by: string;
    created_date?: string;
    updated_date?: string;
    order?: number;
}
export interface PermissionRow {
    permission_id: string;
    permission_name?: string;
    is_active: number;
    created_by: string;
    updated_by: string;
    created_date?: string;
    updated_date?: string;
    menu_ids?: string[];
    order?: number;
};
export interface TeamRow {
    team_id: string;
    team_name: string;
    username: string;
    password: string;
    confirm_password?: string;
    uuid: string;
    zone_id: string;
    zone_name?: string;
    is_active: number;
    created_by: string;
    updated_by: string;
    created_date?: string;
    updated_date?: string;
    order?: number;
};
export interface EquipmentRow {
    equipment_id: string;
    equipment_code: string;
    equipment_name: string;
    description: string;
    service_id: string;
    service_name?: string;
    zone_id: string;
    zone_name?: string;
    image_limit?: number;
    // ---------------- ที่อยู่สถานที่ติดตั้ง ----------------
    address_no: string;        // เลขที่
    moo: string;               // หมู่
    alley: string;             // ตรอก/ซอย
    road: string;              // ถนน
    sub_district_id: string;    // ตำบล/แขวง (id)
    district_id: string;       // อำเภอ/เขต (id)
    province_id: string;       // จังหวัด (id)
    zipcode: string;           // รหัสไปรษณีย์
    phone: string;             // โทรศัพท์
    fax: string;               // โทรสาร
    // -------- เจ้าของ/ผู้ครอบครอง & ผู้ออกแบบโครงสร้าง --------
    owner_name: string;            // ชื่อ
    owner_address_no: string;      // เลขที่
    owner_moo: string;             // หมู่ที่
    owner_alley: string;           // ตรอก/ซอย
    owner_road: string;            // ถนน
    owner_province_id: string;     // จังหวัด (id)
    owner_district_id: string;     // อำเภอ/เขต (id)
    owner_sub_district_id: string;  // ตำบล/แขวง (id)
    owner_zipcode: string;         // รหัสไปรษณีย์
    // ข้อมูลติดต่อเจ้าของ
    owner_phone: string;       // โทรศัพท์
    owner_fax: string;         // โทรสาร
    owner_email: string;       // อีเมล
    // ผู้ออกแบบด้านวิศวกรรมโครงสร้าง
    designer_name: string;         // ชื่อผู้ออกแบบ
    designer_license_no: string;   // ใบอนุญาตทะเบียนเลขที่

    is_active: number;
    created_by: string;
    updated_by: string;
    created_date?: string;
    updated_date?: string;
    order?: number;
}
export interface DataZonesRow {
    service_id: string;
    zone_id: string;
    zone_name: string;
    is_active: number;
    created_by: string;
    updated_by: string;
    created_date?: string;
    updated_date?: string;
    order?: number;
};
export interface HolidayRow {
    holiday_id: string;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    is_active: number;
    created_by: string;
    updated_by: string;
    created_date?: string;
    updated_date?: string;
    order?: number;
};
export interface MenuRow {
    menu_id: string;
    menu_name: string;
    group_id: number;
    seq: number;
    is_active: number;
    created_by: string;
    updated_by: string;
    created_date?: string;
    updated_date?: string;
    order?: number;
};
export interface InspectGroupRow {
    zone_id: string;
    inspect_id: string;
    inspect_name: string;
    is_active: number;
    created_by: string;
    updated_by: string;
    created_date?: string;
    updated_date?: string;
    order?: number;
};
export interface InspectItemsRow {
    inspect_id: string;
    inspect_item_id: string;
    inspect_item_name: string;
    is_active: number;
    created_by: string;
    updated_by: string;
    created_date?: string;
    updated_date?: string;
    order?: number;
};
export interface JobsRow {
    job_id: string;
    job_name: string;
    project_id: string;
    project_name?: string;
    shift_next_jobs: number;
    job_start_date: string;
    job_end_date: string;
    job_start_time: string;
    job_end_time: string;
    start_date?: string;
    end_date?: string;
    team_id: string;
    team_name?: string;
    status_id?: string;
    customer_id: string;
    customer_name?: string;
    branch_name?: string;
    status_name?: string;
    is_active: number;
    created_by: string;
    updated_by: string;
    created_date?: string;
    updated_date?: string;
    order?: number;
}
export interface JobStatusRow {
    status_id: string;
    status_name: string;
    is_active: number;
    created_by: string;
    updated_by: string;
    created_date?: string;
    updated_date?: string;
    order?: number;
}
export interface CustomerBranchRow {
    customer_id: string;
    branch_name: string;
    cus_cost_centre: string;
    store_no: string;
    customer_area: string;
    customer_hub: string;
    branch_tel: string;
    contact_person_id: string;
    address: string;
    group_id: string;
    latitude: string;
    longitude: string;
    is_active: number;
    created_by: string;
    updated_by: string;
    created_date?: string;
    updated_date?: string;
    order?: number;
}
export interface CustomerGroupRow {
    group_id: string;
    group_name: string;
    is_active: number;
    created_by: string;
    updated_by: string;
    created_date?: string;
    updated_date?: string;
    order?: number;
}
// รายการย่อยภายใน inspection
export interface InspectionItem {
    inspection_item_id: string;
    inspection_item_name: string;
    order?: number;
    is_active?: number;
    created_by?: string;
    updated_by?: string;
    created_date?: string;
    updated_date?: string;
}
export interface InspectionGroup {
    inspection_id: string;
    inspection_name: string;
    order?: number;
    is_active?: number;
    created_by?: string;
    updated_by?: string;
    created_date?: string;
    updated_date?: string;

    items: InspectionItem[];
}
export interface ServiceEquipmentRow {
    service_inspec_id: string;
    service_id: string;
    service_name?: string;
    zone_id: string;
    zone_name?: string;
    is_active: number;
    created_by: string;
    updated_by: string;
    created_date?: string;
    updated_date?: string;
    order?: number;

    inspection: InspectionGroup[];
}
export interface ContactRow {
    customer_id: string;
    contact_id: string;
    name: string;
    email: string;
    tel: string;
    is_active: number;
    created_by: string;
    updated_by: string;
    created_date?: string;
    updated_date?: string;
    order?: number;
}
export interface EquipmentBranchRow {
    row_id: string;
    job_id: string;
    equipment_id: string;
    equipment_name?: string;
    is_active: number;
    created_by: string;
    updated_by: string;
    created_date?: string;
    updated_date?: string;
    order?: number;
}
// ค่าร่วมของ master ทุกตาราง
export interface MasterBase {
    is_active: number;          // 1 = ใช้งาน, 0 = ปิดใช้งาน
    created_by: string;
    updated_by: string;
    created_date?: string;      // ISO string จาก DB
    updated_date?: string;      // ISO string จาก DB
    order?: number;
}
/** จังหวัด */
export interface MasterProvinceRow extends MasterBase {
    id: number;                 // PK (INT)
    province_id: string;        // รหัสจังหวัดแบบสตริง (เช่น '10', '11' หรือ 'PROV-01' ตามที่ใช้จริง)
    name_th: string;
    name_en?: string;
}
/** อำเภอ/เขต */
export interface MasterDistrictRow extends MasterBase {
    id: number;                 // PK (INT)
    province_id: string;        // อ้างจังหวัดด้วย province_id (string)
    district_id: string;        // รหัสอำเภอ/เขตแบบสตริง (เช่น 'DIS-01')
    name_th: string;
    name_en?: string;
}
/** ตำบล/แขวง */
export interface MasterSubdistrictRow extends MasterBase {
    id: number;                 // PK (INT)
    district_id: string;        // อ้างอำเภอ/เขตด้วย district_id (string)
    sub_district_id: string;    // รหัสตำบล/แขวงแบบสตริง (เช่น 'SDIS-01')
    name_th: string;
    name_en?: string;
    post_code?: string;         // ถ้าเก็บในตารางนี้ (บางระบบแยกเป็นตาราง postcodes)
}

export interface ViewDataForm {
    data_id: number;

    job_id: string;
    row_id: string;
    equipment_id: string;

    equipment_name: string;
    image_limit: number;
    description: string | null;

    equipment_code: string;
    service_id: string;
    zone_id: string;

    address_no: string;
    moo: string;
    alley: string;
    road: string;

    sub_district_id: string;
    district_id: string;
    province_id: string;
    zipcode: string;

    phone: string;
    fax: string;

    owner_name: string;
    owner_address_no: string;
    owner_moo: string;
    owner_alley: string;
    owner_road: string;
    owner_province_id: string;
    owner_district_id: string;
    owner_sub_district_id: string;
    owner_zipcode: string;
    owner_phone: string;
    owner_fax: string;
    owner_email: string;

    designer_name: string;
    designer_license_no: string;

    /** Thai names from master tables (may be null if not matched) */
    sub_district_name_th: string | null;
    district_name_th: string | null;
    province_name_th: string | null;

    owner_sub_district_name_th: string | null;
    owner_district_name_th: string | null;
    owner_province_name_th: string | null;
}
