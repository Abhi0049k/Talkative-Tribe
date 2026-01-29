import { PrismaClient } from '@prisma/client'

class PrismaInstance {
    private static instance: PrismaClient;
    private constructor() {
        PrismaInstance.instance = new PrismaClient();
    }

    static getInstance(): PrismaClient {
        if (!PrismaInstance.instance) new PrismaInstance();
        return PrismaInstance.instance;
    }

    // Changing this to a static method so we can call it without the wrapper instance
    static connectToDatabase() {
        if (!PrismaInstance.instance) new PrismaInstance();
        PrismaInstance.instance.$connect()
            .then(() => {
                console.log("Connection with the Database established successfully");
            }).catch((err) => {
                console.log("Error: Something went wrong with Database connection!!!");
                console.log(err);
            })
    }
}

const prisma: PrismaClient = PrismaInstance.getInstance();
export const connectDB = PrismaInstance.connectToDatabase;

export default prisma;