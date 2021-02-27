import fetch from "node-fetch";

export async function sendNotification(jsonBody: {
  packageID: string;
  updateMessage: string;
  updateDate: Date;
  receiverEmail: string;
}) {
  const response = await fetch(
    process.env.NOTIFICATION_SERVICE_ENDPOINT as string,
    {
      method: "post",
      body: JSON.stringify(jsonBody),
      headers: { "Content-Type": "application/json" },
    }
  ).then((res) => res.json());
  console.log(response);
}
