import util from "util";
import * as winston from "winston";
import  DailyRotateFile from "winston-daily-rotate-file";
const { format } = winston;

// import logdnaWinston from "logdna-winston";
// const Logger = require("@logdna/logger");

// const logConsole = Logger.createLogger(process.env.LOGDNA_KEY, {
// 	index_meta: true,
// 	tags: process.env.LOGDNA_TAGS + ", console",
// 	level: "trace",
// 	app: process.env.TOKEN,
// });

const transportDailyRotateFile = new DailyRotateFile({
	filename: "dev-%DATE%.log",
	datePattern: "YYYY-MM-DD",
	dirname: process.cwd() + "/logs/",
	zippedArchive: false,
	level: "debug",
});

function prepareMessage(msg: string, ...data:any) {
	const formattedMessage = data.length ? util.format(msg, ...data) : msg;
	return `: ${formattedMessage}`;
}

// const logdnaW = new logdnaWinston({
// 	key: process.env.LOGDNA_KEY,
// 	tags: process.env.LOGDNA_TAGS + ", winston",
// 	indexMeta: true,
// 	level: "debug",
// 	app: process.env.TOKEN,
// });

const { combine, timestamp, printf } = format;
const logFormat = printf((info:any) => {
	return `[${info.timestamp}] [${info.level}]${info.message}`;
});

const transports = [
	new (winston.transports.Console)({ 
		// level: process.env.NODE_ENV === "production" ? "error" : "debug",  
		level: "silly",   
		debugStdout: true   
	}),
	transportDailyRotateFile,
	// logdnaW,
];

//process.env.NODE_ENV === "production" ? "error" : "debug",

// if (process.env.NODE_ENV !== "production") {
// transports.push(transport);
// }

const logger = winston.createLogger({
	transports,
	format: combine(timestamp(), format.splat(), format.simple(), logFormat),
});

if (process.env.NODE_ENV !== "production") {
	logger.debug("Logging initialized at debug level");
}

logger.debug("RESTART_____________________");
const loggerWithCtx = {
	debug: (msg:string, ...data:any) => logger.debug(prepareMessage(msg, ...data)),
	error: (msg:string, ...data:any) => logger.error(prepareMessage(msg, ...data)),
	trace: (msg:string, ...data:any) => logger.silly(prepareMessage(msg, ...data))
};

// const cl = console.log;

// console.log = function (...args) {
// 	// logConsole.log(util.format(args));
// 	cl.apply(console, args);
// };

export default loggerWithCtx;
// module.exports = loggerWithCtx;
