const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const path = require("path");

dotenv.config();
const PORT = process.env.PORT || 5000;
const connectMongoDB = require("./db/connectDB");
const {app, server} = require("./socket/socket");
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.resolve(__dirname, "../frontend/dist/chat-app")));

const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/message");
const userRoutes = require("./routes/user");
const fileRoutes = require("./routes/file");

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/file", fileRoutes);


app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend/dist/chat-app/index.html"));
});

server.listen(PORT, () => {
    connectMongoDB();
    console.log(`Server running on port ${PORT}`);
});