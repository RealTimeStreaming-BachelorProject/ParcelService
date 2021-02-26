import { Express, Response } from "express";
import {
  PACKAGE_CENTRAL_DELIVERY,
  REGISTER_PACKAGE,
  PACKAGE_IN_ROUTE,
  PACKAGE_DETAILS,
} from "./routes";
import {
  IPostPackageCentralDeliveryRequest,
  IPostPackageInRouteRequest,
  IPostRegisterPackageRequest,
  IGetPackageDetailsRequest,
} from "./types/posttypes";
import {
  insertPackageDetails,
  insertPackageHistory,
  findPackageDetails,
  PackageHistoryEnum,
  NotFoundInCassandraError,
  insertPackageTrackingDetails,
} from "./repositories/packageRepo";
import { v4 as uuidv4, validate } from "uuid";
import logger from "./util/logger";

export function registerControllers(app: Express) {
  postRegisterPackage(app);
  postPackageCentralDelivery(app);
  postPackageInRoute(app);
  getPackageDetails(app);
}

function postRegisterPackage(app: Express) {
  app.post(
    REGISTER_PACKAGE,
    async (req: IPostRegisterPackageRequest, res: Response) => {
      const {
        receiverAddress,
        receiverName,
        receiverEmail,
        senderAddress,
        senderName,
        weightKg,
      } = req.body;
      const packageID = uuidv4();
      const tomorrowDelivery = new Date();
      tomorrowDelivery.setDate(tomorrowDelivery.getDate() + 1);
      tomorrowDelivery.setHours(12, 30);
      const expectedDeliveryDate = tomorrowDelivery;
      try {
        await insertPackageDetails({
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
      } catch (e) {
        logger.error(e);
        res.status(500).send();
      }
    }
  );
}

function postPackageCentralDelivery(app: Express) {
  app.post(
    PACKAGE_CENTRAL_DELIVERY,
    async (req: IPostPackageCentralDeliveryRequest, res: Response) => {
      const { packageIDs } = req.body;
      if (!packageIDs) {
        res.status(400).send("Invalid body");
        return;
      }

      try {
        for (const packageID of packageIDs) {
          if (!validate(packageID)) {
            res.status(400).send("One or more packageIDs are invalid");
          }
          await insertPackageHistory({
            packageID,
            status: PackageHistoryEnum.PACKAGE_AT_CENTRAL,
            message: `We have received your package and are processing it`,
          });
          // TODO: Send request to notificationservice. The user has an update in their package history
        }
        res.status(200).send();
      } catch (error) {
        logger.error(error);
        res.status(500).send();
      }
    }
  );
}

function postPackageInRoute(app: Express) {
  app.post(
    PACKAGE_IN_ROUTE,
    async (req: IPostPackageInRouteRequest, res: Response) => {
      const { packageIDs, driverID } = req.body;
      if (!packageIDs || !driverID) {
        res.status(400).send("Invalid body");
        return;
      }
      if (!validate(driverID)) {
        res.status(400).send("Invalid driverID");
        return;
      }
      try {
        for (const packageID of packageIDs) {
          if (!validate(packageID)) {
            res.status(400).send("One or more packageIDs are invalid");
          }
          await insertPackageHistory({
            packageID,
            status: PackageHistoryEnum.PACKAGE_IN_ROUTE,
            message: `Your package is in route`,
          });

          const expectedDeliveryTime = new Date();
          expectedDeliveryTime.setHours(expectedDeliveryTime.getHours() + 8);
          await insertPackageTrackingDetails({
            packageID: packageID,
            driverID,
            expectedDeliveryTime,
          });
          // TODO: Send request to notificationservice. The package is in route. Check your application for real time notifcations and tracking
        }
        res.status(200).send();
      } catch (error) {
        logger.error(error);
        res.status(500).send();
      }
    }
  );
}

function getPackageDetails(app: Express) {
  app.get(
    PACKAGE_DETAILS,
    async (req: IGetPackageDetailsRequest, res: Response) => {
      try {
        const { packageID } = req.query;
        if (!packageID) {
          res.status(400).send("Invalid PackageID");
          return;
        }
        if (!validate(packageID)) {
          res.status(400).send("Invalid packageID");
        }
        const packageDetails = await findPackageDetails(packageID);
        res.json(packageDetails);
      } catch (error) {
        if (error instanceof NotFoundInCassandraError) {
          res.status(404).send();
        } else {
          logger.error(error);
          res.status(500).send();
        }
      }
    }
  );
}
