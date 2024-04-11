const mongoose = require("mongoose");

const connectMongoDB = async () => {
    try {
        
        // &appName=Cluster0
        await mongoose.connect(process.env.MONGO_DB_URI);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.log("Error connecting to MongoDB", error.message);
    }
}

module.exports = connectMongoDB;