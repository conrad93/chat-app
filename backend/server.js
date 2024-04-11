const express = require("express");
const dotenv = require("dotenv");

dotenv.config();
const PORT = process.env.PORT || 5000;
const connectMongoDB = require("./db/connectDB");
const app = express();
app.use(express.json());

const authRoutes = require("./routes/auth");

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.listen(PORT, () => {
    connectMongoDB();
    console.log(`Server running on port ${PORT}`);
});