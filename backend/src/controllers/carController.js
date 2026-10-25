const { Car, Customer, Service } = require("../models");

const {
  handleSuccess,
  handleBadRequest,
  handleError,
  handleNotFound,
  errorMessages,
  successMessages,
} = require("../controllers/errorController");

const {
  uploadFileToS3,
  deleteFileFromS3,
} = require("../services/s3Client");

const {
  sendImageTemplateMessage,
  sendInvoiceTemplate,
} = require("../utils/sendSMS");


// ======================================================
// Create a new car
// ======================================================

exports.createCar = async (req, res) => {
  try {
    const {
      make,
      model,
      fuelType,
      registrationNo,
      mileage,
      customerId,
    } = req.body;

    if (
      !make ||
      !fuelType ||
      !registrationNo ||
      !model ||
      mileage === undefined ||
      !customerId
    ) {
      return handleBadRequest(
        res,
        null,
        errorMessages.MISSING_CAR_FIELDS
      );
    }

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return handleBadRequest(
        res,
        null,
        errorMessages.CUSTOMER_NOT_FOUND ||
          errorMessages.CUSTOMER_NOT_EXIST
      );
    }

    const existingCar = await Car.findOne({
      registrationNo,
    });

    if (existingCar) {
      return handleSuccess(
        res,
        successMessages.CAR_WITH_REGISTRATION_NUMBER_EXISTS,
        { car: existingCar },
        201
      );
    }

    const car = await Car.create({
      make,
      model,
      fuelType,
      registrationNo,
      mileage,
      imageUrl: "",
      customerId,
    });

    return handleSuccess(
      res,
      successMessages.CAR_CREATED_SUCCESSFULLY,
      { car },
      201
    );
  } catch (error) {
    return handleError(
      res,
      error,
      errorMessages.ERROR_CREATING_CAR
    );
  }
};


// ======================================================
// Upload car images
// ======================================================

exports.uploadCarImages = async (req, res) => {
  try {
    const { carId } = req.params;

    const car = await Car.findById(carId);

    if (!car) {
      return handleBadRequest(
        res,
        null,
        errorMessages.CAR_NOT_FOUND
      );
    }

    if (!req.files || req.files.length === 0) {
      return handleBadRequest(
        res,
        null,
        errorMessages.NO_IMAGE_PROVIDED
      );
    }

    const customerId = car.customerId;
    const registrationNo = car.registrationNo;

    const newImageUrls = [];

    req.files.forEach((file, index) => {
      console.log(
        `File ${index + 1}: ${file.originalname} - Size: ${(
          file.size /
          1024 /
          1024
        ).toFixed(2)}MB`
      );
    });

    for (const file of req.files) {
      const key =
        `uploads/${customerId}/${registrationNo}/${file.originalname}`;

      const imageUrl = await uploadFileToS3(
        process.env.BUCKET_NAME,
        key,
        file.buffer,
        file.mimetype
      );

      newImageUrls.push(imageUrl);
    }

    const existingImages = car.imageUrl
      ? car.imageUrl.split(",")
      : [];

    const updatedImages = [
      ...existingImages,
      ...newImageUrls,
    ];

    car.imageUrl = updatedImages.join(",");

    await car.save();

    return handleSuccess(
      res,
      successMessages.IMAGE_UPLOAD_SUCCESS,
      {
        carId: car.id,

        imageUrl: updatedImages,

        compressionInfo: req.files.map((file) => ({
          filename: file.originalname,

          finalSize:
            `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        })),
      }
    );
  } catch (error) {
    console.error(
      errorMessages.ERROR_UPLOADING,
      error
    );

    return handleError(
      res,
      error,
      errorMessages.FAILED_TO_UPLOAD_IMAGE
    );
  }
};


// ======================================================
// Send car images and invoice
// ======================================================

exports.sendCarImageAndInvoiceFromService =
  async (req, res) => {
    try {
      const { serviceId } = req.params;

      const service = await Service.findById(serviceId)
        .populate({
          path: "carId",

          populate: {
            path: "customerId",

            select:
              "firstName lastName phoneNumber",
          },
        });

      if (
        !service ||
        !service.carId ||
        !service.carId.customerId
      ) {
        return handleNotFound(
          res,
          null,
          errorMessages.MISSING_FIELDS
        );
      }

      const car = service.carId;

      const customer = car.customerId;

      if (!car.imageUrl) {
        return handleBadRequest(
          res,
          null,
          errorMessages.NO_IMAGE_PROVIDED
        );
      }

      const imageList = car.imageUrl
        .split(",")
        .map((url) => url.trim())
        .filter(Boolean);

      if (imageList.length === 0) {
        return handleBadRequest(
          res,
          null,
          errorMessages.NO_IMAGE_FOUND
        );
      }

      const pdfUrl = service.invoiceUrl;

      const invoiceNumber =
        service.invoiceNumber;

      const invoiceAmount =
        service.invoiceAmount;

      for (const url of imageList) {
        await sendImageTemplateMessage(
          customer.phoneNumber,
          url
        );
      }

      if (
        pdfUrl &&
        invoiceNumber &&
        invoiceAmount
      ) {
        await sendInvoiceTemplate(
          customer.phoneNumber,
          customer.firstName,
          customer.lastName,
          invoiceNumber,
          invoiceAmount,
          pdfUrl
        );
      } else {
        console.warn(
          errorMessages.INVOICE_DETAILS_INCOMPLETE
        );
      }

      return handleSuccess(
        res,
        successMessages.IMAGE_SENT_ON_WHATSAPP,
        {
          phoneNumber:
            customer.phoneNumber,

          imagesSent:
            imageList,

          pdfUrl,

          invoiceSent: Boolean(
            pdfUrl &&
            invoiceNumber &&
            invoiceAmount
          ),
        }
      );
    } catch (error) {
      console.error(
        errorMessages.ERROR_SENDING_IMAGE_AND_INVOICE,
        error.stack || error
      );

      return handleError(
        res,
        error,
        errorMessages.FAILED_TO_SENT_IMAGE_ON_WHATSAPP
      );
    }
  };


// ======================================================
// Store invoice data
// ======================================================

exports.storeInvoiceData = [
  async (req, res) => {
    try {
      const {
        invoiceNumber,
        invoiceAmount,
      } = req.body;

      const pdfFile =
        req.files?.invoicePdf?.[0];

      const { serviceId } = req.params;

      if (
        !invoiceNumber ||
        !invoiceAmount ||
        !pdfFile
      ) {
        return handleBadRequest(
          res,
          null,
          errorMessages.MISSING_FIELDS_INVOICE
        );
      }

      const service =
        await Service.findById(
          serviceId
        ).populate(
          "carId",
          "registrationNo"
        );

      if (!service) {
        return handleNotFound(
          res,
          null,
          errorMessages.SERVICE_NOT_FOUND
        );
      }

      const registrationNo =
        service.carId?.registrationNo;

      if (!registrationNo) {
        return handleBadRequest(
          res,
          null,
          errorMessages.CAR_REGISTRATION_NUMBER_MISSING
        );
      }

      const customerId =
        service.customerId;

      const finalInvoiceNumber =
        service.invoiceNumber ||
        invoiceNumber;

      const pdfKey =
        `uploads/${customerId}/${registrationNo}/invoice/${finalInvoiceNumber}.pdf`;

      const pdfUrl =
        await uploadFileToS3(
          process.env.BUCKET_NAME,
          pdfKey,
          pdfFile.buffer,
          pdfFile.mimetype
        );

      service.invoiceNumber =
        finalInvoiceNumber;

      service.invoiceAmount =
        invoiceAmount;

      service.invoiceUrl =
        pdfUrl;

      await service.save();

      return handleSuccess(
        res,
        successMessages.INVOICE_STORED_SUCCESSFULLY,
        {
          invoiceNumber:
            finalInvoiceNumber,

          invoiceAmount,

          pdfUrl,
        }
      );
    } catch (error) {
      return handleError(
        res,
        error,
        errorMessages.FAILED_TO_SAVE_INVOICE ||
          "Server error"
      );
    }
  },
];


// ======================================================
// Get all cars
// ======================================================

exports.getAllCars = async (req, res) => {
  try {
    const cars =
      await Car.find()
        .populate(
          "customerId",
          "firstName lastName email phoneNumber address"
        )
        .lean();

    const formattedCars =
      await Promise.all(
        cars.map(async (car) => {
          const services =
            await Service.find({
              carId: car._id,
            })
              .select(
                "description cost serviceDate"
              )
              .lean();

          return {
            ...car,

            customer:
              car.customerId,

            service:
              services,

            imageUrl:
              car.imageUrl
                ? car.imageUrl.split(",")
                : [],
          };
        })
      );

    if (
      formattedCars.length === 0
    ) {
      return handleSuccess(
        res,
        errorMessages.CAR_NOT_FOUND,
        {
          cars:
            formattedCars,
        },
        200
      );
    }

    return handleSuccess(
      res,
      errorMessages.CAR_RETRIEVED,
      {
        cars:
          formattedCars,
      }
    );
  } catch (error) {
    return handleError(
      res,
      error,
      errorMessages.ERROR_FETCHING_CARS
    );
  }
};


// ======================================================
// Get car by ID
// ======================================================

exports.getCarById = async (req, res) => {
  try {
    const car =
      await Car.findById(
        req.params.id
      )
        .populate(
          "customerId",
          "firstName lastName email phoneNumber address"
        )
        .lean();

    if (!car) {
      return handleNotFound(
        res,
        null,
        errorMessages.CAR_NOT_FOUND
      );
    }

    return handleSuccess(
      res,
      errorMessages.CAR_RETRIEVED,
      {
        car: {
          ...car,

          customer:
            car.customerId,

          imageUrl:
            car.imageUrl
              ? car.imageUrl.split(",")
              : [],
        },
      }
    );
  } catch (error) {
    return handleError(
      res,
      error,
      errorMessages.ERROR_FETCHING_CAR
    );
  }
};


// ======================================================
// Get car by registration number
// ======================================================

exports.getCarByRegistrationNo =
  async (req, res) => {
    try {
      const {
        registrationNo,
      } = req.params;

      if (!registrationNo) {
        return handleBadRequest(
          res,
          null,
          errorMessages.MISSING_REGISTRATION_NO
        );
      }

      const car =
        await Car.findOne({
          registrationNo,
        })
          .populate(
            "customerId",
            "firstName lastName email phoneNumber address"
          )
          .lean();

      if (!car) {
        return handleNotFound(
          res,
          null,
          errorMessages.CAR_NOT_FOUND
        );
      }

      return handleSuccess(
        res,
        errorMessages.CAR_RETRIEVED,
        {
          car: {
            ...car,

            customer:
              car.customerId,

            imageUrl:
              car.imageUrl
                ? car.imageUrl.split(",")
                : [],
          },
        }
      );
    } catch (error) {
      return handleError(
        res,
        error,
        errorMessages.ERROR_FETCHING_CAR
      );
    }
  };


// ======================================================
// Get total cars
// ======================================================

exports.getTotalCars = async (req, res) => {
  try {
    const totalCars =
      await Car.countDocuments();

    return handleSuccess(
      res,
      successMessages.TOTAL_CAR_COUNT,
      {
        totalCars,
      }
    );
  } catch (error) {
    return handleError(
      res,
      error,
      errorMessages.ERROR_FETCHING_TOTAL_CARS
    );
  }
};


// ======================================================
// Get total cars by customer
// ======================================================

exports.getTotalCarsByCustomer =
  async (req, res) => {
    try {
      const {
        customerId,
      } = req.query;

      if (!customerId) {
        return handleBadRequest(
          res,
          null,
          errorMessages.CUSTOMERID_REQUIRED
        );
      }

      const registrationNumbers =
        await Car.distinct(
          "registrationNo",
          {
            customerId,
          }
        );

      const totalCars =
        registrationNumbers.length;

      return handleSuccess(
        res,
        successMessages.TOTAL_UNIQUE_CAR_FOR_CUSTOMER,
        {
          customerId,
          totalCars,
        }
      );
    } catch (error) {
      console.error(
        errorMessages.ERROR_FETCHING_CAR_FOR_CUSTOMER,
        error
      );

      return handleError(
        res,
        error,
        errorMessages.ERROR_FETCHING_TOTAL_CARS ||
          errorMessages.ERROR_FETCHING_CAR_COUNT
      );
    }
  };


// ======================================================
// Cars pagination
// ======================================================

exports.getCarsWithPagination =
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
        cars,
      ] =
        await Promise.all([
          Car.countDocuments(),

          Car.find()
            .sort({
              createdAt: -1,
            })
            .skip(skip)
            .limit(limit),
        ]);

      return res.json({
        message:
          successMessages.CARS_FETCHED_SUCCESSFULLY,

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

        cars,
      });
    } catch (error) {
      console.error(
        error
      );

      return res
        .status(500)
        .json({
          error:
            errorMessages.UNABLE_TO_LOAD_CAR_LIST,
        });
    }
  };


// ======================================================
// Update car
// ======================================================

exports.updateCar = async (req, res) => {
  try {
    // 1. MongoDB se existing car find karo
    const car = await Car.findById(req.params.id);

    if (!car) {
      return handleNotFound(
        res,
        null,
        errorMessages.CAR_NOT_FOUND
      );
    }

    const updates = {};

    // 2. Text fields update karo
    [
      "make",
      "model",
      "fuelType",
      "mileage",
    ].forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    console.log("Update Body:", req.body);
    console.log("Update Files:", req.files);

    // 3. Agar new images Postman se aayi hain
    if (req.files && req.files.length > 0) {
      const newImageUrls = [];

      console.log(
        "UPDATE FILES COUNT:",
        req.files.length
      );

      // 4. Har new image Supabase me upload karo
      for (const file of req.files) {
        console.log(
          "CURRENT FILE NAME:",
          file.originalname
        );

        const key =
          `uploads/${car.customerId}/${car.registrationNo}/${file.originalname}`;

        console.log(
          "UPDATE FILE PATH:",
          key
        );

        const imageUrl = await uploadFileToS3(
          process.env.BUCKET_NAME,
          key,
          file.buffer,
          file.mimetype
        );

        console.log(
          "NEW UPLOADED IMAGE URL:",
          imageUrl
        );

        newImageUrls.push(imageUrl);
      }

      // 5. MongoDB me purane URLs ko new URLs se replace karo
      updates.imageUrl = newImageUrls.join(",");

      console.log(
        "NEW IMAGE URLS:",
        newImageUrls
      );
    }

    // 6. Saare updates existing car par apply karo
    Object.assign(car, updates);

    // 7. MongoDB me save karo
    await car.save();

    console.log(
      "CAR UPDATED SUCCESSFULLY"
    );

    return handleSuccess(
      res,
      successMessages.CAR_UPDATED_SUCCESSFULLY,
      {
        car: {
          ...car.toObject(),

          imageUrl: car.imageUrl
            ? car.imageUrl
                .split(",")
                .map((url) => url.trim())
                .filter(Boolean)
            : [],
        },
      }
    );
  } catch (error) {
    console.error(
      "Car update error:",
      error
    );

    return handleError(
      res,
      error,
      errorMessages.ERROR_UPDATING_CAR
    );
  }
};
// ======================================================
// Delete car image
// ======================================================

exports.deleteCarImage = async (req, res) => {
  try {
    const { carId } = req.params;
    const { imageUrl } = req.body || {};

    if (!imageUrl) {
      return handleBadRequest(
        res,
        null,
        errorMessages.NO_IMAGE_URL_PROVIDED
      );
    }

    const car = await Car.findById(carId);

    if (!car) {
      return handleBadRequest(
        res,
        null,
        errorMessages.CAR_NOT_FOUND
      );
    }

    // MongoDB string ko clean URLs ki array me convert karo
    const existingImages = car.imageUrl
      ? car.imageUrl
          .split(",")
          .map((url) => url.trim())
          .filter(Boolean)
      : [];

    // Request se aaye URL ko bhi clean karo
    const cleanImageUrl = imageUrl.trim();

    const imageExists = existingImages.includes(cleanImageUrl);

    if (!imageExists) {
      console.log("Requested URL:", cleanImageUrl);
      console.log("MongoDB URLs:", existingImages);

      return handleBadRequest(
        res,
        null,
        errorMessages.IMAGE_URL_NOT_FOUND_IN_CAR_RECORD
      );
    }

    const bucketName = process.env.BUCKET_NAME;

if (!bucketName) {
  throw new Error(
    "BUCKET_NAME is missing in environment variables"
  );
}

const url = new URL(cleanImageUrl);

const marker = "/storage/v1/object/public/";

const markerIndex = url.pathname.indexOf(marker);

if (markerIndex === -1) {
  return handleBadRequest(
    res,
    null,
    errorMessages.INVALID_IMAGE_URL_FORMAT
  );
}

// public/ ke baad ka complete path
const pathAfterPublic =
  url.pathname.substring(
    markerIndex + marker.length
  );

// First part bucket name hai
const pathParts = pathAfterPublic.split("/");

const urlBucketName = pathParts.shift();

// Baaki actual file path hai
const filePath = pathParts.join("/");

if (
  urlBucketName !== bucketName ||
  !filePath
) {
  console.log("URL Bucket:", urlBucketName);
  console.log("ENV Bucket:", bucketName);
  console.log("File Path:", filePath);

  return handleBadRequest(
    res,
    null,
    errorMessages.INVALID_IMAGE_URL_FORMAT
  );
}

await deleteFileFromS3(
  bucketName,
  decodeURIComponent(filePath)
);

    // MongoDB se sirf selected URL remove
    const updatedImages = existingImages.filter(
      (url) => url !== cleanImageUrl
    );

    car.imageUrl = updatedImages.join(",");

    await car.save();

    return handleSuccess(
      res,
      successMessages.IMAGE_DELETED_SUCCESSFULLY,
      {
        carId: car.id,
        deletedImageUrl: cleanImageUrl,
        remainingImages: updatedImages,
      }
    );
  } catch (error) {
    console.error(
      "Image deletion failed:",
      error
    );

    return handleError(
      res,
      error,
      errorMessages.FAILED_TO_DELETE_IMAGE
    );
  }
};

// ======================================================
// Delete car
// ======================================================

exports.deleteCar = async (req, res) => {
  try {
    const car =
      await Car.findById(
        req.params.id
      );

    if (!car) {
      return handleNotFound(
        res,
        null,
        errorMessages.CAR_NOT_FOUND
      );
    }
// Get all car image URLs before deleting the car
const imageUrls = car.imageUrl
  ? car.imageUrl.split(",").filter(Boolean)
  : [];

console.log("CAR IMAGES TO DELETE:", imageUrls);
    // MongoDB does not automatically cascade delete
    // referenced Service documents.
    for (const imageUrl of imageUrls) {
  // Supabase public URL se bucket aur file path alag karo
  const publicPath = imageUrl.split(
    "/storage/v1/object/public/"
  )[1];

  if (!publicPath) {
    console.log("Invalid Supabase image URL:", imageUrl);
    continue;
  }

  const [bucketName, ...filePathParts] =
    publicPath.split("/");

  const filePath = filePathParts.join("/");

  console.log("DELETE BUCKET:", bucketName);
  console.log("DELETE FILE PATH:", filePath);

  await deleteFileFromS3(
    bucketName,
    filePath
  );
}
    await Service.deleteMany({
      carId: car._id,
    });

    await Car.findByIdAndDelete(
      car._id
    );

    return handleSuccess(
      res,
      successMessages.CAR_DELETED_SUCCESSFULLY
    );
  } catch (error) {
    return handleError(
      res,
      error,
      errorMessages.ERROR_DELETING_CAR
    );
  }
};