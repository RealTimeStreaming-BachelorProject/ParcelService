import { Request } from "express";

export interface IPostRegisterPackageRequest extends Request {
  body: {
    receiverAddress: string;
    receiverName: string;
    receiverEmail: string;
    senderAddress: string;
    senderName: string;
    weightKg: number;
    fakeScenario?: boolean;
  };
}

export interface IPostPackageCentralDeliveryRequest extends Request {
  body: {
    packageIDs: string[];
    fakeScenario?: boolean;
  };
}

export interface IPostPackageInRouteRequest extends Request {
  body: {
    packageIDs: string[];
    driverID: string;
    fakeScenario?: boolean;
  };
}

export interface IGetPackageDetailsRequest extends Request {
  query: {
    packageID: string;
  };
}
