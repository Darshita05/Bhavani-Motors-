const bcrypt = require("bcrypt");
const { User, JobCard } = require("../models");

const {
  errorMessages,
  handleError,
  handleSuccess,
  handleNotFound,
  successMessages,
} = require("../controllers/errorController");


// ==========================================
// Get All Users Controller
// ==========================================

exports.getAllUsers = async (req, res) => {
  try {
    // Get all users and exclude passwordHash
    const users = await User.find().select("-passwordHash");

    if (users.length === 0) {
      return handleSuccess(
        res,
        errorMessages.USER_NOT_FOUND,
        { users },
        200
      );
    }

    return handleSuccess(
      res,
      successMessages.USER_FETCHED_SUCCESSFULLY,
      { users },
      200
    );
  } catch (error) {
    return handleError(
      res,
      error,
      errorMessages.SERVER_ERROR
    );
  }
};


// ==========================================
// Get All Staff Controller (with Assigned Tasks)
// ==========================================

exports.getAllStaff = async (req, res) => {
  try {
    const staffMembers = await User.find({
      role: "staff",
    })
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .lean();

    // Fetch all job cards assigned to staff members
    const staffIds = staffMembers.map(s => s._id);
    const assignedJobCards = await JobCard.find({
      assignedTo: { $in: staffIds },
    })
      .populate("customerId", "firstName lastName phoneNumber email")
      .populate("carId", "make model registrationNo fuelType")
      .sort({ createdAt: -1 })
      .lean();

    // Map assigned job cards and counts to each staff member
    const staffWithJobs = staffMembers.map(staff => {
      const jobs = assignedJobCards.filter(
        j => j.assignedTo && j.assignedTo.toString() === staff._id.toString()
      );
      const activeJobs = jobs.filter(
        j => j.status === "Pending" || j.status === "In Progress"
      );
      const completedJobs = jobs.filter(
        j => j.status === "Completed" || j.status === "Delivered"
      );

      return {
        ...staff,
        assignedJobs: jobs,
        assignedJobsCount: jobs.length,
        activeJobsCount: activeJobs.length,
        completedJobsCount: completedJobs.length,
      };
    });

    return handleSuccess(
      res,
      "Staff fetched successfully",
      { staff: staffWithJobs },
      200
    );
  } catch (error) {
    return handleError(
      res,
      error,
      errorMessages.SERVER_ERROR
    );
  }
};


// ==========================================
// Get Staff By ID Controller (with Assigned Tasks)
// ==========================================

exports.getStaffById = async (req, res) => {
  try {
    const { id } = req.params;
    const staffMember = await User.findById(id).select("-passwordHash").lean();

    if (!staffMember) {
      return handleNotFound(
        res,
        null,
        errorMessages.USER_NOT_FOUND
      );
    }

    const assignedJobs = await JobCard.find({ assignedTo: id })
      .populate("customerId", "firstName lastName phoneNumber email")
      .populate("carId", "make model registrationNo fuelType")
      .sort({ createdAt: -1 })
      .lean();

    const activeJobs = assignedJobs.filter(
      j => j.status === "Pending" || j.status === "In Progress"
    );
    const completedJobs = assignedJobs.filter(
      j => j.status === "Completed" || j.status === "Delivered"
    );

    return handleSuccess(
      res,
      "Staff details fetched successfully",
      {
        staff: {
          ...staffMember,
          assignedJobs,
          assignedJobsCount: assignedJobs.length,
          activeJobsCount: activeJobs.length,
          completedJobsCount: completedJobs.length,
        },
      },
      200
    );
  } catch (error) {
    return handleError(
      res,
      error,
      errorMessages.SERVER_ERROR
    );
  }
};


// ==========================================
// Create Staff Controller
// ==========================================

exports.createStaff = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      designation,
    } = req.body;

    // Check required fields
    if (!name || !email || !password || !designation) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, password and designation are required",
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email is already registered",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(
      password,
      12
    );

    // Create new staff
    const staff = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      role: "staff",
      designation: designation || "Mechanic",
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Staff created successfully",
      data: {
        staff: {
          _id: staff._id,
          name: staff.name,
          email: staff.email,
          phone: staff.phone,
          role: staff.role,
          designation: staff.designation,
          isActive: staff.isActive,
        },
      },
    });
  } catch (error) {
    return handleError(
      res,
      error,
      errorMessages.SERVER_ERROR
    );
  }
};


// ==========================================
// Update Staff Controller
// ==========================================

exports.updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      password,
      designation,
      isActive,
    } = req.body;

    const staffMember = await User.findById(id);
    if (!staffMember) {
      return handleNotFound(
        res,
        null,
        errorMessages.USER_NOT_FOUND
      );
    }

    if (email && email.toLowerCase() !== staffMember.email) {
      const emailExists = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: id },
      });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email is already in use by another user",
        });
      }
      staffMember.email = email.toLowerCase();
    }

    if (name) staffMember.name = name;
    if (phone !== undefined) staffMember.phone = phone;
    if (designation) staffMember.designation = designation;
    if (isActive !== undefined) staffMember.isActive = isActive;

    if (password && password.trim().length > 0) {
      staffMember.passwordHash = await bcrypt.hash(password, 12);
    }

    await staffMember.save();

    return res.status(200).json({
      success: true,
      message: "Staff updated successfully",
      data: {
        staff: {
          _id: staffMember._id,
          name: staffMember.name,
          email: staffMember.email,
          phone: staffMember.phone,
          role: staffMember.role,
          designation: staffMember.designation,
          isActive: staffMember.isActive,
        },
      },
    });
  } catch (error) {
    return handleError(
      res,
      error,
      errorMessages.SERVER_ERROR
    );
  }
};


// ==========================================
// Delete User / Staff Controller
// ==========================================

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete user using MongoDB ObjectId
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return handleNotFound(
        res,
        null,
        errorMessages.USER_NOT_FOUND
      );
    }

    return handleSuccess(
      res,
      successMessages.USER_DELETED_SUCCESSFULLY
    );
  } catch (error) {
    return handleError(
      res,
      error,
      errorMessages.SERVER_ERROR
    );
  }
};