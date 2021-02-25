import { Express, Request, Response } from "express";
import { REGISTER_PACKAGE } from "./routes";
import { IRegisterPackageRequest } from "./types/posttypes";
import { insertPackageDetails } from "./repositories/packageRepo";
import { v4 as uuidv4 } from "uuid";
import logger from "./util/logger";

export function registerControllers(app: Express) {
  registerPackagePostRoute(app);
}

function registerPackagePostRoute(app: Express) {
  app.post(REGISTER_PACKAGE, (req: IRegisterPackageRequest, res: Response) => {
    const {
      receiverAddress,
      receiverName,
      receiverEmail,
      senderAddress,
      senderName,
      weightKg,
    } = req.body;
    const packageID = uuidv4();
    const expectedDeliveryDate = new Date(2021, 3, 1, 12, 30).getMilliseconds();
    try {
      insertPackageDetails({
        packageID,
        receiverAddress,
        receiverName,
        receiverEmail,
        senderAddress,
        senderName,
        weightKg,
        expectedDeliveryDate,
      });
      // TODO: Send request to notificationService
      res.status(201).send();
    } catch (error) {
      logger.error(error);
      res.status(500).send();
    }
  });
}
