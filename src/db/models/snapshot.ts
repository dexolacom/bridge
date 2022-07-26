// "use strict";

import BN from "bn.js";
import { Model, InferAttributes, InferCreationAttributes, CreationOptional, Sequelize, DataTypes } from "sequelize";

export class Snapshot extends Model<InferAttributes<Snapshot>, InferCreationAttributes<Snapshot>>{
	declare contract: string;
	declare chainId: number;
	declare block: number;
	declare count: number;
	declare isCompleted: boolean;
}

export default function (sequelize: Sequelize){

	const snapshot = sequelize.define<Snapshot>(
		"snapshot",
		{
			contract: {
				type: DataTypes.STRING,
			},
			chainId: {
				type: DataTypes.INTEGER,
			},
			block: {
				type: DataTypes.INTEGER,
				allowNull: false
			}, 
			count: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue : 0
			},
			isCompleted: {
				type: DataTypes.BOOLEAN,
				allowNull: false
			}
		},
		{
			underscored: false,
		}
	);

	return snapshot;
}
