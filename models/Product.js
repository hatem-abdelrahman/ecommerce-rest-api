import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

const productSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    reviews: [reviewSchema],
    rating: {
      type: Number,
      required: true,
      default: 0,
    },
    numReviews: {
      type: Number,
      required: true,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    countInStock: {
      type: Number,
      min: [0, "Stock cannot be negative"], // <-- Mongoose Validator
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// 1. Indexes for faster search and filter queries
productSchema.index({ name: "text", description: "text" }); // Compound text index for search
productSchema.index({ category: 1 }); // Single field index for category filtering
productSchema.index({ price: 1 }); // Single field index for price filtering

// 2. Static method to calculate rating average & numReviews using MongoDB Aggregation Pipeline
productSchema.statics.calculateAverageRating = async function (productId) {
  const stats = await this.aggregate([
    // Stage 1: Filter to target only this specific product
    { $match: { _id: productId } },
    // Stage 2: Deconstruct the reviews array so we can process individual reviews
    { $unwind: "$reviews" },
    // Stage 3: Group by product ID and calculate count & average rating
    {
      $group: {
        _id: "$_id",
        rating: { $avg: "$reviews.rating" },
        numReviews: { $sum: 1 },
      },
    },
  ]);
  // If reviews exist, update the product with calculated values
  if (stats.length > 0) {
    await this.findByIdAndUpdate(productId, {
      rating: Number(stats[0].rating.toFixed(1)), // Keep 1 decimal place, e.g. 4.5
      numReviews: stats[0].numReviews,
    });
  } else {
    // If all reviews were deleted, reset back to 0
    await this.findByIdAndUpdate(productId, {
      rating: 0,
      numReviews: 0,
    });
  }
};

const Product = mongoose.model("Product", productSchema);

export default Product;
