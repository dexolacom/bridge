import BN from "bn.js";
import cron from "node-cron";
import { Contract, EventData } from "web3-eth-contract";
import {
	BlockSubscriber,
	SocketSubscriber,
	SubscriberOptions,
} from "../web3/subscribe";
import { Oracle } from "./Oracle";
import logger from "../utils/logger";
import { Event } from "../db/models/event";
import web3 from "../web3/web3";
import * as web3Handlers from "../web3/utils/handlers";
import * as contracts from "../web3/contracts";
import * as db from "../db/services";

export interface BridgeOptions {
	chainId: number;
	subscribe: SubscriberOptions;
}

export class Bridge {
	subscribe: {
		wrap: SocketSubscriber | BlockSubscriber;
		unwrap: SocketSubscriber | BlockSubscriber;
	};

	worker: {
		wrap: BridgeWorker;
		unwrap: BridgeWorker;
	};

	options: {
		wrap: BridgeOptions;
		unwrap: BridgeOptions;
	};

	cron: cron.ScheduledTask;

	oracle: Oracle;

	constructor(wrap: BridgeOptions, unwrap: BridgeOptions) {
		const opts = { wrap, unwrap };
		this.options = opts;

		this.oracle = new Oracle(wrap.chainId, unwrap.chainId);

		const wrks = {
			wrap: new BridgeWorker(this, true),
			unwrap: new BridgeWorker(this, false),
		};
		this.worker = wrks;

		// const sbs = {
		// 	wrap:new SocketSubscriber(
		// 		contracts.wrappers[wrap.chainId],
		// 		saveEvent.bind({chainId: wrap.chainId, saver: db.event.saveEvent}),
		// 		wrap.subscribe
		// 	),
		// 	unwrap: new SocketSubscriber(
		// 		contracts.wrappers[unwrap.chainId],
		// 		saveEvent.bind({chainId: unwrap.chainId, saver: db.event.saveEvent}),
		// 		unwrap.subscribe
		// 	)
		// };

		const sbs = {
			wrap: new BlockSubscriber(
				contracts.wrappers[wrap.chainId],
				saveEvent.bind({ chainId: wrap.chainId, saver: db.event.saveEvent }),
				web3[wrap.chainId],
				{
					getBlock: db.block.getBlock,
					setBlock: db.block.setBlock,
					addBlock: db.block.addBlock
				},
				{
					...wrap.subscribe,
					count: 2,
					timeouts: [5000, 60000],
					blockLimit: 5000,
				}
			),
			unwrap: new BlockSubscriber(
				contracts.wrappers[unwrap.chainId],
				saveEvent.bind({ chainId: unwrap.chainId, saver: db.event.saveEvent }),
				web3[unwrap.chainId],
				{
					getBlock: db.block.getBlock,
					setBlock: db.block.setBlock,
					addBlock: db.block.addBlock
				},
				{
					...unwrap.subscribe,
					count: 2,
					timeouts: [5000, 60000],
					blockLimit: 5000,
				}
			),
		};

		this.subscribe = sbs;

		this.cron = cron.schedule("*/15 * * * *", () => {
			logger.debug("[Snapshot] ===> Start crone.");
			this.getSnapshot("Wrap", this.options.wrap.chainId);
			this.getSnapshot("Unwrap", this.options.unwrap.chainId);
		}, { scheduled: true });
	}

	async getSnapshot(event: string, chainId: number) {
		const address = contracts.wrappers[chainId].options.address.toLowerCase();
		const method = event.toLowerCase() + "Count()";
		const lastSnapshotDB = await db.snapshot.getLastCompletedSnapshot(address, chainId);

		const contractCount = Number(await contracts.wrappers[chainId].methods[method]().call());
		let dbCount = await db.snapshot.getEventsCount(chainId);
		const now = Date.now();
		const blockNow = await web3[chainId].eth.getBlockNumber();

		logger.debug(`[Snapshot] ===> Start. Chain: ${chainId}. Timestamp: ${new Date(now).toLocaleString()}. DB: ${dbCount}. Contract: ${contractCount}. From: ${lastSnapshotDB.block}. To: ${blockNow}.`);

		if (contractCount !== dbCount) {
			const data = await this.subscribe[event==="Wrap"? "wrap": "unwrap"].getHistory(lastSnapshotDB.block, blockNow);
			for (const e of data) {
				if(await this.saveEvent(e)) {
					dbCount++;
					logger.debug(`[Snapshot] ===> Add new event. Chain: ${chainId}. Hash: ${e.transactionHash}. Db-count: ${dbCount}.`);
				}
			}
		
		}

		logger.debug(`[Snapshot] ===> End. Chain: ${chainId}. Timestamp: ${new Date(now).toLocaleString()}. DB: ${dbCount}. Contract: ${contractCount}. From: ${lastSnapshotDB.block}. To: ${blockNow}.`);
	
		if(dbCount!==contractCount){
			await db.snapshot.saveSnapshot({ contract: address, chainId, count: contractCount, block: blockNow, isCompleted: false });
		}else{
			await db.snapshot.saveSnapshot({ contract: address, chainId, count: contractCount, block: blockNow, isCompleted: true});

		}

		
	}


	async saveEvent(event: EventData) {
		return await saveEvent.call(
			{
				chainId:
					event.event === "Wrap" ? this.options.wrap.chainId : this.options.unwrap.chainId,
				saver: db.event.saveEvent,
			},
			event
		);
	}

	async wrapEvent(event: Event) {
		const isWrap = event.event === "Wrap";
		const result = await wrapEvent.call(
			{
				eventChainId: isWrap
					? this.options.wrap.chainId
					: this.options.unwrap.chainId,
				transactionChainId: isWrap
					? this.options.unwrap.chainId
					: this.options.wrap.chainId,
				oracle: this.oracle,
			},
			event
		);

		if (result && result.outHash) {
			await db.event.completeEvent(event.hash, event.chainId, result.outHash, result.fee);
		}
	}

	async start() {
		this.subscribe.wrap.start();
		this.subscribe.unwrap.start();
		this.worker.wrap.run();
		this.worker.unwrap.run();
		this.cron.start();
	}
}

class BridgeWorker {
	isRun = false;
	isWrap: boolean;
	bridge: Bridge;

	constructor(bridge: Bridge, isWrap: boolean) {
		this.bridge = bridge;
		this.isWrap = isWrap;
	}

	async run() {
		this.isRun = true;
		logger.debug(`Worker for ${this.isWrap ? "Wrap" : "Unwrap"} is run`);
		while (this.isRun) {
			const initTransactions = await db.event.getInitEvents(
				this.bridge.options[this.isWrap ? "wrap" : "unwrap"].chainId,
				this.isWrap ? "Wrap" : "Unwrap"
			);

			for (const tx of initTransactions) {
				try {
					await this.bridge.wrapEvent(tx);
				} catch (err) {
					logger.error("Error in worker_run");
					logger.error(err);
				}
			}
		}
	}

	stop() {
		logger.debug(`Worker for ${this.isWrap ? "Wrap" : "Unwrap"} is stop`);
		this.isRun = false;
	}
}

async function saveEvent(event: EventData) {
	try {
		await this.saver(this.chainId, event);
		return true;
	} catch (err) {
		if (err.name === "SequelizeUniqueConstraintError") {
			return false;
		} else {
			logger.error(`Unhandled error in tx saver for ${this.chainId} network`);
			logger.error(err);
			return false;
		}
	}

}

async function wrapEvent(event: Event) {
	try {
		if (!BN.isBN(event.amount)) {
			event.amount = new BN(event.amount);
		}

		const wrapData = {
			from: event.user,
			nonce: event.nonce,
			amount: event.amount,
			fee: new BN("0"),
		};
		const fee = await this.oracle.getFee(wrapData, event.event === "Wrap");

		if (fee.lt(event.amount)) {
			wrapData.fee = fee;
			logger.debug(`Run ${event.event} ${event.nonce} ${event.hash}`);
			const outHash = await web3Handlers.wrapToken(
				this.transactionChainId,
				wrapData,
				{ hash: event.hash, event: event.event, chainId: this.eventChainId }
			);
			return {outHash, fee: fee.toString()};
		} else {
			logger.debug(`Block ${event.event} ${event.nonce} ${event.hash}`);
			await db.event.blockEvent(event.hash, this.eventChainId, fee.toString());
			return undefined;
		}
	} catch (err) {
		if (
			err.message.substring(err.message.length - 17) === "Already processed"
		) {
			logger.debug(
				`Event ${event.event} ${event.nonce} ${event.hash} already processed`
			);
			await db.event.changeEventStatus(this.eventChainId, event.hash, "already_done");
			return;
		} else {
			logger.error(
				`Error in wrap_worker for ${event.event} nonce: ${event.nonce} hash: ${event.hash}`
			);
			logger.error(err);
		}
	}
}
