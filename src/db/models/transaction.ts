// "use strict";

import BN from "web3";
import { Model, InferAttributes, InferCreationAttributes, CreationOptional, Sequelize, DataTypes } from "sequelize";

enum TransactionStatus {
	init, 
	success,
	error
}

class Transaction extends Model<InferAttributes<Transaction>, InferCreationAttributes<Transaction>>{
	declare hash: string;
	declare chainId: string;
	declare contract: string;
	declare event: string;
	declare user: string;
	declare nonce: number;
	declare amount: string | BN;
	declare fee: string | BN; 
	declare status: TransactionStatus; 
	declare eventHash: string | null;
	declare eventChainId: number;
	declare reciept: JSON;
}

export default function (sequelize: Sequelize){

	const transaction = sequelize.define<Transaction>(
		"transaction",
		{
			hash: {
				type: DataTypes.STRING,
				primaryKey: true,
			},
			chainId: {
				type: DataTypes.INTEGER,
				primaryKey: true,
			},
			contract: {
				type: DataTypes.STRING,
				allowNull: false
			},
			event: {
				type: DataTypes.STRING,
			},
			user: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			nonce: {
				type: DataTypes.INTEGER,
			},
			amount: {
				type: DataTypes.STRING,
			},
			fee: {
				type: DataTypes.STRING
			},
			status: {
				type: DataTypes.STRING,
			},
			eventHash: {
				type: DataTypes.STRING,
				allowNull: true
			},
			eventChainId:{
				type: DataTypes.INTEGER,
				allowNull: true
			},
			reciept: {
				type: DataTypes.JSON,
				allowNull: true
			}
		},
		{
			underscored: false,
		}
	);

	return transaction;
}
