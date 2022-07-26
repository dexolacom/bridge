// "use strict";

import BN from "bn.js";
import { Model, InferAttributes, InferCreationAttributes, CreationOptional, Sequelize, DataTypes } from "sequelize";

enum EventStatus {
	init, 
	success,
	blocked
}

export class Event extends Model<InferAttributes<Event>, InferCreationAttributes<Event>>{
	declare hash: string;
	declare chainId: number;
	declare contract: string;
	declare event: string;
	declare user: string;
	declare nonce: number;
	declare amount: string | BN;
	declare fee: string | BN; 
	declare status: EventStatus; 
	declare outHash: string | null;
}

export default function (sequelize: Sequelize){

	const event = sequelize.define<Event>(
		"event",
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
			fee:{
				type: DataTypes.STRING
			},
			status: {
				type: DataTypes.STRING,
			},
			outHash: {
				type: DataTypes.STRING,
				allowNull: true
			}
		},
		{
			underscored: false,
		}
	);

	return event;
}
