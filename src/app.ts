import Koa from "koa";
import Router from "koa-router";
import bodyParser from "koa-bodyparser";

const app = new Koa();
const router = new Router();
const PORT = 3001;

app.use(bodyParser());

router.get("/", async (ctx) => {
  ctx.body = {
    status: true,
    message: "Hello, World!",
  };
});

app.use(router.routes());
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
