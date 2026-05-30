import mongoose from "mongoose";

const ConnectDb = async () => {
    try {
        const conn  = await mongoose.connect(process.env.MONGO_URI);
        if(conn) console.log("Connected to MongoDB",conn.connection.host);
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
};

export default ConnectDb;