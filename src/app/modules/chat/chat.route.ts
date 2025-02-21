import { Router } from 'express';
import { ChatControllers } from './chat.controller';
import auth from '../../middlewares/auth';
import { fileUploader } from "../../helpers/fileUploader";

const router = Router();

// Create a new chatroom (conversation)
router.post("/conversation", ChatControllers.createConversation);

// Get all chat rooms (conversations) for a user
router.get("/conversation", ChatControllers.getConversationByUserId);

// Get a specific chatroom by conversation ID
router.get(
  "/conversation/:id1/:id2",
  ChatControllers.getSingleMassageConversation
);

// Send a message in a specific chatroom (conversation)
router.post("/message", ChatControllers.sendMessage);

// Get all messages for a specific chatroom
router.get("/:chatroomId/messages", ChatControllers.getMessages);

router.get("/:id/chatUsers", ChatControllers.getUserChat);

router.delete("/conversation/:id", ChatControllers.deleteConversion);
router.get("/getMyChat", auth(), ChatControllers.getMyChat);
router.get("/searchUser", ChatControllers.searchUser);
router.post(
  "/generateFile",
  auth(),
  fileUploader.uploadFile,
  ChatControllers.generateFile
);


export const ChatRouters = router;
