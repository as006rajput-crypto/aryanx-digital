require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Lead = require("./models/Lead");
const Test = require("./models/test");

const app = express();

const PORT = process.env.PORT || 5000;

const MONGODB_URI = process.env.MONGODB_URI;

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL || "admin@aryanxdigital.com";

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "admin123";

const JWT_SECRET =
  process.env.JWT_SECRET || "aryanx-digital-secret-key";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-3.8-flash";

/* =========================
   MIDDLEWARE
========================= */

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

/* =========================
   BASIC ROUTES
========================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AryanX Digital Backend is running 🚀",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

/* =========================
   AUTH MIDDLEWARE
========================= */

const authenticateAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, JWT_SECRET);

    req.admin = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
};

/* =========================
   ADMIN LOGIN
========================= */

app.post("/api/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const validEmail =
      email.trim().toLowerCase() ===
      ADMIN_EMAIL.trim().toLowerCase();

    let validPassword = false;

    /*
      Supports both:
      1. Plain password from environment
      2. bcrypt hashed password
    */

    if (ADMIN_PASSWORD.startsWith("$2")) {
      validPassword = await bcrypt.compare(
        password,
        ADMIN_PASSWORD
      );
    } else {
      validPassword = password === ADMIN_PASSWORD;
    }

    if (!validEmail || !validPassword) {
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
        expiresIn: "7d",
      }
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,
    });
  } catch (error) {
    console.error("Admin Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
});

/* =========================
   CUSTOMER LEADS
========================= */

/*
  PUBLIC:
  Customer inquiry submit
*/

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
      business: business.trim(),
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      type: type.trim(),
    });

    const savedLead = await newLead.save();

    return res.status(201).json({
      success: true,
      message: "Customer inquiry saved successfully",
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

/*
  ADMIN:
  Get all customer inquiries
*/

app.get(
  "/api/leads",
  authenticateAdmin,
  async (req, res) => {
    try {
      const leads = await Lead.find().sort({
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
        message: "Failed to load customer inquiries",
        error: error.message,
      });
    }
  }
);

/*
  ADMIN:
  Update lead status
*/

app.put(
  "/api/leads/:id/status",
  authenticateAdmin,
  async (req, res) => {
    try {
      const { status } = req.body;

      if (
        ![
          "New",
          "Contacted",
          "Converted",
          "Closed",
        ].includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid lead status",
        });
      }

      const updatedLead =
        await Lead.findByIdAndUpdate(
          req.params.id,
          { status },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!updatedLead) {
        return res.status(404).json({
          success: false,
          message: "Lead not found",
        });
      }

      return res.json({
        success: true,
        message: "Lead status updated successfully",
        data: updatedLead,
      });
    } catch (error) {
      console.error(
        "PUT /api/leads/:id/status error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to update lead status",
        error: error.message,
      });
    }
  }
);

/*
  ADMIN:
  Delete lead
*/

app.delete(
  "/api/leads/:id",
  authenticateAdmin,
  async (req, res) => {
    try {
      const deletedLead =
        await Lead.findByIdAndDelete(
          req.params.id
        );

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
        "DELETE /api/leads/:id error:",
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

/* =========================
   TEST DATABASE
========================= */

app.get(
  "/api/tests",
  authenticateAdmin,
  async (req, res) => {
    try {
      const tests = await Test.find().sort({
        createdAt: -1,
      });

      res.json({
        success: true,
        data: tests,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to load test data",
        error: error.message,
      });
    }
  }
);

app.post("/api/test", async (req, res) => {
  try {
    const { name, message } = req.body;

    if (!name || !message) {
      return res.status(400).json({
        success: false,
        message: "Name and message are required",
      });
    }

    const test = new Test({
      name,
      message,
    });

    const savedTest = await test.save();

    res.status(201).json({
      success: true,
      message: "Data saved successfully",
      data: savedTest,
    });
  } catch (error) {
    console.error("POST /api/test:", error);

    res.status(500).json({
      success: false,
      message: "Failed to save data",
      error: error.message,
    });
  }
});

app.put(
  "/api/test/:id",
  authenticateAdmin,
  async (req, res) => {
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
          message: "Record not found",
        });
      }

      res.json({
        success: true,
        message: "Data updated successfully",
        data: updatedTest,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update data",
        error: error.message,
      });
    }
  }
);

app.delete(
  "/api/test/:id",
  authenticateAdmin,
  async (req, res) => {
    try {
      const deletedTest =
        await Test.findByIdAndDelete(
          req.params.id
        );

      if (!deletedTest) {
        return res.status(404).json({
          success: false,
          message: "Record not found",
        });
      }

      res.json({
        success: true,
        message: "Data deleted successfully",
        data: deletedTest,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to delete data",
        error: error.message,
      });
    }
  }
);

/* =========================
   AI CHAT
========================= */

app.post("/api/ai/chat", async (req, res) => {
  try {
    const {
      message,
      history = [],
    } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "AI service is not configured",
      });
    }

    const contents = [
      ...history
        .filter(
          (item) =>
            item &&
            item.text &&
            ["user", "model"].includes(item.role)
        )
        .map((item) => ({
          role: item.role,
          parts: [
            {
              text: item.text,
            },
          ],
        })),
      {
        role: "user",
        parts: [
          {
            text: message.trim(),
          },
        ],
      },
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text:
                  "You are AryanX AI, a professional AI assistant for AryanX Digital. Help users understand digital marketing, websites, AI, automation and AryanX Digital services. Be concise, helpful and professional.",
              },
            ],
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini Error:", data);

      return res.status(response.status).json({
        success: false,
        message:
          data?.error?.message ||
          "AI service request failed",
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim();

    if (!reply) {
      return res.status(500).json({
        success: false,
        message: "AI returned an empty response",
      });
    }

    return res.json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error("AI Chat Error:", error);

    return res.status(500).json({
      success: false,
      message: "AI request failed",
      error: error.message,
    });
  }
});

/* =========================
   404
========================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/* =========================
   DATABASE + SERVER
========================= */

if (!MONGODB_URI) {
  console.error(
    "MONGODB_URI is missing from environment variables."
  );
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log(
      "MongoDB Connected Successfully"
    );

    app.listen(PORT, () => {
      console.log(
        `AryanX Digital Backend running on port ${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error(
      "MongoDB Connection Failed:",
      error.message
    );

    process.exit(1);
  });