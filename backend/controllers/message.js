const Message = require("../models/message");
const Conversation = require("../models/conversation");
const { getReceiverSocketId, io } = require("../socket/socket");
const Bucket = require("../utils/bucket");
const path = require("path");
const mime = require("mime-types");
const {encrypt, decrypt} = require("../utils/cryptography");

const sendMessage = async (req, res) => {
    try {
        const {message} = req.body;
        const decryptedMessage = decrypt(message);
        const {id: receiverId} = req.params;
        const senderId = req.user._id;

        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        });

        if(!conversation){
            conversation = await Conversation.create({
                participants: [senderId, receiverId]
            });
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            message: decryptedMessage
        });
        
        if(newMessage){
            conversation.messages.push(newMessage._id);
        }

        await Promise.all([newMessage.save(), conversation.save()]);

        const receiverSocketId = getReceiverSocketId(receiverId);
        if(receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }
        
        res.status(201).json(encrypt(JSON.stringify(newMessage)));

    } catch (error) {
        console.log("Error in sendMessage", error.message);
        res.status(500).json({error: "Internal server error"});
    }
}

const sendImage = async (req, res) => {
    try {
        const {id: receiverId} = req.params;
        const senderId = req.user._id;
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: Date.now().toString() + path.extname(req.file.originalname),
            Body: req.file.buffer,
        };
    
        Bucket.upload(params, async (err, data) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error uploading file');
            }
            
            let conversation = await Conversation.findOne({
                participants: { $all: [senderId, receiverId] }
            });
    
            if(!conversation){
                conversation = await Conversation.create({
                    participants: [senderId, receiverId]
                });
            }
    
            const newMessage = new Message({
                senderId,
                receiverId,
                message: data.Key,
                isImage: true
            });
            
            if(newMessage){
                conversation.messages.push(newMessage._id);
            }
    
            await Promise.all([newMessage.save(), conversation.save()]);
    
            const receiverSocketId = getReceiverSocketId(receiverId);
            if(receiverSocketId) {
                io.to(receiverSocketId).emit("newMessage", newMessage);
            }
            
            res.status(201).json(newMessage);
        });
        
    } catch (error) {
        console.log("Error in sendMessage", error.message);
        res.status(500).json({error: "Internal server error"});
    }
}

const showImage = async (req, res) => {
    try {
        const {name} = req.params;
        const contentType = mime.contentType(name) || 'application/octet-stream';
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: name,
            ResponseContentType: contentType
        };
    
        Bucket.getObject(params, (err, data) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error fetching file');
            }
    
            res.writeHead(200, {'Content-Type': contentType});
            res.write(data.Body, 'binary');
            res.end();
        });
        
    } catch (error) {
        console.log("Error in showImage", error.message);
        res.status(500).json({error: "Internal server error"});
    }
}

const getMessages = async (req, res) => {
    try {
        const {id: userToChatId} = req.params;
        const senderId = req.user._id;

        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, userToChatId] }
        }).populate("messages");
        
        if(!conversation) return res.status(200).json([]);

        let messages = conversation.messages.map(message => encrypt(JSON.stringify(message)));

        res.status(200).json(messages);

    } catch (error) {
        console.log("Error in getMessages", error.message);
        res.status(500).json({error: "Internal server error"});
    }
}

module.exports = {
    sendMessage,
    getMessages,
    sendImage,
    showImage
};