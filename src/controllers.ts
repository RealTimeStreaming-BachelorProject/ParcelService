import { Express, Response } from "express";
import {
  PACKAGE_CENTRAL_DELIVERY,
  REGISTER_PACKAGE,
  PACKAGE_IN_ROUTE,
  PACKAGE_DETAILS,
  PACKAGE_DELIVERED,
} from "./routes";
import {
  IPostPackageCentralDeliveryRequest,
  IPostPackageInRouteRequest,
  IPostRegisterPackageRequest,
  IPostPackageDeliveredRequest,
  IGetPackageDetailsRequest,
} from "./types/posttypes";
import {
  insertPackageDetails,
  insertPackageHistory,
  findPackageDetails,
  PackageHistoryEnum,
  NotFoundInCassandraError,
  insertPackageTrackingDetails,
  findPackageReceieverEmail,
} from "./repositories/packageRepo";
import { v4 as uuidv4, validate } from "uuid";
import logger from "./util/logger";
import { sendNotification } from "./api/notificationService";
import { packageCentralDeliverySchema } from "./helpers/validators";

export function registerControllers(app: Express) {
  postRegisterPackage(app);
  postPackageCentralDelivery(app);
  postPackageInRoute(app);
  postPackageDelivered(app);
  getPackageDetails(app);
}

export interface IResponseJsonBody {
  status: number;
  message: string | object;
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
        fakeScenario,
      } = req.body;
      if (
        !receiverAddress ||
        !receiverName ||
        !receiverEmail ||
        !senderAddress ||
        !senderName ||
        !weightKg
      ) {
        const response: IResponseJsonBody = {
          status: 400,
          message: "One or more body parameters invalid",
        };
        return res.status(400).json(response);
      }
      const packageID = uuidv4();
      const tomorrowDelivery = new Date();
      tomorrowDelivery.setDate(tomorrowDelivery.getDate() + 1);
      tomorrowDelivery.setHours(12, 30);
      const expectedDeliveryDate = tomorrowDelivery;
      try {
        const updateMessage = await insertPackageDetails({
          packageID,
          receiverAddress,
          receiverName,
          receiverEmail,
          senderAddress,
          senderName,
          weightKg,
          expectedDeliveryDate,
        });
        if (fakeScenario !== undefined && !fakeScenario) {
          sendNotification({
            packageID,
            receiverEmail,
            updateDate: new Date(),
            updateMessage,
          });
        }
        const response: IResponseJsonBody = {
          status: 201,
          message: "Package registered",
        };
        response["packageID"] = packageID;
        return res.status(201).json(response);
      } catch (e) {
        logger.error(e);
        const response: IResponseJsonBody = {
          status: 500,
          message: "Error, please try again later",
        };
        return res.status(500).json(response);
      }
    }
  );
}

function postPackageCentralDelivery(app: Express) {
  app.post(
    PACKAGE_CENTRAL_DELIVERY,
    packageCentralDeliverySchema,
    async (req: IPostPackageCentralDeliveryRequest, res: Response) => {
      const { packageIDs, fakeScenario } = req.body;
      if (!packageIDs) {
        const response: IResponseJsonBody = {
          status: 400,
          message: "Invalid Body",
        };
        return res.status(400).json(response);
      }

      if (packageIDs.length === 0) {
        const response: IResponseJsonBody = {
          status: 400,
          message: "No packageIDs",
        };
        return res.status(400).json(response);
      }
      try {
        for (const packageID of packageIDs) {
          if (!validate(packageID)) {
            const response: IResponseJsonBody = {
              status: 400,
              message: "One or more packageIDs are invalid",
            };
            return res.status(400).json(response);
          }
          const updateMessage = `We have received your package and are processing it`;
          await insertPackageHistory({
            packageID,
            status: PackageHistoryEnum.PACKAGE_AT_CENTRAL,
            message: updateMessage,
          });
          if (fakeScenario !== undefined && !fakeScenario) {
            sendNotification({
              packageID,
              receiverEmail: await findPackageReceieverEmail(packageID),
              updateDate: new Date(),
              updateMessage,
            });
          }
        }
        const response: IResponseJsonBody = {
          status: 200,
          message: "Package(s) registered at central",
        };
        return res.status(200).json(response);
      } catch (error) {
        logger.error(error);
        const response: IResponseJsonBody = {
          status: 500,
          message: "Server error, please try again later",
        };
        return res.status(500).json(response);
      }
    }
  );
}

function postPackageInRoute(app: Express) {
  app.post(
    PACKAGE_IN_ROUTE,
    async (req: IPostPackageInRouteRequest, res: Response) => {
      const { packageIDs, driverID, fakeScenario } = req.body;
      if (!packageIDs || !driverID) {
        const response: IResponseJsonBody = {
          status: 400,
          message: "Invalid Body",
        };
        return res.status(400).json(response);
      }
      if (packageIDs.length === 0) {
        const response: IResponseJsonBody = {
          status: 400,
          message: "No packageIDs",
        };
        return res.status(400).json(response);
      }
      if (!validate(driverID)) {
        const response: IResponseJsonBody = {
          status: 400,
          message: "Invalid driverID",
        };
        return res.status(400).json(response);
      }
      try {
        for (const packageID of packageIDs) {
          if (!validate(packageID)) {
            const response: IResponseJsonBody = {
              status: 400,
              message: "One or more packageIDs are invalid",
            };
            return res.status(400).json(response);
          }
          const updateMessage = "Your package is in route";
          await insertPackageHistory({
            packageID,
            status: PackageHistoryEnum.PACKAGE_IN_ROUTE,
            message: updateMessage,
          });

          const expectedDeliveryTime = new Date();
          expectedDeliveryTime.setHours(expectedDeliveryTime.getHours() + 8);
          await insertPackageTrackingDetails({
            packageID: packageID,
            driverID,
            expectedDeliveryTime,
          });
          if (fakeScenario !== undefined && !fakeScenario) {
            sendNotification({
              packageID,
              receiverEmail: await findPackageReceieverEmail(packageID),
              updateDate: new Date(),
              updateMessage:
                updateMessage + ". Check the link for real time tracking",
            });
          }
        }
        const response: IResponseJsonBody = {
          status: 200,
          message: "Package(s) registered in-route",
        };
        return res.status(200).json(response);
      } catch (error) {
        logger.error(error);
        const response: IResponseJsonBody = {
          status: 500,
          message: "Server error, please try again later",
        };
        return res.status(500).json(response);
      }
    }
  );
}

function postPackageDelivered(app: Express) {
  app.post(
    PACKAGE_DELIVERED,
    async (req: IPostPackageDeliveredRequest, res: Response) => {
      const { packageIDs, driverID, fakeScenario } = req.body;
      if (!packageIDs || !driverID) {
        const response: IResponseJsonBody = {
          status: 400,
          message: "Invalid Body",
        };
        return res.status(400).json(response);
      }
      if (packageIDs.length === 0) {
        const response: IResponseJsonBody = {
          status: 400,
          message: "No packageIDs",
        };
        return res.status(400).json(response);
      }
      if (!validate(driverID)) {
        const response: IResponseJsonBody = {
          status: 400,
          message: "Invalid driverID",
        };
        return res.status(400).json(response);
      }
      try {
        for (const packageID of packageIDs) {
          if (!validate(packageID)) {
            const response: IResponseJsonBody = {
              status: 400,
              message: "One or more packageIDs are invalid",
            };
            return res.status(400).json(response);
          }
          const updateMessage = "Your package has been delivered";
          await insertPackageHistory({
            packageID,
            status: PackageHistoryEnum.PACKAGE_DELIVERED,
            message: updateMessage,
          });

          if (fakeScenario !== undefined && !fakeScenario) {
            sendNotification({
              packageID,
              receiverEmail: await findPackageReceieverEmail(packageID),
              updateDate: new Date(),
              updateMessage:
                updateMessage
            });
          }
        }
        const response: IResponseJsonBody = {
          status: 200,
          message: "Package(s) delivered",
        };
        return res.status(200).json(response);
      } catch (error) {
        logger.error(error);
        const response: IResponseJsonBody = {
          status: 500,
          message: "Server error, please try again later",
        };
        return res.status(500).json(response);
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
          const response: IResponseJsonBody = {
            status: 400,
            message: "Invalid PackageID",
          };
          return res.status(400).json(response);
        }
        if (!validate(packageID)) {
          const response: IResponseJsonBody = {
            status: 400,
            message: "Invalid PackageID",
          };
          return res.status(400).json(response);
        }
        const packageDetails = await findPackageDetails(packageID);
        packageDetails["status"] = 200;
        packageDetails["message"] = "Package found";
        return res.json(packageDetails);
      } catch (error) {
        if (error instanceof NotFoundInCassandraError) {
          const response: IResponseJsonBody = {
            status: 404,
            message: "Package not found",
          };
          return res.status(404).json(response);
        } else {
          logger.error(error);
          const response: IResponseJsonBody = {
            status: 500,
            message: "Server error, please try again later",
          };
          return res.status(500).json(response);
        }
      }
    }
  );
}
