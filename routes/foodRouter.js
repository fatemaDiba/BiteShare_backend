import express from "express";
import jwt from "jsonwebtoken";
import {
  foodCollection,
  requestedCollection,
} from "../config/dbCollections.js";
import { ObjectId } from "mongodb";

const foodRouter = express.Router();

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }
  jwt.verify(token, process.env.JWT_ACCESS_TOKEN, (err, decode) => {
    if (err) {
      console.log(err)
      return res.status(401).send({ message: "Unauthorized Access" });
    }
    next();
  });
};

foodRouter.get("/available-foods", async (req, res) => {
  const query = { status: "Available" };
  try {
    const foods = await foodCollection.find(query).toArray();
    res.send(foods);
  } catch (error) {
    res.status(500).send({ message: "Something went wrong on server side" });
  }
});

foodRouter.post("/sort-by-quantity", async (req, res) => {
  const { sortValue } = req.body;
  const query = { status: "Available" };
  if (!sortValue) {
    const foods = await foodCollection.find(query).toArray();
    return res.send(foods);
  }
  const sortedFood = await foodCollection
    .find(query)
    .sort({ quantity: sortValue })
    .toArray();
  res.send(sortedFood);
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
    const result = await requestedCollection.insertOne(requestedData);
    if (result.acknowledged) {
      const query = { _id: new ObjectId(id) };
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
