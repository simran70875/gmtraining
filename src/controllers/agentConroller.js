const { validationResult } = require("express-validator");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateAgentId = require("../utils/generateAgentId");
const transporter = require("../utils/transporter");
const { frontendUrl } = require("../utils/config");

exports.getAllAgents = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search = ''
        } = req.query;

        const skip = (Number(page) - 1) * Number(limit);

        const filter = {
            type: 'agent',
        };

        if (search.trim()) {
            const keywordRegex = new RegExp(search, 'i');
            filter.$or = [
                { userId: { $regex: keywordRegex } },
                { firstName: { $regex: keywordRegex } },
                { email: { $regex: keywordRegex } },
                { address: { $regex: keywordRegex } }
            ];
        }

        const [agents, total] = await Promise.all([
            User.find(filter)
                .skip(skip)
                .limit(Number(limit))
                .sort({ createdAt: -1 }), // Optional: sort by newest first
            User.countDocuments(filter)
        ]);

        res.json({
            data: agents,
            page: Number(page),
            limit: Number(limit),
            total
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch agents', error: err.message });
    }
};

exports.createAgent = async (req, res) => {
    try {
        const { email, phone, firstName, lastName, password, address } = req.body;


        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: "Signature image is required" });
        }

        const imgPath = `/uploads/${file.filename}`;

        const userId = await generateAgentId();

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const existingAgent = await User.findOne({
            $or: [
                { userId },
                { email }
            ]
        });


        if (existingAgent) {
            return res.status(400).json({ message: 'Agent with this userId/mail already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const agent = new User({
            type: 'agent',
            userId,
            email,
            phone,
            firstName,
            lastName,
            password: hashedPassword,
            address,
            signature: imgPath
        });

        await agent.save();

        // Prepare email content
        const mailHtml = `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 16px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eaeaea; padding: 30px; border-radius: 8px; background-color: #ffffff;">
    <h2 style="color: #2c3e50;">Welcome, ${firstName}!</h2>
    <p>We’re excited to have you on board as an agent.</p>

    <p>Your login credentials are:</p>

    <table style="margin-top: 10px; margin-bottom: 20px;">
      <tr>
        <td style="font-weight: bold;">User ID:</td>
        <td style="padding-left: 10px;">${userId}</td>
      </tr>
      <tr>
        <td style="font-weight: bold;">Password:</td>
        <td style="padding-left: 10px;">${password}</td>
      </tr>
    </table>

    <p>You can log in to the admin panel using the button below:</p>

    <a href="${frontendUrl}/admin/signin"
       style="display: inline-block; margin-top: 15px; padding: 10px 20px; background-color: #4F46E5; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold;">
      Log In to Admin Panel
    </a>

    <p style="margin-top: 30px;">If you have any questions or need help, feel free to reach out.</p>

    <p style="margin-top: 20px;">Best regards,<br><strong>The Admin Team</strong></p>
  </div>
`;


        await transporter.sendMail({
            from: process.env.SMTP_FROM_EMAIL,
            to: email,
            subject: `Your Agent Login Credentials`,
            html: mailHtml,
        });

        res.status(201).json({ message: 'Agent created and credentials sent via email.', data: agent });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to create agent', error: err.message });
    }
};

exports.editAgent = async (req, res) => {
    try {
        const { userId } = req.params;
        const updateData = req.body;

        const updatedAgent = await User.findOneAndUpdate(
            { userId, type: 'agent' },
            updateData,
            { new: true }
        );

        if (!updatedAgent) {
            return res.status(404).json({ message: 'Agent not found' });
        }

        res.json({ message: 'Agent updated successfully', data: updatedAgent });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update agent', error: err.message });
    }
};

exports.toggleAgentStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { isActive } = req.body;

        const updated = await User.findOneAndUpdate(
            { userId, type: 'agent' },
            { isActive },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: 'Agent not found' });
        }

        res.json({ message: `Agent ${isActive ? 'enabled' : 'disabled'} successfully`, data: updated });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update agent status', error: err.message });
    }
};

exports.changeAgentPassword = async (req, res) => {
    try {
        const { userId } = req.params;
        const { newPassword } = req.body;

        console.log("agent userId ==> ", userId, newPassword);

        if (!newPassword) {
            return res.status(400).json({ message: "New password is required" });
        }

        const agent = await User.findOne({ userId });
        if (!agent) {
            return res.status(404).json({ message: "Agent not found" });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const updated = await User.findOneAndUpdate(
            { userId, type: 'agent' },
            { password: hashedPassword },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: 'Agent not found' });
        }

        res.json({ message: 'Agent password updated successfully' });
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Failed to change password', error: err.message });
    }
};


exports.deleteAgent = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log("deleteAgent ===> ", req.params)
        const deletedUser = await User.findOneAndDelete({ userId, type: 'agent' });

        if (!deletedUser) {
            return res.status(404).json({ message: 'Agent not found' });
        }

        res.json({ message: 'Agent deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete agent', error });
    }
};
