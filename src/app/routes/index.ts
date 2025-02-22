import express from "express";
import { AuthRouters } from "../modules/auth/auth.routes";
import { UserRouters } from "../modules/user/user.routes";
import { PostRouters } from "../modules/post/post.routes";
import { LikeRouters } from "../modules/like/like.routes";
import { CommentRouters } from "../modules/comment/comment.routes";
import { ShareRouters } from "../modules/share/share.routes";
import { SavedPostRouters } from "../modules/savedPost/save.routes";
import { ChatRouters } from "../modules/chat/chat.route";
import { FollowRouters } from "../modules/follow/follow.routes";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRouters,
  },
  {
    path: "/users",
    route: UserRouters,
  },
  {
    path: "/posts",
    route: PostRouters,
  },
  {
    path: "/likes",
    route: LikeRouters,
  },
  {
    path: "/comments",
    route: CommentRouters,
  },
  {
    path: "/shares",
    route: ShareRouters,
  },
  {
    path: "/saved",
    route: SavedPostRouters,
  },
  {
    path: "/chats",
    route: ChatRouters,
  },
  {
    path: "/follows",
    route: FollowRouters,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
