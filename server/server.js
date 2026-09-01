const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Test = require("./models/Test");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
  res.send("AryanX Digital Backend running");
});

// Test API
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "AryanX Digital API is working"
  });
});

// CREATE - POST
app.post("/api/test", async (req, res) => {
  try {
    const { name, message } = req.body;

    const newTest = new Test({
      name,
      message
    });

    const savedTest = await newTest.save();

    res.status(201).json({
      success: true,
      message: "Data saved successfully",
      data: savedTest
    });
  } catch (error) {
    console.error("POST /api/test error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to save data",
      error: error.message
    });
  }
});

// READ - GET
app.get("/api/tests", async (req, res) => {
  try {
    const tests = await Test.find();

    res.json({
      success: true,
      count: tests.length,
      data: tests
    });
  } catch (error) {
    console.error("GET /api/tests error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch data",
      error: error.message
    });
  }
});

// UPDATE - PUT
app.put("/api/test/:id", async (req, res) => {
  try {
    const { name, message } = req.body;

    const updatedTest = await Test.findByIdAndUpdate(
      req.params.id,
      {
        name,
        message
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedTest) {
      return res.status(404).json({
        success: false,
        message: "Data not found"
      });
    }

    res.json({
      success: true,
      message: "Data updated successfully",
      data: updatedTest
    });
  } catch (error) {
    console.error("PUT /api/test error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update data",
      error: error.message
    });
  }
});

// DELETE
app.delete("/api/test/:id", async (req, res) => {
  try {
    const deletedTest = await Test.findByIdAndDelete(req.params.id);

    if (!deletedTest) {
      return res.status(404).json({
        success: false,
        message: "Data not found"
      });
    }

    res.json({
      success: true,
      message: "Data deleted successfully",
      data: deletedTest
    });
  } catch (error) {
    console.error("DELETE /api/test error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete data",
      error: error.message
    });
  }
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully");
  })
  .catch((error) => {
    console.error("MongoDB Connection Failed:", error.message);
  });

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `AryanX Digital Backend running on http://localhost:${PORT}`
  );
});