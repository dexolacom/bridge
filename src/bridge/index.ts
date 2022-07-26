import { Bridge} from "./Bridge";


const ETH ={
	chainId: 3,
	subscribe:{
		eventName: "Wrap"
	}
};

const BSC ={
	chainId: 97,
	subscribe:{
		eventName: "Unwrap"
	}
};

const ETH_BSC_Bridge: Bridge = new Bridge(ETH, BSC);


export default async function startAllBridges() {
	ETH_BSC_Bridge.start();
}