

import { Contract } from "web3-eth-contract";
import { AbiItem } from "web3-utils";
import web3 from "./web3";

import Wrappers from "../web3/contracts/Wrapper.json";
import Tokens from "../web3/contracts/TBT.json";
import Routers from "../web3/contracts/Router.json";
import Weths from "../web3/contracts/WETH.json";
import Web3 from "web3";

const chainIds = [3,97];

export const wrappers: {[key:number]: Contract}  = {};
export const routers: {[key:number]: Contract} = {};
export const tokens: {[key:number]: Contract}  = {};
export const weths: {[key:number]: Contract}  = {};

chainIds.forEach(chainId=>{
	wrappers[chainId] = new web3[chainId].eth.Contract(Wrappers.find(e=>e.chainId===chainId).ABI as AbiItem[], Wrappers.find(e=>e.chainId===chainId).address );
	routers[chainId] = new web3[chainId].eth.Contract(Routers.find(e=>e.chainId===chainId).ABI as AbiItem[], Routers.find(e=>e.chainId===chainId).address );
	tokens[chainId] = new web3[chainId].eth.Contract(Tokens.find(e=>e.chainId===chainId).ABI as AbiItem[], Tokens.find(e=>e.chainId===chainId).address );
	weths[chainId] = new web3[chainId].eth.Contract(Weths.find(e=>e.chainId===chainId).ABI as AbiItem[], Weths.find(e=>e.chainId===chainId).address );
});


