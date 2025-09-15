export interface ProjectRow {
    project_id: string;
    project_name: string;
    project_description: string;
    customer_id: string;
    customer_name?: string;
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
    emp_id: string;
    first_name: string;
    last_name: string;
    username: string;
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
    equipment_name: string;
    description: string;
    image_limit?: number;
    is_active: number;
    created_by: string;
    updated_by: string;
    created_date?: string;
    updated_date?: string;
    order?: number;
};
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
    team_id: string;
    team_name?: string;
    status_id?: string;
    customer_id: string;
    customer_name?: string;
    branch_id: string;
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
    branch_id: string;
    branch_name: string;
    cus_cost_centre: string;
    store_no: string;
    customer_format: string;
    customer_area: string;
    customer_hub: string;
    branch_tel: string;
    contact_person_id: string;
    address: string;
    customer_regional: string;
    customer_province: string;
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
    customer_id: string;
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
    branch_id: string;
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
    branch_id: string;
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
    service_inspec_id: string;
    equipment_id: string;
    equipment_name?: string;
    is_active: number;
    created_by: string;
    updated_by: string;
    created_date?: string;
    updated_date?: string;
    order?: number;
}
export interface SelectForm {
    branch_id: string;
    service_inspec_id: string;
    service_id: string;
    zone_id: string;
    zone_name?: string;
    is_active: number;
    created_by: string;
    updated_by: string;
    created_date?: string;
    updated_date?: string;
    order?: number;
}
