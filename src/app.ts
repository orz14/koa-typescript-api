import Koa from "koa";
import Router from "koa-router";
import bodyParser from "koa-bodyparser";
import dotenv from "dotenv";
// import { PrismaClient } from "@prisma/client";

dotenv.config();
const app = new Koa();
const router = new Router();
// const prisma = new PrismaClient();
const PORT = process.env.APP_PORT;

app.use(bodyParser());

router.get("/", async (ctx) => {
  ctx.body = {
    status: true,
    message: "Hello Koa!",
  };
});

app.use(router.routes());
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// process.on("SIGTERM", () => {
//   prisma.$disconnect();
// });
