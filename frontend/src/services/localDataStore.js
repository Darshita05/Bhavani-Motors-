import seedData from "../data/seedData.json";

const STORAGE_KEYS = {
  INITIALIZED: "bhavani_initialized_v7",
  CUSTOMERS: "bhavani_customers",
  CARS: "bhavani_cars",
  SERVICES: "bhavani_services",
  JOBCARDS: "bhavani_jobcards",
  ITEMS: "bhavani_items",
  USERS: "bhavani_users",
};

// Initialize localStorage with the new MongoDB project's exact seed data
export const initLocalDataStore = (force = false) => {
  if (typeof window === "undefined") return;

  const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (!isInitialized || force) {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(seedData.customers || []));
    localStorage.setItem(STORAGE_KEYS.CARS, JSON.stringify(seedData.cars || []));
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(seedData.services || []));
    localStorage.setItem(STORAGE_KEYS.JOBCARDS, JSON.stringify(seedData.jobcards || []));
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(seedData.items || []));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(seedData.users || []));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, "true");
  }
};

const getList = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 0 && Array.isArray(fallback) && fallback.length > 0) {
      return fallback;
    }
    return parsed || fallback;
  } catch {
    return fallback;
  }
};

const setList = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Storage save error:", e);
  }
};

// Ensure store is ready
initLocalDataStore();

export const localDataStore = {
  // ==========================================
  // CUSTOMERS
  // ==========================================
  getCustomers: () => getList(STORAGE_KEYS.CUSTOMERS, seedData.customers),

  getCustomerById: (id) => {
    const customers = localDataStore.getCustomers();
    const customer = customers.find((c) => String(c._id || c.id) === String(id));
    if (!customer) return null;
    const cars = localDataStore.getCars().filter((car) => {
      const carCustId = car.customerId?._id || car.customerId?.id || car.customerId || car.customer?._id || car.customer?.id;
      return String(carCustId) === String(id);
    });
    return {
      ...customer,
      totalCars: cars.length,
      cars,
    };
  },

  createCustomer: (data) => {
    const customers = localDataStore.getCustomers();
    const newCustomer = {
      _id: "cust-" + Date.now(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    customers.unshift(newCustomer);
    setList(STORAGE_KEYS.CUSTOMERS, customers);
    return newCustomer;
  },

  updateCustomer: (id, data) => {
    const customers = localDataStore.getCustomers();
    const index = customers.findIndex((c) => String(c._id || c.id) === String(id));
    if (index !== -1) {
      customers[index] = {
        ...customers[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      setList(STORAGE_KEYS.CUSTOMERS, customers);
      return customers[index];
    }
    return null;
  },

  deleteCustomer: (id) => {
    const customers = localDataStore.getCustomers().filter((c) => String(c._id || c.id) !== String(id));
    setList(STORAGE_KEYS.CUSTOMERS, customers);
    return true;
  },

  // ==========================================
  // CARS
  // ==========================================
  getCars: () => getList(STORAGE_KEYS.CARS, seedData.cars),

  getCarById: (id) => {
    const cars = localDataStore.getCars();
    return cars.find((c) => String(c._id || c.id) === String(id)) || null;
  },

  createCar: (data) => {
    const cars = localDataStore.getCars();
    const newCar = {
      _id: "car-" + Date.now(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    cars.unshift(newCar);
    setList(STORAGE_KEYS.CARS, cars);
    return newCar;
  },

  // ==========================================
  // SERVICES
  // ==========================================
  getServices: () => getList(STORAGE_KEYS.SERVICES, seedData.services),

  getServiceById: (id) => {
    const services = localDataStore.getServices();
    return services.find((s) => String(s._id || s.id) === String(id)) || null;
  },

  createService: (data) => {
    const services = localDataStore.getServices();
    const newService = {
      _id: "srv-" + Date.now(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    services.unshift(newService);
    setList(STORAGE_KEYS.SERVICES, services);
    return newService;
  },

  // ==========================================
  // JOB CARDS
  // ==========================================
  getJobCards: () => getList(STORAGE_KEYS.JOBCARDS, seedData.jobcards),

  getJobCardById: (id) => {
    const cards = localDataStore.getJobCards();
    const card = cards.find((c) => String(c._id || c.id) === String(id));
    if (!card) return null;
    return card;
  },

  createJobCard: (data) => {
    const cards = localDataStore.getJobCards();
    const customers = localDataStore.getCustomers();
    const cars = localDataStore.getCars();

    const chosenCustomer =
      typeof data.customerId === "object"
        ? data.customerId
        : customers.find((c) => String(c._id || c.id) === String(data.customerId)) || {};

    const chosenCar =
      typeof data.carId === "object"
        ? data.carId
        : cars.find((c) => String(c._id || c.id) === String(data.carId)) || {};

    const newCard = {
      _id: "jc-" + Date.now(),
      jobCardNumber: `JC-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      ...data,
      customerId: chosenCustomer,
      carId: chosenCar,
      status: data.status || "Pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    cards.unshift(newCard);
    setList(STORAGE_KEYS.JOBCARDS, cards);
    return newCard;
  },

  updateJobCard: (id, data) => {
    const cards = localDataStore.getJobCards();
    const index = cards.findIndex((c) => String(c._id || c.id) === String(id));
    if (index !== -1) {
      cards[index] = {
        ...cards[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      setList(STORAGE_KEYS.JOBCARDS, cards);
      return cards[index];
    }
    return null;
  },

  deleteJobCard: (id) => {
    const cards = localDataStore.getJobCards().filter((c) => String(c._id || c.id) !== String(id));
    setList(STORAGE_KEYS.JOBCARDS, cards);
    return true;
  },

  assignStaffToJobCard: (jobCardId, staffId) => {
    const cards = localDataStore.getJobCards();
    const found = cards.find((c) => String(c._id || c.id) === String(jobCardId));
    if (found) {
      const users = localDataStore.getUsers();
      const staffMember = users.find((u) => String(u._id || u.id) === String(staffId));
      found.assignedTo = staffMember || null;
      found.updatedAt = new Date().toISOString();
      setList(STORAGE_KEYS.JOBCARDS, cards);
      return found;
    }
    return null;
  },

  // ==========================================
  // ITEMS
  // ==========================================
  getItems: () => getList(STORAGE_KEYS.ITEMS, seedData.items),

  createItem: (data) => {
    const items = localDataStore.getItems();
    const newItem = {
      _id: "item-" + Date.now(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    items.unshift(newItem);
    setList(STORAGE_KEYS.ITEMS, items);
    return newItem;
  },

  deleteItem: (id) => {
    const items = localDataStore.getItems().filter((i) => String(i._id || i.id) !== String(id));
    setList(STORAGE_KEYS.ITEMS, items);
    return true;
  },

  // ==========================================
  // USERS & AUTH
  // ==========================================
  getUsers: () => {
    const list = getList(STORAGE_KEYS.USERS, seedData.users);
    if (!list || list.length === 0) {
      return seedData.users || [];
    }
    const hasAdmin = list.some((u) => (u.email || "").toLowerCase() === "23se02it070@ppsu.ac.in");
    if (!hasAdmin && seedData.users) {
      const defaultAdmin = seedData.users.find((u) => (u.email || "").toLowerCase() === "23se02it070@ppsu.ac.in");
      if (defaultAdmin) {
        list.unshift(defaultAdmin);
        setList(STORAGE_KEYS.USERS, list);
      }
    }
    return list;
  },

  createStaff: (data) => {
    const users = localDataStore.getUsers();
    const newStaff = {
      _id: "staff-" + Date.now(),
      ...data,
      role: "staff",
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    users.push(newStaff);
    setList(STORAGE_KEYS.USERS, users);
    return newStaff;
  },

  login: (identifier, password) => {
    const users = localDataStore.getUsers();
    const cleanId = (identifier || "").trim().toLowerCase();

    // Find user by email, username/name, or phone number
    const user = users.find((u) => {
      const uEmail = (u.email || "").trim().toLowerCase();
      const uName = (u.name || "").trim().toLowerCase();
      const uPhone = (u.phone || u.phoneNumber || "").trim();
      return uEmail === cleanId || uName === cleanId || (uPhone && uPhone === cleanId);
    });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    const token = "mock-jwt-token-" + user._id;
    return {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
        phone: user.phone || user.phoneNumber,
      },
    };
  },

  getMonthlyStats: (year = 2026) => {
    const services = localDataStore.getServices();
    const customers = localDataStore.getCustomers();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const data = months.map((month, idx) => {
      const monthNum = idx;
      const monthServices = services.filter((s) => {
        const d = new Date(s.serviceDate || s.createdAt);
        return d.getFullYear() === Number(year) && d.getMonth() === monthNum;
      });
      const monthCustomers = customers.filter((c) => {
        const d = new Date(c.createdAt);
        return d.getFullYear() === Number(year) && d.getMonth() === monthNum;
      });
      const totalAmount = monthServices.reduce((sum, s) => sum + Number(s.cost || 0), 0);
      const collected = monthServices.reduce(
        (sum, s) => sum + Number(s.collectedCost ?? s.collectedAmount ?? 0),
        0
      );
      const pending = Math.max(0, totalAmount - collected);
      return {
        month,
        totalAmount,
        collected,
        pending,
        newCustomers: monthCustomers.length,
      };
    });
    return { year: Number(year), data };
  },
};
