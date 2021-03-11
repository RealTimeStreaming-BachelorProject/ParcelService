import { Pool } from "pg";
import logger from "../util/logger";

export const pool = new Pool();

export async function initDBConnection() {
  let pgConnected = false;
  let retryCounter = 0;
  const maxRetries = 10;
  const retrySleepDurationMs = 1000;
  while (!pgConnected)
    try {
      const { rows } = await pool.query("SELECT NOW()");
      logger.info(`Sucessfully connected to database at ${new Date(rows[0].now).toTimeString()}`);
      return;
    } catch (error) {
      if (retryCounter >= maxRetries) {
        throw error;
      }

      const sleepDuration = retrySleepDurationMs * ++retryCounter;
      logger.warn(
        `Databae connection error (${retryCounter}/${maxRetries}). Retrying in ${
          sleepDuration / 1000
        } seconds`
      );
      await sleep(sleepDuration);
    }
  throw new Error("Could not connect to Database");
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
