const mongoose = require("mongoose");
const { Item } = require("../models");

const {
  handleSuccess,
  handleBadRequest,
  handleError,
  handleNotFound,
  errorMessages,
  successMessages,
} = require("../controllers/errorController");

// Create New Item
exports.createItem = async (req, res) => {
  try {
    const { itemName, itemDetails } = req.body;

    if (!itemName) {
      return handleBadRequest(
        res,
        null,
        errorMessages.MISSING_ITEM_FIELDS
      );
    }

    const item = await Item.create({
      itemName,
      itemDetails: itemDetails || null,
    });

    return handleSuccess(
      res,
      successMessages.ITEM_CREATED_SUCCESSFULLY,
      { item },
      201
    );
  } catch (error) {
    return handleError(
      res,
      error,
      errorMessages.ERROR_CREATING_ITEM
    );
  }
};

// Get All Items With Search And Pagination
exports.getAllItems = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);

    const { search } = req.query;

    const skip = (page - 1) * limit;

    const filter = {};

    if (search) {
      filter.$or = [
        {
          itemName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          itemDetails: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const [items, count] = await Promise.all([
      Item.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Item.countDocuments(filter),
    ]);

    return handleSuccess(
      res,
      successMessages.ITEMS_FETCHED_SUCCESSFULLY,
      {
        items,

        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      },
      200
    );
  } catch (error) {
    return handleError(
      res,
      error,
      errorMessages.ERROR_FETCHING_ITEMS
    );
  }
};

// Get Item By ID
exports.getItemById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return handleBadRequest(
        res,
        null,
        "Invalid item ID format"
      );
    }

    const item = await Item.findById(id);

    if (!item) {
      return handleNotFound(
        res,
        null,
        errorMessages.ITEM_NOT_FOUND
      );
    }

    return handleSuccess(
      res,
      successMessages.ITEM_FETCHED_SUCCESSFULLY,
      { item },
      200
    );
  } catch (error) {
    return handleError(
      res,
      error,
      errorMessages.ERROR_FETCHING_ITEM
    );
  }
};

// Update Item
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemName, itemDetails } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return handleBadRequest(
        res,
        null,
        "Invalid item ID format"
      );
    }

    if (!itemName) {
      return handleBadRequest(
        res,
        null,
        errorMessages.MISSING_ITEM_FIELDS
      );
    }

    const item = await Item.findByIdAndUpdate(
      id,
      {
        itemName,
        ...(itemDetails !== undefined && {
          itemDetails,
        }),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!item) {
      return handleNotFound(
        res,
        null,
        errorMessages.ITEM_NOT_FOUND
      );
    }

    return handleSuccess(
      res,
      successMessages.ITEM_UPDATED_SUCCESSFULLY,
      { item },
      200
    );
  } catch (error) {
    return handleError(
      res,
      error,
      errorMessages.ERROR_UPDATING_ITEM
    );
  }
};

// Delete Item
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return handleBadRequest(
        res,
        null,
        "Invalid item ID format"
      );
    }

    const item = await Item.findByIdAndDelete(id);

    if (!item) {
      return handleNotFound(
        res,
        null,
        errorMessages.ITEM_NOT_FOUND
      );
    }

    return handleSuccess(
      res,
      successMessages.ITEM_DELETED_SUCCESSFULLY,
      {},
      200
    );
  } catch (error) {
    return handleError(
      res,
      error,
      errorMessages.ERROR_DELETING_ITEM
    );
  }
};