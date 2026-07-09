import Product from "../models/Product.js";

// @desc    Fetch all products with advanced filtering, sorting, & pagination
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const query = {};
    // 1. ADVANCED FILTERING
    // A. Text Search (using the compound text index we created)
    if (req.query.keyword) {
      query.$text = { $search: req.query.keyword };
    }
    // B. Category Filter
    if (req.query.category) {
      query.category = req.query.category;
    }
    // C. Brand Filter
    if (req.query.brand) {
      query.brand = req.query.brand;
    }
    // D. Rating Filter (shows items with rating >= specified value)
    if (req.query.rating) {
      query.rating = { $gte: Number(req.query.rating) };
    }
    // E. Price Range Filter
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) {
        query.price.$gte = Number(req.query.minPrice);
      }
      if (req.query.maxPrice) {
        query.price.$lte = Number(req.query.maxPrice);
      }
    }
    // 2. SORTING
    let sortQuery = { createdAt: -1 }; // Default: Newest first
    if (req.query.sortBy) {
      if (req.query.sortBy === "priceAsc") sortQuery = { price: 1 };
      else if (req.query.sortBy === "priceDesc") sortQuery = { price: -1 };
      else if (req.query.sortBy === "rating") sortQuery = { rating: -1 };
      else if (req.query.sortBy === "newest") sortQuery = { createdAt: -1 };
    }
    // 3. PAGINATION
    const page = Number(req.query.pageNumber) || 1; // Current page number
    const limit = Number(req.query.limit) || 8; // Items per page
    const skip = (page - 1) * limit; // Number of items to skip
    // Get total count of products matching the query filters
    const totalCount = await Product.countDocuments(query);
    // Fetch the paginated and sorted products
    const products = await Product.find(query)
      .sort(sortQuery)
      .limit(limit)
      .skip(skip);
    // Return products along with pagination metadata
    res.json({
      products,
      page,
      pages: Math.ceil(totalCount / limit),
      totalProducts: totalCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Fetch single product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      await Product.deleteOne({ _id: product._id });
      res.json({ message: "Product removed" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a product template
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  try {
    const product = new Product({
      name: "Sample Name",
      price: 0,
      user: req.user._id,
      image:
        "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
      brand: "Sample Brand",
      category: "Electronics",
      countInStock: 0,
      numReviews: 0,
      description: "Sample description",
    });
    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  const { name, price, description, image, brand, category, countInStock } =
    req.body;
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      product.name = name || product.name;
      product.price = price === undefined ? product.price : price;
      product.description = description || product.description;
      product.image = image || product.image;
      product.brand = brand || product.brand;
      product.category = category || product.category;
      product.countInStock =
        countInStock === undefined ? product.countInStock : countInStock;
      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
export const createProductReview = async (req, res) => {
  const { rating, comment } = req.body;
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      const alreadyReviewed = product.reviews.find(
        (r) => r.user.toString() === req.user._id.toString(),
      );
      if (alreadyReviewed) {
        return res.status(400).json({ message: "Product already reviewed" });
      }
      const review = {
        name: req.user.name,
        rating: Number(rating),
        comment,
        user: req.user._id,
      };
      product.reviews.push(review);
      await product.save(); // Save the new review inside the product document
      // Instead of calculating ratings inside Node.js, we call the static method
      await Product.calculateAverageRating(product._id);
      res.status(201).json({ message: "Review added" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
