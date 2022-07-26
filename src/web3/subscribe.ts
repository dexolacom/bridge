import { Contract, EventData } from "web3-eth-contract";
import logger from "../utils/logger";
// import { EventEmitter } from "node/events";
import {chain} from "web3-core";
import Web3 from "web3";

export interface SubscriberDataBaseInterface {
	getBlock: (index: string)=>Promise<number>
	setBlock: (index:string, block: number) => Promise<any>,
	addBlock: (index:string, block: number) => Promise<any>
}

export interface SubscriberOptions {
	eventName: string

}

export interface SubscriberBlockOptions extends SubscriberOptions {
	blockLimit: number | undefined 
	count: number,
	timeouts: number[]
}


export class BlockSubscriber {
	contract: Contract;
	worker: (event: EventData)=> Promise<boolean>;
	isBinance: boolean | null = null;
	web3: Web3;
	db: SubscriberDataBaseInterface;
	options: SubscriberBlockOptions;
	runers: ((timeout: number, index: number) => void)[];
	id: string;
	run: boolean;

	constructor (contract: Contract, worker: (event: EventData)=> Promise<boolean>, web3: Web3, db:SubscriberDataBaseInterface, options: SubscriberBlockOptions ){
		this.worker = worker;
		this.contract = contract;
		this.web3 = web3; 
		this.db = db;
		this.options = options;
		this.id = contract.options.address + "_" + options.eventName; 
		
	}

	public async start(){
		const chainId = await this.web3.eth.getChainId();
		this.id+="_"+chainId;
		this.run=true;
		logger.trace("start subscribe");
		for (let i = 0; i < this.options.count; i++) {
			this.listenByBlock(this.options.timeouts[i], i);
		}
	}

	public stop(){
		logger.trace("stop subscribe");
		this.run = false;
	}
     
	async listenByBlock(timeout: number, index: number){
	
		let lastBlockFromDB = await this.db.getBlock(this.id+"_"+index);
		let block = await this.getLastBlock();

		if (!lastBlockFromDB) {
			await this.db.addBlock(this.id+"_"+index, block);
			lastBlockFromDB = block - 1;
		}

		if(block<lastBlockFromDB){
			block = lastBlockFromDB;
		}

		if (block - lastBlockFromDB > this.options.blockLimit) {
			lastBlockFromDB = block - this.options.blockLimit;
		}
		
		logger.trace(`listen event - ${this.id+"_"+index} -from: ${lastBlockFromDB} -to: ${block}`);
		try{
			const pastEvents =  await this.contract.getPastEvents(this.options.eventName, {
				fromBlock: lastBlockFromDB,
				toBlock: block
			});
			
			const result =  filterDublicatesEvents(pastEvents);

	
			for (const event of result) {
				await this.worker(event);
			}
	
			await this.db.setBlock(this.id+"_"+index,block);
			if(this.run){
				setTimeout(() => {
					this.listenByBlock(timeout, index);
				}, timeout);
			}
		} catch (err) {
			console.error(`ERROR listen event - ${this.id+"_"+index} -from: ${lastBlockFromDB} -to: ${block}`);
			console.error(err);
			if(this.run){
				setTimeout(() => {
					this.listenByBlock(timeout, index);
				}, timeout);
			}
		}
	}

	private async  getLastBlock(){
		return await this.web3.eth.getBlockNumber();
	}

	async getHistory(start: number, end:number){
		const dif = end - start;
		const div = Math.floor(dif / this.options.blockLimit) * this.options.blockLimit; 
		let result: EventData[]  = [];
		let tmp;

		for (let i = start; i < div; i+=this.options.blockLimit) {
			tmp = await this.contract.getPastEvents(this.options.eventName, {
				fromBlock: i,
				toBlock: i + this.options.blockLimit
			});
			result = result.concat(tmp);
		}

		if(dif - div>0){
			tmp =  await this.contract.getPastEvents(this.options.eventName, {
				fromBlock: div,
				toBlock: end
			});	
			result = result.concat(tmp);
		}

		return filterDublicatesEvents(result);

	}
    
}

export class SocketSubscriber {
	contract: Contract;
	worker: (event: EventData)=> Promise<boolean>;
	options: SubscriberOptions;
	lisener: any;
	id: string;

	constructor (contract: Contract, worker: (event: EventData)=> Promise<boolean>, options: SubscriberOptions){
		this.worker = worker;
		this.contract = contract;
		this.options = options;
	}

	async start(){

		this.lisener = this.contract.events[this.options.eventName]()
			.on("data", async (event:EventData) => { 
				logger.debug(`New event: ${event.transactionHash} --- Contract: ${this.contract.options.address}. Event: ${this.options.eventName}. Id: ${this.id}`);
				await this.worker(event);
			})
			.on("changed", (changed:EventData) => logger.trace(changed.toString()))
			.on("error", (err:any) => {
				logger.error(`Error in Subscriber. Contract: ${this.contract.options.address}. Event: ${this.options.eventName}. Id: ${this.id}`);
				logger.error(err);
				// throw err;
			})
			.on("connected",(str:any) => {
				this.id = str; 
				logger.debug(`Subscriber successful conneced --- Contract: ${this.contract.options.address}. Event: ${this.options.eventName}. Id: ${this.id}`);
			});
	}

	stop(){
		this.lisener.removeAllListeners();
	}

	restart(){
		this.stop();
	}

	async getHistory(start: number, end:number){
		return filterDublicatesEvents(await this.contract.getPastEvents(this.options.eventName, {
			fromBlock: start,
			toBlock: end
		}));
	}

}

function filterDublicatesEvents(events: EventData[]){
	const result = [];
	const map = new Map();
	for (const item of events) {
		if (!map.has(item.transactionHash)) {
			map.set(item.transactionHash, true);
			result.push(item);
		}
	}
	return result;
}