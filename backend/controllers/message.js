const Message = require("../models/message");
const Conversation = require("../models/conversation");

const sendMessage = async (req, res) => {
    try {
        const {message} = req.body;
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
            message
        });
        
        if(newMessage){
            conversation.messages.push(newMessage._id);
        }

        await Promise.all([newMessage.save(), conversation.save()]);
        
        res.status(201).json(newMessage);

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

        res.status(200).json(conversation.messages);

    } catch (error) {
        console.log("Error in getMessages", error.message);
        res.status(500).json({error: "Internal server error"});
    }
}

module.exports = {
    sendMessage,
    getMessages
};