// "use strict";

import BN from "bn.js";
import { Model, InferAttributes, InferCreationAttributes, CreationOptional, Sequelize, DataTypes } from "sequelize";

export class Block extends Model<InferAttributes<Block>, InferCreationAttributes<Block>>{
	declare index: string;
	declare block: number;
}

export default function (sequelize: Sequelize){

	const block = sequelize.define<Block>(
		"block",
		{
			index: {
				type: DataTypes.STRING,
				primaryKey: true
			},
			block: {
				type: DataTypes.INTEGER,
				allowNull: false
			}
		},
		{
			underscored: false,
		}
	);

	return block;
}
