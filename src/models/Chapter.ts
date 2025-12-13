import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ChapterAttributes {
  id: number;
  bookId: number;
  title: string;
  order: number;
  content: string; // In a relational DB, content might be stored here or linked to another table
  createdAt?: Date;
  updatedAt?: Date;
}

interface ChapterCreationAttributes extends Optional<ChapterAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Chapter extends Model<ChapterAttributes, ChapterCreationAttributes> implements ChapterAttributes {
  public id!: number;
  public bookId!: number;
  public title!: string;
  public order!: number;
  public content!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Chapter.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    bookId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'Books', // This is a placeholder, assuming a 'Books' model exists
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    order: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true, // Content might be optional if stored elsewhere or generated
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'Chapters',
    sequelize, // passing the sequelize instance is required
  }
);

export default Chapter;