const errorMessages = {
  // Authentication-related errors

  EMAIL_REGISTERED: "Email is already registered",
  ERROR_CREATING_USER: "Error creating user",
  INVALID_CREDENTIALS: "Invalid username or password",
  INVALID_OTP: "Invalid otp code",
  MISSING_FIELDS: "First name, last name, email and password are required",
  NO_ACTIVE_SESSION: "No active session found",
  RESET_EMAIL_ERROR: "Error sending reset email:",
  SERVER_ERROR: "Server error occurred",
  USERNAME_TAKEN: "Username is already taken",
  USER_NOT_FOUND: "User not found",
  WEAK_PASSWORD:
    "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.",
  USERNAME_AND_PASSWORD_REQUIRED: "Username and password are required",
  ONLY_ADMIN_CAN_LOGIN: "Only admins can log in",
  VALID_EMAIL_REQUIRED: "A valid email address is required",
  RESET_SESSION_EXPIRED_OR_NOT_FOUND:
    "Password reset session expired or not found",
  OTP_EXPIRED: "OTP has expired. Please request a new one",
  VERIFY_OTP_FIRST: "Please verify your OTP first",
  SESSION_EXPIRED:
    "Your session has expired. Please restart the password reset process.",

  // Invoice-related errors

  FAILED_TO_SAVE_INVOICE: "Failed to save invoice data",

  // Car-related errors

  MISSING_CAR_FIELDS:
    "Make, model, fuelType, mileage and registration number are required",
  CAR_NOT_FOUND: "Car not found",
  CAR_RETRIEVED: "Car retrieved successfully",
  ERROR_CREATING_CAR: "Error creating car",
  ERROR_FETCHING_CARS: "Error fetching cars",
  ERROR_FETCHING_CAR: "Error fetching car",
  ERROR_UPDATING_CAR: "Error updating car",
  ERROR_DELETING_CAR: "Error deleting car",
  NO_IMAGE_PROVIDED: "No image provided for the car",
  FAILED_TO_UPLOAD_IMAGE: "Failed to upload image",
  FAILED_TO_DELETE_IMAGE: "Failed to delete image",
  MISSING_FIELDS: "Service, car, or customer not found",
  NO_IMAGE_FOUND: "No image found for the car",
  FAILED_TO_SENT_IMAGE_ON_WHATSAPP: "Failed to send image on WhatsApp",
  ERROR_FETCHING_CAR_COUNT: "Error fetching customer's car count",
  NO_IMAGE_URL_PROVIDED: "No image URL provided",
  IMAGE_URL_NOT_FOUND_IN_CAR_RECORD: "Image URL not found in car record",
  INVALID_IMAGE_URL_FORMAT: "Invalid image URL format",
  UNABLE_TO_LOAD_CAR_LIST:
    "Unable to load car list with pagination. Please try again later.",
  CAR_REGISTRATION_NUMBER_MISSING: "Car registration number is required",
  ERROR_SENDING_IMAGE_AND_INVOICE: "Error sending WhatsApp images and PDF:",
  INVOICE_DETAILS_INCOMPLETE:
    "Invoice details incomplete, skipping invoice PDF send.",
  IMAGE_DELETION_ERROR: "Image deletion failed:",
  ERROR_FETCHING_CAR_FOR_CUSTOMER: "Error fetching cars for customer:",
  ERROR_UPLOADING: "Upload error:",

  // Service-related errors

  MISSING_SERVICE_FIELDS:
    "Car ID, cost, serviceDate, days and dueDate are required",
  ERROR_CREATING_SERVICE: "Error creating service record",
  ERROR_FETCHING_SERVICES: "Error fetching services",
  ERROR_FETCHING_SERVICE: "Error fetching service",
  ERROR_UPDATING_SERVICE: "Error updating service",
  ERROR_DELETING_SERVICE: "Error deleting service",
  UNABLE_TO_LOAD_SERVICE_LIST:
    "Unable to load service list with pagination. Please try again later.",
  SERVICE_NOT_FOUND: "Service not found",
  MISSING_FIELDS_INVOICE:
    "Invoice number, invoice amount and invoice PDF are required",
  COST_AND_ADDITIONAL_COST_REQUIRED:
    "Please provide 'cost' or 'additionalCost'.",

  // Customer-related errors

  MISSING_CUSTOMER_FIELDS:
    "Firstname, lastname, email, phone number and address are required",
  CUSTOMERID_REQUIRED: "Customer ID is required",
  CUSTOMER_NOT_EXIST: "Customer does not exist",
  ERROR_CREATING_CUSTOMER: "Error creating customer",
  ERROR_FETCHING_CUSTOMERS: "Error fetching customers",
  ERROR_FETCHING_CUSTOMER: "Error fetching customer",
  ERROR_UPDATING_CUSTOMER: "Error updating customer",
  ERROR_DELETING_CUSTOMER: "Error deleting customer",
  MISSING_FIELDS:
    "Please provide at least phoneNumber, registrationNo, or fullName.",
  UNABLE_TO_LOAD_CUSTOMER_LIST:
    "Unable to load customer list with pagination. Please try again later.",
  CUSTOMER_NOT_FOUND: "Customer not found",

  // Item-related errors

  MISSING_ITEM_FIELDS: "Item name is required",
  ITEM_NOT_FOUND: "Item not found",
  ERROR_CREATING_ITEM: "Error creating item",
  ERROR_FETCHING_ITEMS: "Error fetching items",
  ERROR_FETCHING_ITEM: "Error fetching item",
  ERROR_UPDATING_ITEM: "Error updating item",
  ERROR_DELETING_ITEM: "Error deleting item",
  UNABLE_TO_LOAD_ITEM_LIST:
    "Unable to load item list with pagination. Please try again later.",
};

const successMessages = {
  // Authentication-related

  USER_CREATED: "User created successfully",
  USER_LOGGED_IN: "User logged in successfully",
  RESET_CODE_SENT: "A reset code has been sent to your email",
  LOGOUT_SUCCESSFUL: "Logout successful",
  PASSWORD_RESET_SUCCESSFUL: "Password reset successful",
  PASSWORD_UPDATED_SUCCESSFULLY: "Password updated successfully",
  VERIFICATION_CODE_VALID:
    "Verification code valid. Proceed to reset password.",
  PASSWORD_UPDATED: "Password updated successfully",

  // User-related

  USER_CREATED_SUCCESSFULLY: "User created successfully",
  USER_DELETED_SUCCESSFULLY: "User deleted successfully",
  USER_FETCHED_SUCCESSFULLY: "User fetched successfully",
  USERS_FETCHED_SUCCESSFULLY: "Users fetched successfully",

  // Car-related
  CAR_CREATED_SUCCESSFULLY: "Car created successfully",
  CAR_UPDATED_SUCCESSFULLY: "Car updated successfully",
  CAR_DELETED_SUCCESSFULLY: "Car deleted successfully",
  CARS_FETCHED_SUCCESSFULLY: "Cars fetched successfully",
  CAR_FETCHED_SUCCESSFULLY: "Car fetched successfully",
  CAR_WITH_REGISTRATION_NUMBER_EXISTS:
    "Car with this registration number already exists",
  IMAGE_UPLOAD_SUCCESS: "Image uploaded successfully",
  IMAGE_SENT_ON_WHATSAPP: "All images sent via WhatsApp successfully",
  TOTAL_CAR_COUNT: "Total cars count retrieved",
  TOTAL_UNIQUE_CAR_FOR_CUSTOMER: "Total unique cars for customer retrieved",
  IMAGE_DELETED_SUCCESSFULLY: "Image deleted successfully",

  // Invoice-related

  INVOICE_STORED_SUCCESSFULLY: "Invoice stored successfully",
  INVOICE_SENT_SUCCESSFULLY: "Invoice sent on WhatsApp",

  // Customer-related
  CUSTOMER_CREATED_SUCCESSFULLY: "Customer created successfully",
  CUSTOMER_UPDATED_SUCCESSFULLY: "Customer updated successfully",
  CUSTOMER_DELETED_SUCCESSFULLY: "Customer deleted successfully",
  CUSTOMERS_FETCHED_SUCCESSFULLY: "Customers fetched successfully",
  CUSTOMER_FETCHED_SUCCESSFULLY: "Customer fetched successfully",
  CUSTOMER_RETRIEVED: "Customer retrieved successfully",
  TOTAL_CUSTOMER_RETRIEVED: "Total customers retrieved successfully",
  NO_RECENT_CUSTOMER_FOUND:
    "No recent customer found. Please create a customer first.",
  CUSTOMER_NOT_FOUND: "Customer not found",

  // Service-related
  SERVICE_CREATED_SUCCESSFULLY: "Service created successfully",
  SERVICE_UPDATED_SUCCESSFULLY: "Service updated successfully",
  SERVICE_DELETED_SUCCESSFULLY: "Service deleted successfully",
  SERVICES_FETCHED_SUCCESSFULLY: "Services fetched successfully",
  SERVICE_FETCHED_SUCCESSFULLY: "Service fetched successfully",
  TOTAL_SERVICE_RETRIEVED: "Total services retrieved successfully",
  NO_RECENT_SERVICE_FOUND:
    "No recent service found. Please create a service first.",
  SERVICE_NOT_FOUND: "Service not found",
  SERVICE_RETRIEVED: "Service retrieved successfully",

  // Item-related
  ITEM_CREATED_SUCCESSFULLY: "Item created successfully",
  ITEM_UPDATED_SUCCESSFULLY: "Item updated successfully",
  ITEM_DELETED_SUCCESSFULLY: "Item deleted successfully",
  ITEMS_FETCHED_SUCCESSFULLY: "Items fetched successfully",
  ITEM_FETCHED_SUCCESSFULLY: "Item fetched successfully",
};

// Centralized error handler for server errors (defaults to 500)
const handleError = (res, error, message, statusCode = 500) => {
  console.error(message, error);
  return res.status(statusCode).json({ statusCode, message, data: {} });
};

// Centralized error handler for client errors (defaults to 400)
const handleBadRequest = (res, error, message, statusCode = 400) => {
  console.error(message, error);
  return res.status(statusCode).json({ statusCode, message, data: {} });
};

// centralized handler for success responses (defaults to 200)
const handleSuccess = (res, message, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    statusCode, // ← HTTP status code
    message, // ← descriptive message
    data, // ← payload under “data”
  });
};

// centralized handler for unauthorized responses (defaults to 401)
const handleUnauthorized = (res, error, message, statusCode = 401) => {
  console.error(message, error);
  return res.status(statusCode).json({ statusCode, message, data: {} });
};

// Centralized handler for "Not Found" responses (defaults to 404)
const handleNotFound = (res, error, message, statusCode = 404) => {
  console.error(message, error);
  return res.status(statusCode).json({ statusCode, message, data: {} });
};

module.exports = {
  errorMessages,
  handleError,
  handleBadRequest,
  handleSuccess,
  handleUnauthorized,
  handleNotFound,
  successMessages,
};
