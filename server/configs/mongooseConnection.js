import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const connectDB = async () => {
    try {
        const DB = await mongoose.connect(process.env.MONGOOSE_URL);
        console.log(DB.connection.host);
        console.log(DB.connection.name);

    } catch (error) {
        console.log("Mongo connection error", error);
    }
}

export default connectDB;