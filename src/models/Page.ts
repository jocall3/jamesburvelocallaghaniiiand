import { Schema, model, Document } from 'mongoose';

/**
 * Interface representing a single page in a book.
 */
export interface IPage extends Document {
  /**
   * The title of the page.
   */
  title: string;

  /**
   * The main content of the page.
   */
  content: string;

  /**
   * The chapter this page belongs to.
   * This is a reference to the Chapter model.
   */
  chapter: Schema.Types.ObjectId;

  /**
   * The order of this page within its chapter.
   */
  pageNumber: number;

  /**
   * Timestamp when the page was created.
   */
  createdAt: Date;

  /**
   * Timestamp when the page was last updated.
   */
  updatedAt: Date;
}

/**
 * Mongoose schema for the Page model.
 */
const pageSchema = new Schema<IPage>(
  {
    title: {
      type: String,
      required: [true, 'Page title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Page content is required'],
    },
    chapter: {
      type: Schema.Types.ObjectId,
      ref: 'Chapter', // Assuming a 'Chapter' model exists
      required: [true, 'Page must belong to a chapter'],
    },
    pageNumber: {
      type: Number,
      required: [true, 'Page number is required'],
      min: [1, 'Page number must be at least 1'],
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

/**
 * Mongoose model for book pages.
 */
const Page = model<IPage>('Page', pageSchema);

export default Page;