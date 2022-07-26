import "dotenv/config";
import {startServer} from "./server/index";
import startAllBridges from "./bridge/index";
import  db from "./db/models";

async function start() {
	
	await db.authenticate();
	// await db.init();
	await startServer();
	await startAllBridges();
}

start();