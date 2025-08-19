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
