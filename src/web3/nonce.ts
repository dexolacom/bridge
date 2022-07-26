import web3 from "./web3";
const nonce: {[key:number]: number}  = {};


for (const chainId in web3) {
	if (Object.prototype.hasOwnProperty.call(web3, chainId)) {
		nonce[chainId]=0;
	}
}

export default nonce;
