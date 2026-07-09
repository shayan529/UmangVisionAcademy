import Cart from "../models/cart.model.js";

export const addToCart = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user._id;

    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required" });
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = await Cart.create({
        user: userId,
        courses: [courseId],
      });
    } else {
      const normalizedCourses = (cart.courses || []).filter(
        (id) => id && id.toString() !== courseId,
      );

      if (!normalizedCourses.some((id) => id.toString() === courseId)) {
        normalizedCourses.push(courseId);
        cart.courses = normalizedCourses;
        await cart.save();
      }
    }

    res.json(cart);
  } catch (error) {
    console.error("[Cart] addToCart error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      user: req.user._id,
    }).populate("courses");

    if (!cart) {
      return res.json({ courses: [] });
    }

    const courses = (cart.courses || []).filter(Boolean);
    res.json({ ...cart.toObject(), courses });
  } catch (error) {
    console.error("[Cart] getCart error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { courseId } = req.params;

    const cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    cart.courses = (cart.courses || []).filter(
      (id) => id && id.toString() !== courseId,
    );

    await cart.save();

    res.json(cart);
  } catch (error) {
    console.error("[Cart] removeFromCart error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user._id }, { courses: [] });

    res.json({
      message: "Cart cleared",
    });
  } catch (error) {
    console.error("[Cart] clearCart error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
