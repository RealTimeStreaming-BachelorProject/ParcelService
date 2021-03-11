import { pool } from "../helpers/database.scripts";

export interface IPackageDetails {
  packageID: string;
  receiverAddress: string;
  receiverName: string;
  receiverEmail: string;
  senderAddress: string;
  senderName: string;
  weightKg: number;
  registered?: Date; // Is set by database
  expectedDeliveryDate: Date;
}

export enum PackageHistoryEnum {
  PACKAGE_REGISTERED = "PACKAGE_REGISTERED",
  PACKAGE_AT_CENTRAL = "PACKAGE_AT_CENTRAL",
  PACKAGE_IN_ROUTE = "PACKAGE_IN_ROUTE",
}

export interface IPackageHistory {
  packageID: string;
  status: string;
  message: string;
}

export interface IPackageTracking {
  packageID: string;
  driverID: string;
  expectedDeliveryTime: Date;
}

export async function insertPackageDetails(
  packageDetails: IPackageDetails
): Promise<string> {
  const query = `INSERT INTO PackageDetails
                (packageID, receiverAddress, receiverName, receiverEmail, senderAddress, senderName, weightKg, registered, expectedDeliveryDate)
                VALUES (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        $7,
                        now(),
                        $8
                        )`;
  const params = Object.values(packageDetails);
  await pool.query(query, params);

  const packageHistoryMessage = `We have been notified of your purchase at ${
    packageDetails.senderName
  }. We expect to deliver your package ${packageDetails.expectedDeliveryDate.toDateString()}`;
  await insertPackageHistory({
    packageID: packageDetails.packageID,
    status: PackageHistoryEnum.PACKAGE_REGISTERED,
    message: packageHistoryMessage,
  });
  return packageHistoryMessage;
}

export async function insertPackageHistory(packageHistory: IPackageHistory) {
  const query = `INSERT INTO PackageHistory
                  (packageID, status, message, entryDate)
                  VALUES (
                          $1,
                          $2,
                          $3,
                          now()
                        )`;
  const params = Object.values(packageHistory);
  await pool.query(query, params);
}

export async function findPackageReceieverEmail(
  packageID: string
): Promise<string> {
  const query = `SELECT receiveremail FROM packagedetails WHERE packageID = $1;`;
  const { rows: resultSet } = await pool.query(query, [packageID]);
  return resultSet[0].receiveremail;
}

export async function insertPackageTrackingDetails(
  packageTrackingDetails: IPackageTracking
) {
  const query = `INSERT INTO PackageTracking
                (packageID, driverID, expectedDeliveryTime)
                VALUES (
                        $1,
                        $2,
                        $3
                      )`;
  const params = Object.values(packageTrackingDetails);
  await pool.query(query, params);
}

export interface IHistoryEntry {
  status: string;
  message: string;
  entryDate: Date;
}

export interface IPackageInfo {
  packageID: string;
  receiverAddress: string;
  receiverName: string;
  receiverEmail: string;
  senderAddress: string;
  senderName: string;
  weightKg: number;
  registered: Date;
  expectedDeliveryDate: Date;
  historyEntries: IHistoryEntry[];
  trackingURL?: string;
  driverID?: string;
  expectedDeliveryTime?: Date;
}

export class PackageNotFoundError extends Error {}

export async function findPackageDetails(
  packageID: string
): Promise<IPackageInfo> {
  const packageDetailsQuery = `SELECT * FROM PackageDetails WHERE packageID = $1`;
  const { rows: pDResultSet } = await pool.query(packageDetailsQuery, [
    packageID,
  ]);
  if (!pDResultSet[0])
    throw new PackageNotFoundError(
      "Package does not exist in table 'packagedetails'"
    );
  const {
    packageid,
    receiveraddress,
    receivername,
    receiveremail,
    senderaddress,
    sendername,
    weightkg,
    registered,
    expecteddeliverydate,
  } = pDResultSet[0];
  const packageHistoryQuery = `SELECT * FROM PackageHistory WHERE packageID = $1`;
  const { rows: pHResultSet } = await pool.query(packageHistoryQuery, [
    packageID,
  ]);
  if (!pHResultSet[0])
    throw new PackageNotFoundError(
      "Package does not exist in table 'packagehistory'"
    );
  const history: IHistoryEntry[] = [];
  for (const historyEntry of pHResultSet) {
    history.push({
      status: PackageHistoryEnum[historyEntry.status],
      message: historyEntry.message,
      entryDate: historyEntry.entrydate,
    });
  }
  const packageTrackingDetailsQuery = `SELECT * FROM PackageTracking WHERE packageID = $1`;
  const pTResultSet = await pool.query(packageTrackingDetailsQuery, [
    packageID,
  ]);

  let driverid: string | undefined, expecteddeliverytime: Date | undefined;

  const trackingDetails = pTResultSet[0];
  if (trackingDetails) {
    driverid = trackingDetails.driverid;
    expecteddeliverytime = trackingDetails.expecteddeliverytime;
  }

  return {
    packageID: packageid,
    receiverAddress: receiveraddress,
    receiverName: receivername,
    receiverEmail: receiveremail,
    senderAddress: senderaddress,
    senderName: sendername,
    weightKg: weightkg,
    registered: registered,
    expectedDeliveryDate: expecteddeliverydate,
    historyEntries: history,
    driverID: driverid,
    expectedDeliveryTime: expecteddeliverytime,
  };
}
