if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
import express from "express";
import logger from "./util/logger";
import cors from "cors";
import { registerControllers } from "./controllers";
import { initCassandraConnection } from "./helpers/cassandra.scripts";
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PACKAGE_SERVICE_PORT ?? 9999;

(async () => {
  const cassandraClient = await initCassandraConnection();
  registerControllers(app);
  app.listen(PORT, () => {
    logger.info(`🚀 PackageService Running On Port ${PORT}`);
  });
})().catch((e) => {
  logger.error(e);
});
