import Cart from "../models/cart.model.js";

export const addToCart = async (req, res) => {
  const { courseId } = req.body;
  const userId = req.user.id;

  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({
      user: userId,
      courses: [courseId],
    });
  } else {
    if (!cart.courses.includes(courseId)) {
      cart.courses.push(courseId);
      await cart.save();
    }
  }

  res.json(cart);
};

export const getCart = async (req, res) => {
  const cart = await Cart.findOne({
    user: req.user.id,
  }).populate("courses");

  res.json(cart || { courses: [] });
};

export const removeFromCart = async (req, res) => {
  const { courseId } = req.params;

  const cart = await Cart.findOne({
    user: req.user.id,
  });

  if (!cart) {
    return res.status(404).json({
      message: "Cart not found",
    });
  }

  cart.courses = cart.courses.filter((id) => id.toString() !== courseId);

  await cart.save();

  res.json(cart);
};

export const clearCart = async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user.id }, { courses: [] });

  res.json({
    message: "Cart cleared",
  });
};
