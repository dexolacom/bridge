"use strict";
// eslint-disable-next-line node/no-unpublished-require

import fs from "fs";
import path from "path";
import { Sequelize, Options, ModelStatic, DataTypes, Model } from "sequelize";
import { fileURLToPath } from "url";


const config: Options = {
	username: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_DATABASE,
	host: process.env.DB_HOST,
	dialect: "postgres",
};

const db : {[key:string]: any} = {};

// db.done = false;

import  *  as  winston  from  "winston";
// import  DailyRotateFile from "winston-daily-rotate-file";

// const transport = new DailyRotateFile({
// 	filename: "db-%DATE%.log",
// 	datePattern: "YYYY-MM-DD",
// 	dirname: __dirname + "/../logs/",
// 	zippedArchive: false,
// 	// maxFiles: "14d",
// // });

const regExp = /(\n|\r|\t)( +(?= ))/gi;
const formatNewLine = winston.format((info, opts) => {
	const { message } = info;
	info.message = message.replace(regExp, "");
	return info;
});

const logger = winston.createLogger({
	level: "debug",
	format: winston.format.combine(
		formatNewLine(),
		winston.format.timestamp(),
		winston.format.prettyPrint()
	),
	// transports: [transport],
	transports: [new winston.transports.File({ filename: "database.log" })],
});

const sequelize = new Sequelize(
	config.database,
	config.username,
	config.password,
	{ ...config, 
		logging: (msg) => {
			logger.debug(msg);
			//  console.log(msg);
		} 
	}
);

fs.readdirSync(__dirname)
	.filter((file) => {
		return (
			file.indexOf(".") !== 0 && file !== "index.js" && file.slice(-3) === ".js"
		);
	})
	.forEach((file) => {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const model = (require(path.join(__dirname, file))).default(sequelize);
		db[model.name] = model;
	});


Object.keys(db).forEach((modelName) => {
	if (db[modelName].associate) {
		db[modelName].associate(db);
	}
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// db.sequelize.sync();

const authenticate = async () => {
	
	try {
		await db.sequelize.sync();
		await db.sequelize.authenticate();
		console.log(
			`Connection has been established successfully. ${db.sequelize.config.database}`
		);
	} catch (err) {
		console.log("Unable to connect to the database:", err);
	}
};

db.authenticate = authenticate;


export default db;
