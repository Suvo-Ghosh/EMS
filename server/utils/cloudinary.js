import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


const storage = multer.memoryStorage();
export const upload = multer({
    storage,
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB limit
    },
});

export const uploadToCloudinary = (buffer, folder = "ems/profile-images") =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "image",
                transformation: [
                    { width: 512, height: 512, crop: "fill", gravity: "face" }, // nice cropped avatar
                ],
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        stream.end(buffer);
    });

