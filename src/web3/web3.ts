import Web3 from "web3"; 
import { HttpProvider, WebsocketProvider } from "web3-core";

export const rps = [
	{
		chainId: 3,
		rpc: "wss://ropsten.infura.io/ws/v3/4b4d329aa3be4458b3d2cbbb752bf66d",
		isWebSocket:  true
		// rpc: "http://ropsten.infura.io/ws/v3/4b4d329aa3be4458b3d2cbbb752bf66d",
		// isWebSocket: false
	},
	{
		chainId: 97,
		// rpc: "https://data-seed-prebsc-1-s1.binance.org:8545/", 
		// isWebSocket: false,
		rpc: "wss://speedy-nodes-nyc.moralis.io/a49cccec58f3560ed0ac9479/bsc/testnet/ws",
		//rpc:  "wss://bsc.getblock.io/testnet/?api_key=f5aea362-1e9b-475e-a553-097882d9f177",
		isWebSocket: true
	}
];

const providers : {[key:number]: WebsocketProvider | HttpProvider}={};
const web3  : {[key:number]: Web3}={};

rps.forEach(e=>{
	providers[e.chainId] = new Web3.providers[e.isWebSocket? "WebsocketProvider": "HttpProvider"](e.rpc, e.isWebSocket?  {    
		clientConfig: {
			// // Useful if requests are large
			// maxReceivedFrameSize: 100000000,   // bytes - default: 1MiB
			// maxReceivedMessageSize: 100000000, // bytes - default: 8MiB

			// Useful to keep a connection alive
			keepalive: true,
			keepaliveInterval: 60000 // ms
		},
		reconnect: {
			auto: true,
			delay: 5000, // ms
			maxAttempts: 5,
			onTimeout: false
		}}: undefined); 

	web3[e.chainId]=new Web3(providers[e.chainId]);
});

export default web3;