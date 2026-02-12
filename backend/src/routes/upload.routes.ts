import { NextFunction, Request, Response, Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

export const uploadRouter = Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

uploadRouter.post("/", upload.array("files", 10), (req: Request, res: Response, next: NextFunction) => {
    try {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
            return next({ status: 400, message: "No files uploaded" });
        }

        const filePaths = files.map(file => `/uploads/${file.filename}`);

        res.status(200).send({
            message: "Files uploaded successfully",
            paths: filePaths
        });
    } catch (err) {
        console.error("Upload error:", err);
        next(err);
    }
});
