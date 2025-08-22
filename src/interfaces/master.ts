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
    service_id: string;
    service_name?: string;
    system_zone_id: string;
    system_zone_name?: string;
    image_limit?: number;
    is_active: number;
    created_by: string;
    updated_by: string;
    created_date?: string;
    updated_date?: string;
    order?: number;
};
export interface SystemZonesRow {
    system_zone_id: string;
    system_zone_name: string;
    is_active: number;
    created_by: string;
    updated_by: string;
    created_date?: string;
    updated_date?: string;
    order?: number;
};