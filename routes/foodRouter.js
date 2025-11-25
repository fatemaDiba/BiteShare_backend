import express from "express";
import jwt from "jsonwebtoken";
import {
  foodCollection,
  requestedCollection,
} from "../config/dbCollections.js";
import { ObjectId } from "mongodb";
import { sendFoodRequestNotification } from "../config/emailService.js";

const foodRouter = express.Router();

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }
  jwt.verify(token, process.env.JWT_ACCESS_TOKEN, (err, decode) => {
    if (err) {
      console.log(err);
      return res.status(401).send({ message: "Unauthorized Access" });
    }
    next();
  });
};

foodRouter.get("/available-foods", async (req, res) => {
  const { status, search, location, sortBy, sortOrder, page, limit } =
    req.query;

  try {
    // Build dynamic query
    const query = {};

    // Filter by status (if provided)
    if (status) {
      query.status = status;
    }

    // Filter by location (case-insensitive partial match)
    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    // Search in food name or location (case-insensitive)
    if (search) {
      query.$or = [
        { foodName: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    // Build sort options
    const sort = {};
    if (sortBy) {
      // sortOrder: 'asc' = 1, 'desc' = -1, default to -1 (descending)
      sort[sortBy] = sortOrder === "asc" ? 1 : -1;
    }

    // Pagination parameters
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 12;
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination metadata
    const totalItems = await foodCollection.countDocuments(query);

    // Execute query with pagination
    const foods = await foodCollection
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .toArray();

    // Send response with pagination metadata
    res.send({
      foods,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalItems / limitNum),
        totalItems,
        itemsPerPage: limitNum,
        hasNextPage: pageNum * limitNum < totalItems,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching foods:", error);
    res.status(500).send({ message: "Something went wrong on server side" });
  }
});

foodRouter.get("/featured-foods", async (req, res) => {
  try {
    const foods = await foodCollection
      .find()
      .sort({ quantity: -1 })
      .limit(4)
      .toArray();
    res.send(foods);
  } catch (error) {
    res.status(500).send({ message: "Something went wrong on server side" });
  }
});

foodRouter.post("/add-food", async (req, res) => {
  const data = req.body;

  try {
    const result = await foodCollection.insertOne({
      ...data,
      price: Number(data.price),
      quantity: Number(data.quantity),
      status: "Available",
    });
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Something went wrong on server side" });
  }
});

foodRouter.post("/food-details", async (req, res) => {
  const id = req.body;

  const query = { _id: new ObjectId(id) };
  try {
    const food = await foodCollection.findOne(query);
    res.send(food);
  } catch (err) {
    res.status(501).send({ message: "Something went wrong on server side" });
  }
});

foodRouter.post("/manage-myfoods", verifyToken, async (req, res) => {
  const { email } = req.body;
  const query = {
    userEmail: email,
  };
  try {
    const foods = foodCollection.find(query);
    const result = await foods.toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Something went wrong on server side" });
  }
});

foodRouter.put("/update-food/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const { foodImg, foodName, quantity, location, exDate, note } = updateData;
  const filter = { _id: new ObjectId(id) };

  try {
    const options = { upsert: true };
    const updateDoc = {
      $set: {
        foodImg,
        foodName,
        quantity,
        location,
        exDate,
        note,
      },
    };
    const result = await foodCollection.updateOne(filter, updateDoc, options);
    res.send(result);
  } catch (err) {
    res.status(501).send({ message: "Server Side Error" });
  }
});

foodRouter.delete("/available-foods/:id", async (req, res) => {
  const { id } = req.params;
  const query = { _id: new ObjectId(id) };
  try {
    const result = await foodCollection.deleteOne(query);
    res.send(result);
  } catch (err) {
    res.status(501).send({ message: "Server Side Error" });
  }
});

foodRouter.post("/request-food/:id", async (req, res) => {
  const { id } = req.params;
  const requestedData = req.body;

  try {
    // First, fetch the food item to check if it's expired
    const query = { _id: new ObjectId(id) };
    const food = await foodCollection.findOne(query);

    if (!food) {
      return res.status(404).send({ message: "Food item not found" });
    }

    // Check if the food has expired
    // exDate is now in ISO format
    const expirationDate = new Date(food.exDate);
    expirationDate.setHours(0, 0, 0, 0); // Reset time to compare only dates

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Reset time to compare only dates

    if (expirationDate < currentDate) {
      return res.status(400).send({
        message: "This food item has expired and cannot be requested",
      });
    }

    const result = await requestedCollection.insertOne(requestedData);
    if (result.acknowledged) {
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: "Requested",
        },
      };
      const updatedData = await foodCollection.updateOne(
        query,
        updateDoc,
        options
      );

      // Send email notification to food donor (non-blocking)
      sendFoodRequestNotification({
        donorEmail: food.userEmail,
        donorName: food.userName,
        foodName: food.foodName,
        requesterEmail: requestedData.user,
        requestDate: requestedData.currentDate,
        note: requestedData.note,
        quantity: food.quantity,
        location: food.location,
      }).catch((err) => {
        console.error("Failed to send email notification:", err);
        // Don't fail the request if email fails
      });

      if (updatedData.modifiedCount > 0) {
        return res.send({ message: "Successfully updated status" });
      } else {
        return res.send({
          message: "Failed to update status.",
        });
      }
    } else {
      return res.send({ message: "Failed to request food" });
    }
  } catch (err) {
    res.status(501).send({ message: "Server Side Error" });
  }
});

foodRouter.post("/requested-foods", verifyToken, async (req, res) => {
  const { email } = req.body;
  const query = {
    user: email,
  };
  try {
    const foods = requestedCollection.find(query);
    const result = await foods.toArray();
    res.send(result);
  } catch (err) {
    res.status(501).send({ message: "Server Side Error" });
  }
});

export default foodRouter;
