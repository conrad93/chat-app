const Message = require("../models/message");
const Conversation = require("../models/conversation");
const { getReceiverSocketId, io } = require("../socket/socket");
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
};