if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
import express from "express";
import logger from "./util/logger";
import cors from "cors";
import { registerControllers } from "./controllers";
import { initDBConnection } from "./helpers/database.scripts";
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PACKAGE_SERVICE_PORT ?? 80;

(async () => {
  await initDBConnection();
  registerControllers(app);
  app.listen(PORT, () => {
    logger.info(`🚀 PackageService Running On Port ${PORT}`);
  });
})().catch((e) => {
  logger.error(e);
});
