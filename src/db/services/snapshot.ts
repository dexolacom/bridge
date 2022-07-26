import db from "../models";
import { Snapshot } from "../models/snapshot";
import { InferAttributes,} from "sequelize";

export async function getLastCompletedSnapshot(contract: string, chainId: number) {
	const data =  await db.snapshot.findAll({
		where: {
			contract,
			chainId,
			isCompleted: true
		},
		limit: 1,
		order: [ [ "block", "DESC" ]]
	});
	return data.length !== 0? data[0]: null;
}

export async function getEventsCount(chainId: number) {
	return  await db.event.count({ where: { chainId } });
}

export async function saveSnapshot(data: InferAttributes<Snapshot>) {
	await db.snapshot.create(data);
}
