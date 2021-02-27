import { cassandraClient } from "../helpers/cassandra.scripts";

export interface IPackageDetails {
  packageID: string;
  receiverAddress: string;
  receiverName: string;
  receiverEmail: string;
  senderAddress: string;
  senderName: string;
  weightKg: number;
  registered?: Date; // Is set by Cassandra
  expectedDeliveryDate: Date;
}

// This enum's static values should never be changed without great consideration to Cassandra.
// Cassandra relies on these numbers to print out the correct message
// TODO: Create a unit test on this
export enum PackageHistoryEnum {
  PACKAGE_REGISTERED = 0,
  PACKAGE_AT_CENTRAL = 1,
  PACKAGE_IN_ROUTE = 2,
}

export interface IPackageHistory {
  packageID: string;
  status: number;
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
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        totimestamp(now()),
                        ?
                        );`;
  const params = Object.values(packageDetails);
  await cassandraClient.execute(query, params, { prepare: true });
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
                          ?,
                          ?,
                          ?,
                          totimestamp(now())
                        );`;
  const params = Object.values(packageHistory);
  await cassandraClient.execute(query, params, { prepare: true });
}

export async function findPackageReceieverEmail(
  packageID: string
): Promise<string> {
  const query = `SELECT receiveremail FROM packagedetails WHERE packageID = ?;`;
  const resultSet = await cassandraClient.execute(query, [packageID], { prepare: true });
  return resultSet.first().receiveremail
}

export async function insertPackageTrackingDetails(
  packageTrackingDetails: IPackageTracking
) {
  const query = `INSERT INTO PackageTracking
                (packageID, driverID, expectedDeliveryTime)
                VALUES (
                        ?,
                        ?,
                        ?
                      );`;
  const params = Object.values(packageTrackingDetails);
  await cassandraClient.execute(query, params, { prepare: true });
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

export class NotFoundInCassandraError extends Error {}

export async function findPackageDetails(
  packageID: string
): Promise<IPackageInfo> {
  const packageDetailsQuery = `SELECT * FROM PackageDetails WHERE packageID = ?`;
  const pDResultSet = await cassandraClient.execute(
    packageDetailsQuery,
    [packageID],
    {
      prepare: true,
    }
  );
  if (!pDResultSet.first())
    throw new NotFoundInCassandraError(
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
  } = pDResultSet.first();
  const packageHistoryQuery = `SELECT * FROM PackageHistory WHERE packageID = ?`;
  const pHResultSet = await cassandraClient.execute(
    packageHistoryQuery,
    [packageID],
    {
      prepare: true,
    }
  );
  if (!pHResultSet.first())
    throw new NotFoundInCassandraError(
      "Package does not exist in table 'packagehistory'"
    );
  const history: IHistoryEntry[] = [];
  for (const historyEntry of pHResultSet.rows) {
    history.push({
      status: PackageHistoryEnum[historyEntry.status],
      message: historyEntry.message,
      entryDate: historyEntry.entrydate,
    });
  }
  const packageTrackingDetailsQuery = `SELECT * FROM PackageTracking WHERE packageID = ?`;
  const pTResultSet = await cassandraClient.execute(
    packageTrackingDetailsQuery,
    [packageID],
    {
      prepare: true,
    }
  );

  let driverid: string | undefined, expecteddeliverytime: Date | undefined;

  const trackingDetails = pTResultSet.first();
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
