import  db from "../models";
import { EventData } from "web3-eth-contract";


export async function  isEventExists(chainId: number, hash: string) {
	return !!(await db.event.findOne({where:{
		chainId,
		hash
	}}));
}

export async function saveEvent(chainId: number, event: EventData) {
	const data = {
		hash: event.transactionHash.toLowerCase(),
		user:  event.returnValues.user.toLowerCase(),
		contract: event.address.toLowerCase(),
		chainId,
		event: event.event,
		nonce: event.returnValues.wrapNonce,
		amount: event.returnValues.amount,
		status: "init",
	};

	await db.event.create(data);
	return true;
}

export async function getEvent(chainId: number, hash: string) {
	return await db.event.findOne({where:{
		chainId,
		hash
	}});
}

export async function getInitEvents(chainId: number, event: string) {
	return await db.event.findAll({
		where: {
			chainId,
			status: "init",
			event,
		},
		limit: 5
	});
}

export async function  changeEventStatus(chainId: number, hash: string, newStatus: string) {
	const a = await db.event.update({status: newStatus}, {where: {
		chainId,
		hash, 
	}});
	return !!a;
}

export async function completeEvent(hash: string, chainId: number, outHash: string, fee: string) {
	await db.event.update({outHash,	fee, status: "complete"}, {where: {
		chainId,
		hash
	}});
	return true;
}

export async function blockEvent(hash: string, chainId: number, fee: string) {
	await db.event.update({	fee, status: "blocked"}, {where: {
		chainId,
		hash,

	}});
	return true;
}