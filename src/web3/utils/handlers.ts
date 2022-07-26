import Web3 from "web3";
import logger from "../../utils/logger";
import { Contract, EventData } from "web3-eth-contract";
import BN from "bn.js";
import utils from "web3-utils";
import web3 from "../web3";
import nonce from "../nonce";
import * as contracts from "../contracts";
import {tx as db} from "../../db/services";

const GAS_MULTIPLIER = 1.5;

export async function estimateGas(chainId: number, method: string, data: any) {
	try{
		return (
			(await contracts.wrappers[chainId].methods[method](
				data.from,
				data.amount,
				data.fee,
				data.nonce
			).estimateGas({ from: process.env.GENERAL_ADDRESS })) * GAS_MULTIPLIER
		).toFixed();
	}catch(err){
		logger.error(`Error in estimateGas. ChainId: ${chainId}. Method: ${method}`);
		logger.error(err);
		throw new Error(err.message);
	}
}

export async function getGasPrice(chainId: number, add = 0) {
	if (chainId === 56) {
		return utils.toWei(new BN("12").addn(add), "gwei");
	} else {
		return await web3[chainId].eth.getGasPrice();
	}
}

export async function getLastNonce(chainId: number) {
	const account = await web3[chainId].eth.accounts.privateKeyToAccount(
		process.env.GENERAL_PRIVATE_KEY
	).address;
	const nonce = await web3[chainId].eth.getTransactionCount(account);
	return nonce;
}

export async function wrapToken(
	chainId: number,
	wrapData: {
    from: string;
    amount: string | BN;
    fee: string | BN;
    nonce: number;
  },
	eventData: {
    hash: string;
    event: string;
	chainId: number
  },
	countRestart = 0
): Promise<string> {
	const type: string = eventData.event === "Wrap" ? "wrap" : "unwrap";

	if (nonce[chainId] === 0) {
		logger.debug(`Nonce of ${chainId} network is 0. Start request.`);
		nonce[chainId] = await getLastNonce(chainId);
		logger.debug(
			`Nonce of ${chainId} network after request is ${nonce[chainId]}`
		);
	}

	const nonceForTheTransaction = nonce[chainId]++;

	const gasPrice = await getGasPrice(chainId, countRestart);

	const txObject = {
		nonce: nonceForTheTransaction,
		from: process.env.GENERAL_ADDRESS,
		to: contracts.wrappers[chainId].options.address,
		data: contracts.wrappers[chainId].methods[type](
			wrapData.from,
			wrapData.amount,
			wrapData.fee,
			wrapData.nonce
		).encodeABI(),
		gas: await estimateGas(
			chainId,
			eventData.event === "Wrap" ? "wrap" : "unwrap",
			wrapData
		),
		gasPrice,
		value: "0x00",
	};

	logger.debug(
		`Send tx. Network: - ${chainId}. Event: - ${eventData.event}. Used nonce: - ${nonceForTheTransaction}. Init event hash: - ${eventData.hash}. countRestart: - ${countRestart}`
	);

	const rawTx = await web3[chainId].eth.accounts.signTransaction(
		txObject,
		process.env.GENERAL_PRIVATE_KEY
	);

	try {
		const result = await sendTransaction(chainId, rawTx.rawTransaction, {
			eventHash: eventData.hash,
			eventChainId: eventData.chainId,
			contract: txObject.to.toLowerCase(),
			nonce: wrapData.nonce,
			amount: wrapData.amount.toString(),
			fee: wrapData.fee.toString(),
			user: wrapData.from,
			chainId: chainId,
			event: eventData.event
		});

		logger.debug(
			`Event ${eventData.hash} complete with ${result} transaction.`
		);
		return result;
	} catch (err) {
		logger.error(
			`Error in ${eventData.event} send for event: ${eventData.hash} 
			User: ${wrapData.from} , amount: ${	wrapData.amount}, fee: ${wrapData.fee.toString()}, eventNonce: ${wrapData.nonce}`
		);
		logger.error(err);

		if (
			err.message ===
      "Transaction was not mined within 750 seconds, please make sure your transaction was properly sent. Be aware that it might still be mined!"
		) {
			if (countRestart < 3) {
				logger.debug(`Restart event: ${eventData.hash}. `);
				return await wrapToken(chainId, wrapData, eventData, countRestart + 1);
			} else {
				logger.error(
					`Too much transacions restarts on ${eventData.event}!. Init Event Hash: ${eventData.hash}`
				);
			}
		}

		if (err.message === "Returned error: nonce too low") {
			const x = await getLastNonce(chainId);
			logger.debug(`Nonce eth after request is ${nonce[chainId]}`);
			logger.debug(
				`Restart WRAP TX with new nonce. Event: ${eventData.hash}. Old nonce: ${nonce[chainId]}. New nonce: ${x}`
			);
			nonce[chainId] = x;
			return await wrapToken(chainId, wrapData, eventData);
		}

		throw new Error(err);
	}
}

export async function sendTransaction(chainId: number, rawTx: any, data: any) {
	let tmpHash: string;
	
	// await db.createTransaction({hash: tmpHash, ...data});
	await web3[chainId].eth
		.sendSignedTransaction(rawTx)
		.once("transactionHash", (hash) => {
			logger.debug(
				`[TX] ===> Run. Hash: ${hash}. Event: ${data.eventHash}. Nonce: ${data.nonce}`
			);
			tmpHash = hash;
			db.createTransaction({hash: tmpHash, ...data});
		})
		.once("receipt", (receipt) => {
			logger.debug(
				`[TX] ===> Confirm. Hash: ${receipt.transactionHash}. Event: ${data.eventHash}. Nonce: ${data.nonce}`
			);
			db.completeTransaction(tmpHash, chainId, receipt);
			return receipt;
		})
		.on("error", async (error) => {
			logger.error(
				`[TX] ===> Error. ${tmpHash}. Nonce: ${data.nonce}. Error: ${error}`
			);
			logger.error(error.toString());
			db.errorTransaction(tmpHash, chainId);

			return error;
		})
		.then((receipt) => {
			return receipt;
		});
	return tmpHash;
}
