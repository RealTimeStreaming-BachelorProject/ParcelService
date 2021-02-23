import { Client } from "cassandra-driver";

export async function initDB(cassandraClient: Client) {
  const keyspaceQuery =
    "CREATE KEYSPACE IF NOT EXISTS packageservice WITH replication = { 'class': 'SimpleStrategy', 'replication_factor': '2' }";
  await cassandraClient.execute(keyspaceQuery);
  cassandraClient.keyspace = "packageservice";

  const tableQuery =
    "CREATE TABLE IF NOT EXISTS PackageDetails (" +
        "packageID UUID," +
        "receiverAddress TEXT," +
        "receiverName TEXT," +
        "senderAddress TEXT," +
        "senderName TEXT," +
        "weight INT," +
        "registered TIMESTAMP," +
        "expectedDeliveryDate TIMESTAMP," +
        "PRIMARY KEY ( packageID )" +
    ");";
  await cassandraClient.execute(tableQuery);
}

