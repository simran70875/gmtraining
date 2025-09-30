const Order = require("../models/Order");
const Cart = require("../models/Cart");
const path = require("path");
const generateOrderId = require("../utils/generateOrderId");
const { default: axios } = require("axios");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const transporter = require("../utils/transporter");
const { validationResult } = require("express-validator");
const moment = require("moment");

const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// Compare cart items with products sent in request
const areSameProducts = (cartItems, requestProducts) => {
  if (cartItems.length !== requestProducts.length) return false;

  const cartMap = new Map();
  cartItems.forEach((item) => {
    cartMap.set(item.product._id.toString(), item.quantity);
  });

  for (const p of requestProducts) {
    const id = typeof p.productId === "string" ? p.productId : p.product._id;
    const quantity = p.quantity;
    if (
      !cartMap.has(id.toString()) ||
      cartMap.get(id.toString()) !== quantity
    ) {
      return false;
    }
  }

  return true;
};

exports.requestQuote = async (req, res) => {
  const {
    agentId,
    firstName,
    lastName,
    address,
    address2,
    city,
    postcode,
    company,
    email,
    userId,
    products,
    phone,
    message,
  } = req.body;

  if (!email || !products || !userId || !firstName || !lastName || !address) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    if (agentId) {
      const agent = await User.findOne({ userId: agentId });
      if (!agent)
        return res
          .status(404)
          .json({ message: "Agent not found with your given agent id" });
    }

    const cart = await Cart.findOne({ userId }).populate("items.product");

    if (!cart) return res.status(404).json({ message: "Cart not found" });

    if (!areSameProducts(cart.items, products)) {
      return res.status(400).json({ message: "Cart and quote items mismatch" });
    }

    const simplifiedProducts = products.map((p) => ({
      productId: p.product._id,
      code: p.product.Code,
      description: p.product.Description,
      image: p.product.ImageRef,
      quantity: p.quantity,
    }));

    const orderId = await generateOrderId();

    const newOrder = await Order.create({
      agentId,
      orderId,
      email,
      firstName,
      lastName,
      address,
      address2,
      city,
      postcode,
      company,
      userId,
      products: simplifiedProducts,
      status: "Pending",
      phone,
      message,
    });

    await Cart.deleteOne({ userId });

    return res.status(200).json({
      message: "Quote request created successfully",
      order: newOrder,
    });
  } catch (err) {
    console.error("Quote creation error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ADMIN API - Finalize Quote With Prices & Send Mail
exports.finalizeQuote = async (req, res) => {
  const {
    orderId,
    deliveryCharges = 0,
    products,
    subtotal,
    tax,
    total,
  } = req.body;

  try {
    const userId = req.user.userId;

    let user = await User.findOne({ userId: userId });
    let agent;

    if (user.type == "agent") {
      agent = user;
    }

    const order = await Order.findOne({ orderId }).populate(
      "products.productId"
    );

    if (!order) return res.status(404).json({ error: "Order not found" });

    const updatedOrder = await Order.findOneAndUpdate(
      { orderId },
      {
        products,
        deliveryCharges,
        subtotal,
        tax,
        total,
        status: "Quotation Sent",
      },
      { new: true }
    ).populate("products.productId");

    if (!updatedOrder)
      return res.status(404).json({ error: "Order not found" });

    // Email attachments (images)
    let attachments = [];
    const cidMap = await Promise.all(
      products.map(async (p, i) => {
        try {
          const response = await axios.get(p.image, {
            responseType: "arraybuffer",
          });
          const cid = `product-${i}@quote`;
          const ext = path.extname(p.image).slice(1) || "jpg";

          attachments.push({
            filename: `image${i}.${ext}`,
            content: Buffer.from(response.data, "binary"),
            cid,
          });

          return cid;
        } catch (error) {
          console.warn(`Failed to load image for ${p.code}:`, error.message);
          return null;
        }
      })
    );

    const token = jwt.sign({ userId: order.userId, orderId }, JWT_SECRET, {
      expiresIn: "7d",
    });

    const confirmOrderUrl = `${frontendUrl}/confirm-order/${token}`;

    // HTML product rows
    const productTableRows = products
      .map((p, i) => {
        const cid = cidMap[i];
        const imageTag = cid
          ? `<img src="cid:${cid}" style="width: 100px; height: auto;" />`
          : "Image not available";

        return `
<tr>
  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
    ${imageTag}
  </td>
  <td style="border: 1px solid #ddd; padding: 8px;">
    <a href="${frontendUrl}/projectDetails/${
          p.productId
        }" target="_blank" style="color: #007bff;">
      ${p.code}
    </a>
  </td>
  <td style="border: 1px solid #ddd; padding: 8px;">
    ${p.description}
  </td>
  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
    ${p.quantity}
  </td>
  <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">
    £${p.unitPrice?.toFixed(2) ?? "0.00"}
  </td>
  <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">
    £${p.totalPrice?.toFixed(2) ?? "0.00"}
  </td>
</tr>
`;
      })
      .join("");

    const mailHtml = `
<p>Hi ${order?.firstName},</p>

<p>Thank you for reaching out to us – we’re delighted to support your PPE needs!<br />
Please find below your personalised quote, carefully prepared based on the items you requested:</p>

<h3>🛒 Quotation Summary</h3>
<table style="border-collapse: collapse; width: 100%; max-width: 600px;">
  <thead>
    <tr>
      <th style="border: 1px solid #ddd; padding: 8px;">Image</th>
      <th style="border: 1px solid #ddd; padding: 8px;">Product</th>
      <th style="border: 1px solid #ddd; padding: 8px;">Description</th>
      <th style="border: 1px solid #ddd; padding: 8px;">Qty</th>
      <th style="border: 1px solid #ddd; padding: 8px;">Unit Price</th>
      <th style="border: 1px solid #ddd; padding: 8px;">Total Price</th>
    </tr>
  </thead>
  <tbody>
    ${productTableRows}
  </tbody>
</table>

<p><strong>Subtotal:</strong> £${subtotal.toFixed(2)}<br />
<strong>VAT (20%):</strong> £${tax.toFixed(2)}<br />
<strong>Delivery Charges:</strong> £${deliveryCharges.toFixed(2)}<br />
<strong>Total Payable:</strong> £${total.toFixed(2)}</p>

<h3>🛡️ Our Quality Commitment</h3>
<ul>
  <li>✅ All products meet the highest UK safety standards</li>
  <li>✅ Supplied with Declaration of Conformity (UK)</li>
  <li>✅ Products tested and compliant with relevant BS and EN safety norms</li>
  <li>✅ Next working day delivery available on all in-stock items (for orders placed before 1 PM)</li>
</ul>

<p>✅ Click below to confirm your order:<br />
👉 <a href="${confirmOrderUrl}" target="_blank" style="color: #007bff;">
  Place / Confirm Your Order Now
</a>
</p>

<p>If you need to make changes, request additional products, or have any questions, feel free to reply directly or reach out to us.</p>

<p>We’re committed to helping your business stay safe and compliant—efficiently and affordably.</p>

<p>
  Best regards,<br />
  ${
    agent ? agent.firstName + " " + agent.lastName : "Workwear Admin Team"
  }<br />
  Sales Expert<br />
  Work Wear Pvt. Ltd.<br />
  📞 ${agent ? agent.phone : "+44 17996 11006"}<br />
  ${
    agent && agent.signature
      ? `<img src="${process.env.BASE_URL}${agent.signature}" style="width: 300px; height: auto;" />`
      : `<img src="${process.env.BASE_URL}/topBanners/SaleSupport.png" style="width: 100px; height: auto;" />`
  }<br />
  ✉️ ${agent ? agent.email : "hello@gm-training.co.uk"}<br />
  🌐 workwearcompany.co.uk
</p>

`;
    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL,
      to: order.email,
      subject: `Final Quote - Order ${order.orderId}`,
      html: mailHtml,
      attachments,
    });

    return res
      .status(200)
      .json({ message: "Quote finalized and email sent", order });
  } catch (error) {
    console.error("finalizeQuote error:", error);
    return res.status(500).json({ error: "Failed to finalize quote" });
  }
};

exports.generateToken = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findOne({ orderId: id, userId: req.user.userId });

    if (!order) return res.status(404).json({ error: "Order not found" });

    const token = jwt.sign(
      { userId: order.userId, orderId: order.orderId },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to generate token" });
  }
};

exports.createOrderByAdmin = async (req, res) => {
  try {
    const {
      agentId,
      userId,

      email,
      firstName,
      lastName,
      address,
      address2,
      city,
      postcode,
      company,
      phone,

      products,

      deliveryCharges = 0,
      subtotal,
      tax,
      total,
    } = req.body;

    const type = req.user.type;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg }); // send only the first error message
    }

    let agent;

    // Optional: Validate agent exists
    if (agentId) {
      agent = await User.findOne({ userId: agentId });
      if (!agent) return res.status(404).json({ message: "Agent not found" });
    }

    // Determine customer userId
    let user;

    if (!userId) {
      const now = new Date();
      const datePart = now
        .toISOString()
        .slice(2, 10) // "25-06-17"
        .replace(/-/g, ""); // → "250617"

      const randomPart = String(Math.floor(Math.random() * 90) + 10); // Random 2-digit number (10–99)

      // Create a new user if no userId was provided
      const newUserId = `WS${datePart}-${randomPart}`;

      const newUser = await User.create({
        userId: newUserId,
        email,
        firstName,
        lastName,
        address,
        address2,
        city,
        postcode,
        company,
        phone,
        type: "guest",
        isActive: true,
      });

      user = newUser;
    } else {
      // Validate existing user
      const existingUser = await User.findOneAndUpdate(
        { userId },
        {
          email,
          firstName,
          lastName,
          address,
          address2,
          city,
          postcode,
          company,
          phone,
        },
        {
          new: true,
        }
      );
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }
      user = existingUser;
    }

    const orderId = await generateOrderId();

    // Build order object
    const newOrder = await Order.create({
      agentId,
      orderId,
      email,
      firstName,
      lastName,
      address,
      address2,
      city,
      postcode,
      company,
      phone,
      userId: user.userId,
      city: city ? city : user.city,
      company: company ? company : user.company,
      postcode: postcode ?? user.postcode ?? "",
      products,
      deliveryCharges,
      subtotal,
      tax,
      total,
      status: "Quotation Sent",
      createdBy: type,
    });

    // Email attachments (images)
    let attachments = [];
    const cidMap = await Promise.all(
      products.map(async (p, i) => {
        try {
          const response = await axios.get(p.image, {
            responseType: "arraybuffer",
          });
          const cid = `product-${i}@quote`;
          const ext = path.extname(p.image).slice(1) || "jpg";

          attachments.push({
            filename: `image${i}.${ext}`,
            content: Buffer.from(response.data, "binary"),
            cid,
          });

          return cid;
        } catch (error) {
          console.warn(`Failed to load image for ${p.code}:`, error.message);
          return null;
        }
      })
    );

    const token = jwt.sign({ userId: user.userId, orderId }, JWT_SECRET, {
      expiresIn: "7d",
    });

    const confirmOrderUrl = `${frontendUrl}/confirm-order/${token}`;

    // HTML product rows
    const productTableRows = products
      .map((p, i) => {
        const cid = cidMap[i];
        const imageTag = cid
          ? `<img src="cid:${cid}" style="width: 100px; height: auto;" />`
          : "Image not available";

        return `
<tr>
  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
    ${imageTag}
  </td>
  <td style="border: 1px solid #ddd; padding: 8px;">
    <a href="${frontendUrl}/projectDetails/${
          p.productId
        }" target="_blank" style="color: #007bff;">
      ${p.code}
    </a>
  </td>
  <td style="border: 1px solid #ddd; padding: 8px;">
    ${p.description}
  </td>
  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
    ${p.quantity}
  </td>
  <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">
    £${p.unitPrice?.toFixed(2) ?? "0.00"}
  </td>
  <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">
    £${p.totalPrice?.toFixed(2) ?? "0.00"}
  </td>
</tr>
`;
      })
      .join("");

    const mailHtml = `
<p>Hi ${firstName},</p>

<p>Thank you for reaching out to us – we’re delighted to support your PPE needs!<br />
Please find below your personalised quote, carefully prepared based on the items you requested:</p>

<h3>🛒 Quotation Summary</h3>
<table style="border-collapse: collapse; width: 100%; max-width: 600px;">
  <thead>
    <tr>
      <th style="border: 1px solid #ddd; padding: 8px;">Image</th>
      <th style="border: 1px solid #ddd; padding: 8px;">Product</th>
      <th style="border: 1px solid #ddd; padding: 8px;">Description</th>
      <th style="border: 1px solid #ddd; padding: 8px;">Qty</th>
      <th style="border: 1px solid #ddd; padding: 8px;">Unit Price</th>
      <th style="border: 1px solid #ddd; padding: 8px;">Total Price</th>
    </tr>
  </thead>
  <tbody>
    ${productTableRows}
  </tbody>
</table>

<p><strong>Subtotal:</strong> £${subtotal.toFixed(2)}<br />
<strong>VAT (20%):</strong> £${tax.toFixed(2)}<br />
<strong>Delivery Charges:</strong> £${deliveryCharges.toFixed(2)}<br />
<strong>Total Payable:</strong> £${total.toFixed(2)}</p>

<h3>🛡️ Our Quality Commitment</h3>
<ul>
  <li>✅ All products meet the highest UK safety standards</li>
  <li>✅ Supplied with Declaration of Conformity (UK)</li>
  <li>✅ Products tested and compliant with relevant BS and EN safety norms</li>
  <li>✅ Next working day delivery available on all in-stock items (for orders placed before 1 PM)</li>
</ul>

<p>✅ Click below to confirm your order:<br />
👉 <a href="${confirmOrderUrl}" target="_blank" style="color: #007bff;">
  Place / Confirm Your Order Now
</a>
</p>

<p>If you need to make changes, request additional products, or have any questions, feel free to reply directly or reach out to us.</p>

<p>We’re committed to helping your business stay safe and compliant—efficiently and affordably.</p>

<p>
  Best regards,<br />
  ${
    agent ? agent.firstName + " " + agent.lastName : "Workwear Admin Team"
  }<br />
  Sales Expert<br />
  Work Wear Pvt. Ltd.<br />
  📞 ${agent ? agent.phone : "+44 17996 11006"}<br />
  ${
    agent && agent.signature
      ? `<img src="${process.env.BASE_URL}${agent.signature}" style="width: 400px; height: auto;" />`
      : `<img src="${process.env.BASE_URL}/topBanners/SaleSupport.png" style="width: 100px; height: auto;" />`
  }<br />
  ✉️ ${agent ? agent.email : "hello@gm-training.co.uk"}<br />
  🌐 workwearcompany.co.uk
</p>
`;
    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL,
      to: email,
      subject: `Final Quote - Order ${orderId}`,
      html: mailHtml,
      attachments,
    });

    // Return response
    return res.status(201).json({
      message: "Order created and quotation send to client successfully",
      order: newOrder,
    });
  } catch (error) {
    console.error("createOrderByAdmin error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

exports.getOrders = async (req, res) => {
  const userId = req.user.userId;
  let statusFilters = req.query.status;

  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const query = {};

    // Admin gets all orders, users only their own
    if (user.type === "user") {
      query.userId = userId;
    }

    if (user.type === "agent") {
      query.agentId = userId;
    }

    // Normalize status filter
    if (statusFilters) {
      if (!Array.isArray(statusFilters)) {
        statusFilters = [statusFilters];
      }
      // Filter out invalid values
      statusFilters = statusFilters.filter(Boolean);
      query.status = { $in: statusFilters };
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    return res.status(200).json({ data: orders });
  } catch (error) {
    console.error("getOrders error:", error);
    return res.status(500).json({ error: "Failed to fetch orders" });
  }
};

exports.getOrder = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findOne({ orderId });
    const agent = await User.findOne({ userId: order.agentId });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const data = { ...order.toObject(), agent };

    return res.json({ data: data });
  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).json({ error: "Failed to fetch order" });
  }
};

exports.confirm_Order = async (req, res) => {
  const { orderId } = req.params;
  const updateData = req.body;
  const { userId } = updateData;

  try {
    // Step 1: Find the order
    const existingOrder = await Order.findOne({ orderId });

    if (!existingOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Step 2: Validate user ownership
    if (existingOrder.userId !== userId) {
      return res
        .status(403)
        .json({ error: "Unauthorized: This order does not belong to you." });
    }

    // Step 3: Promote guest to registered user if needed
    const existingUser = await User.findOne({ userId });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const password = userId;

    let wasPromoted = false;
    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingUser.type === "guest") {
      wasPromoted = true;
      await User.findOneAndUpdate(
        { userId },
        {
          type: "user",
          password: hashedPassword,
          email: existingOrder.email,
          phone: existingOrder.phone,
          firstName: existingOrder.firstName,
          lastName: existingOrder.lastName,
          address: existingOrder.address,
          company: existingOrder.company,
          city: existingOrder.city,
        },
        { new: true }
      );
    }

    // Step 4: Confirm the order
    const updatedOrder = await Order.findOneAndUpdate({ orderId }, updateData, {
      new: true,
      runValidators: true,
    });

    const mailHtml = `
  <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
    <h2 style="color: #007bff;">Thank you for your order!</h2>

    <p>Hi ${updatedOrder.firstName || "Customer"},</p>

    <p>We’re pleased to inform you that your order <strong>#${
      updatedOrder.orderId
    }</strong> has been successfully placed.</p>

    <p>Your account has been upgraded from guest to a registered user. You can now log in using the following credentials:</p>
      <ul>
        <li><strong>User ID:</strong> ${userId}</li>
        <li><strong>Password:</strong> ${password}</li>
      </ul>
      <p>We recommend you log in and update your password for security reasons.</p>
      <p><a href="${frontendUrl}/login" style="color: #007bff;">Click here to log in</a></p>
      

    <p>If you have any questions, feel free to reach out to our support team.</p>

    <p style="margin-top: 30px;">Best regards,<br/>The ${
      process.env.COMPANY_NAME || "Team"
    }</p>
  </div>
`;

    const adminMailHtml = `
          <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
           <h2 style="color: #007bff;">Order Confirmed</h2>
           <p>Order <strong>#${
             updatedOrder.orderId
           }</strong> has been confirmed and placed successfully.</p>
           <p>Customer name: ${
             updatedOrder.firstName + " " + updatedOrder.lastName || "N/A"
           }</p>
           <p>Customer email: ${updatedOrder.email || "N/A"}</p>
           <p>Customer phone: ${updatedOrder.phone || "N/A"}</p>
           <p>You can view the full details in the admin panel.</p>
           <p style="margin-top: 30px;">Regards,<br/>${
             process.env.COMPANY_NAME || "Team"
           }</p>
          </div>
    `;

    // if already registered user not send mail
    if (wasPromoted) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM_EMAIL,
        to: updatedOrder.email,
        subject: `Final Quote - Order ${updatedOrder.orderId}`,
        html: mailHtml,
      });
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL,
      to: process.env.SMTP_FROM_EMAIL,
      subject: `Final Quote - Order ${updatedOrder.orderId}`,
      html: adminMailHtml,
    });

    if (existingOrder.agentId) {
      const agent = await User.findOne({ userId: existingOrder.agentId });
      if (agent && agent.email) {
        await transporter.sendMail({
          from: process.env.SMTP_FROM_EMAIL,
          to: agent.email,
          subject: `Order Confirmed - ${updatedOrder.orderId}`,
          html: adminMailHtml,
        });
      }
    }

    res.json({
      message: "Order confirmed successfully",
      order: updatedOrder,
    });
  } catch (err) {
    console.error("Error confirming order:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    return res.status(200).json({
      message: "Order status updated successfully.",
      order,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.updateOrderPaymentStatus = async (req, res) => {
  const { id } = req.params;
  const { paymentStatus } = req.body;

  try {
    const order = await Order.findByIdAndUpdate(
      id,
      { paymentStatus },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    return res.status(200).json({
      message: "Order payment status updated successfully.",
      order,
    });
  } catch (error) {
    console.error("Error updating order payment status:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.deleteOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findByIdAndDelete(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    return res.status(200).json({
      message: "Order payment status deleted successfully.",
      order,
    });
  } catch (error) {
    console.error("Error deleteing order payment status:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.getOrderStatsComparison = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const today = moment().endOf("day");
    const currentMonthStart = moment().startOf("month");

    const lastMonthStart = moment().subtract(1, "month").startOf("month");
    const lastMonthToToday = moment()
      .subtract(1, "month")
      .date(moment().date())
      .endOf("day");

    const baseFilter = {
      status: "Delivered",
      createdAt: {
        $gte: currentMonthStart.toDate(),
        $lte: today.toDate(),
      },
    };

    const previousFilter = {
      status: "Delivered",
      createdAt: {
        $gte: lastMonthStart.toDate(),
        $lte: lastMonthToToday.toDate(),
      },
    };

    if (user.type === "agent") {
      baseFilter.agentId = user.userId;
      previousFilter.agentId = user.userId;
    }

    const currentOrders = await Order.find(baseFilter);
    const previousOrders = await Order.find(previousFilter);

    const todayFilter = {
      createdAt: {
        $gte: moment().startOf("day").toDate(),
        $lte: today.toDate(),
      },
    };

    if (user.type === "agent") {
      todayFilter.agentId = user.userId;
    }

    const todayOrders = await Order.find(todayFilter);

    const completedOrders = currentOrders.filter(
      (o) => o.status === "Delivered"
    );

    // Totals for all time
    let totalOrders, allCompletedOrders, allPendingOrders;

    if (user.type === "agent") {
      totalOrders = await Order.countDocuments({ agentId: user.userId });
      allCompletedOrders = await Order.countDocuments({
        status: "Delivered",
        agentId: user.userId,
      });
      allPendingOrders = await Order.countDocuments({
        status: { $in: ["Pending", "Quotation Sent"] },
        agentId: user.userId,
      });
    } else {
      totalOrders = await Order.countDocuments();
      allCompletedOrders = await Order.countDocuments({ status: "Delivered" });
      allPendingOrders = await Order.countDocuments({
        status: { $in: ["Pending", "Quotation Sent"] },
      });
    }

    const previousCount = previousOrders.length || 1; // prevent divide by zero
    const percentageChange = (
      ((currentOrders.length - previousOrders.length) / previousCount) *
      100
    ).toFixed(2);

    res.json({
      currentMonthOrders: currentOrders.length,
      previousMonthOrders: previousOrders.length,
      todayOrders: todayOrders.length,
      completedOrders: completedOrders.length,
      percentageChange,
      totalOrders,
      allCompletedOrders,
      allPendingOrders,
    });
  } catch (err) {
    console.error("Error fetching order stats:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMonthlyProfits = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const year = parseInt(req.query.year);
    if (!year) return res.status(400).json({ message: "Year is required" });

    // Common date range
    const startOfYear = moment().year(year).startOf("year").toDate();
    const endOfYear = moment().year(year).endOf("year").toDate();

    let orders = [];

    if (user.type === "agent") {
      // Agent: only their own orders
      orders = await Order.find({
        status: "Delivered",
        paymentStatus: "Paid",
        agentId: user.userId,
        createdAt: { $gte: startOfYear, $lte: endOfYear },
      });
    } else if (user.type === "admin") {
      // Admin: all orders
      orders = await Order.find({
        status: "Delivered",
        paymentStatus: "Paid",
        createdAt: { $gte: startOfYear, $lte: endOfYear },
      });
    }

    const monthlyProfits = Array(12).fill(0);

    for (const order of orders) {
      const monthIndex = moment(order.createdAt).month(); // 0–11
      for (const product of order.products) {
        const profit =
          (product.unitPrice - product.buyPrice) * product.quantity;
        monthlyProfits[monthIndex] += profit;
      }
    }

    res.json(monthlyProfits.map((p) => Math.round(p)));
  } catch (err) {
    console.error("Error calculating monthly profits:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAgentMonthlyProfits = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const year = parseInt(req.query.year);
    if (!year) return res.status(400).json({ message: "Year is required" });

    // This will store monthly profits for each agent
    const agentProfitsMap = {}; // { agentId: [Jan, Feb, ..., Dec] }

    // Common date range
    const startOfYear = moment().year(year).startOf("year").toDate();
    const endOfYear = moment().year(year).endOf("year").toDate();

    if (user.type === "agent") {
      // Agents see only their own profits
      const orders = await Order.find({
        status: "Delivered",
        paymentStatus: "Paid",
        agentId: user.userId,
        createdAt: { $gte: startOfYear, $lte: endOfYear },
      });

      agentProfitsMap[user.userId] = Array(12).fill(0);

      for (const order of orders) {
        const monthIndex = moment(order.createdAt).month();
        for (const product of order.products) {
          const profit = product.unitPrice * product.quantity;
          agentProfitsMap[user.userId][monthIndex] += profit;
        }
      }
    }

    if (user.type === "admin") {
      // Admins see all agents
      const orders = await Order.find({
        status: "Delivered",
        paymentStatus: "Paid",
        createdAt: { $gte: startOfYear, $lte: endOfYear },
      });

      for (const order of orders) {
        const agentId = order.agentId;
        if (!agentId) continue;

        if (!agentProfitsMap[agentId]) {
          agentProfitsMap[agentId] = Array(12).fill(0);
        }

        const monthIndex = moment(order.createdAt).month();
        for (const product of order.products) {
          const profit =
            (product.unitPrice - product.buyPrice) * product.quantity;
          agentProfitsMap[agentId][monthIndex] += profit;
        }
      }
    }

    // Now get agent names
    const agentIds = Object.keys(agentProfitsMap);
    const agentUsers = await User.find(
      { userId: { $in: agentIds } },
      "firstName lastName userId"
    );

    const result = agentUsers.map((agent) => ({
      name: `${agent.firstName} ${agent.lastName}`,
      data: agentProfitsMap[agent.userId],
    }));

    res.json(result);
  } catch (err) {
    console.error("Error fetching agent monthly profits:", err);
    res.status(500).json({ message: "Server error" });
  }
};
