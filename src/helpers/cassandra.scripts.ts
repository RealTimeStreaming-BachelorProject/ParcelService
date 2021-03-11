import cassandra, { Client } from "cassandra-driver";
import logger from "../util/logger";

export const cassandraClient = new cassandra.Client({
  contactPoints: JSON.parse(process.env.CASSANDRA_NODES as string),
  localDataCenter: process.env.CASSANDRA_LOCAL_DATACENTER,
  keyspace: process.env.CASSANDRA_KEYSPACE,
});

export async function initCassandraConnection(): Promise<Client> {
  let cassandraConnected = false;
  let retryCounter = 0;
  const maxRetries = 10;
  const retrySleepDurationMs = 1000;
  while (!cassandraConnected)
    try {
      await cassandraClient.connect();
      return cassandraClient as Client;
    } catch (error) {
      if (retryCounter >= maxRetries) {
        throw error;
      }

      const sleepDuration = retrySleepDurationMs * ++retryCounter;
      logger.warn(
        `Cassandra connection error (${retryCounter}/${maxRetries}). Retrying in ${
          sleepDuration / 1000
        } seconds`
      );
      await sleep(sleepDuration);
    }
  throw new Error("Could not connect to Cassandra");
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
