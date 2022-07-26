import "dotenv/config";
import  db from "./db/models";


async function init() {
	await db.authenticate();

	await db.snapshot.bulkCreate([
		{
			contract: "0x1486cdc5e3aad507eb825769db4892600e34c4db",
			chainId:  3,
			block:  12317197,
			count:  0,
			isCompleted: true
		},
		{
			contract: "0xa188bfc90204a567b0f78dd6ce83a025b510285b",
			chainId:  97,
			block:  19770904,
			count:  0,
			isCompleted: true
		},
	]);

    
}

init();