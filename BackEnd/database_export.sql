PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE expense (
	id INTEGER NOT NULL, 
	title VARCHAR NOT NULL, 
	category VARCHAR NOT NULL, 
	amount FLOAT NOT NULL, 
	date VARCHAR NOT NULL, 
	note VARCHAR NOT NULL, user_id INTEGER, 
	PRIMARY KEY (id)
);
INSERT INTO expense VALUES(6,'April Rent','Bills',1462.0,'2026-04-01','',1);
INSERT INTO expense VALUES(7,'Transport','Transport',45.0,'2026-04-11','Mostly train',1);
INSERT INTO expense VALUES(8,'MacBook Neo','Shopping',749.0,'2026-03-20','',1);
INSERT INTO expense VALUES(9,'March Rent','Bills',1462.0,'2026-03-12','',1);
INSERT INTO expense VALUES(10,'February Rent','Bills',1300.0,'2026-02-11','',1);
INSERT INTO expense VALUES(12,'Toys','Shopping',30.0,'2026-03-20','Totta',1);
INSERT INTO expense VALUES(14,'Aatrox Figure','Entertainment',234.0,'2026-05-15','',1);
INSERT INTO expense VALUES(15,'Brekkie','Food',20.19999999999999929,'2026-05-14','Cubano',1);
INSERT INTO expense VALUES(16,'Meds','Health',123.0,'2026-05-21','',1);
CREATE TABLE category (
	id INTEGER NOT NULL, 
	name VARCHAR NOT NULL, 
	description VARCHAR NOT NULL, 
	is_default BOOLEAN NOT NULL, 
	is_active BOOLEAN NOT NULL, user_id INTEGER, 
	PRIMARY KEY (id)
);
INSERT INTO category VALUES(1,'Bills','Default category for bills expenses',1,1,NULL);
INSERT INTO category VALUES(2,'Food','Default category for food expenses',1,1,NULL);
INSERT INTO category VALUES(3,'Transport','Default category for transport expenses',1,1,NULL);
INSERT INTO category VALUES(4,'Shopping','Default category for shopping expenses',1,1,NULL);
INSERT INTO category VALUES(5,'Entertainment','Default category for entertainment expenses',1,1,NULL);
INSERT INTO category VALUES(6,'Other','Default category for other expenses',1,1,NULL);
INSERT INTO category VALUES(7,'HealthCare','Anything I spend in Hospital or Drug Store or Clinic',0,1,NULL);
INSERT INTO category VALUES(8,'Health','',0,1,1);
INSERT INTO category VALUES(9,'Music','',0,1,2);
CREATE TABLE user (
	id INTEGER NOT NULL, 
	username VARCHAR NOT NULL, 
	email VARCHAR NOT NULL, 
	hashed_password VARCHAR NOT NULL, 
	role VARCHAR NOT NULL, 
	PRIMARY KEY (id)
);
INSERT INTO user VALUES(1,'Jason','halim@sample.com','$2b$12$TJZWWJrW8bdPaBIV8KjW6ueVejZxeCQgjmaATOt9eKAky2JZJQkwW','user');
INSERT INTO user VALUES(2,'Young','youngblood@gmail.com','$2b$12$N/0NC1vmuwc/ncDsOc5F3.FwPQXrSQPyw1/NGCoZtiXxtF1qEXRxa','user');
CREATE UNIQUE INDEX ix_category_name ON category (name);
CREATE INDEX ix_user_email ON user (email);
CREATE INDEX ix_user_username ON user (username);
COMMIT;
