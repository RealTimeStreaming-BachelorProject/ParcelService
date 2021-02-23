import express from "express";
import logger from "./util/logger";
import cassandra from "cassandra-driver";
import cors from "cors";
import { initDB } from "./cassandra.scripts";
import { registerControllers } from "./controllers";

const cassandraClient = new cassandra.Client({
  contactPoints: JSON.parse(process.env.CASSANDRA_NODES as string),
  localDataCenter: process.env.CASSANDRA_LOCAL_DATACENTER,
});

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT ?? 9999;

(async () => {
  await cassandraClient.connect();
  await initDB(cassandraClient);
  registerControllers(app)
  app.listen(PORT, () => {
      logger.info("🚀 PackageService Running")
  })
})().catch((e) => {
  logger.error(e.message);
});
