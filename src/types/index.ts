// User types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  is_superuser: boolean;
  cafe_manager?: boolean;
  staff_profile?: Staff;
}

export interface Floor {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  table_count?: number;
  rooms?: Room[];
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  staff_count?: number;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  department: number;
  department_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Staff {
  id: number;
  employee_id: string;
  user: User;
  first_name: string;
  last_name: string;
  full_name?: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  department: Department;
  role: Role;
  hire_date: string;
  salary: number;
  employment_status: 'active' | 'inactive' | 'terminated' | 'on_leave';
  is_active: boolean;
  profile_picture?: string;
  profile_picture_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: number;
  staff: Staff;
  date: string;
  check_in_time?: string;
  check_out_time?: string;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'leave';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Leave {
  id: number;
  staff: Staff;
  leave_type: 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'other';
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_by?: Staff;
  approved_at?: string;
  notes?: string;
  duration_days?: number;
  created_at: string;
  updated_at: string;
}

export interface Table {
  id: number;
  table_number: string;
  table_name?: string;
  capacity: number;
  is_active: boolean;
  qr_code?: string;
  qr_code_url?: string;
  qr_unique_id: string;
  created_at: string;
  visual_x?: number;
  visual_y?: number;
  floor: number;
  floor_name?: string;
  room?: number;
  room_name?: string;
  has_active_order?: boolean;
  shape?: 'circle' | 'rectangle';
  width?: number;
  height?: number;
  radius?: number;
}

export interface Room {
  id: number;
  room_number: string;
  room_name?: string;
  room_type: string;
  floor: number;
  floor_name?: string;
  capacity: number;
  price_per_night: number;
  is_active: boolean;
  room_status: string;
  qr_code?: string;
  qr_code_url?: string;
  qr_unique_id: string;
  description?: string;
  amenities?: string;
  created_at: string;
  updated_at: string;
  has_active_order?: boolean;
  tables?: Table[];
}

// Menu item types
export interface MenuItem {
  id: number;
  name: string;
  category: string;
  description: string;
  image?: string;
  image_url?: string;
  price: string;
  list_order: number;
  is_available: boolean;
}

// Order types
export interface Order {
  id: number;
  name: string;
  phone: string;
  table: string;
  price: string;
  status: string;
  estimated_time: number;
  created_at: string;
  updated_at: string;
  special_instructions?: string;
  items_json: string;
  table_unique_id?: string;
  room_unique_id?: string;
  order_type: 'table' | 'room';
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'cancelled';

// Rating types
export interface Rating {
  id: number;
  user_name?: string;
  comment: string;
  created_at: string;
  updated_at: string;
}

// Bill types
export interface Bill {
  id: number;
  order_items: Record<string, [number, string]>; // [quantity, total_price]
  name: string;
  bill_total: string;
  phone: string;
  bill_time: string;
  table_number?: string;
}

// Cart types
export interface CartItem {
  id: number;
  menu_item_id: number;
  quantity: number;
  name: string;
  price: string;
}

export interface Cart {
  [itemId: string]: CartItem;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface SignupRequest {
  phone: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface OrderRequest {
  items: Array<{
    menu_item: number;
    quantity: number;
    price: string;
  }>;
  table_unique_id?: string;
  special_instructions?: string;
  total_amount: string;
}

export interface DashboardStats {
  total_revenue: string;
  total_orders: number;
  total_menu_items: number;
  total_tables: number;
  total_staff: number;
  pending_orders: number;
  average_order_value: string;
  recent_orders: Order[];
  popular_items: MenuItem[];
}

// Auth context types
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  signup: (userData: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
}
