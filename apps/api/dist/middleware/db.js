import { db } from "../db.js";
export const dbMiddleware = async (c, next) => {
    c.set("db", db);
    await next();
};
