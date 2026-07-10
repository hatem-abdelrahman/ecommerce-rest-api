import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Stripe from "stripe";

// Helper to check if Stripe Secret Key is valid and return an instance
const getStripeInstance = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (
    !key ||
    key.includes("PleaseReplaceThis") ||
    key.startsWith("sk_test_51PTestKey")
  ) {
    return null;
  }
  try {
    return new Stripe(key);
  } catch (error) {
    console.error("Stripe initialization failed:", error.message);
    return null;
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const addOrderItems = async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  if (orderItems && orderItems.length === 0) {
    return res.status(400).json({ message: "No order items" });
  }

  try {
    const order = new Order({
      orderItems: orderItems.map((x) => ({
        ...x,
        product: x.product,
        _id: undefined, // remove front-end item ID
      })),
      user: req.user._id,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email",
    );

    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create Stripe Payment Intent
// @route   POST /api/orders/:id/stripe-intent
// @access  Private
export const createStripePaymentIntent = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const stripe = getStripeInstance();
    if (!stripe) {
      console.warn(
        "Stripe key is not configured. Falling back to MOCK Stripe mode.",
      );
      return res.json({
        clientSecret: "mock_stripe_client_secret_success_12345",
        isMock: true,
      });
    }

    // Stripe expects amount in cents
    const amountInCents = Math.round(order.totalPrice * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      metadata: { orderId: order._id.toString() },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      isMock: false,
    });
  } catch (error) {
    console.error("Stripe Intent Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
export const updateOrderToPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
        email_address: req.body.email_address,
      };

      // Decrease stock levels for each item using updateOne instead of find then save, to prevent race condition
      for (const item of order.orderItems) {
        const result = await Product.updateOne(
          {
            _id: item.product,
            countInStock: { $gte: item.qty }, // <-- The Guard: only match if stock >= qty
          },
          { $inc: { countInStock: -item.qty } }, // Decrements stock directly in MongoDB (atomic)
        );
        // 2. Check if the update succeeded (in case the stock is not >= qty)
        if (result.modifiedCount === 0) {
          // If modifiedCount is 0, it means MongoDB couldn't find the product with enough stock. It is sold out!
          throw new Error(`Product ${item.name} is out of stock!`);
        }
      }

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
export const updateOrderToDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      if (!order.isPaid) {
        return res
          .status(400)
          .json({ message: "Cannot deliver an unpaid order" });
      }
      order.isDelivered = true;
      order.deliveredAt = Date.now();

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate("user", "id name");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
