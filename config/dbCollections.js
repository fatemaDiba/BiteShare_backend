import { getDB } from "./db.config.js";
const db = getDB();
export const foodCollection = db.collection("foodCollection");
export const orderCollection = db.collection("orderCollection");
export const requestedCollection = db.collection("requestedCollection");
