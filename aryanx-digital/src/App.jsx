import { useEffect, useState } from "react";
import "./App.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://aryanx-digital-backend.onrender.com";

const API = (endpoint) => `${API_URL}${endpoint}`;

function App() {
  // =========================================================
  // BASIC STATES
  // =========================================================

  const [toast, setToast] = useState(null);

  const [isAdminPage] = useState(
    window.location.pathname.toLowerCase() === "/admin"
  );

  const [adminToken, setAdminToken] = useState(
    localStorage.getItem("adminToken") || ""
  );

  const [adminEmail, setAdminEmail] = useState(
    localStorage.getItem("adminEmail") || ""
  );

  // =========================================================
  // TEST DATABASE STATES
  // =========================================================

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editMessage, setEditMessage] = useState("");

  // =========================================================
  // LEAD / CUSTOMER INQUIRY STATES
  // =========================================================

  const [leads, setLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadRefreshing, setLeadRefreshing] = useState(false);

  const [leadUpdatingId, setLeadUpdatingId] = useState(null);
  const [leadDeletingId, setLeadDeletingId] = useState(null);

  const [business, setBusiness] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [businessType, setBusinessType] = useState("");

  const [leadSubmitting, setLeadSubmitting] = useState(false);

  // =========================================================
  // AI CHAT STATES
  // =========================================================

  const [chatOpen, setChatOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      text:
        "Hello! 👋 I'm AryanX AI. How can I help you grow your business today?",
    },
  ]);

  const [chatInput, setChatInput] = useState("");

  // =========================================================
  // TOAST
  // =========================================================

  const showToast = (messageText, type = "success") => {
    setToast({
      message: messageText,
      type,
    });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // =========================================================
  // AUTH HEADERS
  // =========================================================

  const getAuthHeaders = () => {
    if (!adminToken) {
      return {};
    }

    return {
      Authorization: `Bearer ${adminToken}`,
    };
  };

  // =========================================================
  // ADMIN LOGIN
  // =========================================================

  const handleAdminLogin = async (e) => {
    e.preventDefault();

    if (!adminEmail.trim() || !document.getElementById("adminPassword")?.value) {
      showToast("Please enter email and password.", "error");
      return;
    }

    const password =
      document.getElementById("adminPassword")?.value || "";

    try {
      setLeadsLoading(true);

      const response = await fetch(API("/api/admin/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: adminEmail.trim(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        showToast(
          result.message || "Invalid admin credentials.",
          "error"
        );
        return;
      }

      const token = result.token;

      if (!token) {
        showToast("Login token was not received.", "error");
        return;
      }

      localStorage.setItem("adminToken", token);
      localStorage.setItem("adminEmail", adminEmail.trim());

      setAdminToken(token);

      showToast("Admin login successful!", "success");

      window.location.reload();
    } catch (error) {
      console.error("Admin Login Error:", error);
      showToast(
        "Unable to connect to backend server.",
        "error"
      );
    } finally {
      setLeadsLoading(false);
    }
  };

  // =========================================================
  // ADMIN LOGOUT
  // =========================================================

  const handleAdminLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminEmail");

    setAdminToken("");
    setAdminEmail("");

    showToast("Logged out successfully.", "success");

    setTimeout(() => {
      window.location.href = "/";
    }, 700);
  };

  // =========================================================
  // LOAD TEST DATABASE
  // =========================================================

  const loadData = async () => {
    try {
      setLoading(true);

      const response = await fetch(API("/api/tests"));

      if (!response.ok) {
        throw new Error("Server error");
      }

      const result = await response.json();

      if (result.success) {
        setTests(result.data || []);
      } else {
        setTests([]);
      }
    } catch (error) {
      console.error("API Error:", error);
      setTests([]);

      showToast(
        "Unable to connect to test database.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // REFRESH TEST DATABASE
  // =========================================================

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      await loadData();

      showToast(
        "Database refreshed successfully!",
        "success"
      );
    } catch (error) {
      console.error("Refresh Error:", error);

      showToast(
        "Unable to refresh database.",
        "error"
      );
    } finally {
      setRefreshing(false);
    }
  };

  // =========================================================
  // ADD TEST DATA
  // =========================================================

  const addData = async (e) => {
    e.preventDefault();

    if (!name.trim() || !message.trim()) {
      showToast(
        "Please fill all fields.",
        "error"
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(API("/api/test"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          message: message.trim(),
        }),
      });

      const result = await response.json();

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
      console.error("Add Data Error:", error);

      showToast(
        "Backend connection failed.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DELETE TEST DATA
  // =========================================================

  const deleteData = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this record?"
    );

    if (!confirmDelete) {
      return;
    }

    setDeletingId(id);

    try {
      const response = await fetch(
        API(`/api/test/${id}`),
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (result.success) {
        setTests((prev) =>
          prev.filter(
            (test) => test._id !== id
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
      console.error("Delete Error:", error);

      showToast(
        "Backend connection failed.",
        "error"
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =========================================================
  // START TEST EDIT
  // =========================================================

  const startEdit = (test) => {
    setEditingId(test._id);
    setEditName(test.name || "");
    setEditMessage(test.message || "");
  };

  // =========================================================
  // CANCEL TEST EDIT
  // =========================================================

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditMessage("");
  };

  // =========================================================
  // UPDATE TEST DATA
  // =========================================================

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
      const response = await fetch(
        API(`/api/test/${id}`),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editName.trim(),
            message: editMessage.trim(),
          }),
        }
      );

      const result = await response.json();

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
      console.error("Update Error:", error);

      showToast(
        "Backend connection failed.",
        "error"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // =========================================================
  // LOAD CUSTOMER LEADS
  // =========================================================

  const loadLeads = async () => {
    if (!adminToken) {
      setLeads([]);
      return;
    }

    try {
      setLeadsLoading(true);

      const response = await fetch(
        API("/api/leads"),
        {
          method: "GET",
          headers: {
            ...getAuthHeaders(),
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminEmail");

        setAdminToken("");

        showToast(
          "Admin session expired. Please login again.",
          "error"
        );

        return;
      }

      const result = await response.json();

      if (result.success) {
        setLeads(result.data || []);
      } else {
        setLeads([]);

        showToast(
          result.message ||
            "Unable to load customer inquiries.",
          "error"
        );
      }
    } catch (error) {
      console.error("Load Leads Error:", error);

      setLeads([]);

      showToast(
        "Unable to load customer inquiries.",
        "error"
      );
    } finally {
      setLeadsLoading(false);
    }
  };

  // =========================================================
  // REFRESH CUSTOMER LEADS
  // =========================================================

  const refreshLeads = async () => {
    try {
      setLeadRefreshing(true);

      await loadLeads();

      showToast(
        "Customer inquiries refreshed!",
        "success"
      );
    } catch (error) {
      console.error(
        "Refresh Leads Error:",
        error
      );
    } finally {
      setLeadRefreshing(false);
    }
  };

  // =========================================================
  // CUSTOMER INQUIRY SUBMIT
  // =========================================================

  const handleAuditSubmit = async (e) => {
    e.preventDefault();

    if (
      !business.trim() ||
      !customerName.trim() ||
      !phone.trim() ||
      !email.trim() ||
      !businessType
    ) {
      showToast(
        "Please fill all customer inquiry fields.",
        "error"
      );
      return;
    }

    setLeadSubmitting(true);

    const leadData = {
      business: business.trim(),
      name: customerName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      type: businessType,
    };

    try {
      // =====================================================
      // SAVE CUSTOMER INQUIRY TO MONGODB
      // =====================================================

      const response = await fetch(
        API("/api/leads"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(leadData),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        showToast(
          result.message ||
            "Unable to save inquiry.",
          "error"
        );

        return;
      }

      showToast(
        "Inquiry saved successfully! Opening WhatsApp...",
        "success"
      );

      // =====================================================
      // WHATSAPP MESSAGE
      // =====================================================

      const whatsappText =
        `Hello AryanX Digital,%0A%0A` +
        `I want a Free Digital Audit.%0A%0A` +
        `Business Name: ${encodeURIComponent(
          leadData.business
        )}%0A` +
        `Name: ${encodeURIComponent(
          leadData.name
        )}%0A` +
        `Phone: ${encodeURIComponent(
          leadData.phone
        )}%0A` +
        `Email: ${encodeURIComponent(
          leadData.email
        )}%0A` +
        `Business Type: ${encodeURIComponent(
          leadData.type
        )}`;

      window.open(
        `https://wa.me/917070858521?text=${whatsappText}`,
        "_blank"
      );

      // =====================================================
      // RESET FORM
      // =====================================================

      setBusiness("");
      setCustomerName("");
      setPhone("");
      setEmail("");
      setBusinessType("");
    } catch (error) {
      console.error(
        "Customer Inquiry Error:",
        error
      );

      showToast(
        "Unable to connect to backend. Please try again.",
        "error"
      );
    } finally {
      setLeadSubmitting(false);
    }
  };

  // =========================================================
  // UPDATE LEAD STATUS
  // =========================================================

  const updateLeadStatus = async (
    id,
    newStatus
  ) => {
    setLeadUpdatingId(id);

    try {
      const response = await fetch(
        API(`/api/leads/${id}/status`),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        showToast(
          result.message ||
            "Unable to update lead status.",
          "error"
        );

        return;
      }

      setLeads((prev) =>
        prev.map((lead) =>
          lead._id === id
            ? {
                ...lead,
                status:
                  result.data?.status ||
                  newStatus,
              }
            : lead
        )
      );

      showToast(
        "Lead status updated!",
        "success"
      );
    } catch (error) {
      console.error(
        "Update Lead Status Error:",
        error
      );

      showToast(
        "Unable to update lead status.",
        "error"
      );
    } finally {
      setLeadUpdatingId(null);
    }
  };

  // =========================================================
  // DELETE CUSTOMER LEAD
  // =========================================================

  const deleteLead = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this customer inquiry?"
    );

    if (!confirmDelete) {
      return;
    }

    setLeadDeletingId(id);

    try {
      const response = await fetch(
        API(`/api/leads/${id}`),
        {
          method: "DELETE",
          headers: {
            ...getAuthHeaders(),
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        showToast(
          result.message ||
            "Unable to delete inquiry.",
          "error"
        );

        return;
      }

      setLeads((prev) =>
        prev.filter(
          (lead) => lead._id !== id
        )
      );

      showToast(
        "Customer inquiry deleted.",
        "success"
      );
    } catch (error) {
      console.error(
        "Delete Lead Error:",
        error
      );

      showToast(
        "Unable to delete customer inquiry.",
        "error"
      );
    } finally {
      setLeadDeletingId(null);
    }
  };

  // =========================================================
  // OPEN WHATSAPP FOR LEAD
  // =========================================================

  const openLeadWhatsApp = (lead) => {
    if (!lead?.phone) {
      showToast(
        "Customer phone number not available.",
        "error"
      );
      return;
    }

    let cleanPhone = String(
      lead.phone
    ).replace(/\D/g, "");

    if (
      cleanPhone.length === 10
    ) {
      cleanPhone = `91${cleanPhone}`;
    }

    const message =
      `Hello ${lead.name || "there"}, ` +
      `this is AryanX Digital. ` +
      `We received your inquiry for ` +
      `${lead.business || "your business"}.`;

    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        message
      )}`,
      "_blank"
    );
  };

  // =========================================================
  // AI CHAT
  // =========================================================

  const sendAIMessage = async (e) => {
    e?.preventDefault();

    const userMessage =
      chatInput.trim();

    if (!userMessage || aiLoading) {
      return;
    }

    const newUserMessage = {
      role: "user",
      text: userMessage,
    };

    const updatedMessages = [
      ...chatMessages,
      newUserMessage,
    ];

    setChatMessages(updatedMessages);
    setChatInput("");
    setAiLoading(true);

    try {
      const response = await fetch(
        API("/api/ai/chat"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessage,
            history: updatedMessages.map(
              (item) => ({
                role:
                  item.role === "assistant"
                    ? "model"
                    : "user",
                parts: [
                  {
                    text: item.text,
                  },
                ],
              })
            ),
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "AI request failed"
        );
      }

      const aiText =
        result.message ||
        result.reply ||
        result.data?.message ||
        "Sorry, I could not generate a response.";

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: aiText,
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
          role: "assistant",
          text:
            "Sorry, I'm unable to connect to AryanX AI right now. Please try again.",
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  // =========================================================
  // USE EFFECT
  // =========================================================

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (isAdminPage && adminToken) {
      loadLeads();
    }
  }, [isAdminPage, adminToken]);

  // =========================================================
  // ADMIN LOGIN PAGE
  // =========================================================

  if (isAdminPage && !adminToken) {
    return (
      <div className="app">
        {toast && (
          <div
            className={`toast toast-${toast.type}`}
          >
            <div className="toast-icon">
              {toast.type === "success"
                ? "✓"
                : "!"}
            </div>

            <div className="toast-content">
              <strong>
                {toast.type === "success"
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

        <section
          className="backend-section"
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className="backend-form"
            style={{
              width: "100%",
              maxWidth: "500px",
            }}
          >
            <div
              style={{
                textAlign: "center",
                marginBottom: "30px",
              }}
            >
              <div
                className="ai-orb"
                style={{
                  margin: "0 auto 20px",
                }}
              >
                ✦
              </div>

              <span>
                ARYANX DIGITAL
              </span>

              <h2>
                Admin Login
              </h2>

              <p>
                Login to manage customer
                inquiries and business data.
              </p>
            </div>

            <form
              onSubmit={
                handleAdminLogin
              }
            >
              <input
                type="email"
                placeholder="Admin Email"
                value={adminEmail}
                onChange={(e) =>
                  setAdminEmail(
                    e.target.value
                  )
                }
                required
              />

              <input
                id="adminPassword"
                type="password"
                placeholder="Admin Password"
                required
              />

              <button
                type="submit"
                className="primary-btn"
                disabled={leadsLoading}
              >
                {leadsLoading
                  ? "Logging in..."
                  : "Login to Dashboard →"}
              </button>
            </form>

            <div
              style={{
                textAlign: "center",
                marginTop: "25px",
              }}
            >
              <a href="/">
                ← Back to Website
              </a>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // =========================================================
  // ADMIN DASHBOARD
  // =========================================================

  if (isAdminPage && adminToken) {
    const totalLeads = leads.length;

    const newLeads = leads.filter(
      (lead) =>
        (lead.status || "New") ===
        "New"
    ).length;

    const contactedLeads =
      leads.filter(
        (lead) =>
          lead.status ===
          "Contacted"
      ).length;

    const convertedLeads =
      leads.filter(
        (lead) =>
          lead.status ===
          "Converted"
      ).length;

    const closedLeads =
      leads.filter(
        (lead) =>
          lead.status ===
          "Closed"
      ).length;

    return (
      <div className="app">
        {toast && (
          <div
            className={`toast toast-${toast.type}`}
          >
            <div className="toast-icon">
              {toast.type === "success"
                ? "✓"
                : "!"}
            </div>

            <div className="toast-content">
              <strong>
                {toast.type === "success"
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

        <nav className="navbar">
          <div className="logo">
            <img
              src="/logo.jpg"
              alt="AryanX Digital"
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
            }}
          >
            <span>
              Admin:{" "}
              {adminEmail}
            </span>

            <button
              type="button"
              className="nav-btn"
              onClick={
                handleAdminLogout
              }
            >
              Logout
            </button>
          </div>
        </nav>

        <section
          className="backend-section"
          style={{
            minHeight: "100vh",
          }}
        >
          <div className="section-heading">
            <span>
              ARYANX DIGITAL ADMIN
            </span>

            <h2>
              Customer
              <br />
              <em>Inquiry Dashboard.</em>
            </h2>

            <p>
              Manage customer inquiries
              received through the Free
              Digital Audit form.
            </p>
          </div>

          {/* =================================================
              DASHBOARD STATS
          ================================================= */}

          <div
            className="why-grid"
            style={{
              marginBottom: "40px",
            }}
          >
            <div className="why-card">
              <div className="why-number">
                {totalLeads}
              </div>

              <h3>
                Total Leads
              </h3>

              <p>
                All customer inquiries.
              </p>
            </div>

            <div className="why-card">
              <div className="why-number">
                {newLeads}
              </div>

              <h3>
                New
              </h3>

              <p>
                New inquiries waiting
                for contact.
              </p>
            </div>

            <div className="why-card">
              <div className="why-number">
                {contactedLeads}
              </div>

              <h3>
                Contacted
              </h3>

              <p>
                Customers already contacted.
              </p>
            </div>

            <div className="why-card">
              <div className="why-number">
                {convertedLeads}
              </div>

              <h3>
                Converted
              </h3>

              <p>
                Successfully converted leads.
              </p>
            </div>
          </div>

          {/* =================================================
              CLOSED STAT
          ================================================= */}

          <div
            style={{
              textAlign: "center",
              marginBottom: "30px",
            }}
          >
            <span>
              Closed Leads:{" "}
              <strong>
                {closedLeads}
              </strong>
            </span>
          </div>

          {/* =================================================
              REFRESH
          ================================================= */}

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "15px",
              marginBottom: "35px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="primary-btn"
              onClick={refreshLeads}
              disabled={
                leadRefreshing ||
                leadsLoading
              }
            >
              {leadRefreshing
                ? "Refreshing..."
                : "🔄 Refresh Inquiries"}
            </button>

            <a
              href="/"
              className="secondary-btn"
            >
              View Website
            </a>
          </div>

          {/* =================================================
              CUSTOMER INQUIRIES
          ================================================= */}

          {leadsLoading ? (
            <div
              style={{
                textAlign: "center",
                padding: "50px",
              }}
            >
              <h3>
                Loading customer inquiries...
              </h3>
            </div>
          ) : leads.length === 0 ? (
            <div
              className="backend-form"
              style={{
                textAlign: "center",
              }}
            >
              <h3>
                No Customer Inquiries Yet
              </h3>

              <p>
                When someone submits the
                Free Digital Audit form,
                their inquiry will appear
                here.
              </p>
            </div>
          ) : (
            <div
              className="backend-data-grid"
            >
              {leads.map((lead) => (
                <div
                  className="backend-card"
                  key={lead._id}
                >
                  <span>
                    CUSTOMER INQUIRY
                  </span>

                  <h3>
                    {lead.business ||
                      "Business Name"}
                  </h3>

                  <p>
                    <strong>
                      Name:
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

                  <p>
                    <strong>
                      Status:
                    </strong>
                  </p>

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
                      leadUpdatingId ===
                      lead._id
                    }
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

                  {lead.createdAt && (
                    <small
                      style={{
                        display: "block",
                        marginTop: "15px",
                      }}
                    >
                      Received:{" "}
                      {new Date(
                        lead.createdAt
                      ).toLocaleString()}
                    </small>
                  )}

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      marginTop: "20px",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={() =>
                        openLeadWhatsApp(
                          lead
                        )
                      }
                    >
                      WhatsApp
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteLead(
                          lead._id
                        )
                      }
                      disabled={
                        leadDeletingId ===
                        lead._id
                      }
                      style={{
                        padding:
                          "12px 18px",
                        borderRadius:
                          "8px",
                        border: "none",
                        cursor:
                          leadDeletingId ===
                          lead._id
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      {leadDeletingId ===
                      lead._id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  // =========================================================
  // PUBLIC WEBSITE
  // =========================================================

  return (
    <div className="app">
      {/* =====================================================
          TOAST
      ===================================================== */}

      {toast && (
        <div
          className={`toast toast-${toast.type}`}
        >
          <div className="toast-icon">
            {toast.type === "success"
              ? "✓"
              : "!"}
          </div>

          <div className="toast-content">
            <strong>
              {toast.type === "success"
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

      {/* =====================================================
          NAVBAR
      ===================================================== */}

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

          <a href="#database">
            Database
          </a>

          <a href="#contact">
            Contact
          </a>
        </div>

        <a
          href="#contact"
          className="nav-btn"
        >
          Get Started
        </a>
      </nav>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="hero">
        <div className="hero-content">
          <div className="badge">
            ✦ AI-POWERED DIGITAL GROWTH
          </div>

          <h1>
            Grow Your Business
            <span>
              {" "}
              With AI & Digital.
            </span>
          </h1>

          <p>
            AryanX Digital helps businesses
            build, automate and grow their
            online presence with modern
            technology, AI and smart digital
            solutions.
          </p>

          <div className="hero-buttons">
            <a
              href="#contact"
              className="primary-btn"
            >
              Get Free Digital Audit →
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

      {/* =====================================================
          SERVICES
      ===================================================== */}

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
            designed to help your business
            build, automate and grow.
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
              Perfect for businesses that
              are just getting started online.
            </p>

            <ul>
              <li>
                Professional Website
              </li>

              <li>
                Google Business Setup
              </li>

              <li>
                Basic Social Media Setup
              </li>

              <li>
                Contact & WhatsApp Integration
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
              For businesses looking to
              attract more customers online.
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
              Smart automation systems for
              modern businesses.
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

      {/* =====================================================
          AI SECTION
      ===================================================== */}

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
            Don't just take your business
            online. Make it intelligent.
          </p>

          <div className="ai-features">
            <div>
              <strong>
                01
              </strong>

              <span>
                AI Customer Support
              </span>
            </div>

            <div>
              <strong>
                02
              </strong>

              <span>
                Automated Lead Follow-up
              </span>
            </div>

            <div>
              <strong>
                03
              </strong>

              <span>
                Smart Business Analytics
              </span>
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
              Can you tell me about your
              services?
            </div>

            <div className="message ai">
              Absolutely! I'm AryanX AI.
              How can I help your business
              grow today?
            </div>

            <div className="message customer">
              I want more customers.
            </div>

            <div className="message ai">
              Great. Let's build your
              digital growth system.
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          ABOUT
      ===================================================== */}

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
            AryanX Digital is an AI-powered
            digital growth company helping
            businesses build a stronger online
            presence, automate their operations
            and attract more customers.
          </p>

          <p>
            We combine modern web technology,
            artificial intelligence, automation
            and digital marketing to create
            practical solutions that help
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

      {/* =====================================================
          WHY ARYANX
      ===================================================== */}

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
            We build long-term digital
            growth systems that combine
            technology, AI and business
            strategy.
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
              We use artificial intelligence
              to make business processes
              smarter and more efficient.
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
              Every solution is designed
              around your actual business
              goals and customer needs.
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
              Our systems are designed to
              grow with your business, from
              the first customer to thousands.
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
              delivery. We help businesses
              continuously improve and grow.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          DATABASE
      ===================================================== */}

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
            Add, view, update and delete
            data directly through the
            AryanX Digital website.
          </p>
        </div>

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
                setName(e.target.value)
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
            This data is coming directly
            from our Express API and
            MongoDB Atlas database.
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
                      EDIT DATABASE RECORD
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
                      value={editMessage}
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
                      ID:{" "}
                      {test._id}
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
                          border: "none",
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
                          border: "none",
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
                "pointer",
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
      </section>

      {/* =====================================================
          CONTACT / FREE DIGITAL AUDIT
      ===================================================== */}

      <section
        className="cta"
        id="contact"
      >
        <div className="cta-content">
          <span>
            START YOUR DIGITAL JOURNEY
          </span>

          <h2>
            Ready to grow your
            <br />
            <strong>
              business?
            </strong>
          </h2>

          <p>
            Tell us about your business
            and discover how AryanX Digital
            can help you build, automate
            and grow.
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

        {/* =================================================
            IMPORTANT:
            THIS FORM NOW SAVES TO MONGODB
            AND THEN OPENS WHATSAPP.
        ================================================= */}

        <form
          className="audit-form"
          onSubmit={
            handleAuditSubmit
          }
        >
          <input
            name="business"
            type="text"
            placeholder="Business Name"
            value={business}
            onChange={(e) =>
              setBusiness(
                e.target.value
              )
            }
            required
            disabled={
              leadSubmitting
            }
          />

          <input
            name="name"
            type="text"
            placeholder="Your Name"
            value={customerName}
            onChange={(e) =>
              setCustomerName(
                e.target.value
              )
            }
            required
            disabled={
              leadSubmitting
            }
          />

          <input
            name="phone"
            type="tel"
            placeholder="Mobile Number"
            value={phone}
            onChange={(e) =>
              setPhone(
                e.target.value
              )
            }
            required
            disabled={
              leadSubmitting
            }
          />

          <input
            name="email"
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
            required
            disabled={
              leadSubmitting
            }
          />

          <select
            name="type"
            value={businessType}
            onChange={(e) =>
              setBusinessType(
                e.target.value
              )
            }
            required
            disabled={
              leadSubmitting
            }
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
            disabled={
              leadSubmitting
            }
          >
            {leadSubmitting
              ? "Saving Inquiry..."
              : "Get Free Digital Audit →"}
          </button>
        </form>
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

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

          <a href="#database">
            Database
          </a>

          <a href="#contact">
            Contact
          </a>

          <a href="/admin">
            Admin
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

      {/* =====================================================
          FLOATING AI BUTTON
      ===================================================== */}

      <button
        type="button"
        onClick={() =>
          setChatOpen(
            (prev) => !prev
          )
        }
        style={{
          position: "fixed",
          right: "25px",
          bottom: "90px",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          border: "none",
          background:
            "linear-gradient(135deg, #2563eb, #06b6d4)",
          color: "#fff",
          fontSize: "24px",
          cursor: "pointer",
          zIndex: 9998,
          boxShadow:
            "0 10px 30px rgba(37,99,235,0.35)",
        }}
        aria-label="Open AryanX AI"
      >
        ✦
      </button>

      {/* =====================================================
          AI CHAT WINDOW
      ===================================================== */}

      {chatOpen && (
        <div
          style={{
            position: "fixed",
            right: "25px",
            bottom: "165px",
            width: "min(380px, calc(100vw - 30px))",
            height: "520px",
            background: "#fff",
            borderRadius: "18px",
            boxShadow:
              "0 20px 60px rgba(0,0,0,0.18)",
            zIndex: 9997,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border:
              "1px solid rgba(37,99,235,0.15)",
          }}
        >
          <div
            style={{
              padding: "18px",
              background:
                "linear-gradient(135deg, #2563eb, #06b6d4)",
              color: "#fff",
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <strong>
                ✦ ARYANX AI
              </strong>

              <div
                style={{
                  fontSize: "12px",
                  marginTop: "3px",
                  opacity: 0.9,
                }}
              >
                AI Business Assistant
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setChatOpen(false)
              }
              style={{
                border: "none",
                background:
                  "transparent",
                color: "#fff",
                fontSize: "22px",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>

          <div
            style={{
              flex: 1,
              padding: "15px",
              overflowY: "auto",
              background: "#f8fafc",
            }}
          >
            {chatMessages.map(
              (msg, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent:
                      msg.role === "user"
                        ? "flex-end"
                        : "flex-start",
                    marginBottom:
                      "12px",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "82%",
                      padding:
                        "11px 14px",
                      borderRadius:
                        "14px",
                      background:
                        msg.role ===
                        "user"
                          ? "#2563eb"
                          : "#fff",
                      color:
                        msg.role ===
                        "user"
                          ? "#fff"
                          : "#1e293b",
                      boxShadow:
                        msg.role ===
                        "user"
                          ? "none"
                          : "0 2px 10px rgba(0,0,0,0.06)",
                      fontSize:
                        "14px",
                      lineHeight:
                        "1.5",
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              )
            )}

            {aiLoading && (
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "flex-start",
                }}
              >
                <div
                  style={{
                    padding:
                      "11px 14px",
                    borderRadius:
                      "14px",
                    background:
                      "#fff",
                    color:
                      "#64748b",
                    fontSize:
                      "14px",
                  }}
                >
                  AryanX AI is thinking...
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={
              sendAIMessage
            }
            style={{
              display: "flex",
              gap: "8px",
              padding: "12px",
              borderTop:
                "1px solid #e2e8f0",
              background: "#fff",
            }}
          >
            <input
              type="text"
              placeholder="Ask AryanX AI..."
              value={chatInput}
              onChange={(e) =>
                setChatInput(
                  e.target.value
                )
              }
              disabled={
                aiLoading
              }
              style={{
                flex: 1,
                minWidth: 0,
              }}
            />

            <button
              type="submit"
              className="primary-btn"
              disabled={
                aiLoading ||
                !chatInput.trim()
              }
              style={{
                padding:
                  "10px 15px",
              }}
            >
              →
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;