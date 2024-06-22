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

    connectToDatabase() {
        PrismaInstance.instance.$connect()
            .then(() => {
                console.log("connection with the Database established");
            }).catch((err) => {
                console.log("Something went wrong!!!");
                console.log(err);
            })
    }
}

const prisma: PrismaClient = PrismaInstance.getInstance();

export default prisma;