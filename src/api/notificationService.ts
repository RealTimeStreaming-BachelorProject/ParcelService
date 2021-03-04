import fetch from "node-fetch";
import logger from "../util/logger";

export async function sendNotification(jsonBody: {
  packageID: string;
  updateMessage: string;
  updateDate: Date;
  receiverEmail: string;
}) {
  try {
    const response = await fetch(
      process.env.NOTIFICATION_SERVICE_ENDPOINT as string,
      {
        method: "post",
        body: JSON.stringify(jsonBody),
        headers: { "Content-Type": "application/json" },
      }
    ).then((res) => res.json());
    console.log(response)
  } catch (error) {
    logger.error("Could not contact notification service");
  }
}
