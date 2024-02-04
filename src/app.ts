import Koa from "koa";
import Router from "koa-router";
import bodyParser from "koa-bodyparser";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { ulid } from "ulid";
import jwt from "jsonwebtoken";

dotenv.config();
const app = new Koa();
const router = new Router();
const prisma = new PrismaClient();
const PORT = process.env.APP_PORT;

app.use(bodyParser());

const authenticate: Koa.Middleware = async (ctx, next) => {
  const token = ctx.request.header.authorization?.replace("Bearer ", "");
  if (!token) {
    ctx.status = 401;
    ctx.body = {
      status: false,
      statusCode: 401,
      message: "Unauthorized",
    };
    return;
  }

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    ctx.state.user = decoded.data;
    await next();
  } catch (error) {
    ctx.status = 401;
    ctx.body = {
      status: false,
      statusCode: 401,
      message: "Invalid token",
    };
  }
};

router.get("/", (ctx) => {
  ctx.body = {
    status: true,
    message: "Hello Koa!",
  };
});

router.get("/users", async (ctx) => {
  const users = await prisma.user.findMany();
  ctx.body = users;
});

type RegisterUser = {
  name: string;
  username: string;
  password: string;
};

router.post("/users", async (ctx) => {
  const id = ulid();
  const { name, username, password }: RegisterUser = ctx.request.body as RegisterUser;
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await prisma.user.create({
    data: {
      id,
      name,
      username,
      password: hashedPassword,
    },
  });
  ctx.body = newUser;
});

router.get("/users/:id", async (ctx) => {
  const id = ctx.params.id;
  const user = await prisma.user.findUnique({ where: { id } });
  ctx.body = user;
});

type UpdateUser = {
  name?: string;
  username?: string;
};

router.patch("/users/:id", async (ctx) => {
  const id = ctx.params.id;
  const { name, username }: UpdateUser = ctx.request.body as UpdateUser;
  const updatedUser = await prisma.user.update({
    where: { id },
    data: { name, username },
  });
  ctx.body = updatedUser;
});

router.delete("/users/:id", async (ctx) => {
  const id = ctx.params.id;
  await prisma.user.delete({ where: { id } });
  ctx.body = {
    status: true,
    message: `User with id ${id} deleted successfully`,
  };
});

type LoginUser = {
  username: string;
  password: string;
};

router.post("/login", async (ctx) => {
  const { username, password }: LoginUser = ctx.request.body as LoginUser;
  const user: any = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    ctx.status = 401;
    ctx.body = {
      status: false,
      statusCode: 401,
      message: "Invalid credentials",
    };
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (isPasswordValid) {
    const payload = {
      data: {
        id: user.id,
        name: user.name,
        username: user.username,
      },
    };
    const secret = process.env.JWT_SECRET!;
    const token = jwt.sign(payload, secret, { expiresIn: "1h" });
    ctx.status = 200;
    ctx.body = {
      status: true,
      statusCode: 200,
      data: {
        id: user.id,
        name: user.name,
        username: user.username,
      },
      token,
    };
    return;
  } else {
    ctx.status = 401;
    ctx.body = {
      status: false,
      statusCode: 401,
      message: "Invalid credentials",
    };
    return;
  }
});

router.get("/me", authenticate, (ctx) => {
  ctx.body = ctx.state.user;
});

app.use(router.routes());
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on("SIGTERM", () => {
  prisma.$disconnect();
});
