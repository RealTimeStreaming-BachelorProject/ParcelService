import { Request } from "express";

export interface IRegisterPackageRequest extends Request {
  body: {
    receiverAddress: string;
    receiverName: string;
    receiverEmail: string;
    senderAddress: string;
    senderName: string;
    weightKg: number;
  };
}
