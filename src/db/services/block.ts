import  db from "../models";

export async function  addBlock(index:string, block: number) {
	await db.block.create({index,block});
}

export async function getBlock(index: string) {
	const a = await db.block.findByPk(index);
	if(a){
		return a.block;
	}
}

export async function setBlock(index:string, block: number) {
	await db.sequelize.query("UPDATE blocks SET block=:block WHERE index=:index", 
		{replacements:{
			block, index
		}}
	);
	return true;
}