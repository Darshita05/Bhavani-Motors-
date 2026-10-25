const {
  Service,
  Car,
  Customer,
  JobCard,
} = require("../models");

const {
  handleSuccess,
  successMessages,
  handleBadRequest,
  handleError,
  handleNotFound,
  errorMessages,
} = require("../controllers/errorController");


// ======================================================
// Create Service
// ======================================================

exports.createService = async (req, res) => {
  try {
    const {
      carId,
      description,
      cost,
      collectedCost,
      serviceDate,
      days,
      dueDate,
      mileage,
    } = req.body;

    // ==================================================
    // VALIDATION
    // ==================================================

    if (!carId || !cost || !serviceDate) {
      return handleBadRequest(
        res,
        null,
        errorMessages.MISSING_SERVICE_FIELDS
      );
    }

    // ==================================================
    // FIND CAR
    // ==================================================

    const car = await Car.findById(carId);

    if (!car) {
      return handleNotFound(
        res,
        null,
        errorMessages.CAR_NOT_FOUND
      );
    }

    // ==================================================
    // CREATE SERVICE
    // ==================================================

    const service = await Service.create({
      carId,

      customerId: car.customerId,

      description,

      cost,

      collectedCost: collectedCost || 0,

      serviceDate,

      days: days || null,

      dueDate: dueDate || null,

      mileage:
        mileage !== undefined
          ? mileage
          : car.mileage,
    });

    console.log(
      "SERVICE CREATED:",
      service._id
    );


    // ==================================================
    // CHECK IF JOB CARD ALREADY EXISTS
    // ==================================================

    const existingJobCard =
      await JobCard.findOne({
        serviceId: service._id,
      });

    if (!existingJobCard) {

      // ================================================
      // GENERATE UNIQUE JOB CARD NUMBER
      // ================================================

      const currentYear =
        new Date().getFullYear();

      const lastJobCard =
        await JobCard.findOne({
          jobCardNumber: {
            $regex: `^JC-${currentYear}-`,
          },
        }).sort({
          createdAt: -1,
        });


      let nextNumber = 1;


      if (lastJobCard?.jobCardNumber) {

        const lastNumber =
          parseInt(
            lastJobCard.jobCardNumber
              .split("-")
              .pop(),
            10
          );


        if (!isNaN(lastNumber)) {
          nextNumber =
            lastNumber + 1;
        }

      }


      const jobCardNumber =
        `JC-${currentYear}-${String(
          nextNumber
        ).padStart(
          3,
          "0"
        )}`;


      console.log(
        "Creating automatic Job Card..."
      );

      console.log(
        "Job Card Number:",
        jobCardNumber
      );

      console.log(
        "Service ID:",
        service._id
      );

      console.log(
        "Customer ID:",
        car.customerId
      );

      console.log(
        "Car ID:",
        car._id
      );


      // ================================================
      // CREATE JOB CARD
      // ================================================

      const createdJobCard =
        await JobCard.create({

          jobCardNumber,

          serviceId:
            service._id,

          customerId:
            car.customerId,

          carId:
            car._id,


          // Customer complaints can be
          // manually added later

          complaints: [],


          // Service description becomes
          // Work To Be Done

          workToBeDone: [
            {
              description:
                description ||
                "Vehicle Service",

              cost:
                Number(
                  cost || 0
                ),
            },
          ],


          // Parts can be added later

          itemsUsed: [],


          // Service date becomes
          // vehicle entry time

          timeIn:
            serviceDate ||
            new Date(),


          // Service due date becomes
          // expected delivery

          expectedDelivery:
            dueDate ||
            null,


          status:
            "Pending",


          remarks:
            null,


          // No parts initially

          partsTotal:
            0,


          // Service cost becomes
          // labour cost

          labourTotal:
            Number(
              cost || 0
            ),


          subtotal:
            Number(
              cost || 0
            ),


          discount:
            0,


          tax:
            0,


          grandTotal:
            Number(
              cost || 0
            ),

        });


      console.log(
        "JOB CARD CREATED SUCCESSFULLY:",
        createdJobCard._id
      );

    }


    // ==================================================
    // GET SERVICE WITH CAR DETAILS
    // ==================================================

    const serviceWithCar =
      await Service.findById(
        service._id
      ).populate({

        path:
          "carId",

        select:
          "make model registrationNo mileage customerId",

        populate: {

          path:
            "customerId",

          select:
            "firstName lastName",

        },

      });


    // ==================================================
    // SUCCESS RESPONSE
    // ==================================================

    return handleSuccess(

      res,

      successMessages
        .SERVICE_CREATED_SUCCESSFULLY,

      {
        service:
          serviceWithCar,
      },

      201

    );


  } catch (error) {

    console.error(
      "CREATE SERVICE ERROR:",
      error
    );


    return handleError(

      res,

      error,

      errorMessages
        .ERROR_CREATING_SERVICE

    );

  }
};
// ======================================================
// Get All Services
// ======================================================

exports.getAllServices = async (req, res) => {
  try {
    const filter = {};

    if (req.query.carId) {
      filter.carId = req.query.carId;
    }

    const services = await Service.find(filter)
      .populate(
        "carId",
        "mileage registrationNo"
      )
      .sort({
        createdAt: -1,
      });

    if (services.length === 0) {
      return handleSuccess(
        res,
        successMessages.SERVICE_NOT_FOUND,
        {
          services,
        },
        200
      );
    }

    return handleSuccess(
      res,
      successMessages.SERVICE_RETRIEVED,
      {
        services,
      }
    );
  } catch (error) {
    return handleError(
      res,
      error,
      errorMessages.ERROR_FETCHING_SERVICES
    );
  }
};


// ======================================================
// Get Service By ID
// ======================================================

exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(
      req.params.id
    ).populate(
      "carId",
      "make model registrationNo fuelType mileage"
    );

    if (!service) {
      return handleNotFound(
        res,
        null,
        errorMessages.SERVICE_NOT_FOUND
      );
    }

    return handleSuccess(
      res,
      successMessages.SERVICE_RETRIEVED,
      {
        service,
      }
    );
  } catch (error) {
    return handleError(
      res,
      error,
      errorMessages.ERROR_FETCHING_SERVICE
    );
  }
};


// ======================================================
// Services Pagination
// ======================================================

exports.getServicesWithPagination = async (
  req,
  res
) => {
  try {
    const page = Math.max(
      parseInt(req.query.page, 10) || 1,
      1
    );

    const limit = Math.max(
      parseInt(req.query.limit, 10) || 15,
      1
    );

    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.customerId) {
      filter.customerId = req.query.customerId;
    }

    const [count, services] = await Promise.all([
      Service.countDocuments(filter),

      Service.find(filter)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .select("-days")
        .populate(
          "carId",
          "registrationNo make model customerId mileage"
        ),
    ]);

    return res.json({
      totalItems: count,

      totalPages: Math.ceil(
        count / limit
      ),

      currentPage: page,

      pageSize: limit,

      services,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error:
        errorMessages.UNABLE_TO_LOAD_SERVICE_LIST,
    });
  }
};


// ======================================================
// Services Pagination Of 10
// ======================================================

exports.getServicesWithPaginationOf10 =
  async (req, res) => {
    try {
      const page = Math.max(
        parseInt(req.query.page, 10) || 1,
        1
      );

      const limit = Math.max(
        parseInt(req.query.limit, 10) || 10,
        1
      );

      const skip =
        (page - 1) * limit;

      const filter = {};

      const carId =
        req.query.carId;

      if (
        carId &&
        carId !== "all"
      ) {
        filter.carId =
          carId;
      }

      const [
        count,
        services,
      ] =
        await Promise.all([
          Service.countDocuments(
            filter
          ),

          Service.find(
            filter
          )
            .select(
              "serviceDate dueDate cost collectedCost description carId"
            )
            .populate(
              "carId",
              "registrationNo mileage"
            )
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
            count / limit
          ),

        currentPage:
          page,

        pageSize:
          limit,

        services,
      });
    } catch (error) {
      console.error(error);

      return res
        .status(500)
        .json({
          error:
            errorMessages.UNABLE_TO_LOAD_SERVICE_LIST,
        });
    }
  };


// ======================================================
// Add To Collected Cost
// ======================================================

exports.addToCollectedCost = async (
  req,
  res
) => {
  try {
    const serviceId =
      req.params.id;

    const {
      cost,
      additionalCost,
    } = req.body;

    if (
      cost === undefined &&
      additionalCost === undefined
    ) {
      return handleBadRequest(
        res,
        null,
        errorMessages.COST_AND_ADDITIONAL_COST_REQUIRED
      );
    }

    const service =
      await Service.findById(
        serviceId
      );

    if (!service) {
      return handleNotFound(
        res,
        null,
        errorMessages.SERVICE_NOT_FOUND
      );
    }

    const updates = {};

    if (cost !== undefined) {
      if (isNaN(cost)) {
        return handleBadRequest(
          res,
          null,
          "Invalid 'cost' value."
        );
      }

      updates.cost =
        parseFloat(cost);
    }

    if (
      additionalCost !==
      undefined
    ) {
      if (
        isNaN(
          additionalCost
        )
      ) {
        return handleBadRequest(
          res,
          null,
          "Invalid 'additionalCost' value."
        );
      }

      updates.collectedCost =
        (service.collectedCost ||
          0) +
        parseFloat(
          additionalCost
        );
    }

    Object.assign(
      service,
      updates
    );

    await service.save();

    return handleSuccess(
      res,
      successMessages.SERVICE_UPDATED_SUCCESSFULLY,
      {
        serviceId:
          service.id,

        updatedFields:
          updates,
      }
    );
  } catch (error) {
    return handleError(
      res,
      error,
      errorMessages.ERROR_UPDATING_SERVICE
    );
  }
};


// ======================================================
// Update Service
// ======================================================

exports.updateService = async (req, res) => {
  try {
    const updates = {};

    [
      "description",
      "cost",
      "collectedCost",
      "serviceDate",
      "days",
      "dueDate",
      "mileage",
    ].forEach((field) => {
      if (
        req.body[field] !==
        undefined
      ) {
        updates[field] =
          req.body[field];
      }
    });

    const service =
      await Service.findByIdAndUpdate(
        req.params.id,
        updates,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!service) {
      return handleNotFound(
        res,
        null,
        errorMessages.SERVICE_NOT_FOUND
      );
    }

    return handleSuccess(
      res,
      successMessages.SERVICE_UPDATED_SUCCESSFULLY,
      {
        service,
      }
    );
  } catch (error) {
    return handleError(
      res,
      error,
      errorMessages.ERROR_UPDATING_SERVICE
    );
  }
};


// ======================================================
// Delete Service
// ======================================================

exports.deleteService = async (req, res) => {
  try {
    const service =
      await Service.findByIdAndDelete(
        req.params.id
      );

    if (!service) {
      return handleNotFound(
        res,
        null,
        errorMessages.SERVICE_NOT_FOUND
      );
    }

    return handleSuccess(
      res,
      successMessages.SERVICE_DELETED_SUCCESSFULLY
    );
  } catch (error) {
    return handleError(
      res,
      error,
      errorMessages.ERROR_DELETING_SERVICE
    );
  }
};


// ======================================================
// Monthly Statistics
// ======================================================

exports.getMonthlyStats = async (req, res) => {
  try {
    let year =
      parseInt(
        req.query.year,
        10
      ) ||
      new Date().getFullYear();

    let startDate =
      new Date(
        year,
        0,
        1
      );

    let endDate =
      new Date(
        year + 1,
        0,
        1
      );

    // Check if selected year has services
    const countForYear =
      await Service.countDocuments({
        serviceDate: {
          $gte: startDate,
          $lt: endDate,
        },
      });

    // If no services exist, use latest service year
    if (
      countForYear === 0
    ) {
      const latestService =
        await Service.findOne()
          .sort({
            serviceDate: -1,
          })
          .select(
            "serviceDate"
          );

      if (latestService) {
        year =
          new Date(
            latestService.serviceDate
          ).getFullYear();

        startDate =
          new Date(
            year,
            0,
            1
          );

        endDate =
          new Date(
            year + 1,
            0,
            1
          );
      }
    }

    const serviceRows =
      await Service.aggregate([
        {
          $match: {
            serviceDate: {
              $gte:
                startDate,

              $lt:
                endDate,
            },
          },
        },

        {
          $group: {
            _id: {
              $month:
                "$serviceDate",
            },

            totalCost: {
              $sum:
                "$cost",
            },

            totalCollected: {
              $sum: {
                $ifNull: [
                  "$collectedCost",
                  0,
                ],
              },
            },
          },
        },

        {
          $sort: {
            _id: 1,
          },
        },
      ]);

    const customerRows =
      await Customer.aggregate([
        {
          $match: {
            createdAt: {
              $gte:
                startDate,

              $lt:
                endDate,
            },
          },
        },

        {
          $group: {
            _id: {
              $month:
                "$createdAt",
            },

            newCustomers: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            _id: 1,
          },
        },
      ]);

    const serviceMap = {};

    serviceRows.forEach(
      (row) => {
        serviceMap[
          row._id
        ] = {
          totalCost:
            row.totalCost ||
            0,

          totalCollected:
            row.totalCollected ||
            0,
        };
      }
    );

    const customerMap = {};

    customerRows.forEach(
      (row) => {
        customerMap[
          row._id
        ] =
          row.newCustomers ||
          0;
      }
    );

    const months =
      Array.from(
        {
          length: 12,
        },
        (_, index) =>
          new Date(
            year,
            index,
            1
          ).toLocaleString(
            "en",
            {
              month:
                "short",
            }
          )
      );

    const data =
      months.map(
        (
          month,
          index
        ) => {
          const monthNumber =
            index + 1;

          const serviceData =
            serviceMap[
              monthNumber
            ] || {
              totalCost: 0,

              totalCollected: 0,
            };

          return {
            month,

            totalAmount:
              serviceData.totalCost,

            collected:
              serviceData.totalCollected,

            pending:
              Math.max(
                0,

                serviceData.totalCost -
                  serviceData.totalCollected
              ),

            newCustomers:
              customerMap[
                monthNumber
              ] || 0,
          };
        }
      );

    return res.json({
      year,
      data,
    });
  } catch (error) {
    console.error(
      "getMonthlyStats error:",
      error
    );

    return res
      .status(500)
      .json({
        error:
          "Failed to fetch monthly stats",
      });
  }
};


// ======================================================
// Get Next Invoice Number
// ======================================================

exports.getNextInvoiceNumber =
  async (req, res) => {
    try {
      const currentYear =
        new Date().getFullYear();

      const startOfYear =
        new Date(
          currentYear,
          0,
          1
        );

      const endOfYear =
        new Date(
          currentYear + 1,
          0,
          1
        );

      const services =
        await Service.find({
          invoiceNumber: {
            $exists: true,
            $nin: [
              null,
              "",
            ],
          },

          createdAt: {
            $gte:
              startOfYear,

            $lt:
              endOfYear,
          },
        })
          .select(
            "invoiceNumber"
          )
          .lean();

      let maxNumber = 0;

      for (
        const service
        of services
      ) {
        const match =
          service.invoiceNumber?.match(
            /^INV-(\d+)$/
          );

        if (match) {
          const number =
            parseInt(
              match[1],
              10
            );

          if (
            number <
              10000 &&
            number >
              maxNumber
          ) {
            maxNumber =
              number;
          }
        }
      }

      const nextNumber =
        maxNumber + 1;

      const nextInvoiceNumber =
        `INV-${String(
          nextNumber
        ).padStart(
          3,
          "0"
        )}`;

      return handleSuccess(
        res,
        "Next invoice number generated",
        {
          invoiceNumber:
            nextInvoiceNumber,
        }
      );
    } catch (error) {
      return handleError(
        res,
        error,
        "Failed to generate invoice number"
      );
    }
  };