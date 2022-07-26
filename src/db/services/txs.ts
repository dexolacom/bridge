import  db from "../models";


export async function createTransaction(data: any){
	return await db.transaction.create({...data, status: "init"});
}

export async function errorTransaction(hash: string, chainId: number) {
	return await db.transaction.update({status: "error"}, {where: {
		hash,
		chainId
	}});
}

export async function completeTransaction(hash: string, chainId: number, receipt: any) {
	return await db.transaction.update({status: "completed", receipt}, {where: {
		hash,
		chainId
	}});
}

// completeTransaction;
// createTransaction();
// changeTransactionStatus;