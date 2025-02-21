import { PrismaClient } from "@prisma/client";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import { userFilter } from "../../utils/searchFilter";
import { Request } from "express";
import { IPaginationOptions } from "../../interface/pagination.type";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { fileUploader } from "../../helpers/fileUploader";

const prisma = new PrismaClient();

// Create a new conversation between two users
const createConversationIntoDB = async (user1Id: string, user2Id: string) => {
  // Check if a conversation already exists between these two users
  const existingConversation = await prisma.conversation.findFirst({
    where: {
      OR: [
        { user1Id: user1Id, user2Id: user2Id },
        { user1Id: user2Id, user2Id: user1Id },
      ],
    },
  });

  if (existingConversation) {
    return existingConversation; // If it exists, return the existing conversation
  }

  // Create a new conversation if it doesn't exist
  const result = await prisma.conversation.create({
    data: {
      user1Id,
      user2Id,
    },
  });
  return result;
};

// Get all conversations for a specific user
const getConversationsByUserIdIntoDB = async (userId: string) => {
  const result = await prisma.conversation.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    include: {
      user1: true, // Include details of user1
      user2: true, // Include details of user2
      messages: {
        orderBy: { createdAt: "desc" }, // Include the latest message
        take: 1, // Just get the latest message for preview
      },
    },
  });
  return result;
};

// Get messages for a specific conversation between two users
const getMessagesByConversationIntoDB = async (
  user1Id: string,
  user2Id: string
) => {
  const conversation = await prisma.conversation.findFirst({
    where: {
      OR: [
        { user1Id: user1Id, user2Id: user2Id },
        { user1Id: user2Id, user2Id: user1Id },
      ],
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return conversation || [];
};

// Create a message in a specific conversation
const createMessageIntoDB = async (
  conversationId: string,
  senderId: string,
  receiverId: string,
  content: string,
  file: any
) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  // Create a message in the existing conversation
  const result = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId,
      receiverId,
      content,
      file,
    },
  });

  return result;
};
const getChatUsersForUser = async (userId: string) => {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    include: {
      user1: true,
      user2: true,
      messages: {
        orderBy: { createdAt: "desc" }, // Get the most recent message
        take: 1, // Only return the latest message
      },
    },
  });

  // Extract the unique list of users the user is chatting with and their last message
  const chatUsersData = conversations.map((conversation) => {
    const chatUser =
      conversation.user1Id === userId ? conversation.user2 : conversation.user1;
    const lastMessage = conversation.messages[0]; // The most recent message
    return {
      chatUser,
      lastMessage, // Include the latest message
    };
  });

  return chatUsersData;
};

const deleteConversation = async (id: string) => {
  // Start a transaction
  return await prisma.$transaction(async (prisma) => {
    // Check if the conversation exists
    const isConversationExist = await prisma.conversation.findUnique({
      where: { id },
      include: { messages: true }, // Include messages in the conversation
    });

    if (!isConversationExist) {
      throw new ApiError(httpStatus.NOT_FOUND, "Conversation not found");
    }

    // First, delete all related messages
    await prisma.message.deleteMany({
      where: { conversationId: id },
    });

    // Then, delete the conversation
    const result = await prisma.conversation.delete({
      where: { id },
    });

    if (!result) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Could not delete conversation"
      );
    }

    return result;
  });
};

const countUnreadMessages = async (userId: string, chatroomId: string) => {
  const unreadCount = await prisma.message.count({
    where: {
      conversationId: chatroomId,
      receiverId: userId,
      isRead: false, // Only count unread messages
    },
  });

  return unreadCount;
};
const markMessagesAsRead = async (userId: string, chatroomId: string) => {
  await prisma.message.updateMany({
    where: {
      receiverId: userId,
      conversationId: chatroomId,
      isRead: false, // Only update unread messages
    },
    data: {
      isRead: true, // Mark as read
    },
  });
};

const searchUser = async (req: Request, options: IPaginationOptions) => {
  const { user } = req.query;
  const userFilters = userFilter(user as string);
  const { page, limit, skip } = paginationHelper.calculatePagination(options);

  const result = await prisma.user.findMany({
    where: userFilters,
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    skip,
    select: {
      id: true,
      name: true,
      profileImage: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    meta: {
      total: await prisma.user.count({
        where: userFilters,
      }),
      page,
      limit,
    },
    data: result,
  };
};

const getMyChat = async (userId: string) => {
  const result = await prisma.conversation.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const chatList = await Promise.all(
    result.map(async (conversation) => {
      const lastMessage = conversation.messages[0];
      const targetUserId =
        conversation.user1Id === userId
          ? conversation.user2Id
          : conversation.user1Id;

      const targetUserProfile = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          name: true,
          userName: true,
          email: true,
          profileImage: true,
        },
      });

      return {
        conversationId: conversation.id,
        user: targetUserProfile || null,
        lastMessage: lastMessage ? lastMessage.content : null,
        lastMessageDate: lastMessage ? lastMessage.createdAt : null,
      };
    })
  );

  return chatList;
};

const generateFile = async (userId: string, files: any) => {
  let file = null;

  if (files) {
    try {
      const uploadResult = await fileUploader.uploadToDigitalOcean(files); // Use files.path if needed
      file = uploadResult?.Location || null;
    } catch (error) {
      console.error("File upload failed:", error);
      throw new Error("File upload failed");
    }
  }

  const post = await prisma.generateFile.create({
    data: {
      userId: userId,
      file,
    },
  });

  return post;
};

export const chatServices = {
  createConversationIntoDB,
  getConversationsByUserIdIntoDB,
  getMessagesByConversationIntoDB,
  createMessageIntoDB,
  getChatUsersForUser,
  deleteConversation,
  countUnreadMessages,
  markMessagesAsRead,
  getMyChat,
  searchUser,
  generateFile,
};
