CREATE TABLE IF NOT EXISTS PackageDetails (
    packageID UUID,
    receiverAddress TEXT NOT NULL,
    receiverName TEXT NOT NULL,
    receiverEmail TEXT NOT NULL ,
    senderAddress TEXT NOT NULL,
    senderName TEXT NOT NULL,
    weightKg INT NOT NULL,
    registered TIMESTAMP NOT NULL,
    expectedDeliveryDate TIMESTAMP NOT NULL ,
    PRIMARY KEY ( packageID )
);

CREATE TYPE PACKAGE_STATUS AS ENUM ('PACKAGE_REGISTERED', 'PACKAGE_AT_CENTRAL','PACKAGE_IN_ROUTE');

CREATE TABLE IF NOT EXISTS PackageHistory (
    packageID UUID REFERENCES PackageDetails(packageID),
    status PACKAGE_STATUS NOT NULL,
    message TEXT NOT NULL,
    entryDate TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS PackageTracking (
    packageID UUID REFERENCES PackageDetails(packageID),
    driverID UUID NOT NULL,
    expectedDeliveryTime TIMESTAMP NOT NULL
);