CREATE KEYSPACE IF NOT EXISTS PackageService WITH replication = { 'class': 'SimpleStrategy', 'replication_factor': '2' };

USE PackageService;

CREATE TABLE IF NOT EXISTS PackageDetails (
    packageID UUID,
    receiverAddress TEXT,
    receiverName TEXT,
    receiverEmail TEXT,
    senderAddress TEXT,
    senderName TEXT,
    weightKg INT,
    registered TIMESTAMP,
    expectedDeliveryDate TIMESTAMP,
    PRIMARY KEY ( packageID )
);

CREATE TABLE IF NOT EXISTS PackageHistory (
    packageID UUID,
    status INT,
    message TEXT,
    entryDate TIMESTAMP,
    PRIMARY KEY ( packageID, entryDate, status  )
);

CREATE TABLE IF NOT EXISTS PackageTracking (
    packageID UUID,
    driverID UUID,
    expectedDeliveryTime TIMESTAMP,
    PRIMARY KEY( packageID, driverID )
);
