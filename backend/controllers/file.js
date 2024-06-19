const fs = require("fs");

const uploadRecording = async (req, res) => {
    try {
        const {roomId} = req.body;
        const videoFile = req.file;
        if(!fs.existsSync("uploads")) {
            fs.mkdirSync("uploads");
        }
        fs.renameSync(videoFile.path, `uploads/${videoFile.originalname}`);

        res.status(200).json({message: "File uploaded successfully"});
        
    } catch (error) {
        console.log("Error in uploadRecording", error.message);
        res.status(500).json({error: "Internal server error"});
    }
};

module.exports = {
    uploadRecording
};