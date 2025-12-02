import axios, { AxiosResponse } from 'axios';
import {
  User,
  MenuItem,
  Table,
  Room,
  Floor,
  Department,
  Role,
  Staff,
  Attendance,
  Leave,
  Order,
  Rating,
  Bill,
  SignupRequest,
  OrderRequest,
  DashboardStats
} from '../types';

// Configure axios base URL from environment variables or current host.
// When accessing via LAN IP (192.168.x.x), we want the backend to use the
// same host so that session cookies line up.
const backendUrlFromEnv = import.meta.env.VITE_BACKEND_URL;
const frontendHost =
  typeof window !== 'undefined' && window.location?.hostname
    ? window.location.hostname
    : 'localhost';

// Only trust VITE_BACKEND_URL when we're running on localhost;
// for LAN access, always use the current host on port 8000.
const shouldUseEnvBackend =
  backendUrlFromEnv &&
  (frontendHost === 'localhost' || frontendHost === '127.0.0.1');

const backendUrlFallback = `http://${frontendHost}:8000`;
const backendUrl = (shouldUseEnvBackend ? backendUrlFromEnv : backendUrlFallback).replace(
  '0.0.0.0',
  'localhost'
);

axios.defaults.baseURL = backendUrl;
axios.defaults.withCredentials = true;
axios.defaults.timeout = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000');

// Interceptor to remove restaurant headers from auth endpoints
axios.interceptors.request.use((config) => {
  // Remove restaurant headers for auth endpoints
  const authEndpoints = ['/api/auth/login/', '/api/auth/signup/', '/api/auth/logout/', '/api/auth/current_user/'];
  const isAuthEndpoint = authEndpoints.some(endpoint => config.url?.includes(endpoint));
  
  if (isAuthEndpoint && config.headers) {
    // Remove restaurant headers for auth requests
    delete config.headers['X-Restaurant-Id'];
    delete config.headers['X-Restaurant-Slug'];
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// API service class
class ApiService {
  private restaurantId: number | null = null;
  private restaurantSlug: string | null = null;

  // Restaurant context management
  setRestaurantContext(restaurantId: number | null): void {
    this.restaurantId = restaurantId;
    // Update axios headers for all subsequent requests
    // Only set header if we have a valid restaurant ID (not 0 or null)
    if (restaurantId && restaurantId > 0) {
      axios.defaults.headers.common['X-Restaurant-Id'] = restaurantId.toString();
    } else {
      // Remove header if restaurant ID is invalid
      if ('X-Restaurant-Id' in axios.defaults.headers.common) {
        delete axios.defaults.headers.common['X-Restaurant-Id'];
      }
    }
  }

  setRestaurantSlug(slug: string | null): void {
    this.restaurantSlug = slug;
    // Update axios headers
    // Only set header if we have a valid slug (not empty string)
    if (slug && slug.trim() !== '') {
      axios.defaults.headers.common['X-Restaurant-Slug'] = slug;
    } else {
      // Remove header if slug is invalid
      if ('X-Restaurant-Slug' in axios.defaults.headers.common) {
        delete axios.defaults.headers.common['X-Restaurant-Slug'];
      }
    }
  }

  getRestaurantContext(): { restaurant_id?: number; restaurant_slug?: string } {
    const context: { restaurant_id?: number; restaurant_slug?: string } = {};
    if (this.restaurantId) {
      context.restaurant_id = this.restaurantId;
    }
    if (this.restaurantSlug) {
      context.restaurant_slug = this.restaurantSlug;
    }
    return context;
  }

  // Restaurant endpoints
  async getRestaurants(): Promise<any[]> {
    const response: AxiosResponse<any[]> = await axios.get('/api/restaurants/');
    return response.data;
  }

  async getRestaurant(restaurantId: number): Promise<any> {
    const response: AxiosResponse<any> = await axios.get(`/api/restaurants/${restaurantId}/`);
    return response.data;
  }

  async createRestaurant(restaurantData: any): Promise<any> {
    const response: AxiosResponse<any> = await axios.post('/api/restaurants/', restaurantData);
    return response.data;
  }

  async updateRestaurant(restaurantId: number, restaurantData: any): Promise<any> {
    const response: AxiosResponse<any> = await axios.put(`/api/restaurants/${restaurantId}/`, restaurantData);
    return response.data;
  }

  async deleteRestaurant(restaurantId: number): Promise<void> {
    await axios.delete(`/api/restaurants/${restaurantId}/`);
  }

  async activateRestaurant(restaurantId: number): Promise<any> {
    const response: AxiosResponse<any> = await axios.post(`/api/restaurants/${restaurantId}/activate/`);
    return response.data;
  }

  // Super Admin endpoints
  async getSuperAdminDashboard(): Promise<any> {
    const response: AxiosResponse<any> = await axios.get('/api/super-admin/dashboard/');
    return response.data;
  }

  async getCrossRestaurantAnalytics(): Promise<any> {
    const response: AxiosResponse<any> = await axios.get('/api/super-admin/analytics/');
    return response.data;
  }

  // Auth endpoints
  async login(phone: string, password: string, restaurantSlug?: string): Promise<User> {
    const data: any = { phone, password };
    if (restaurantSlug) {
      data.restaurant_slug = restaurantSlug;
    }
    const response: AxiosResponse<User> = await axios.post('/api/auth/login/', data);
    return response.data;
  }

  async signup(userData: SignupRequest): Promise<User> {
    const response: AxiosResponse<User> = await axios.post('/api/auth/signup/', userData);
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await axios.post('/api/auth/logout/');
    } catch (error) {
      // Even if logout fails on server, we should clear local state
      console.log('Logout completed');
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response: AxiosResponse<User | { user: null }> = await axios.get('/api/auth/current_user/');
      // Handle both response formats: User object or {user: null}
      if (response.data && 'user' in response.data && response.data.user === null) {
        return null;
      }
      // If response.data has user properties, it's a User object
      if (response.data && ('id' in response.data || 'phone' in response.data)) {
        return response.data as User;
      }
      return null;
    } catch (error: any) {
      // If 401 or 403, user is not authenticated
      if (error.response?.status === 401 || error.response?.status === 403) {
        return null;
      }
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Staff login
  async staffLogin(phone: string, password: string): Promise<any> {
    console.log('Staff login attempt:', { phone, password });
    console.log('Backend URL:', axios.defaults.baseURL);
    const response: AxiosResponse = await axios.post('/api/auth/staff_login/', { phone, password });
    console.log('Staff login response:', response.data);
    return response.data;
  }

  // Menu endpoints
  async getMenuItems(): Promise<MenuItem[]> {
    const context = this.getRestaurantContext();
    const params = new URLSearchParams();
    if (context.restaurant_id) params.append('restaurant_id', context.restaurant_id.toString());
    if (context.restaurant_slug) params.append('restaurant_slug', context.restaurant_slug);
    
    const url = `/api/menu/${params.toString() ? '?' + params.toString() : ''}`;
    const response: AxiosResponse<MenuItem[]> = await axios.get(url);
    return response.data;
  }

  async createMenuItem(menuData: Partial<MenuItem>): Promise<MenuItem> {
    // Ensure price is sent as a number (backend expects decimal)
    const payload = {
      ...menuData,
      price: menuData.price !== undefined ? Number(menuData.price) : undefined,
    };
    const response: AxiosResponse<MenuItem> = await axios.post('/api/menu/', payload);
    return response.data;
  }

  async updateMenuItem(menuId: number, menuData: Partial<MenuItem>): Promise<MenuItem> {
    const payload = {
      ...menuData,
      price: menuData.price !== undefined ? Number(menuData.price) : undefined,
    };
    const response: AxiosResponse<MenuItem> = await axios.put(`/api/menu/${menuId}/`, payload);
    return response.data;
  }

  async deleteMenuItem(menuId: number): Promise<void> {
    await axios.delete(`/api/menu/${menuId}/`);
  }

  // Table endpoints
  async getTables(): Promise<Table[]> {
    const context = this.getRestaurantContext();
    const params = new URLSearchParams();
    if (context.restaurant_id) params.append('restaurant_id', context.restaurant_id.toString());
    if (context.restaurant_slug) params.append('restaurant_slug', context.restaurant_slug);
    
    const url = `/api/tables/${params.toString() ? '?' + params.toString() : ''}`;
    const response: AxiosResponse<Table[]> = await axios.get(url);
    return response.data;
  }

  async createTable(tableData: Partial<Table>): Promise<Table> {
    const response: AxiosResponse<Table> = await axios.post('/api/tables/', tableData);
    return response.data;
  }

  async deleteTable(tableId: number): Promise<void> {
    await axios.delete(`/api/tables/${tableId}/`);
  }

  async regenerateQR(tableId: number): Promise<Table> {
    const response: AxiosResponse<Table> = await axios.post(`/api/tables/${tableId}/regenerate_qr/`);
    return response.data;
  }

  async updateTablePosition(tableId: number, x: number, y: number): Promise<Table> {
    const response: AxiosResponse<Table> = await axios.post(`/api/tables/${tableId}/update_position/`, { x, y });
    return response.data;
  }

  // Order endpoints
  async getOrders(): Promise<Order[]> {
    // Restaurant context is set via headers (X-Restaurant-Id and X-Restaurant-Slug)
    // The backend middleware will extract these headers
    const response: AxiosResponse<Order[]> = await axios.get('/api/orders/');
    return response.data;
  }

  async getOrdersByTable(tableNumber: string): Promise<Order[]> {
    const response: AxiosResponse<Order[]> = await axios.get(`/api/orders/by_table/?table=${tableNumber}`);
    return response.data;
  }

  async getOrdersByTableUniqueId(tableUniqueId: string): Promise<Order[]> {
    const response: AxiosResponse<Order[]> = await axios.get(`/api/orders/by_table_unique_id/?table_unique_id=${tableUniqueId}`);
    return response.data;
  }

  async getOrdersByRoomUniqueId(roomUniqueId: string): Promise<Order[]> {
    const response: AxiosResponse<Order[]> = await axios.get(`/api/orders/by_room_unique_id/?room_unique_id=${roomUniqueId}`);
    return response.data;
  }

  async createOrder(orderData: OrderRequest): Promise<Order> {
    const response: AxiosResponse<Order> = await axios.post('/api/orders/', orderData);
    return response.data;
  }

  async getOrder(orderId: number): Promise<Order> {
    const response: AxiosResponse<Order> = await axios.get(`/api/orders/${orderId}/`);
    return response.data;
  }

  async updateOrderStatus(orderId: number, status: string): Promise<Order> {
    try {
      console.log('Updating order status:', { orderId, status });
      // Use the update_status action endpoint
      const response: AxiosResponse<any> = await axios.post(`/api/orders/${orderId}/update_status/`, { status });
      console.log('Order status update response:', response.data);
      
      // Return the order from response if available, otherwise fetch it
      if (response.data.order) {
        return response.data.order;
      }
      
      // Fallback: fetch the updated order
      return await this.getOrder(orderId);
    } catch (error: any) {
      console.error('Error updating order status:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Failed to update order status';
      throw new Error(errorMessage);
    }
  }

  async markOrderPaid(orderId: number, paymentMethod: string = 'cash'): Promise<Order> {
    try {
      const response: AxiosResponse<any> = await axios.post(`/api/orders/${orderId}/mark_paid/`, {
        payment_method: paymentMethod,
      });

      if (response.data.order) {
        return response.data.order;
      }

      return await this.getOrder(orderId);
    } catch (error: any) {
      console.error('Error marking order as paid:', error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.message ||
        'Failed to mark order as paid';
      throw new Error(errorMessage);
    }
  }

  async getUserOrders(): Promise<Order[]> {
    const response: AxiosResponse<Order[]> = await axios.get('/api/orders/my-orders/');
    return response.data;
  }

  // Rating endpoints
  async getRatings(): Promise<Rating[]> {
    const response: AxiosResponse<Rating[]> = await axios.get('/api/ratings/');
    return response.data;
  }

  async createRating(ratingData: { comment: string }): Promise<Rating> {
    const response: AxiosResponse<Rating> = await axios.post('/api/ratings/', ratingData);
    return response.data;
  }

  // Bill endpoints
  async getBills(): Promise<Bill[]> {
    const response: AxiosResponse<Bill[]> = await axios.get('/api/bills/');
    return response.data;
  }

  async getBillsByTable(tableUniqueId: string): Promise<Bill[]> {
    const response: AxiosResponse<Bill[]> = await axios.get(`/api/bills/?table_unique_id=${tableUniqueId}`);
    return response.data;
  }

  async getBillsByRoom(roomUniqueId: string): Promise<Bill[]> {
    const response: AxiosResponse<Bill[]> = await axios.get(`/api/bills/?room_unique_id=${roomUniqueId}`);
    return response.data;
  }

  async clearTable(tableUniqueId?: string, roomUniqueId?: string): Promise<any> {
    const response = await axios.post('/api/orders/clear_table/', {
      table_unique_id: tableUniqueId,
      room_unique_id: roomUniqueId
    });
    return response.data;
  }

  // Dashboard endpoints
  async getDashboardStats(): Promise<DashboardStats> {
    const response: AxiosResponse<DashboardStats> = await axios.get('/api/dashboard/stats/');
    return response.data;
  }

  // Floor endpoints
  async getFloors(): Promise<Floor[]> {
    const response: AxiosResponse<Floor[]> = await axios.get('/api/floors/');
    return response.data;
  }

  async createFloor(floorData: Partial<Floor>): Promise<Floor> {
    const response: AxiosResponse<Floor> = await axios.post('/api/floors/', floorData);
    return response.data;
  }

  async updateFloor(floorId: number, floorData: Partial<Floor>): Promise<Floor> {
    const response: AxiosResponse<Floor> = await axios.put(`/api/floors/${floorId}/`, floorData);
    return response.data;
  }

  async deleteFloor(floorId: number): Promise<void> {
    await axios.delete(`/api/floors/${floorId}/`);
  }

  async getTablesByFloor(floorId: number): Promise<Table[]> {
    const response: AxiosResponse<Table[]> = await axios.get(`/api/tables/by_floor/?floor=${floorId}`);
    return response.data;
  }

  // Room management
  async getRooms(): Promise<Room[]> {
    const response: AxiosResponse<Room[]> = await axios.get('/api/rooms/');
    return response.data;
  }

  async createRoom(roomData: Partial<Room>): Promise<Room> {
    const response: AxiosResponse<Room> = await axios.post('/api/rooms/', roomData);
    return response.data;
  }

  async updateRoom(roomId: number, roomData: Partial<Room>): Promise<Room> {
    const response: AxiosResponse<Room> = await axios.put(`/api/rooms/${roomId}/`, roomData);
    return response.data;
  }

  async deleteRoom(roomId: number): Promise<void> {
    await axios.delete(`/api/rooms/${roomId}/`);
  }

  async getRoomsByFloor(floorId: number): Promise<Room[]> {
    const response: AxiosResponse<Room[]> = await axios.get(`/api/rooms/by_floor/?floor_id=${floorId}`);
    return response.data;
  }

  async getAvailableRooms(): Promise<Room[]> {
    const response: AxiosResponse<Room[]> = await axios.get('/api/rooms/available/');
    return response.data;
  }

  async getOccupiedRooms(): Promise<Room[]> {
    const response: AxiosResponse<Room[]> = await axios.get('/api/rooms/occupied/');
    return response.data;
  }

  // Department endpoints
  async getDepartments(): Promise<Department[]> {
    const response: AxiosResponse<Department[]> = await axios.get('/api/departments/');
    return response.data;
  }

  async createDepartment(departmentData: Partial<Department>): Promise<Department> {
    const response: AxiosResponse<Department> = await axios.post('/api/departments/', departmentData);
    return response.data;
  }

  async updateDepartment(departmentId: number, departmentData: Partial<Department>): Promise<Department> {
    const response: AxiosResponse<Department> = await axios.put(`/api/departments/${departmentId}/`, departmentData);
    return response.data;
  }

  async deleteDepartment(departmentId: number): Promise<void> {
    await axios.delete(`/api/departments/${departmentId}/`);
  }

  // Role endpoints
  async getRoles(): Promise<Role[]> {
    const response: AxiosResponse<Role[]> = await axios.get('/api/roles/');
    return response.data;
  }

  async getRolesByDepartment(departmentId: number): Promise<Role[]> {
    const response: AxiosResponse<Role[]> = await axios.get(`/api/roles/by_department/?department=${departmentId}`);
    return response.data;
  }

  async createRole(roleData: Partial<Role>): Promise<Role> {
    const response: AxiosResponse<Role> = await axios.post('/api/roles/', roleData);
    return response.data;
  }

  async updateRole(roleId: number, roleData: Partial<Role>): Promise<Role> {
    const response: AxiosResponse<Role> = await axios.put(`/api/roles/${roleId}/`, roleData);
    return response.data;
  }

  async deleteRole(roleId: number): Promise<void> {
    await axios.delete(`/api/roles/${roleId}/`);
  }

  // Staff endpoints
  async getStaff(): Promise<Staff[]> {
    const response: AxiosResponse<Staff[]> = await axios.get('/api/staff/');
    return response.data;
  }

  async getActiveStaff(): Promise<Staff[]> {
    const response: AxiosResponse<Staff[]> = await axios.get('/api/staff/active_staff/');
    return response.data;
  }

  async getStaffByDepartment(departmentId: number): Promise<Staff[]> {
    const response: AxiosResponse<Staff[]> = await axios.get(`/api/staff/by_department/?department=${departmentId}`);
    return response.data;
  }

  async createStaff(staffData: any): Promise<Staff> {
    const response: AxiosResponse<Staff> = await axios.post('/api/staff/', staffData);
    return response.data;
  }

  async checkPhoneExists(phone: string): Promise<boolean> {
    try {
      const response: AxiosResponse<{ exists: boolean }> = await axios.get(`/api/staff/check_phone/?phone=${phone}`);
      return response.data.exists;
    } catch (error) {
      // If the endpoint doesn't exist, return false
      return false;
    }
  }

  async updateStaff(staffId: number, staffData: Partial<Staff>): Promise<Staff> {
    const response: AxiosResponse<Staff> = await axios.put(`/api/staff/${staffId}/`, staffData);
    return response.data;
  }

  async deleteStaff(staffId: number): Promise<void> {
    await axios.delete(`/api/staff/${staffId}/`);
  }

  // Attendance endpoints
  async getAttendance(): Promise<Attendance[]> {
    const response: AxiosResponse<Attendance[]> = await axios.get('/api/attendance/');
    return response.data;
  }

  async createAttendance(attendanceData: Partial<Attendance>): Promise<Attendance> {
    const response: AxiosResponse<Attendance> = await axios.post('/api/attendance/', attendanceData);
    return response.data;
  }

  async updateAttendance(attendanceId: number, attendanceData: Partial<Attendance>): Promise<Attendance> {
    const response: AxiosResponse<Attendance> = await axios.put(`/api/attendance/${attendanceId}/`, attendanceData);
    return response.data;
  }

  async deleteAttendance(attendanceId: number): Promise<void> {
    await axios.delete(`/api/attendance/${attendanceId}/`);
  }

  async checkIn(staffId?: number): Promise<Attendance> {
    const data = staffId ? { staff: staffId } : {};
    const response: AxiosResponse<Attendance> = await axios.post('/api/attendance/check_in/', data);
    return response.data;
  }

  async checkOut(staffId?: number): Promise<Attendance> {
    const data = staffId ? { staff: staffId } : {};
    const response: AxiosResponse<Attendance> = await axios.post('/api/attendance/check_out/', data);
    return response.data;
  }

  // Leave endpoints
  async getLeaves(): Promise<Leave[]> {
    const response: AxiosResponse<Leave[]> = await axios.get('/api/leaves/');
    return response.data;
  }

  async createLeave(leaveData: Partial<Leave>): Promise<Leave> {
    const response: AxiosResponse<Leave> = await axios.post('/api/leaves/', leaveData);
    return response.data;
  }

  async updateLeave(leaveId: number, leaveData: Partial<Leave>): Promise<Leave> {
    const response: AxiosResponse<Leave> = await axios.put(`/api/leaves/${leaveId}/`, leaveData);
    return response.data;
  }

  async deleteLeave(leaveId: number): Promise<void> {
    await axios.delete(`/api/leaves/${leaveId}/`);
  }

  async approveLeave(leaveId: number): Promise<Leave> {
    const response: AxiosResponse<Leave> = await axios.post(`/api/leaves/${leaveId}/approve/`);
    return response.data;
  }

  async rejectLeave(leaveId: number): Promise<Leave> {
    const response: AxiosResponse<Leave> = await axios.post(`/api/leaves/${leaveId}/reject/`);
    return response.data;
  }

  // Staff-specific methods
  async getStaffAttendance(staffId: number): Promise<Attendance[]> {
    const response: AxiosResponse<Attendance[]> = await axios.get(`/api/attendance/?staff=${staffId}`);
    return response.data;
  }

  async getStaffLeaves(staffId: number): Promise<Leave[]> {
    const response: AxiosResponse<Leave[]> = await axios.get(`/api/leaves/?staff=${staffId}`);
    return response.data;
  }

  // HR Management API Functions
  async getHRDepartments(): Promise<any[]> {
    const response: AxiosResponse<any[]> = await axios.get('/api/hr-departments/');
    return response.data;
  }

  async createHRDepartment(departmentData: any): Promise<any> {
    const response: AxiosResponse<any> = await axios.post('/api/hr-departments/', departmentData);
    return response.data;
  }

  async updateHRDepartment(departmentId: number, departmentData: any): Promise<any> {
    const response: AxiosResponse<any> = await axios.put(`/api/hr-departments/${departmentId}/`, departmentData);
    return response.data;
  }

  async deleteHRDepartment(departmentId: number): Promise<void> {
    await axios.delete(`/api/hr-departments/${departmentId}/`);
  }

  async getHRPositions(): Promise<any[]> {
    const response: AxiosResponse<any[]> = await axios.get('/api/hr-positions/');
    return response.data;
  }

  async createHRPosition(positionData: any): Promise<any> {
    const response: AxiosResponse<any> = await axios.post('/api/hr-positions/', positionData);
    return response.data;
  }

  async updateHRPosition(positionId: number, positionData: any): Promise<any> {
    const response: AxiosResponse<any> = await axios.put(`/api/hr-positions/${positionId}/`, positionData);
    return response.data;
  }

  async deleteHRPosition(positionId: number): Promise<void> {
    await axios.delete(`/api/hr-positions/${positionId}/`);
  }

  async getEmployees(): Promise<any[]> {
    const response: AxiosResponse<any[]> = await axios.get('/api/employees/');
    return response.data;
  }

  async getActiveEmployees(): Promise<any[]> {
    const response: AxiosResponse<any[]> = await axios.get('/api/employees/active_employees/');
    return response.data;
  }

  async getEmployee(employeeId: number): Promise<any> {
    const response: AxiosResponse<any> = await axios.get(`/api/employees/${employeeId}/`);
    return response.data;
  }

  async createEmployee(employeeData: any): Promise<any> {
    const response: AxiosResponse<any> = await axios.post('/api/employees/', employeeData);
    return response.data;
  }

  async updateEmployee(employeeId: number, employeeData: any): Promise<any> {
    const response: AxiosResponse<any> = await axios.put(`/api/employees/${employeeId}/`, employeeData);
    return response.data;
  }

  async deleteEmployee(employeeId: number): Promise<void> {
    await axios.delete(`/api/employees/${employeeId}/`);
  }

  async getEmployeeDocuments(employeeId: number): Promise<any[]> {
    const response: AxiosResponse<any[]> = await axios.get(`/api/employees/${employeeId}/documents/`);
    return response.data;
  }

  async uploadEmployeeDocument(documentData: FormData): Promise<any> {
    const response: AxiosResponse<any> = await axios.post('/api/employee-documents/', documentData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getPayrolls(): Promise<any[]> {
    const response: AxiosResponse<any[]> = await axios.get('/api/payrolls/');
    return response.data;
  }

  async getPayroll(payrollId: number): Promise<any> {
    const response: AxiosResponse<any> = await axios.get(`/api/payrolls/${payrollId}/`);
    return response.data;
  }

  async createPayroll(payrollData: any): Promise<any> {
    const response: AxiosResponse<any> = await axios.post('/api/payrolls/', payrollData);
    return response.data;
  }

  async updatePayroll(payrollId: number, payrollData: any): Promise<any> {
    const response: AxiosResponse<any> = await axios.put(`/api/payrolls/${payrollId}/`, payrollData);
    return response.data;
  }

  async getMonthlyPayrollSummary(month: number, year: number): Promise<any> {
    const response: AxiosResponse<any> = await axios.get(`/api/payrolls/monthly_summary/?month=${month}&year=${year}`);
    return response.data;
  }

  async getLeaveRequests(): Promise<any[]> {
    const response: AxiosResponse<any[]> = await axios.get('/api/leave-requests/');
    return response.data;
  }

  async getPendingLeaveRequests(): Promise<any[]> {
    const response: AxiosResponse<any[]> = await axios.get('/api/leave-requests/pending_approvals/');
    return response.data;
  }

  async createLeaveRequest(leaveData: any): Promise<any> {
    const response: AxiosResponse<any> = await axios.post('/api/leave-requests/', leaveData);
    return response.data;
  }

  async approveLeaveRequest(leaveId: number): Promise<any> {
    const response: AxiosResponse<any> = await axios.post(`/api/leave-requests/${leaveId}/approve/`);
    return response.data;
  }

  async rejectLeaveRequest(leaveId: number, reason: string): Promise<any> {
    const response: AxiosResponse<any> = await axios.post(`/api/leave-requests/${leaveId}/reject/`, { reason });
    return response.data;
  }

  async getPerformanceReviews(): Promise<any[]> {
    const response: AxiosResponse<any[]> = await axios.get('/api/performance-reviews/');
    return response.data;
  }

  async createPerformanceReview(reviewData: any): Promise<any> {
    const response: AxiosResponse<any> = await axios.post('/api/performance-reviews/', reviewData);
    return response.data;
  }

  async updatePerformanceReview(reviewId: number, reviewData: any): Promise<any> {
    const response: AxiosResponse<any> = await axios.put(`/api/performance-reviews/${reviewId}/`, reviewData);
    return response.data;
  }

  async getOverdueReviews(): Promise<any[]> {
    const response: AxiosResponse<any[]> = await axios.get('/api/performance-reviews/overdue_reviews/');
    return response.data;
  }

  async getTrainings(): Promise<any[]> {
    const response: AxiosResponse<any[]> = await axios.get('/api/trainings/');
    return response.data;
  }

  async getUpcomingTrainings(): Promise<any[]> {
    const response: AxiosResponse<any[]> = await axios.get('/api/trainings/upcoming/');
    return response.data;
  }

  async getOngoingTrainings(): Promise<any[]> {
    const response: AxiosResponse<any[]> = await axios.get('/api/trainings/ongoing/');
    return response.data;
  }

  async createTraining(trainingData: any): Promise<any> {
    const response: AxiosResponse<any> = await axios.post('/api/trainings/', trainingData);
    return response.data;
  }

  async updateTraining(trainingId: number, trainingData: any): Promise<any> {
    const response: AxiosResponse<any> = await axios.put(`/api/trainings/${trainingId}/`, trainingData);
    return response.data;
  }

  async getTrainingEnrollments(): Promise<any[]> {
    const response: AxiosResponse<any[]> = await axios.get('/api/training-enrollments/');
    return response.data;
  }

  async enrollInTraining(enrollmentData: any): Promise<any> {
    const response: AxiosResponse<any> = await axios.post('/api/training-enrollments/', enrollmentData);
    return response.data;
  }

  async completeTraining(enrollmentId: number): Promise<any> {
    const response: AxiosResponse<any> = await axios.post(`/api/training-enrollments/${enrollmentId}/complete/`);
    return response.data;
  }

  async issueCertificate(enrollmentId: number, certificateFile?: File): Promise<any> {
    const formData = new FormData();
    if (certificateFile) {
      formData.append('certificate_file', certificateFile);
    }
    const response: AxiosResponse<any> = await axios.post(`/api/training-enrollments/${enrollmentId}/issue_certificate/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Generic HTTP methods for custom endpoints
  async get(url: string): Promise<AxiosResponse> {
    return await axios.get(url);
  }

  async post(url: string, data?: any): Promise<AxiosResponse> {
    return await axios.post(url, data);
  }

  async put(url: string, data?: any): Promise<AxiosResponse> {
    return await axios.put(url, data);
  }

  async delete(url: string): Promise<AxiosResponse> {
    return await axios.delete(url);
  }
}

export const apiService = new ApiService();
export default apiService;
