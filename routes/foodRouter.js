import express from "express";
import jwt from "jsonwebtoken";
import {
  foodCollection,
  orderCollection,
  requestedCollection,
} from "../config/dbCollections.js";
import { ObjectId } from "mongodb";
import { sendFoodRequestNotification, sendBulkOrderNotification } from "../config/emailService.js";

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

foodRouter.get("/all-foods", async (req, res) => {
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
      .sort(sort || { createdAt: -1 })
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
  const { page, limit } = req.query;

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 12;
  const skip = (pageNum - 1) * limitNum;

  const query = {
    userEmail: email,
  };
  try {
    const totalItems = await foodCollection.countDocuments(query);

    const foods = await foodCollection
      .find(query)
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

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
    res.status(500).send({ message: "Something went wrong on server side" });
  }
});

foodRouter.put("/update-food/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const { foodImg, foodName, quantity, location, exDate, note, description } = updateData;
  const filter = { _id: new ObjectId(id) };

  try {
    const existingFood = await foodCollection.findOne(filter);
    if (!existingFood) {
      return res.status(404).send({ message: "Food item not found" });
    }

    const existingDescription = existingFood.description || existingFood.note;
    const newDescription = description || note;

    const isUnchanged =
      existingFood.foodName === foodName &&
      existingFood.foodImg === foodImg &&
      existingFood.location === location &&
      existingFood.quantity === Number(quantity) &&
      new Date(existingFood.exDate).toISOString().split('T')[0] === new Date(exDate).toISOString().split('T')[0] &&
      existingDescription === newDescription &&
      (existingFood.price || 0) === (updateData.price || 0);

    if (isUnchanged) {
      return res.status(400).send({ message: "No changes detected. Please update at least one field." });
    }

    const options = { upsert: true };
    const updateDoc = {
      $set: {
        foodImg,
        foodName,
        quantity,
        location,
        exDate,
        description: newDescription,
        price: updateData.price,
      },
    };
    const result = await foodCollection.updateOne(filter, updateDoc, options);
    res.send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server Side Error" });
  }
});

foodRouter.delete("/all-foods/:id", async (req, res) => {
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
    const query = { _id: new ObjectId(id) };
    const food = await foodCollection.findOne(query);

    if (!food) {
      return res.status(404).send({ message: "Food item not found" });
    }

    if (food.userEmail === requestedData.user) {
      return res.status(400).send({
        message: "You cannot request your own donated food.",
      });
    }

    const expirationDate = new Date(food.exDate);
    expirationDate.setHours(0, 0, 0, 0);

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

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

// Get orders for report (filtered by month)
foodRouter.get("/orders/report", verifyToken, async (req, res) => {
  const { email, month } = req.query;
  console.log(`Generating report for email: ${email}, month: ${month}`);

  try {
    const query = { userEmail: email };

    // If month is provided (format: YYYY-MM), filter by that month
    if (month) {
      const startDate = new Date(`${month}-01T00:00:00.000Z`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);

      query.orderDate = {
        $gte: startDate.toISOString(),
        $lt: endDate.toISOString(),
      };
      console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    }

    console.log("Query:", JSON.stringify(query));

    const orders = await orderCollection
      .find(query)
      .sort({ orderDate: -1 })
      .toArray();

    console.log(`Found ${orders.length} orders`);

    res.send(orders);
  } catch (err) {
    console.error("Error fetching report data:", err);
    res.status(500).send({ message: "Server Side Error" });
  }
});

foodRouter.get("/orders/:email", verifyToken, async (req, res) => {
  const { email } = req.params;
  const query = {
    user: email,
  };
  try {
    const foods = orderCollection.find(query);
    const result = await foods.toArray();
    res.send(result);
  } catch (err) {
    res.status(501).send({ message: "Server Side Error" });
  }
});

// Get orders by email (using query params)
foodRouter.get("/orders", verifyToken, async (req, res) => {
  const { email, page, limit } = req.query;

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  const query = {
    userEmail: email,
  };
  try {
    const totalItems = await orderCollection.countDocuments(query);

    const orders = await orderCollection
      .find(query)
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    res.send({
      orders,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalItems / limitNum),
        totalItems,
        itemsPerPage: limitNum,
        hasNextPage: pageNum * limitNum < totalItems,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).send({ message: "Server Side Error" });
  }
});



// Update order status
foodRouter.patch("/orders/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
      $set: {
        status: status,
        updatedAt: new Date().toISOString(),
      },
    };

    const result = await orderCollection.updateOne(filter, updateDoc);

    if (result.modifiedCount > 0) {
      res.send({ message: "Status updated successfully" });
    } else {
      res.status(404).send({ message: "Order not found or status unchanged" });
    }
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).send({ message: "Server Side Error" });
  }
});

// Bulk Order Route
foodRouter.post("/orders", async (req, res) => {
  const orderData = req.body;

  try {
    // Validate required fields
    if (!orderData.quantity || !orderData.deliveryDate || !orderData.address) {
      return res.status(400).send({ message: "Missing required fields" });
    }

    if (orderData.ownerEmail === orderData.userEmail) {
      return res.status(400).send({
        message: "You cannot order your own food.",
      });
    }

    // Create order document
    const order = {
      ...orderData,
      quantity: Number(orderData.quantity),
      totalPrice: Number(orderData.totalPrice),
      orderDate: new Date().toISOString(),
      status: "Pending",
    };

    const result = await orderCollection.insertOne(order);

    if (result.acknowledged) {
      sendBulkOrderNotification({
        ownerEmail: orderData.ownerEmail,
        ownerName: orderData.ownerName,
        foodName: orderData.foodName,
        customerName: orderData.userName,
        customerEmail: orderData.userEmail,
        quantity: orderData.quantity,
        deliveryDate: orderData.deliveryDate,
        deliveryAddress: orderData.address,
        totalPrice: orderData.totalPrice,
        notes: orderData.description,
      }).catch((err) => {
        console.error("Failed to send bulk order email notification:", err);
        // Don't fail the order if email fails
      });

      res.send({ message: "Order placed successfully", orderId: result.insertedId });
    } else {
      res.status(500).send({ message: "Failed to place order" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server Side Error" });
  }
});


export default foodRouter;
