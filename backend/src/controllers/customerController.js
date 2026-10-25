const { Customer, Car, Service } = require("../models");

const {
  handleSuccess,
  successMessages,
  handleBadRequest,
  handleError,
  handleNotFound,
  errorMessages,
} = require("./errorController");

const { deleteFileFromS3 } = require("../services/s3Client");


// ======================================================
// Create Customer
// ======================================================

exports.createCustomer = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      address,
    } = req.body;

    if (
      !firstName ||
      !lastName ||
      !phoneNumber ||
      !address
    ) {
      return handleBadRequest(
        res,
        null,
        errorMessages.MISSING_CUSTOMER_FIELDS
      );
    }

    const customer = await Customer.create({
      firstName,
      lastName,
      email: email || undefined,
      phoneNumber,
      address,
    });

    return handleSuccess(
      res,
      successMessages.CUSTOMER_CREATED_SUCCESSFULLY,
      { customer },
      201
    );
  } catch (error) {
    return handleError(
      res,
      error,
      errorMessages.ERROR_CREATING_CUSTOMER
    );
  }
};


// ======================================================
// Get All Customers
// ======================================================

exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find()
      .sort({ createdAt: -1 })
      .lean();

    const customersWithServices = await Promise.all(
      customers.map(async (customer) => {
        const services = await Service.find({
          customerId: customer._id,
        })
          .select(
            "description cost collectedCost serviceDate carId"
          )
          .populate(
            "carId",
            "make model registrationNo"
          )
          .lean();

        const formattedServices = services.map(
          (service) => ({
            ...service,
            car: service.carId,
          })
        );

        return {
          ...customer,
          services: formattedServices,
        };
      })
    );

    if (customersWithServices.length === 0) {
      return handleSuccess(
        res,
        successMessages.CUSTOMER_NOT_FOUND,
        {
          customers: customersWithServices,
        },
        200
      );
    }

    return handleSuccess(
      res,
      successMessages.CUSTOMER_RETRIEVED,
      {
        customers: customersWithServices,
      }
    );
  } catch (error) {
    return handleError(
      res,
      error,
      errorMessages.ERROR_FETCHING_CUSTOMERS
    );
  }
};


// ======================================================
// Get All Customers With Names Only
// ======================================================

exports.getAllCustomersWithNames = async (req, res) => {
  try {
    const customers = await Customer.find()
      .select("firstName lastName")
      .lean();

    const formattedCustomers = customers.map(
      (customer) => ({
        _id: customer._id,

        id: customer._id,

        fullName:
          `${customer.firstName} ${customer.lastName}`.trim(),
      })
    );

    if (formattedCustomers.length === 0) {
      return handleSuccess(
        res,
        successMessages.CUSTOMER_NOT_FOUND,
        {
          customers: formattedCustomers,
        },
        200
      );
    }

    return handleSuccess(
      res,
      successMessages.CUSTOMER_RETRIEVED,
      {
        customers: formattedCustomers,
      }
    );
  } catch (error) {
    return handleError(
      res,
      error,
      errorMessages.ERROR_FETCHING_CUSTOMERS
    );
  }
};


// ======================================================
// Get Customer By ID
// ======================================================

exports.getCustomerById = async (req, res) => {
  try {
    const customerId = req.params.id;

    const customer = await Customer.findById(
      customerId
    ).lean();

    if (!customer) {
      return handleNotFound(
        res,
        null,
        errorMessages.CUSTOMER_NOT_FOUND
      );
    }

    const services = await Service.find({
      customerId,
    })
      .select(
        "description cost collectedCost serviceDate carId"
      )
      .populate(
        "carId",
        "make model registrationNo mileage"
      )
      .lean();

    const formattedServices = services.map(
      (service) => ({
        ...service,

        car: service.carId,
      })
    );

    const totalCars = await Car.countDocuments({
      customerId,
    });

    return handleSuccess(
      res,
      successMessages.CUSTOMER_RETRIEVED,
      {
        customer: {
          ...customer,

          services: formattedServices,
        },

        totalCars,
      }
    );
  } catch (error) {
    return handleError(
      res,
      error,
      errorMessages.ERROR_FETCHING_CUSTOMER
    );
  }
};


// ======================================================
// Find Customer By Phone, Registration Number Or Name
// ======================================================

const normalizePhone = (phone) =>
  phone.replace(/\D/g, "");

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

exports.findCustomerByPhoneOrRegistrationOrName =
  async (req, res) => {
    try {
      const {
        phoneNumber,
        registrationNo,
        fullName,
      } = req.query;

      if (
        !phoneNumber &&
        !registrationNo &&
        !fullName
      ) {
        return handleBadRequest(
          res,
          null,
          errorMessages.MISSING_FIELDS
        );
      }

      let customer = null;

      // Search by phone number
      if (phoneNumber) {
        const normalized =
          normalizePhone(phoneNumber);

        const last10Digits =
          normalized.slice(-10);

        customer = await Customer.findOne({
          phoneNumber: {
            $regex:
              `${escapeRegex(last10Digits)}$`,
          },
        }).lean();
      }

      // Search by registration number
      if (!customer && registrationNo) {
        const car = await Car.findOne({
          registrationNo,
        }).lean();

        if (car) {
          customer = await Customer.findById(
            car.customerId
          ).lean();
        }
      }

      // Search by full name
      if (!customer && fullName) {
        const nameParts =
          fullName.trim().split(/\s+/);

        const firstName =
          nameParts[0] || "";

        const lastName =
          nameParts.slice(1).join(" ");

        const nameFilter = {
          firstName: {
            $regex: escapeRegex(firstName),
            $options: "i",
          },
        };

        if (lastName) {
          nameFilter.lastName = {
            $regex: escapeRegex(lastName),
            $options: "i",
          };
        }

        customer = await Customer.findOne(
          nameFilter
        ).lean();
      }

      if (!customer) {
        return handleNotFound(
          res,
          null,
          errorMessages.CUSTOMER_NOT_FOUND
        );
      }

      // Get all customer's cars
      const cars = await Car.find({
        customerId: customer._id,
      }).lean();

      // Get services for each car
      const carsWithServices =
        await Promise.all(
          cars.map(async (car) => {
            const services =
              await Service.find({
                carId: car._id,
              })
                .select(
                  "description cost collectedCost serviceDate"
                )
                .lean();

            return {
              ...car,
              services,
            };
          })
        );

      // Get all services directly linked with customer
      const services = await Service.find({
        customerId: customer._id,
      })
        .populate(
          "carId",
          "make model registrationNo"
        )
        .lean();

      const formattedServices =
        services.map((service) => ({
          ...service,

          car: service.carId,
        }));

      const customerResult = {
        ...customer,

        cars: carsWithServices,

        services: formattedServices,
      };

      return handleSuccess(
        res,
        successMessages.CUSTOMER_RETRIEVED,
        {
          customer: customerResult,
        }
      );
    } catch (error) {
      return handleError(
        res,
        error,
        errorMessages.ERROR_FETCHING_CUSTOMER
      );
    }
  };


// ======================================================
// Get Total Customers With Revenue
// ======================================================

exports.getTotalCustomersWithRevenue =
  async (req, res) => {
    try {
      const customers =
        await Customer.find()
          .lean();

      const customersWithServices =
        await Promise.all(
          customers.map(
            async (customer) => {
              const services =
                await Service.find({
                  customerId:
                    customer._id,
                })
                  .select(
                    "description cost serviceDate"
                  )
                  .lean();

              return {
                ...customer,
                services,
              };
            }
          )
        );

      // MongoDB aggregation for total revenue
      const revenueResult =
        await Service.aggregate([
          {
            $group: {
              _id: null,

              totalRevenue: {
                $sum: "$cost",
              },
            },
          },
        ]);

      const totalRevenue =
        revenueResult.length > 0
          ? revenueResult[0].totalRevenue
          : 0;

      return handleSuccess(
        res,
        successMessages.TOTAL_CUSTOMER_RETRIEVED,
        {
          totalCustomers:
            customers.length,

          totalRevenue,

          customers:
            customersWithServices,
        }
      );
    } catch (error) {
      return handleError(
        res,
        error,
        errorMessages.ERROR_FETCHING_TOTAL_CUSTOMERS
      );
    }
  };


// ======================================================
// Get Recent Customers
// ======================================================

exports.getRecentCustomers = async (req, res) => {
  try {
    const limit =
      Math.max(
        parseInt(req.query.limit, 10) || 5,
        1
      );

    const recentCustomers =
      await Customer.find()
        .sort({
          createdAt: -1,
        })
        .limit(limit)
        .lean();

    const customersWithServices =
      await Promise.all(
        recentCustomers.map(
          async (customer) => {
            const services =
              await Service.find({
                customerId:
                  customer._id,
              })
                .select(
                  "serviceDate"
                )
                .lean();

            return {
              ...customer,
              services,
            };
          }
        )
      );

    if (
      customersWithServices.length === 0
    ) {
      return handleSuccess(
        res,
        successMessages.NO_RECENT_CUSTOMER_FOUND,
        {
          recentCustomers:
            customersWithServices,
        },
        200
      );
    }

    return handleSuccess(
      res,
      `Retrieved ${customersWithServices.length} most recent customer(s)`,
      {
        recentCustomers:
          customersWithServices,
      }
    );
  } catch (error) {
    return handleError(
      res,
      error,
      errorMessages.ERROR_FETCHING_CUSTOMERS
    );
  }
};


// ======================================================
// Get Customers With Pagination
// ======================================================

exports.getCustomersWithPagination =
  async (req, res) => {
    try {
      const page =
        Math.max(
          parseInt(
            req.query.page,
            10
          ) || 1,
          1
        );

      const limit =
        Math.max(
          parseInt(
            req.query.limit,
            10
          ) || 15,
          1
        );

      const skip =
        (page - 1) *
        limit;

      const [
        count,
        customers,
      ] =
        await Promise.all([
          Customer.countDocuments(),

          Customer.find()
            .sort({
              createdAt: -1,
            })
            .skip(skip)
            .limit(limit),
        ]);

      return res.json({
        totalItems:
          count,

        totalPages:
          Math.ceil(
            count /
              limit
          ),

        currentPage:
          page,

        pageSize:
          limit,

        customers,
      }); 
    } catch (error) {
      console.error(
        error
      );

      return res
        .status(500)
        .json({
          error:
            errorMessages.UNABLE_TO_LOAD_CUSTOMER_LIST,
        });
    }
  };


// ======================================================
// Update Customer
// ======================================================

exports.updateCustomer = async (req, res) => {
  try {
    const updates = {};

    [
      "firstName",
      "lastName",
      "email",
      "phoneNumber",
      "address",
    ].forEach((field) => {
      if (
        req.body[field] !==
        undefined
      ) {
        updates[field] =
          req.body[field];
      }
    });

    const customer =
      await Customer.findByIdAndUpdate(
        req.params.id,
        updates,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!customer) {
      return handleNotFound(
        res,
        null,
        errorMessages.CUSTOMER_NOT_FOUND
      );
    }

    return handleSuccess(
      res,
      successMessages.CUSTOMER_UPDATED_SUCCESSFULLY,
      {
        customer,
      }
    );
  } catch (error) {
    return handleError(
      res,
      error,
      errorMessages.ERROR_UPDATING_CUSTOMER
    );
  }
};


// ======================================================
// Delete Customer
// ======================================================

exports.deleteCustomer = async (req, res) => {
  try {
    const customer =
      await Customer.findById(
        req.params.id
      );

    if (!customer) {
      return handleNotFound(
        res,
        null,
        errorMessages.CUSTOMER_NOT_FOUND
      );
    }

    // Find all customer's cars
    const cars =
      await Car.find({
        customerId:
          customer._id,
      });

    const allImageUrls = [];

    // Collect car images
    for (const car of cars) {
      if (car.imageUrl) {
        const images =
          car.imageUrl
            .split(",")
            .map(
              (url) =>
                url.trim()
            )
            .filter(Boolean);

        allImageUrls.push(
          ...images
        );
      }
    }

    // Delete images from S3
    for (
      const imageUrl
      of allImageUrls
    ) {
      const s3Key =
        imageUrl.split(
          ".amazonaws.com/"
        )[1];

      if (s3Key) {
        try {
          await deleteFileFromS3(
            process.env.BUCKET_NAME,
            s3Key
          );
        } catch (
          s3Error
        ) {
          console.error(
            "Error deleting from S3:",
            s3Error.message
          );
        }
      }
    }

    // MongoDB does not automatically cascade delete
    // Delete customer's services
    await Service.deleteMany({
      customerId:
        customer._id,
    });

    // Delete customer's cars
    await Car.deleteMany({
      customerId:
        customer._id,
    });

    // Delete customer
    await Customer.findByIdAndDelete(
      customer._id
    );

    return handleSuccess(
      res,
      successMessages.CUSTOMER_DELETED_SUCCESSFULLY,
      {
        deletedCustomerId:
          customer.id,

        deletedImages:
          allImageUrls,
      }
    );
  } catch (error) {
    return handleError(
      res,
      error,
      errorMessages.ERROR_DELETING_CUSTOMER
    );
  }
};