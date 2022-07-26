import Web3 from "web3";
import BN  from "bn.js";
import { Contract} from "web3-eth-contract";
import logger from "../utils/logger";
import * as contracts from "../web3/contracts";
import web3 from "../web3/web3";
import { estimateGas,getGasPrice } from "../web3/utils/handlers";

interface WrapData {
    from: string,
    nonce: number,
    amount: string | BN
}

export class Oracle {

	chainId: {
		wrap: number,
		unwrap: number
	};

	constructor(
		wrapChainId: number,
		unwrapChainId: number
	){
		this.chainId = {
			wrap: wrapChainId,
			unwrap: unwrapChainId
		};
	}

	async getFee(data: WrapData, isWrap: boolean, _gasPrice: string | BN = undefined ){
		const type = isWrap? "wrap": "unwrap";
		const chainId = this.chainId[isWrap? "unwrap": "wrap"];
		try{
			const gas = await estimateGas(chainId, type, data);
			const gasPrice = await getGasPrice(chainId);

			const price = new BN(gas).mul(new BN(gasPrice));
			const addresses = [contracts.weths[chainId].options.address, contracts.tokens[chainId].options.address];
			const fee = await contracts.routers[chainId].methods
				.getAmountsOut(price, addresses)
				.call();
			logger.trace(`Get fee ======> ${data.from} - ${data.nonce} - ${data.amount}. Gas: ${gas}. gasPrice: ${gasPrice}. fee: ${fee[1].split(".")[0]}`);
			return new BN(fee[1].split(".")[0]);
		}
		catch(err){
			logger.error("Error in getFee");
			logger.error(err);
			throw new Error(err);
		}
	}

}
