import { localDataStore } from "./localDataStore";

export const handleMockApiRequest = async (method, endpoint, payloadOrParams = {}) => {
  const [cleanEndpoint, queryString] = (endpoint || "").split("?");
  const queryParams = new URLSearchParams(queryString || "");

  // Merge params if passed
  if (method === "GET" && typeof payloadOrParams === "object" && !Array.isArray(payloadOrParams)) {
    Object.entries(payloadOrParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null) queryParams.set(k, String(v));
    });
  }

  // Small delay for natural feel
  await new Promise((r) => setTimeout(r, 60));

  // ==========================================
  // CUSTOMERS
  // ==========================================
  if (cleanEndpoint === "/api/customers/getall") {
    return { data: { customers: localDataStore.getCustomers() } };
  }

  if (cleanEndpoint === "/api/customers/get/pagination") {
    const all = localDataStore.getCustomers();
    const page = parseInt(queryParams.get("page") || "1", 10);
    const limit = parseInt(queryParams.get("limit") || "10", 10);
    const start = (page - 1) * limit;
    const paged = all.slice(start, start + limit);
    return {
      data: {
        customers: paged,
        totalPages: Math.max(1, Math.ceil(all.length / limit)),
        totalItems: all.length,
        currentPage: page,
      },
    };
  }

  if (cleanEndpoint.startsWith("/api/customers/get/")) {
    const id = cleanEndpoint.replace("/api/customers/get/", "").trim();
    const customer = localDataStore.getCustomerById(id);
    if (!customer) {
      throw { response: { status: 404, data: { message: "Customer not found" } } };
    }
    return { data: { customer, totalCars: customer.totalCars } };
  }

  if (cleanEndpoint === "/api/customers/create") {
    const created = localDataStore.createCustomer(payloadOrParams);
    return { success: true, message: "Customer created successfully", data: { customer: created } };
  }

  if (cleanEndpoint.startsWith("/api/customers/update/")) {
    const id = cleanEndpoint.replace("/api/customers/update/", "").trim();
    const updated = localDataStore.updateCustomer(id, payloadOrParams);
    return { success: true, message: "Customer updated successfully", data: { customer: updated } };
  }

  if (cleanEndpoint.startsWith("/api/customers/delete/")) {
    const id = cleanEndpoint.replace("/api/customers/delete/", "").trim();
    localDataStore.deleteCustomer(id);
    return { success: true, message: "Customer deleted successfully" };
  }

  // ==========================================
  // CARS
  // ==========================================
  if (cleanEndpoint === "/api/cars/getall") {
    return { data: { cars: localDataStore.getCars() } };
  }

  if (cleanEndpoint.startsWith("/api/cars/")) {
    const id = cleanEndpoint.replace("/api/cars/", "").trim();
    const car = localDataStore.getCarById(id);
    return { data: { car: car || {} } };
  }

  if (cleanEndpoint === "/api/cars/create") {
    const created = localDataStore.createCar(payloadOrParams);
    return { success: true, message: "Car created successfully", data: { car: created } };
  }

  // ==========================================
  // SERVICES
  // ==========================================
  if (cleanEndpoint === "/api/services/getall") {
    return { data: { services: localDataStore.getServices() } };
  }

  if (cleanEndpoint === "/api/services/get/pagination") {
    const all = localDataStore.getServices();
    const page = parseInt(queryParams.get("page") || "1", 10);
    const limit = parseInt(queryParams.get("limit") || "10", 10);
    const start = (page - 1) * limit;
    const paged = all.slice(start, start + limit);
    return {
      services: paged,
      totalPages: Math.max(1, Math.ceil(all.length / limit)),
      totalItems: all.length,
      currentPage: page,
    };
  }

  if (cleanEndpoint.startsWith("/api/services/get/")) {
    const id = cleanEndpoint.replace("/api/services/get/", "").trim();
    const service = localDataStore.getServiceById(id);
    return { data: { service: service || {} } };
  }

  if (cleanEndpoint.startsWith("/api/services/monthly-stats")) {
    const yearParam = queryParams.get("year") || 2026;
    return { data: localDataStore.getMonthlyStats(yearParam) };
  }

  // ==========================================
  // JOB CARDS
  // ==========================================
  if (cleanEndpoint === "/api/job-cards") {
    if (method === "GET") {
      return { data: localDataStore.getJobCards() };
    }
    if (method === "POST") {
      const created = localDataStore.createJobCard(payloadOrParams);
      return { success: true, message: "Job card created successfully", data: { jobCard: created } };
    }
  }

  if (cleanEndpoint.startsWith("/api/job-cards/") && cleanEndpoint.endsWith("/assign")) {
    const id = cleanEndpoint.replace("/api/job-cards/", "").replace("/assign", "").trim();
    const updated = localDataStore.assignStaffToJobCard(id, payloadOrParams?.staffId);
    return { success: true, message: "Staff assigned successfully", data: { jobCard: updated } };
  }

  if (cleanEndpoint.startsWith("/api/job-cards/") && cleanEndpoint.endsWith("/items")) {
    return { success: true, message: "Item added successfully" };
  }

  if (cleanEndpoint.startsWith("/api/job-cards/") && cleanEndpoint.endsWith("/status")) {
    const id = cleanEndpoint.replace("/api/job-cards/", "").replace("/status", "").trim();
    const updated = localDataStore.updateJobCard(id, { status: payloadOrParams?.status || "Delivered" });
    return { success: true, data: { jobCard: updated } };
  }

  if (cleanEndpoint.startsWith("/api/job-cards/")) {
    const id = cleanEndpoint.replace("/api/job-cards/", "").trim();
    if (method === "GET") {
      const card = localDataStore.getJobCardById(id);
      return { data: { jobCard: card || {} } };
    }
    if (method === "PUT" || method === "PATCH") {
      const updated = localDataStore.updateJobCard(id, payloadOrParams);
      return { success: true, data: { jobCard: updated } };
    }
    if (method === "DELETE") {
      localDataStore.deleteJobCard(id);
      return { success: true, message: "Job card deleted successfully" };
    }
  }

  // ==========================================
  // ITEMS
  // ==========================================
  if (cleanEndpoint.startsWith("/api/items/getall")) {
    return { data: { items: localDataStore.getItems() } };
  }

  if (cleanEndpoint === "/api/items/create") {
    const created = localDataStore.createItem(payloadOrParams);
    return { success: true, data: { item: created } };
  }

  if (cleanEndpoint.startsWith("/api/items/delete/")) {
    const id = cleanEndpoint.replace("/api/items/delete/", "").trim();
    localDataStore.deleteItem(id);
    return { success: true, message: "Item deleted successfully" };
  }

  // ==========================================
  // USERS & STAFF
  // ==========================================
  if (cleanEndpoint === "/api/users/staff") {
    if (method === "GET") {
      const allUsers = localDataStore.getUsers();
      const staffOnly = allUsers.filter((u) => u.role === "staff");
      return { data: { staff: staffOnly } };
    }
    if (method === "POST") {
      const created = localDataStore.createStaff(payloadOrParams);
      return { success: true, data: { staff: created } };
    }
  }

  if (cleanEndpoint === "/api/users/getall" || cleanEndpoint === "/api/users") {
    return { data: { users: localDataStore.getUsers() } };
  }

  // ==========================================
  // AUTH
  // ==========================================
  if (cleanEndpoint === "/api/auth/login" || cleanEndpoint === "/api/auth/signin") {
    const identifier = payloadOrParams?.identifier || payloadOrParams?.email || payloadOrParams?.username;
    const password = payloadOrParams?.password;
    const authRes = localDataStore.login(identifier, password);
    localStorage.setItem("jwtToken", authRes.token);
    localStorage.setItem("user", JSON.stringify(authRes.user));
    return {
      success: true,
      message: "Login successful",
      token: authRes.token,
      user: authRes.user,
    };
  }

  if (cleanEndpoint === "/api/auth/register" || cleanEndpoint === "/api/auth/signup") {
    const newUser = localDataStore.createStaff(payloadOrParams);
    return { success: true, user: newUser };
  }

  // Fallback default
  return { success: true, data: [] };
};
