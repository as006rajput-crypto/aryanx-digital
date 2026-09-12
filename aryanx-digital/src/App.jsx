
import { useEffect, useState } from "react";
import "./App.css";
import AdminLogin from "./AdminLogin";

const API_URL = import.meta.env.VITE_API_URL || "";

const API = (endpoint) => {
  return API_URL + endpoint;
};

function App() {
  // =========================
  // ROUTE
  // =========================

  const isAdminPage =
    window.location.pathname === "/admin" ||
    window.location.pathname.startsWith("/admin/");

  // =========================
  // ADMIN AUTH
  // =========================

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(
    !!localStorage.getItem("adminToken")
  );

  // =========================
  // DATABASE TEST DATA
  // =========================

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // =========================
  // LEADS
  // =========================

  const [leads, setLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadSearch, setLeadSearch] = useState("");
  const [leadTypeFilter, setLeadTypeFilter] = useState("All");
  const [deletingLeadId, setDeletingLeadId] = useState(null);

  // =========================
  // TOAST
  // =========================

  const [toast, setToast] = useState(null);

  // =========================
  // AI CHATBOT
  // =========================

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");

  const [chatMessages, setChatMessages] = useState([
    {
      sender: "ai",
      text:
        "Hello! 👋 I'm AryanX AI. Tell me about your business and I'll help you find the right digital solution.",
    },
  ]);

  const [chatLoading, setChatLoading] = useState(false);

  // =========================
  // DASHBOARD STATISTICS
  // =========================

  const totalLeads = leads.length;

  const newLeads = leads.filter(
    (lead) => !lead.status || lead.status === "New"
  ).length;

  const contactedLeads = leads.filter(
    (lead) => lead.status === "Contacted"
  ).length;

  const convertedLeads = leads.filter(
    (lead) => lead.status === "Converted"
  ).length;

  const closedLeads = leads.filter(
    (lead) => lead.status === "Closed"
  ).length;

  const businessTypes = new Set(
    leads
      .map((lead) => lead.type)
      .filter(Boolean)
  ).size;

  const conversionRate =
    totalLeads > 0
      ? Math.round((convertedLeads / totalLeads) * 100)
      : 0;

  const contactRate =
    totalLeads > 0
      ? Math.round((contactedLeads / totalLeads) * 100)
      : 0;

  // =========================
  // TOAST
  // =========================

  const showToast = (message, type = "success") => {
    setToast({
      message,
      type,
    });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // =========================
  // AI CONVERSATION MEMORY
  // =========================

  const sendAIMessage = async (e) => {
    if (e) {
      e.preventDefault();
    }

    const trimmedMessage = chatMessage.trim();

    if (!trimmedMessage || chatLoading) {
      return;
    }

    const conversationHistory = chatMessages
      .filter((chat) => chat.text?.trim())
      .map((chat) => ({
        role:
          chat.sender === "user"
            ? "user"
            : "model",
        text: chat.text,
      }));

    setChatMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: trimmedMessage,
      },
    ]);

    setChatMessage("");
    setChatLoading(true);

    try {
      const response = await fetch(
        API("/api/ai/chat"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: trimmedMessage,
            history: conversationHistory,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "AI assistant request failed"
        );
      }

      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: result.reply,
        },
      ]);
    } catch (error) {
      console.error(
        "AI Chat Error:",
        error
      );

      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text:
            "Sorry! I'm having trouble connecting right now. Please try again.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // =========================
  // CLEAR AI CHAT
  // =========================

  const clearAIChat = () => {
    setChatMessages([
      {
        sender: "ai",
        text:
          "Hello! 👋 I'm AryanX AI. How can I help your business grow today?",
      },
    ]);

    setChatMessage("");
  };

  // =========================
  // AI FEATURE ACTIONS
  // =========================

  const handleAIFeatureClick = (feature) => {
    if (feature === "support") {
      setIsChatOpen(true);

      showToast(
        "AryanX AI Customer Support opened.",
        "success"
      );

      setTimeout(() => {
        const chatWindow =
          document.getElementById(
            "ai-chat-window"
          );

        if (chatWindow) {
          chatWindow.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 100);
    }

    if (feature === "followup") {
      if (!isAdminPage || !isAdminLoggedIn) {
        showToast(
          "Admin login is required to manage lead follow-ups.",
          "error"
        );

        window.location.href = "/admin";
        return;
      }

      const followupSection =
        document.getElementById("followup");

      if (followupSection) {
        followupSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }

      showToast(
        "Lead Follow-up system opened.",
        "success"
      );
    }

    if (feature === "analytics") {
      if (!isAdminPage || !isAdminLoggedIn) {
        showToast(
          "Admin login is required to view analytics.",
          "error"
        );

        window.location.href = "/admin";
        return;
      }

      const analyticsSection =
        document.getElementById("analytics");

      if (analyticsSection) {
        analyticsSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }

      showToast(
        "Smart Business Analytics opened.",
        "success"
      );
    }
  };

  // =========================
  // LOAD TEST DATA
  // =========================

  const loadData = async () => {
    if (!isAdminPage || !isAdminLoggedIn) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        API("/api/tests")
      );

      if (!response.ok) {
        throw new Error("Server error");
      }

      const result = await response.json();

      if (result.success) {
        setTests(result.data);
      } else {
        setTests([]);
      }
    } catch (error) {
      console.error(
        "API Error:",
        error
      );

      setTests([]);

      showToast(
        "Unable to connect to server.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOAD ALL LEADS
  // =========================

  const loadLeads = async () => {
    if (!isAdminPage || !isAdminLoggedIn) {
      setLeads([]);
      return;
    }

    const token =
      localStorage.getItem("adminToken");

    if (!token) {
      setLeads([]);
      return;
    }

    try {
      setLeadsLoading(true);

      const response = await fetch(
        API("/api/leads"),
        {
          headers: {
            Authorization:
              "Bearer " + token,
          },
        }
      );

      const result =
        await response.json();

      if (response.status === 401) {
        handleLogout();

        showToast(
          "Session expired. Please login again.",
          "error"
        );

        return;
      }

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to load leads"
        );
      }

      if (result.success) {
        setLeads(result.data);
      } else {
        setLeads([]);
      }
    } catch (error) {
      console.error(
        "Leads API Error:",
        error
      );

      setLeads([]);

      showToast(
        "Unable to load leads.",
        "error"
      );
    } finally {
      setLeadsLoading(false);
    }
  };

  // =========================
  // REFRESH DATA
  // =========================

  const handleRefresh = async () => {
    if (!isAdminPage || !isAdminLoggedIn) {
      return;
    }

    try {
      setRefreshing(true);

      await Promise.all([
        loadData(),
        loadLeads(),
      ]);

      showToast(
        "Data refreshed successfully!",
        "success"
      );
    } catch (error) {
      console.error(
        "Refresh Error:",
        error
      );

      showToast(
        "Unable to refresh data.",
        "error"
      );
    } finally {
      setRefreshing(false);
    }
  };

  // =========================
  // ADD TEST DATA
  // =========================

  const addData = async (e) => {
    e.preventDefault();

    if (
      !name.trim() ||
      !message.trim()
    ) {
      showToast(
        "Please fill all fields.",
        "error"
      );

      return;
    }

    setSaving(true);

    try {
      const response =
        await fetch(
          API("/api/test"),
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              name,
              message,
            }),
          }
        );

      const result =
        await response.json();

      if (result.success) {
        setTests((prev) => [
          result.data,
          ...prev,
        ]);

        setName("");
        setMessage("");

        showToast(
          "Data added successfully!",
          "success"
        );
      } else {
        showToast(
          result.message ||
            "Failed to add data.",
          "error"
        );
      }
    } catch (error) {
      console.error(
        "Add Data Error:",
        error
      );

      showToast(
        "Backend connection failed.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // DELETE TEST DATA
  // =========================

  const deleteData = async (id) => {
    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this record?"
      );

    if (!confirmDelete) {
      return;
    }

    setDeletingId(id);

    try {
      const response =
        await fetch(
          API("/api/test/" + id),
          {
            method: "DELETE",
          }
        );

      const result =
        await response.json();

      if (result.success) {
        setTests((prev) =>
          prev.filter(
            (test) =>
              test._id !== id
          )
        );

        showToast(
          "Data deleted successfully!",
          "success"
        );
      } else {
        showToast(
          result.message ||
            "Failed to delete data.",
          "error"
        );
      }
    } catch (error) {
      console.error(
        "Delete Error:",
        error
      );

      showToast(
        "Backend connection failed.",
        "error"
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =========================
  // START EDIT
  // =========================

  const startEdit = (test) => {
    setEditingId(test._id);
    setEditName(test.name);
    setEditMessage(test.message);
  };

  // =========================
  // CANCEL EDIT
  // =========================

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditMessage("");
  };

  // =========================
  // UPDATE TEST DATA
  // =========================

  const updateData = async (id) => {
    if (
      !editName.trim() ||
      !editMessage.trim()
    ) {
      showToast(
        "Please fill all fields.",
        "error"
      );

      return;
    }

    setUpdatingId(id);

    try {
      const response =
        await fetch(
          API("/api/test/" + id),
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              name: editName,
              message: editMessage,
            }),
          }
        );

      const result =
        await response.json();

      if (result.success) {
        setTests((prev) =>
          prev.map((test) =>
            test._id === id
              ? result.data
              : test
          )
        );

        cancelEdit();

        showToast(
          "Data updated successfully!",
          "success"
        );
      } else {
        showToast(
          result.message ||
            "Failed to update data.",
          "error"
        );
      }
    } catch (error) {
      console.error(
        "Update Error:",
        error
      );

      showToast(
        "Backend connection failed.",
        "error"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // =========================
  // UPDATE LEAD STATUS
  // =========================

  const updateLeadStatus = async (
    id,
    status
  ) => {
    const token =
      localStorage.getItem(
        "adminToken"
      );

    if (!token) {
      handleLogout();
      return;
    }

    try {
      setUpdatingId(id);

      const response =
        await fetch(
          API(
            "/api/leads/" +
              id +
              "/status"
          ),
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                "Bearer " + token,
            },
            body: JSON.stringify({
              status,
            }),
          }
        );

      const result =
        await response.json();

      if (response.status === 401) {
        handleLogout();

        showToast(
          "Session expired. Please login again.",
          "error"
        );

        return;
      }

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to update status"
        );
      }

      setLeads((prevLeads) =>
        prevLeads.map((lead) =>
          lead._id === id
            ? {
                ...lead,
                status:
                  result.data.status,
              }
            : lead
        )
      );

      showToast(
        "Lead status updated successfully!",
        "success"
      );
    } catch (error) {
      console.error(
        "Update Lead Status Error:",
        error
      );

      showToast(
        "Failed to update lead status.",
        "error"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // =========================
  // DELETE LEAD
  // =========================

  const deleteLead = async (
    leadId
  ) => {
    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this lead?"
      );

    if (!confirmDelete) {
      return;
    }

    const token =
      localStorage.getItem(
        "adminToken"
      );

    if (!token) {
      handleLogout();
      return;
    }

    try {
      setDeletingLeadId(leadId);

      const response =
        await fetch(
          API(
            "/api/leads/" +
              leadId
          ),
          {
            method: "DELETE",
            headers: {
              Authorization:
                "Bearer " + token,
            },
          }
        );

      const result =
        await response.json();

      if (response.status === 401) {
        handleLogout();

        showToast(
          "Session expired. Please login again.",
          "error"
        );

        return;
      }

      if (!response.ok) {
        showToast(
          result.message ||
            "Failed to delete lead.",
          "error"
        );

        return;
      }

      setLeads((prevLeads) =>
        prevLeads.filter(
          (lead) =>
            lead._id !== leadId
        )
      );

      showToast(
        "Lead deleted successfully!",
        "success"
      );
    } catch (error) {
      console.error(
        "Delete Lead Error:",
        error
      );

      showToast(
        "Server error. Please try again.",
        "error"
      );
    } finally {
      setDeletingLeadId(null);
    }
  };

  // =========================
  // AUTOMATED LEAD FOLLOW-UP
  // =========================

  const sendLeadFollowUp = (
    lead
  ) => {
    if (!lead.phone) {
      showToast(
        "Customer phone number is not available.",
        "error"
      );

      return;
    }

    const cleanPhone =
      String(lead.phone).replace(
        /\D/g,
        ""
      );

    const whatsappNumber =
      cleanPhone.length === 10
        ? "91" + cleanPhone
        : cleanPhone;

    const followUpMessage =
      `Hello ${lead.name || "there"},\n\n` +
      `This is AryanX Digital. 👋\n\n` +
      `We received your enquiry for ${
        lead.business ||
        "your business"
      } and wanted to follow up regarding your Free Digital Audit.\n\n` +
      `Please let us know a convenient time to discuss your requirements.\n\n` +
      `Thank you,\nAryanX Digital`;

    window.open(
      "https://wa.me/" +
        whatsappNumber +
        "?text=" +
        encodeURIComponent(
          followUpMessage
        ),
      "_blank"
    );

    if (
      lead.status === "New" ||
      !lead.status
    ) {
      updateLeadStatus(
        lead._id,
        "Contacted"
      );
    }

    showToast(
      "Follow-up WhatsApp message prepared.",
      "success"
    );
  };

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {
    localStorage.removeItem(
      "adminToken"
    );

    localStorage.removeItem(
      "adminEmail"
    );

    setIsAdminLoggedIn(false);
    setLeads([]);
    setTests([]);

    if (window.location.pathname !== "/") {
      window.location.href = "/";
    }
  };

  // =========================
  // LOGIN SUCCESS
  // =========================

  const handleAdminLogin = () => {
    setIsAdminLoggedIn(true);
    loadLeads();
    loadData();
  };

  // =========================
  // LOAD ADMIN DATA
  // =========================

  useEffect(() => {
    if (
      isAdminPage &&
      isAdminLoggedIn
    ) {
      loadData();
      loadLeads();
    }
  }, [
    isAdminPage,
    isAdminLoggedIn,
  ]);

  // =========================
  // FILTERED LEADS
  // =========================

  const filteredLeads =
    leads.filter((lead) => {
      const search =
        leadSearch
          .toLowerCase()
          .trim();

      const matchesSearch =
        lead.business
          ?.toLowerCase()
          .includes(search) ||
        lead.name
          ?.toLowerCase()
          .includes(search) ||
        lead.phone
          ?.toLowerCase()
          .includes(search) ||
        lead.email
          ?.toLowerCase()
          .includes(search) ||
        lead.type
          ?.toLowerCase()
          .includes(search);

      const matchesType =
        leadTypeFilter === "All" ||
        lead.type ===
          leadTypeFilter;

      return (
        matchesSearch &&
        matchesType
      );
    });

  // =========================
  // CLEAR LEAD FILTERS
  // =========================

  const clearLeadFilters = () => {
    setLeadSearch("");
    setLeadTypeFilter("All");
  };

  // =========================
  // ADMIN LOGIN PAGE
  // =========================

  if (
    isAdminPage &&
    !isAdminLoggedIn
  ) {
    return (
      <AdminLogin
        onLogin={handleAdminLogin}
      />
    );
  }

  // =========================
  // MAIN PUBLIC WEBSITE
  // =========================

  return (
    <div className="app">

      {/* =========================
          TOAST
      ========================= */}

      {toast && (
        <div
          className={
            "toast toast-" +
            toast.type
          }
        >
          <div className="toast-icon">
            {toast.type ===
            "success"
              ? "✓"
              : "!"}
          </div>

          <div className="toast-content">
            <strong>
              {toast.type ===
              "success"
                ? "Success"
                : "Error"}
            </strong>

            <span>
              {toast.message}
            </span>
          </div>

          <button
            type="button"
            className="toast-close"
            onClick={() =>
              setToast(null)
            }
          >
            ×
          </button>
        </div>
      )}

      {/* =========================
          NAVBAR
      ========================= */}

      <nav className="navbar">

        <div className="logo">
          <img
            src="/logo.jpg"
            alt="AryanX Digital"
          />
        </div>

        <div className="nav-links">

          <a href="#services">
            Services
          </a>

          <a href="#about">
            About
          </a>

          <a href="#ai">
            AI Solutions
          </a>

          {isAdminPage &&
            isAdminLoggedIn && (
              <a href="#database">
                Database
              </a>
            )}

          <a href="#contact">
            Contact
          </a>

        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >

          <a
            href="#contact"
            className="nav-btn"
          >
            Get Started
          </a>

          {isAdminPage &&
            isAdminLoggedIn && (
              <button
                type="button"
                onClick={
                  handleLogout
                }
                style={{
                  padding:
                    "10px 18px",
                  borderRadius:
                    "8px",
                  border: "none",
                  cursor:
                    "pointer",
                  fontWeight:
                    "600",
                }}
              >
                🚪 Logout
              </button>
            )}

        </div>

      </nav>

      {/* =========================
          HERO
      ========================= */}

      <section className="hero">

        <div className="hero-content">

          <div className="badge">
            ✦ AI-POWERED DIGITAL
            GROWTH
          </div>

          <h1>
            Grow Your Business
            <span>
              {" "}
              With AI & Digital.
            </span>
          </h1>

          <p>
            AryanX Digital helps
            businesses build,
            automate and grow
            their online presence
            with modern technology,
            AI and smart digital
            solutions.
          </p>

          <div className="hero-buttons">

            <a
              href="#contact"
              className="primary-btn"
            >
              Get Free Digital
              Audit →
            </a>

            <a
              href="#services"
              className="secondary-btn"
            >
              Explore Services
            </a>

          </div>

          <div className="trust">

            <div>
              <strong>
                AI
              </strong>

              <span>
                Powered
              </span>
            </div>

            <div>
              <strong>
                24/7
              </strong>

              <span>
                Automation
              </span>
            </div>

            <div>
              <strong>
                360°
              </strong>

              <span>
                Digital Growth
              </span>
            </div>

          </div>

        </div>

        <div className="hero-card">

          <div className="card-glow"></div>

          <div className="ai-orb">
            ✦
          </div>

          <p>
            ARYANX AI
          </p>

          <h3>
            Your Business.
            <br />
            Digitally Smarter.
          </h3>

          <div className="mini-stats">

            <div>
              <span>
                Leads
              </span>

              <strong>
                +128%
              </strong>
            </div>

            <div>
              <span>
                Automation
              </span>

              <strong>
                24/7
              </strong>
            </div>

          </div>

        </div>

      </section>

      {/* =========================
          SERVICES
      ========================= */}

      <section
        className="section"
        id="services"
      >

        <div className="section-heading">

          <span>
            OUR SERVICES
          </span>

          <h2>
            Choose the right
            <br />
            <em>
              growth system.
            </em>
          </h2>

          <p>
            Simple digital solutions
            designed to help your
            business build,
            automate and grow.
          </p>

        </div>

        <div className="services-grid">

          <div className="service-card">

            <div className="service-icon">
              ◈
            </div>

            <h3>
              Starter
            </h3>

            <p>
              Perfect for businesses
              that are just getting
              started online.
            </p>

            <ul>
              <li>
                Professional Website
              </li>

              <li>
                Google Business Setup
              </li>

              <li>
                Basic Social Media
                Setup
              </li>

              <li>
                Contact & WhatsApp
                Integration
              </li>
            </ul>

            <a href="#contact">
              Get Started →
            </a>

          </div>

          <div className="service-card featured">

            <div className="popular">
              MOST POPULAR
            </div>

            <div className="service-icon">
              ✦
            </div>

            <h3>
              Growth
            </h3>

            <p>
              For businesses looking
              to attract more customers
              online.
            </p>

            <ul>
              <li>
                Everything in Starter
              </li>

              <li>
                Social Media Management
              </li>

              <li>
                Lead Generation
              </li>

              <li>
                Digital Marketing
              </li>
            </ul>

            <a href="#contact">
              Grow With Us →
            </a>

          </div>

          <div className="service-card">

            <div className="service-icon">
              ◎
            </div>

            <h3>
              AI Business
            </h3>

            <p>
              Smart automation systems
              for modern businesses.
            </p>

            <ul>
              <li>
                AI Customer Support
              </li>

              <li>
                WhatsApp Automation
              </li>

              <li>
                Lead Automation
              </li>

              <li>
                Business Analytics
              </li>
            </ul>

            <a href="#contact">
              Build With AI →
            </a>

          </div>

        </div>

      </section>

      {/* =========================
          AI SECTION
      ========================= */}

      <section
        className="ai-section"
        id="ai"
      >

        <div className="ai-content">

          <span className="section-label">
            THE ARYANX ADVANTAGE
          </span>

          <h2>
            Make Your Business
            <br />
            <span>
              AI-Powered.
            </span>
          </h2>

          <p>
            Don't just take your
            business online. Make
            it intelligent.
          </p>

          <div className="ai-features">

            <div
              role="button"
              tabIndex={0}
              onClick={() =>
                handleAIFeatureClick(
                  "support"
                )
              }
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" ||
                  e.key === " "
                ) {
                  handleAIFeatureClick(
                    "support"
                  );
                }
              }}
              style={{
                cursor: "pointer",
              }}
            >
              <strong>
                01
              </strong>

              <span>
                AI Customer Support
              </span>

              <small>
                Click to open AI
                Assistant →
              </small>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() =>
                handleAIFeatureClick(
                  "followup"
                )
              }
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" ||
                  e.key === " "
                ) {
                  handleAIFeatureClick(
                    "followup"
                  );
                }
              }}
              style={{
                cursor: "pointer",
              }}
            >
              <strong>
                02
              </strong>

              <span>
                Automated Lead
                Follow-up
              </span>

              <small>
                Admin access required →
              </small>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() =>
                handleAIFeatureClick(
                  "analytics"
                )
              }
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" ||
                  e.key === " "
                ) {
                  handleAIFeatureClick(
                    "analytics"
                  );
                }
              }}
              style={{
                cursor: "pointer",
              }}
            >
              <strong>
                03
              </strong>

              <span>
                Smart Business
                Analytics
              </span>

              <small>
                Admin access required →
              </small>
            </div>

          </div>

        </div>

        <div className="ai-dashboard">

          <div className="dashboard-top">

            <span>
              ARYANX AI
            </span>

            <span className="online">
              ● LIVE
            </span>

          </div>

          <div className="chat">

            <div className="message customer">
              Can you tell me
              about your services?
            </div>

            <div className="message ai">
              Absolutely! I'm
              AryanX AI. How can
              I help your business
              grow today?
            </div>

            <div className="message customer">
              I want more customers.
            </div>

            <div className="message ai">
              Great. Let's build
              your digital growth
              system.
            </div>

          </div>

        </div>

      </section>

      {/* =========================
          ABOUT
      ========================= */}

      <section
        className="about"
        id="about"
      >

        <div className="about-heading">

          <span className="section-label">
            ABOUT ARYANX DIGITAL
          </span>

          <h2>
            We build digital
            <br />
            <span>
              systems that grow.
            </span>
          </h2>

        </div>

        <div className="about-content">

          <p>
            AryanX Digital is an
            AI-powered digital
            growth company helping
            businesses build a
            stronger online
            presence, automate
            their operations and
            attract more customers.
          </p>

          <p>
            We combine modern web
            technology, artificial
            intelligence, automation
            and digital marketing to
            create practical
            solutions that help
            businesses grow.
          </p>

          <div className="about-points">

            <div>
              <strong>
                01
              </strong>

              <span>
                Technology First
              </span>
            </div>

            <div>
              <strong>
                02
              </strong>

              <span>
                AI Powered
              </span>
            </div>

            <div>
              <strong>
                03
              </strong>

              <span>
                Growth Focused
              </span>
            </div>

          </div>

        </div>

      </section>

      {/* =========================
          WHY ARYANX
      ========================= */}

      <section className="why-section">

        <div className="section-heading">

          <span>
            WHY ARYANX DIGITAL
          </span>

          <h2>
            More than a digital
            <br />
            <em>
              service provider.
            </em>
          </h2>

          <p>
            We build long-term
            digital growth systems
            that combine technology,
            AI and business strategy.
          </p>

        </div>

        <div className="why-grid">

          <div className="why-card">

            <div className="why-number">
              01
            </div>

            <h3>
              AI First
            </h3>

            <p>
              We use artificial
              intelligence to make
              business processes
              smarter and more
              efficient.
            </p>

          </div>

          <div className="why-card">

            <div className="why-number">
              02
            </div>

            <h3>
              Business Focused
            </h3>

            <p>
              Every solution is
              designed around your
              actual business goals
              and customer needs.
            </p>

          </div>

          <div className="why-card">

            <div className="why-number">
              03
            </div>

            <h3>
              Built to Scale
            </h3>

            <p>
              Our systems are
              designed to grow with
              your business, from the
              first customer to
              thousands.
            </p>

          </div>

          <div className="why-card">

            <div className="why-number">
              04
            </div>

            <h3>
              Long-Term Support
            </h3>

            <p>
              We don't disappear after
              delivery. We help
              businesses continuously
              improve and grow.
            </p>

          </div>

        </div>

      </section>

      {/* =========================
          ADMIN DATABASE / DASHBOARD
          ONLY FOR ADMIN
      ========================= */}

      {isAdminPage &&
        isAdminLoggedIn && (
          <section
            className="backend-section"
            id="database"
          >

            <div className="section-heading">

              <span>
                ARYANX DIGITAL DATABASE
              </span>

              <h2>
                Manage Your
                <br />
                <em>
                  Business Data.
                </em>
              </h2>

              <p>
                Add, view, update and
                delete data through the
                AryanX Digital admin
                dashboard.
              </p>

            </div>

            {/* ADD DATA */}

            <div className="backend-form">

              <h3>
                Add New Record
              </h3>

              <form
                onSubmit={addData}
              >

                <input
                  type="text"
                  placeholder="Enter name"
                  value={name}
                  onChange={(e) =>
                    setName(
                      e.target.value
                    )
                  }
                  disabled={saving}
                />

                <textarea
                  placeholder="Enter message"
                  value={message}
                  onChange={(e) =>
                    setMessage(
                      e.target.value
                    )
                  }
                  rows="4"
                  disabled={saving}
                />

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Add Data"}
                </button>

              </form>

            </div>

            {/* LIVE BACKEND DATA */}

            <div className="section-heading">

              <span>
                LIVE BACKEND DATA
              </span>

              <h2>
                AryanX Digital
                <br />
                <em>
                  Connected to MongoDB.
                </em>
              </h2>

              <p>
                This data is coming
                directly from our
                Express API and MongoDB
                Atlas database.
              </p>

            </div>

            {loading ? (
              <p className="backend-loading">
                Loading data...
              </p>
            ) : tests.length === 0 ? (
              <p className="backend-loading">
                No data found.
              </p>
            ) : (
              <div className="backend-data-grid">

                {tests.map((test) => (

                  <div
                    className="backend-card"
                    key={test._id}
                  >

                    {editingId ===
                    test._id ? (
                      <>

                        <span>
                          EDIT DATABASE
                          RECORD
                        </span>

                        <input
                          type="text"
                          value={editName}
                          onChange={(e) =>
                            setEditName(
                              e.target.value
                            )
                          }
                          disabled={
                            updatingId ===
                            test._id
                          }
                        />

                        <textarea
                          value={
                            editMessage
                          }
                          onChange={(e) =>
                            setEditMessage(
                              e.target.value
                            )
                          }
                          rows="4"
                          disabled={
                            updatingId ===
                            test._id
                          }
                        />

                        <div
                          style={{
                            display: "flex",
                            gap: "10px",
                            marginTop: "15px",
                            flexWrap: "wrap",
                          }}
                        >

                          <button
                            type="button"
                            className="primary-btn"
                            onClick={() =>
                              updateData(
                                test._id
                              )
                            }
                            disabled={
                              updatingId ===
                              test._id
                            }
                          >
                            {updatingId ===
                            test._id
                              ? "Updating..."
                              : "Save Changes"}
                          </button>

                          <button
                            type="button"
                            onClick={
                              cancelEdit
                            }
                            disabled={
                              updatingId ===
                              test._id
                            }
                            style={{
                              padding:
                                "12px 20px",
                              borderRadius:
                                "8px",
                              border:
                                "1px solid #ccc",
                              background:
                                "transparent",
                              cursor:
                                "pointer",
                            }}
                          >
                            Cancel
                          </button>

                        </div>

                      </>
                    ) : (
                      <>

                        <span>
                          DATABASE RECORD
                        </span>

                        <h3>
                          {test.name}
                        </h3>

                        <p>
                          {test.message}
                        </p>

                        <small>
                          ID: {test._id}
                        </small>

                        <div
                          style={{
                            display: "flex",
                            gap: "10px",
                            marginTop: "18px",
                            flexWrap: "wrap",
                          }}
                        >

                          <button
                            type="button"
                            onClick={() =>
                              startEdit(
                                test
                              )
                            }
                            disabled={
                              deletingId ===
                                test._id ||
                              refreshing
                            }
                            style={{
                              padding:
                                "10px 18px",
                              borderRadius:
                                "8px",
                              border:
                                "none",
                              cursor:
                                "pointer",
                            }}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteData(
                                test._id
                              )
                            }
                            disabled={
                              deletingId ===
                              test._id
                            }
                            style={{
                              padding:
                                "10px 18px",
                              borderRadius:
                                "8px",
                              border:
                                "none",
                              cursor:
                                "pointer",
                            }}
                          >
                            {deletingId ===
                            test._id
                              ? "Deleting..."
                              : "Delete"}
                          </button>

                        </div>

                      </>
                    )}

                  </div>

                ))}

              </div>
            )}

            {/* REFRESH */}

            <div
              style={{
                textAlign: "center",
                marginTop: "30px",
              }}
            >

              <button
                type="button"
                onClick={
                  handleRefresh
                }
                disabled={
                  loading ||
                  refreshing
                }
                style={{
                  padding:
                    "12px 24px",
                  borderRadius:
                    "8px",
                  border:
                    "1px solid #ccc",
                  background:
                    "transparent",
                  cursor:
                    loading ||
                    refreshing
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    loading ||
                    refreshing
                      ? 0.6
                      : 1,
                }}
              >
                {refreshing
                  ? "Refreshing..."
                  : "🔄 Refresh Database"}
              </button>

            </div>

            {/* CUSTOMER ENQUIRIES */}

            <div
              className="section-heading"
              id="followup"
              style={{
                marginTop: "80px",
              }}
            >

              <span>
                CUSTOMER ENQUIRIES
              </span>

              <h2>
                AryanX Digital
                <br />
                <em>
                  Business Leads.
                </em>
              </h2>

              <p>
                All enquiries submitted
                through the Free Digital
                Audit form are stored
                securely in MongoDB.
              </p>

            </div>

            {/* SMART BUSINESS ANALYTICS */}

            <div
              id="analytics"
              style={{
                scrollMarginTop:
                  "100px",
              }}
            >

              <div
                className="section-heading"
                style={{
                  marginTop: "50px",
                }}
              >

                <span>
                  SMART BUSINESS
                  ANALYTICS
                </span>

                <h2>
                  Understand Your
                  <br />
                  <em>
                    Business Growth.
                  </em>
                </h2>

                <p>
                  Track customer
                  enquiries, lead
                  activity, conversion
                  and business categories
                  from one dashboard.
                </p>

              </div>

              {/* MAIN ANALYTICS */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(3, minmax(0, 1fr))",
                  gap: "20px",
                  margin: "40px 0",
                }}
              >

                <div className="backend-card">

                  <span>
                    TOTAL LEADS
                  </span>

                  <h2>
                    {totalLeads}
                  </h2>

                  <p>
                    All customer
                    enquiries
                  </p>

                </div>

                <div className="backend-card">

                  <span>
                    NEW LEADS
                  </span>

                  <h2>
                    {newLeads}
                  </h2>

                  <p>
                    Pending enquiries
                  </p>

                </div>

                <div className="backend-card">

                  <span>
                    BUSINESS TYPES
                  </span>

                  <h2>
                    {businessTypes}
                  </h2>

                  <p>
                    Different business
                    categories
                  </p>

                </div>

              </div>

              {/* STATUS ANALYTICS */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(4, minmax(0, 1fr))",
                  gap: "20px",
                  margin:
                    "20px 0 40px",
                }}
              >

                <div className="backend-card">

                  <span>
                    CONTACTED LEADS
                  </span>

                  <h2>
                    {contactedLeads}
                  </h2>

                  <p>
                    Leads already
                    contacted
                  </p>

                </div>

                <div className="backend-card">

                  <span>
                    CONVERTED LEADS
                  </span>

                  <h2>
                    {convertedLeads}
                  </h2>

                  <p>
                    Successfully
                    converted leads
                  </p>

                </div>

                <div className="backend-card">

                  <span>
                    CLOSED LEADS
                  </span>

                  <h2>
                    {closedLeads}
                  </h2>

                  <p>
                    Closed customer
                    enquiries
                  </p>

                </div>

                <div className="backend-card">

                  <span>
                    CONVERSION RATE
                  </span>

                  <h2>
                    {conversionRate}%
                  </h2>

                  <p>
                    Lead conversion
                    performance
                  </p>

                </div>

              </div>

              {/* EXTRA ANALYTICS */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",
                  gap: "20px",
                  marginBottom:
                    "50px",
                }}
              >

                <div className="backend-card">

                  <span>
                    CONTACT RATE
                  </span>

                  <h2>
                    {contactRate}%
                  </h2>

                  <p>
                    Percentage of leads
                    contacted
                  </p>

                </div>

                <div className="backend-card">

                  <span>
                    FOLLOW-UP READY
                  </span>

                  <h2>
                    {newLeads}
                  </h2>

                  <p>
                    New leads ready for
                    follow-up
                  </p>

                </div>

              </div>

            </div>

            {/* LEAD SEARCH */}

            <div
              style={{
                maxWidth: "600px",
                margin:
                  "0 auto 30px",
              }}
            >

              <input
                type="text"
                placeholder="🔍 Search business, name, phone or email..."
                value={leadSearch}
                onChange={(e) =>
                  setLeadSearch(
                    e.target.value
                  )
                }
                style={{
                  width: "100%",
                  padding:
                    "14px 18px",
                  borderRadius:
                    "10px",
                  border:
                    "1px solid #ccc",
                  fontSize: "15px",
                  boxSizing:
                    "border-box",
                  outline: "none",
                }}
              />

              <select
                value={
                  leadTypeFilter
                }
                onChange={(e) =>
                  setLeadTypeFilter(
                    e.target.value
                  )
                }
                style={{
                  width: "100%",
                  padding:
                    "14px 18px",
                  borderRadius:
                    "10px",
                  border:
                    "1px solid #ccc",
                  fontSize: "15px",
                  marginTop: "12px",
                  outline: "none",
                }}
              >

                <option value="All">
                  All Business Types
                </option>

                {[
                  ...new Set(
                    leads
                      .map(
                        (lead) =>
                          lead.type
                      )
                      .filter(Boolean)
                  ),
                ].map(
                  (type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {type}
                    </option>
                  )
                )}

              </select>

              <button
                type="button"
                onClick={
                  clearLeadFilters
                }
                style={{
                  marginTop:
                    "12px",
                  padding:
                    "10px 18px",
                  borderRadius:
                    "8px",
                  border:
                    "none",
                  cursor:
                    "pointer",
                  fontSize:
                    "14px",
                }}
              >
                ✕ Clear Filters
              </button>

            </div>

            {/* CUSTOMER LEADS */}

            {leadsLoading ? (
              <p className="backend-loading">
                Loading customer
                enquiries...
              </p>
            ) : filteredLeads.length ===
              0 ? (
              <p className="backend-loading">
                No matching customer
                enquiry found.
              </p>
            ) : (
              <div className="backend-data-grid">

                {filteredLeads.map(
                  (lead) => (

                    <div
                      className="backend-card"
                      key={lead._id}
                    >

                      <span>
                        CUSTOMER ENQUIRY
                      </span>

                      <h3>
                        {lead.business}
                      </h3>

                      <p>
                        <strong>
                          Customer:
                        </strong>{" "}
                        {lead.name}
                      </p>

                      <p>
                        <strong>
                          Phone:
                        </strong>{" "}
                        {lead.phone}
                      </p>

                      <p>
                        <strong>
                          Email:
                        </strong>{" "}
                        {lead.email}
                      </p>

                      <p>
                        <strong>
                          Business Type:
                        </strong>{" "}
                        {lead.type}
                      </p>

                      {/* LEAD STATUS */}

                      <div
                        style={{
                          marginTop:
                            "15px",
                        }}
                      >

                        <strong>
                          Lead Status:
                        </strong>

                        <select
                          value={
                            lead.status ||
                            "New"
                          }
                          onChange={(e) =>
                            updateLeadStatus(
                              lead._id,
                              e.target.value
                            )
                          }
                          disabled={
                            updatingId ===
                            lead._id
                          }
                          style={{
                            width:
                              "100%",
                            padding:
                              "10px 12px",
                            marginTop:
                              "8px",
                            borderRadius:
                              "8px",
                            border:
                              "1px solid #ccc",
                            fontSize:
                              "14px",
                            cursor:
                              updatingId ===
                              lead._id
                                ? "not-allowed"
                                : "pointer",
                            outline:
                              "none",
                          }}
                        >

                          <option value="New">
                            New
                          </option>

                          <option value="Contacted">
                            Contacted
                          </option>

                          <option value="Converted">
                            Converted
                          </option>

                          <option value="Closed">
                            Closed
                          </option>

                        </select>

                      </div>

                      <small>
                        Created At:{" "}
                        {lead.createdAt
                          ? new Date(
                              lead.createdAt
                            ).toLocaleString()
                          : "N/A"}
                      </small>

                      {/* LEAD ACTIONS */}

                      <div
                        style={{
                          display:
                            "flex",
                          gap:
                            "10px",
                          marginTop:
                            "18px",
                          flexWrap:
                            "wrap",
                        }}
                      >

                        <button
                          type="button"
                          onClick={() =>
                            sendLeadFollowUp(
                              lead
                            )
                          }
                          style={{
                            padding:
                              "10px 18px",
                            borderRadius:
                              "8px",
                            border:
                              "none",
                            cursor:
                              "pointer",
                            fontWeight:
                              "600",
                          }}
                        >
                          📲 Follow-up
                        </button>

                        <button
                          type="button"
                          onClick={() => {

                            const cleanPhone =
                              String(
                                lead.phone ||
                                  ""
                              ).replace(
                                /\D/g,
                                ""
                              );

                            const whatsappNumber =
                              cleanPhone.length ===
                              10
                                ? "91" +
                                  cleanPhone
                                : cleanPhone;

                            const message =
                              "Hello " +
                              (lead.name ||
                                "there") +
                              ", this is AryanX Digital. How can we help your business grow?";

                            window.open(
                              "https://wa.me/" +
                                whatsappNumber +
                                "?text=" +
                                encodeURIComponent(
                                  message
                                ),
                              "_blank"
                            );

                          }}
                          style={{
                            padding:
                              "10px 18px",
                            borderRadius:
                              "8px",
                            border:
                              "none",
                            cursor:
                              "pointer",
                          }}
                        >
                          💬 WhatsApp
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteLead(
                              lead._id
                            )
                          }
                          disabled={
                            deletingLeadId ===
                            lead._id
                          }
                          style={{
                            padding:
                              "10px 18px",
                            borderRadius:
                              "8px",
                            border:
                              "none",
                            cursor:
                              deletingLeadId ===
                              lead._id
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          {deletingLeadId ===
                          lead._id
                            ? "Deleting..."
                            : "🗑️ Delete"}
                        </button>

                      </div>

                    </div>

                  )
                )}

              </div>
            )}

          </section>
        )}

      {/* =========================
          CONTACT / CTA
      ========================= */}

      <section
        className="cta"
        id="contact"
      >

        <div className="cta-content">

          <span>
            START YOUR DIGITAL
            JOURNEY
          </span>

          <h2>
            Ready to grow your
            <br />
            <strong>
              business?
            </strong>
          </h2>

          <p>
            Tell us about your
            business and discover
            how AryanX Digital can
            help you build,
            automate and grow.
          </p>

          <div className="contact-info">

            <p>
              📱 +91 70708 58521
            </p>

            <p>
              📧 aryan7070t@gmail.com
            </p>

          </div>

        </div>

        {/* AUDIT FORM */}

        <form
          className="audit-form"
          onSubmit={async (e) => {

            e.preventDefault();

            const business =
              e.target.business.value;

            const customerName =
              e.target.name.value;

            const phone =
              e.target.phone.value;

            const email =
              e.target.email.value;

            const type =
              e.target.type.value;

            try {

              const response =
                await fetch(
                  API("/api/leads"),
                  {
                    method: "POST",
                    headers: {
                      "Content-Type":
                        "application/json",
                    },
                    body:
                      JSON.stringify({
                        business,
                        name:
                          customerName,
                        phone,
                        email,
                        type,
                      }),
                  }
                );

              const result =
                await response.json();

              if (!response.ok) {

                showToast(
                  result.message ||
                    "Failed to submit enquiry",
                  "error"
                );

                return;
              }

              if (
                isAdminPage &&
                isAdminLoggedIn
              ) {

                setLeads(
                  (prev) => [
                    result.data,
                    ...prev,
                  ]
                );

              }

              const whatsappMessage =
                "Hello AryanX Digital,\n\n" +
                "I want a Free Digital Audit.\n\n" +
                "Business Name: " +
                business +
                "\n" +
                "Name: " +
                customerName +
                "\n" +
                "Phone: " +
                phone +
                "\n" +
                "Email: " +
                email +
                "\n" +
                "Business Type: " +
                type;

              window.open(
                "https://wa.me/917070858521?text=" +
                  encodeURIComponent(
                    whatsappMessage
                  ),
                "_blank"
              );

              e.target.reset();

              showToast(
                "Enquiry submitted successfully!",
                "success"
              );

            } catch (error) {

              console.error(
                "Lead submission error:",
                error
              );

              showToast(
                "Server error. Please try again.",
                "error"
              );
            }

          }}
        >

          <input
            name="business"
            type="text"
            placeholder="Business Name"
            required
          />

          <input
            name="name"
            type="text"
            placeholder="Your Name"
            required
          />

          <input
            name="phone"
            type="tel"
            placeholder="Mobile Number"
            required
          />

          <input
            name="email"
            type="email"
            placeholder="Email Address"
            required
          />

          <select
            name="type"
            required
          >

            <option value="">
              Select Business Type
            </option>

            <option value="Restaurant / Cafe">
              Restaurant / Cafe
            </option>

            <option value="Hotel">
              Hotel
            </option>

            <option value="Gym / Fitness">
              Gym / Fitness
            </option>

            <option value="Salon / Beauty">
              Salon / Beauty
            </option>

            <option value="Coaching Institute">
              Coaching Institute
            </option>

            <option value="Real Estate">
              Real Estate
            </option>

            <option value="Retail Business">
              Retail Business
            </option>

            <option value="Other">
              Other
            </option>

          </select>

          <button
  type="submit"
  className="primary-btn"
>
  Get Free Digital Audit →
</button>
        </form>

      </section>

      {/* =========================
          FOOTER
      ========================= */}

      <footer>

        <div className="footer-logo">

          ARYAN

          <span>
            X
          </span>

          <small>
            DIGITAL
          </small>

        </div>

        <p>
          AI-Powered Digital Growth
          Partner for Businesses.
        </p>

        <div className="footer-links">

          <a href="#services">
            Services
          </a>

          <a href="#about">
            About
          </a>

          <a href="#ai">
            AI Solutions
          </a>

          {isAdminPage &&
            isAdminLoggedIn && (
              <a href="#database">
                Database
              </a>
            )}

          <a href="#contact">
            Contact
          </a>

        </div>

        <div className="copyright">
          © 2026 AryanX Digital.
          All rights reserved.
        </div>

        <a
          href="https://wa.me/917070858521"
          target="_blank"
          rel="noopener noreferrer"
          className="whatsapp-btn"
        >
          WhatsApp Us
        </a>

      </footer>

      {/* =========================
          FLOATING AI CHATBOT
      ========================= */}

      <button
        type="button"
        onClick={() =>
          setIsChatOpen(
            (prev) => !prev
          )
        }
        aria-label={
          isChatOpen
            ? "Close AryanX AI Chat"
            : "Open AryanX AI Chat"
        }
        style={{
          position: "fixed",
          right: "25px",
          bottom: "25px",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          border: "none",
          background: "#2563eb",
          color: "#ffffff",
          fontSize: "26px",
          fontWeight: "700",
          cursor: "pointer",
          zIndex: 999999,
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.4)",
        }}
      >
        {isChatOpen
          ? "×"
          : "✦"}
      </button>

      {isChatOpen && (
        <div
          id="ai-chat-window"
          style={{
            position: "fixed",
            right: "25px",
            bottom: "100px",
            width: "360px",
            maxWidth:
              "calc(100vw - 40px)",
            height: "500px",
            background: "#080d1d",
            border:
              "1px solid #2563eb",
            borderRadius: "18px",
            padding: "18px",
            zIndex: 999998,
            boxShadow:
              "0 20px 60px rgba(0,0,0,0.6)",
            display: "flex",
            flexDirection:
              "column",
            boxSizing:
              "border-box",
          }}
        >

          {/* CHAT HEADER */}

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              paddingBottom: "14px",
              borderBottom:
                "1px solid rgba(255,255,255,0.1)",
            }}
          >

            <div>

              <strong
                style={{
                  display: "block",
                  color: "#ffffff",
                  fontSize: "15px",
                }}
              >
                ✦ ARYANX AI
              </strong>

              <span
                style={{
                  color: "#22c55e",
                  fontSize: "11px",
                }}
              >
                ● Online
              </span>

            </div>

            <button
              type="button"
              onClick={
                clearAIChat
              }
              title="Clear chat"
              aria-label="Clear chat"
              style={{
                border: "none",
                background:
                  "transparent",
                color: "#94a3b8",
                fontSize: "20px",
                cursor: "pointer",
              }}
            >
              ↻
            </button>

          </div>

          {/* CHAT MESSAGES */}

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "15px 2px",
            }}
          >

            {chatMessages.map(
              (
                chat,
                index
              ) => (

                <div
                  key={index}
                  style={{
                    maxWidth:
                      "82%",
                    marginBottom:
                      "10px",
                    marginLeft:
                      chat.sender ===
                      "user"
                        ? "auto"
                        : "0",
                    padding:
                      "11px 13px",
                    borderRadius:
                      "11px",
                    background:
                      chat.sender ===
                      "user"
                        ? "#1e293b"
                        : "rgba(37,99,235,0.15)",
                    color:
                      chat.sender ===
                      "user"
                        ? "#e2e8f0"
                        : "#bfdbfe",
                    fontSize:
                      "12px",
                    lineHeight:
                      "1.5",
                    wordBreak:
                      "break-word",
                  }}
                >
                  {chat.text}
                </div>

              )
            )}

            {chatLoading && (
              <div
                style={{
                  maxWidth:
                    "82%",
                  padding:
                    "11px 13px",
                  borderRadius:
                    "11px",
                  background:
                    "rgba(37,99,235,0.15)",
                  color:
                    "#93c5fd",
                  fontSize:
                    "12px",
                }}
              >
                AryanX AI is
                thinking...
              </div>
            )}

          </div>

          {/* CHAT INPUT */}

          <form
            onSubmit={
              sendAIMessage
            }
            style={{
              display: "flex",
              gap: "8px",
              paddingTop: "12px",
              borderTop:
                "1px solid rgba(255,255,255,0.1)",
            }}
          >

            <input
              type="text"
              placeholder="Ask AryanX AI..."
              value={
                chatMessage
              }
              onChange={(e) =>
                setChatMessage(
                  e.target.value
                )
              }
              disabled={
                chatLoading
              }
              style={{
                flex: 1,
                minWidth: 0,
                padding: "12px",
                borderRadius: "9px",
                border:
                  "1px solid rgba(255,255,255,0.15)",
                background: "#0f172a",
                color: "#ffffff",
                outline: "none",
                boxSizing:
                  "border-box",
              }}
            />

            <button
              type="submit"
              disabled={
                chatLoading ||
                !chatMessage.trim()
              }
              style={{
                width: "45px",
                border: "none",
                borderRadius: "9px",
                background:
                  "#2563eb",
                color: "#ffffff",
                cursor:
                  chatLoading ||
                  !chatMessage.trim()
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  chatLoading ||
                  !chatMessage.trim()
                    ? 0.5
                    : 1,
                fontSize: "16px",
              }}
            >
              ➤
            </button>

          </form>

        </div>
      )}

    </div>
  );
}

export default App;

