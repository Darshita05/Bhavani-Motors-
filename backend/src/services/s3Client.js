const { supabase } = require("../config/supabaseConfig");

// ======================================================
// Upload file to Supabase Storage
// ======================================================
async function uploadFileToS3(
  bucketName,
  key,
  fileBuffer,
  contentType
) {
  try {
    let finalContentType = contentType;
    const lowerKey = key.toLowerCase();

    if (
      lowerKey.endsWith(".jpg") ||
      lowerKey.endsWith(".jpeg")
    ) {
      finalContentType = "image/jpeg";
    } else if (lowerKey.endsWith(".png")) {
      finalContentType = "image/png";
    } else if (lowerKey.endsWith(".webp")) {
      finalContentType = "image/webp";
    } else if (lowerKey.endsWith(".pdf")) {
      finalContentType = "application/pdf";
    }

    console.log("Bucket Name:", bucketName);
    console.log("File Path:", key);
    console.log("Content Type:", finalContentType);

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(key, fileBuffer, {
        contentType: finalContentType,
        upsert: true,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    console.log("Uploaded URL:", publicUrlData.publicUrl);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Upload service error:", error);
    throw error;
  }
}

// ======================================================
// Delete file from Supabase Storage
// ======================================================
async function deleteFileFromS3(bucketName, key) {
  try {
    console.log("Delete Bucket:", bucketName);
    console.log("Delete File Path:", key);

    const { data, error } = await supabase.storage
      .from(bucketName)
      .remove([key]);

    if (error) {
      console.error("Supabase delete error:", error);
      throw error;
    }

    console.log("Deleted file:", data);

    return true;
  } catch (error) {
    console.error("Delete service error:", error);
    throw error;
  }
}

module.exports = {
  uploadFileToS3,
  deleteFileFromS3,
};