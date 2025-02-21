import express from "express";
import { AuthRouters } from "../modules/auth/auth.routes";
import { UserRouters } from "../modules/user/user.routes";
import { PostRouters } from "../modules/post/post.routes";
import { LikeRouters } from "../modules/like/like.routes";

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
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
