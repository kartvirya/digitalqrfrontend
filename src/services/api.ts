import axios, { AxiosResponse } from 'axios';
import { BACKEND_URL } from '../config';
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

// Configure axios base URL strictly from environment
const backendUrlFromEnv = BACKEND_URL;
if (!backendUrlFromEnv) {
  // eslint-disable-next-line no-console
  console.error('REACT_APP_BACKEND_URL is not set. Please define it in your frontend .env file.');
}
axios.defaults.baseURL = backendUrlFromEnv;
axios.defaults.withCredentials = true;
axios.defaults.timeout = parseInt(process.env.REACT_APP_API_TIMEOUT || '30000');

// API service class
class ApiService {
  // Auth endpoints
  async login(phone: string, password: string): Promise<User> {
    const response: AxiosResponse<User> = await axios.post('/api/auth/login/', { phone, password });
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
      const response: AxiosResponse<User> = await axios.get('/api/auth/current_user/');
      return response.data;
    } catch (error) {
      return null;
    }
  }

  // Menu endpoints
  async getMenuItems(): Promise<MenuItem[]> {
    const response: AxiosResponse<MenuItem[]> = await axios.get('/api/menu/');
    return response.data;
  }

  async createMenuItem(menuData: Partial<MenuItem>): Promise<MenuItem> {
    const response: AxiosResponse<MenuItem> = await axios.post('/api/menu/', menuData);
    return response.data;
  }

  async updateMenuItem(menuId: number, menuData: Partial<MenuItem>): Promise<MenuItem> {
    const response: AxiosResponse<MenuItem> = await axios.put(`/api/menu/${menuId}/`, menuData);
    return response.data;
  }

  async deleteMenuItem(menuId: number): Promise<void> {
    await axios.delete(`/api/menu/${menuId}/`);
  }

  // Table endpoints
  async getTables(): Promise<Table[]> {
    const response: AxiosResponse<Table[]> = await axios.get('/api/tables/');
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
    const response: AxiosResponse<Order> = await axios.patch(`/api/orders/${orderId}/`, { status });
    return response.data;
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
}

export const apiService = new ApiService();
export default apiService;
