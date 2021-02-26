import { Request } from "express";

export interface IPostRegisterPackageRequest extends Request {
  body: {
    receiverAddress: string;
    receiverName: string;
    receiverEmail: string;
    senderAddress: string;
    senderName: string;
    weightKg: number;
  };
}

export interface IPostPackageCentralDeliveryRequest extends Request {
  body: {
    packageIDs: string[];
  };
}

export interface IPostPackageInRouteRequest extends Request {
  body: {
    packageIDs: string[];
    driverID: string;
  };
}

export interface IGetPackageDetailsRequest extends Request {
  query: {
    packageID: string;
  };
}
