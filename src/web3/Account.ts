// import Web3 from "web3";
// import web3 from "./web3";

// export class Account {
// 	address: string;
// 	privateKey: string;
// 	chainId: number;
// 	nonce: number | null = null;

// 	constructor(privateKey: string, chainId: number){
// 		this.chainId=chainId;
// 		this.privateKey=privateKey;

// 		this.address = web3[chainId].eth.accounts.privateKeyToAccount(
// 			process.env.GENERAL_PRIVATE_KEY
// 		).address;

// 		// web3.eth.getTransactionCount(this.address).then(e=>{
// 		// 	this.nonce=e;
// 		// });
// 	}

// 	public async get nonce(){
// 		if(this.nonce === null) {

// 		}else{
// 			return this.nonce;
// 		}
// 	}
// }