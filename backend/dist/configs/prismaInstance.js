"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
prisma.$connect().then(() => {
    console.log("Connection with the Database established");
}).catch((err) => {
    console.log("Something went wrong with the database connection");
    console.log(err);
});
exports.default = prisma;
