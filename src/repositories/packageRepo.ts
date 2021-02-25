import { cassandraClient } from "../helpers/cassandra.scripts";
import { v4 as uuidv4 } from "uuid";

export interface IPackageDetails {
  packageID: string;
  receiverAddress: string;
  receiverName: string;
  receiverEmail: string,
  senderAddress: string;
  senderName: string;
  weightKg: number;
  expectedDeliveryDate: number;
}

export async function insertPackageDetails(packageDetails: IPackageDetails) {
  const query = `INSERT INTO PackageDetails
                (packageID, receiverAddress, receiverName, receiverEmail, senderAddress, senderName, weightKg, registered, expectedDeliveryDate)
                VALUES 
                    (
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
}
