
const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Test = require("./models/Test");
const Lead = require("./models/Lead");

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());
app.use(express.json());

// =====================================================
// ADMIN CONFIG
// =====================================================

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL || "admin@aryanxdigital.com";

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "admin123";

const JWT_SECRET =
  process.env.JWT_SECRET || "aryanx-digital-secret-key";

// =====================================================
// GEMINI AI CONFIG
// =====================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Current Gemini Flash model.
// You can change this from .env if needed.
const GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-3.8-flash";

// =====================================================
// ARYANX AI SYSTEM INSTRUCTION
// =====================================================

const ARYANX_AI_SYSTEM_PROMPT = `
You are AryanX AI, the official AI business assistant for AryanX Digital.

Your job is to help visitors understand AryanX Digital's digital services
and guide them toward the right solution.

ABOUT ARYANX DIGITAL:
AryanX Digital is an AI-powered digital growth and technology business.

MAIN SERVICES:
1. Professional website development
2. Mobile-friendly web development
3. Digital marketing
4. Social media solutions
5. Lead generation
6. Customer lead management
7. AI-powered customer support
8. WhatsApp automation
9. Business automation
10. Business analytics
11. AI solutions for businesses
12. Digital growth consulting

YOUR BEHAVIOR:
- Be helpful, natural and professional.
- Understand the user's actual question instead of matching keywords.
- Answer in the same language style as the user.
- If the user speaks Hindi, reply in Hindi.
- If the user speaks Hinglish, reply in Hinglish.
- If the user speaks English, reply in English.
- Keep answers clear and reasonably concise.
- You can explain technical concepts in simple language.
- Ask a useful follow-up question when more information is needed.
- Help users identify which AryanX Digital service may be useful for them.
- If someone describes their business, understand their business type and suggest relevant digital solutions.
- Do not repeatedly introduce yourself in every answer.

IMPORTANT BUSINESS RULES:
- Never invent prices.
- Never claim a service has a specific price unless the user provides that price.
- Never invent clients, customers, certifications, partnerships, awards or business results.
- Never promise guaranteed sales, guaranteed leads, guaranteed revenue or guaranteed business growth.
- If the user asks for pricing, explain that pricing depends on requirements and recommend submitting the Free Digital Audit/contact form.
- If the user wants to contact AryanX Digital, guide them toward the website's Free Digital Audit/contact option or WhatsApp enquiry option.
- Do not claim that you personally performed an action if you cannot actually perform it.
- Do not pretend to access private company databases or customer information.

SALES SUPPORT:
When appropriate, ask questions such as:
- What type of business do you have?
- Do you already have a website?
- What is your main goal?
- Do you want more leads, automation, online presence or customer support?

TECHNICAL QUESTIONS:
You may answer general questions about:
- Websites
- HTML
- CSS
- JavaScript
- React
- Node.js
- APIs
- AI
- Automation
- Digital marketing
- Business analytics

For questions unrelated to AryanX Digital, you may still provide a useful general answer,
but do not falsely connect unrelated topics to AryanX Digital.

SAFETY:
Do not provide harmful, illegal or dangerous instructions.
Do not request passwords, API keys, banking credentials or other sensitive information.

Your goal is to provide genuinely useful answers rather than fixed keyword-based responses.
`;

// =====================================================
// OBJECT ID VALIDATION
// =====================================================

const isValidObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

// =====================================================
// HOME ROUTE
// =====================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AryanX Digital Backend is running 🚀",
  });
});

// =====================================================
// DAY 7 - REAL ARYANX AI ASSISTANT
// =====================================================

app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    // -------------------------------------------------
    // Validate message
    // -------------------------------------------------

    if (
      !message ||
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a message.",
      });
    }

    // -------------------------------------------------
    // Check Gemini API key
    // -------------------------------------------------

    if (!GEMINI_API_KEY) {
      console.error(
        "GEMINI_API_KEY is missing from server .env"
      );

      return res.status(500).json({
        success: false,
        message:
          "AI service is not configured. Please add GEMINI_API_KEY to the server .env file.",
      });
    }

    // -------------------------------------------------
    // Build conversation
    // -------------------------------------------------

    const contents = [];

    // Optional conversation history.
    // This allows the frontend to send previous messages later.
    if (Array.isArray(history)) {
      const safeHistory = history
        .filter(
          (item) =>
            item &&
            (item.role === "user" ||
              item.role === "model") &&
            typeof item.text === "string" &&
            item.text.trim()
        )
        .slice(-12);

      for (const item of safeHistory) {
        contents.push({
          role: item.role,
          parts: [
            {
              text: item.text.trim(),
            },
          ],
        });
      }
    }

    // Current user message
    contents.push({
      role: "user",
      parts: [
        {
          text: message.trim(),
        },
      ],
    });

    // -------------------------------------------------
    // Gemini API request
    // -------------------------------------------------

    const geminiUrl =
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [
            {
              text: ARYANX_AI_SYSTEM_PROMPT,
            },
          ],
        },

        contents,

        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 700,
        },
      }),
    });

    // -------------------------------------------------
    // Parse Gemini response
    // -------------------------------------------------

    const geminiData = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error(
        "Gemini API Error:",
        JSON.stringify(geminiData, null, 2)
      );

      return res.status(502).json({
        success: false,
        message:
          "AI service could not process the request.",
      });
    }

    // -------------------------------------------------
    // Extract AI response safely
    // -------------------------------------------------

    const reply =
      geminiData?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim();

    if (!reply) {
      console.error(
        "Gemini returned no usable response:",
        JSON.stringify(geminiData, null, 2)
      );

      return res.status(502).json({
        success: false,
        message:
          "AI returned an empty response. Please try again.",
      });
    }

    // -------------------------------------------------
    // Send response to frontend
    // -------------------------------------------------

    return res.json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error("AI Chat Error:", error);

    return res.status(500).json({
      success: false,
      message:
        "AI Assistant server error. Please try again.",
    });
  }
});

// =====================================================
// ADMIN LOGIN
// =====================================================

app.post("/api/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (
      email.trim().toLowerCase() !==
      ADMIN_EMAIL.toLowerCase()
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const hashedPassword = await bcrypt.hash(
      ADMIN_PASSWORD,
      10
    );

    const passwordMatch = await bcrypt.compare(
      password,
      hashedPassword
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        email: ADMIN_EMAIL,
        role: "admin",
      },
      JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    return res.json({
      success: true,
      message: "Admin login successful",
      token,
      admin: {
        email: ADMIN_EMAIL,
        role: "admin",
      },
    });
  } catch (error) {
    console.error(
      "POST /api/admin/login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
});

// =====================================================
// AUTH MIDDLEWARE
// =====================================================

const authenticateAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      JWT_SECRET
    );

    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    req.admin = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// =====================================================
// TEST API
// =====================================================

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "AryanX Digital API is working",
  });
});

// =====================================================
// TEST CREATE
// =====================================================

app.post("/api/test", async (req, res) => {
  try {
    const { name, message } = req.body;

    if (
      !name ||
      !name.trim() ||
      !message ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Name and message are required",
      });
    }

    const newTest = new Test({
      name,
      message,
    });

    const savedTest = await newTest.save();

    return res.status(201).json({
      success: true,
      message: "Data saved successfully",
      data: savedTest,
    });
  } catch (error) {
    console.error(
      "POST /api/test error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to save data",
      error: error.message,
    });
  }
});

// =====================================================
// TEST READ
// =====================================================

app.get("/api/tests", async (req, res) => {
  try {
    const tests = await Test.find();

    return res.json({
      success: true,
      count: tests.length,
      data: tests,
    });
  } catch (error) {
    console.error(
      "GET /api/tests error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch data",
      error: error.message,
    });
  }
});

// =====================================================
// TEST UPDATE
// =====================================================

app.put("/api/test/:id", async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid record ID",
    });
  }

  try {
    const { name, message } = req.body;

    const updatedTest =
      await Test.findByIdAndUpdate(
        req.params.id,
        {
          name,
          message,
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!updatedTest) {
      return res.status(404).json({
        success: false,
        message: "Data not found",
      });
    }

    return res.json({
      success: true,
      message: "Data updated successfully",
      data: updatedTest,
    });
  } catch (error) {
    console.error(
      "PUT /api/test error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update data",
      error: error.message,
    });
  }
});

// =====================================================
// TEST DELETE
// =====================================================

app.delete("/api/test/:id", async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid record ID",
    });
  }

  try {
    const deletedTest =
      await Test.findByIdAndDelete(
        req.params.id
      );

    if (!deletedTest) {
      return res.status(404).json({
        success: false,
        message: "Data not found",
      });
    }

    return res.json({
      success: true,
      message: "Data deleted successfully",
      data: deletedTest,
    });
  } catch (error) {
    console.error(
      "DELETE /api/test error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete data",
      error: error.message,
    });
  }
});

// =====================================================
// CREATE LEAD
// PUBLIC API
// =====================================================

app.post("/api/leads", async (req, res) => {
  try {
    const {
      business,
      name,
      phone,
      email,
      type,
    } = req.body;

    if (
      !business ||
      !name ||
      !phone ||
      !email ||
      !type
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const newLead = new Lead({
      business,
      name,
      phone,
      email,
      type,
    });

    const savedLead = await newLead.save();

    return res.status(201).json({
      success: true,
      message: "Lead saved successfully",
      data: savedLead,
    });
  } catch (error) {
    console.error(
      "POST /api/leads error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to save lead",
      error: error.message,
    });
  }
});

// =====================================================
// GET ALL LEADS
// PROTECTED
// =====================================================

app.get(
  "/api/leads",
  authenticateAdmin,
  async (req, res) => {
    try {
      const leads =
        await Lead.find().sort({
          createdAt: -1,
        });

      return res.json({
        success: true,
        count: leads.length,
        data: leads,
      });
    } catch (error) {
      console.error(
        "GET /api/leads error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch leads",
        error: error.message,
      });
    }
  }
);

// =====================================================
// UPDATE LEAD STATUS
// PROTECTED
// =====================================================

app.put(
  "/api/leads/:id/status",
  authenticateAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid lead ID",
        });
      }

      if (
        ![
          "New",
          "Contacted",
          "Converted",
        ].includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid status",
        });
      }

      const updatedLead =
        await Lead.findByIdAndUpdate(
          id,
          { status },
          { new: true }
        );

      if (!updatedLead) {
        return res.status(404).json({
          success: false,
          message: "Lead not found",
        });
      }

      return res.json({
        success: true,
        message:
          "Lead status updated successfully",
        data: updatedLead,
      });
    } catch (error) {
      console.error(
        "PUT /api/leads/:id/status error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update lead status",
        error: error.message,
      });
    }
  }
);

// =====================================================
// DELETE LEAD
// PROTECTED
// =====================================================

app.delete(
  "/api/leads/:id",
  authenticateAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid lead ID",
        });
      }

      const deletedLead =
        await Lead.findByIdAndDelete(id);

      if (!deletedLead) {
        return res.status(404).json({
          success: false,
          message: "Lead not found",
        });
      }

      return res.json({
        success: true,
        message: "Lead deleted successfully",
        data: deletedLead,
      });
    } catch (error) {
      console.error(
        "DELETE /api/leads error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to delete lead",
        error: error.message,
      });
    }
  }
);

// =====================================================
// MONGODB CONNECTION
// =====================================================

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log(
      "MongoDB Connected Successfully"
    );
  })
  .catch((error) => {
    console.error(
      "MongoDB Connection Failed:",
      error.message
    );
  });

// =====================================================
// START SERVER
// =====================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `AryanX Digital Backend running on http://localhost:${PORT}`
  );
});

