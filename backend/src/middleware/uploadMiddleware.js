const multer = require("multer");
const sharp = require("sharp");

// Configure multer to store files in memory
const storage = multer.memoryStorage();

// Allow only specific image MIME types
const allowedMimeTypes = [
  "image/apng",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/octet-stream",
];

// 2MB limit for final compressed image
const FILE_SIZE_LIMIT = 2 * 1024 * 1024; // 2MB
// 15MB limit for initial upload (before compression)
const INITIAL_FILE_SIZE_LIMIT = 15 * 1024 * 1024; // 15MB

// File filter function
const fileFilter = (req, file, callback) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return callback(
      new Error("Invalid file type. Only image files are allowed."),
      false
    );
  }
  callback(null, true); // File type is valid
};

// Multer upload middleware with higher initial limit
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: INITIAL_FILE_SIZE_LIMIT, // Allow larger files initially
  },
});

// Image compression middleware
const compressImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    const compressedFiles = [];

    for (const file of req.files) {
      let compressedBuffer = file.buffer;
      let quality = 90;
      let width = null;

      // Keep compressing until file size is under 2MB
      while (compressedBuffer.length > FILE_SIZE_LIMIT && quality > 10) {
        // Determine initial resize dimensions if image is very large
        if (!width) {
          const metadata = await sharp(file.buffer).metadata();
          if (metadata.width > 1920) {
            width = 1920; // Resize to max 1920px width
          } else if (metadata.width > 1200) {
            width = 1200; // Resize to max 1200px width
          }
        }

        const sharpInstance = sharp(file.buffer);

        // Apply resizing if needed
        if (width) {
          sharpInstance.resize(width, null, {
            withoutEnlargement: true,
            fit: "inside",
          });
        }

        // Compress based on format
        if (file.mimetype === "image/jpeg" || file.mimetype === "image/jpg") {
          compressedBuffer = await sharpInstance
            .jpeg({ quality: quality })
            .toBuffer();
        } else if (file.mimetype === "image/png") {
          compressedBuffer = await sharpInstance
            .png({
              quality: quality,
              compressionLevel: 9,
              palette: true, // Convert to 8-bit palette if possible
            })
            .toBuffer();
        } else if (file.mimetype === "image/webp") {
          compressedBuffer = await sharpInstance
            .webp({ quality: quality })
            .toBuffer();
        } else {
          // For other formats, convert to JPEG
          compressedBuffer = await sharpInstance
            .jpeg({ quality: quality })
            .toBuffer();
          file.mimetype = "image/jpeg";
          file.originalname = file.originalname.replace(/\.[^/.]+$/, ".jpg");
        }

        // Reduce quality for next iteration if needed
        quality -= 10;

        // If still too large and quality is very low, reduce dimensions further
        if (compressedBuffer.length > FILE_SIZE_LIMIT && quality <= 20) {
          width = width ? Math.floor(width * 0.8) : 800;
          quality = 70; // Reset quality when reducing dimensions
        }
      }

      // Check if compression was successful
      if (compressedBuffer.length > FILE_SIZE_LIMIT) {
        return res.status(400).json({
          status: "error",
          message: `Unable to compress image ${file.originalname} to under 2MB. Please use a smaller image.`,
        });
      }

      // Create compressed file object
      const compressedFile = {
        ...file,
        buffer: compressedBuffer,
        size: compressedBuffer.length,
      };

      compressedFiles.push(compressedFile);
    }

    // Replace original files with compressed files
    req.files = compressedFiles;
    next();
  } catch (error) {
    console.error("Image compression error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to compress images",
    });
  }
};

// Custom error handler for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        status: "error",
        message: `File size exceeds limit of ${
          INITIAL_FILE_SIZE_LIMIT / (1024 * 1024)
        }MB`,
      });
    }
    return res.status(400).json({ status: "error", message: err.message });
  } else if (err) {
    return res.status(400).json({ status: "error", message: err.message });
  }
  next(); // Proceed if no error
};

module.exports = {
  upload,
  compressImages,
  handleUploadError,
};
