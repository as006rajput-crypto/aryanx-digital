import { useEffect, useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL;
const API = (endpoint) => `${API_URL}${endpoint}`;

function App() {
  const [tests, setTests] = useState([]);
  const [leads, setLeads] = useState([]);
const [leadsLoading, setLeadsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leadSearch, setLeadSearch] = useState("");
  const [deletingLeadId, setDeletingLeadId] = useState(null);

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editMessage, setEditMessage] = useState("");

  const [toast, setToast] = useState(null);

  // =========================
  // TOAST NOTIFICATION
  // =========================

  const showToast = (message, type = "success") => {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // =========================
  // GET ALL DATA
  // =========================

  const loadData = async () => {
    try {
      setLoading(true);

      const response = await fetch(API("/api/tests"));

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
      console.error("API Error:", error);
      setTests([]);
      showToast("Unable to connect to server.", "error");
    } finally {
      setLoading(false);
    }
  };
  // =========================
// GET ALL LEADS
// =========================
const loadLeads = async () => {
  try {
    setLeadsLoading(true);

    const response = await fetch(API("/api/leads"));
    const result = await response.json();

    if (result.success) {
      setLeads(result.data);
    } else {
      setLeads([]);
    }
  } catch (error) {
    console.error("Leads API Error:", error);
    setLeads([]);
    showToast("Unable to load leads.", "error");
  } finally {
    setLeadsLoading(false);
  }
};

  // =========================
  // REFRESH DATA
  // =========================

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      await loadData();

      showToast("Data refreshed successfully!", "success");
    } catch (error) {
      console.error("Refresh Error:", error);
      showToast("Unable to refresh data.", "error");
    } finally {
      setRefreshing(false);
    }
  };

  // =========================
  // ADD DATA
  // =========================

  const addData = async (e) => {
    e.preventDefault();

    if (!name.trim() || !message.trim()) {
      showToast("Please fill all fields.", "error");
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
          name,
          message,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTests((prev) => [result.data, ...prev]);

        setName("");
        setMessage("");

        showToast("Data added successfully!", "success");
      } else {
        showToast(
          result.message || "Failed to add data.",
          "error"
        );
      }
    } catch (error) {
      console.error("Add Data Error:", error);
      showToast("Backend connection failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // DELETE DATA
  // =========================

  const deleteData = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this record?"
    );

    if (!confirmDelete) return;

    setDeletingId(id);

    try {
      const response = await fetch(API(`/api/test/${id}`), {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        setTests((prev) =>
          prev.filter((test) => test._id !== id)
        );

        showToast("Data deleted successfully!", "success");
      } else {
        showToast(
          result.message || "Failed to delete data.",
          "error"
        );
      }
    } catch (error) {
      console.error("Delete Error:", error);
      showToast("Backend connection failed.", "error");
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
  // UPDATE DATA
  // =========================

  const updateData = async (id) => {
    if (!editName.trim() || !editMessage.trim()) {
      showToast("Please fill all fields.", "error");
      return;
    }

    setUpdatingId(id);

    try {
      const response = await fetch(API(`/api/test/${id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editName,
          message: editMessage,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTests((prev) =>
          prev.map((test) =>
            test._id === id ? result.data : test
          )
        );

        cancelEdit();

        showToast("Data updated successfully!", "success");
      } else {
        showToast(
          result.message || "Failed to update data.",
          "error"
        );
      }
    } catch (error) {
      console.error("Update Error:", error);
      showToast("Backend connection failed.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  // =========================
  // LOAD DATA ON PAGE LOAD
  // =========================

  useEffect(() => {
  loadData();
  loadLeads();
}, []);

  return (
    <div className="app">

      {/* =========================
          TOAST
      ========================= */}

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <div className="toast-icon">
            {toast.type === "success" ? "✓" : "!"}
          </div>

          <div className="toast-content">
            <strong>
              {toast.type === "success"
                ? "Success"
                : "Error"}
            </strong>

            <span>{toast.message}</span>
          </div>

          <button
            type="button"
            className="toast-close"
            onClick={() => setToast(null)}
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
          <img src="/logo.jpg" alt="AryanX Digital" />
        </div>

        <div className="nav-links">
          <a href="#services">Services</a>
          <a href="#about">About</a>
          <a href="#ai">AI Solutions</a>
          <a href="#database">Database</a>
          <a href="#contact">Contact</a>
        </div>

        <a href="#contact" className="nav-btn">
          Get Started
        </a>
      </nav>

      {/* =========================
          HERO
      ========================= */}

      <section className="hero">
        <div className="hero-content">

          <div className="badge">
            ✦ AI-POWERED DIGITAL GROWTH
          </div>

          <h1>
            Grow Your Business
            <span> With AI & Digital.</span>
          </h1>

          <p>
            AryanX Digital helps businesses build, automate and grow
            their online presence with modern technology, AI and
            smart digital solutions.
          </p>

          <div className="hero-buttons">
            <a href="#contact" className="primary-btn">
              Get Free Digital Audit →
            </a>

            <a href="#services" className="secondary-btn">
              Explore Services
            </a>
          </div>

          <div className="trust">
            <div>
              <strong>AI</strong>
              <span>Powered</span>
            </div>

            <div>
              <strong>24/7</strong>
              <span>Automation</span>
            </div>

            <div>
              <strong>360°</strong>
              <span>Digital Growth</span>
            </div>
          </div>
        </div>

        <div className="hero-card">
          <div className="card-glow"></div>

          <div className="ai-orb">
            ✦
          </div>

          <p>ARYANX AI</p>

          <h3>
            Your Business.
            <br />
            Digitally Smarter.
          </h3>

          <div className="mini-stats">
            <div>
              <span>Leads</span>
              <strong>+128%</strong>
            </div>

            <div>
              <span>Automation</span>
              <strong>24/7</strong>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          SERVICES
      ========================= */}

      <section className="section" id="services">

        <div className="section-heading">
          <span>OUR SERVICES</span>

          <h2>
            Choose the right
            <br />
            <em>growth system.</em>
          </h2>

          <p>
            Simple digital solutions designed to help your business
            build, automate and grow.
          </p>
        </div>

        <div className="services-grid">

          <div className="service-card">
            <div className="service-icon">◈</div>

            <h3>Starter</h3>

            <p>
              Perfect for businesses that are just getting started online.
            </p>

            <ul>
              <li>Professional Website</li>
              <li>Google Business Setup</li>
              <li>Basic Social Media Setup</li>
              <li>Contact & WhatsApp Integration</li>
            </ul>

            <a href="#contact">
              Get Started →
            </a>
          </div>

          <div className="service-card featured">

            <div className="popular">
              MOST POPULAR
            </div>

            <div className="service-icon">✦</div>

            <h3>Growth</h3>

            <p>
              For businesses looking to attract more customers online.
            </p>

            <ul>
              <li>Everything in Starter</li>
              <li>Social Media Management</li>
              <li>Lead Generation</li>
              <li>Digital Marketing</li>
            </ul>

            <a href="#contact">
              Grow With Us →
            </a>
          </div>

          <div className="service-card">

            <div className="service-icon">◎</div>

            <h3>AI Business</h3>

            <p>
              Smart automation systems for modern businesses.
            </p>

            <ul>
              <li>AI Customer Support</li>
              <li>WhatsApp Automation</li>
              <li>Lead Automation</li>
              <li>Business Analytics</li>
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

      <section className="ai-section" id="ai">

        <div className="ai-content">

          <span className="section-label">
            THE ARYANX ADVANTAGE
          </span>

          <h2>
            Make Your Business
            <br />
            <span>AI-Powered.</span>
          </h2>

          <p>
            Don't just take your business online.
            Make it intelligent.
          </p>

          <div className="ai-features">

            <div>
              <strong>01</strong>
              <span>AI Customer Support</span>
            </div>

            <div>
              <strong>02</strong>
              <span>Automated Lead Follow-up</span>
            </div>

            <div>
              <strong>03</strong>
              <span>Smart Business Analytics</span>
            </div>

          </div>
        </div>

        <div className="ai-dashboard">

          <div className="dashboard-top">
            <span>ARYANX AI</span>
            <span className="online">● LIVE</span>
          </div>

          <div className="chat">

            <div className="message customer">
              Can you tell me about your services?
            </div>

            <div className="message ai">
              Absolutely! I'm AryanX AI.
              How can I help your business grow today?
            </div>

            <div className="message customer">
              I want more customers.
            </div>

            <div className="message ai">
              Great. Let's build your digital growth system.
            </div>

          </div>
        </div>
      </section>

      {/* =========================
          ABOUT
      ========================= */}

      <section className="about" id="about">

        <div className="about-heading">

          <span className="section-label">
            ABOUT ARYANX DIGITAL
          </span>

          <h2>
            We build digital
            <br />
            <span>systems that grow.</span>
          </h2>

        </div>

        <div className="about-content">

          <p>
            AryanX Digital is an AI-powered digital growth company helping
            businesses build a stronger online presence, automate their
            operations and attract more customers.
          </p>

          <p>
            We combine modern web technology, artificial intelligence,
            automation and digital marketing to create practical solutions
            that help businesses grow.
          </p>

          <div className="about-points">

            <div>
              <strong>01</strong>
              <span>Technology First</span>
            </div>

            <div>
              <strong>02</strong>
              <span>AI Powered</span>
            </div>

            <div>
              <strong>03</strong>
              <span>Growth Focused</span>
            </div>

          </div>
        </div>
      </section>

      {/* =========================
          WHY ARYANX
      ========================= */}

      <section className="why-section">

        <div className="section-heading">

          <span>WHY ARYANX DIGITAL</span>

          <h2>
            More than a digital
            <br />
            <em>service provider.</em>
          </h2>

          <p>
            We build long-term digital growth systems that combine
            technology, AI and business strategy.
          </p>

        </div>

        <div className="why-grid">

          <div className="why-card">
            <div className="why-number">01</div>

            <h3>AI First</h3>

            <p>
              We use artificial intelligence to make business
              processes smarter and more efficient.
            </p>
          </div>

          <div className="why-card">
            <div className="why-number">02</div>

            <h3>Business Focused</h3>

            <p>
              Every solution is designed around your actual
              business goals and customer needs.
            </p>
          </div>

          <div className="why-card">
            <div className="why-number">03</div>

            <h3>Built to Scale</h3>

            <p>
              Our systems are designed to grow with your business,
              from the first customer to thousands.
            </p>
          </div>

          <div className="why-card">
            <div className="why-number">04</div>

            <h3>Long-Term Support</h3>

            <p>
              We don't disappear after delivery. We help businesses
              continuously improve and grow.
            </p>
          </div>

        </div>
      </section>

      {/* =========================
          DATABASE / ADMIN PANEL
      ========================= */}

      <section
        className="backend-section"
        id="database"
      >

        <div className="section-heading">

          <span>ARYANX DIGITAL DATABASE</span>

          <h2>
            Manage Your
            <br />
            <em>Business Data.</em>
          </h2>

          <p>
            Add, view, update and delete data directly through
            the AryanX Digital website.
          </p>

        </div>

        {/* ADD DATA FORM */}

        <div className="backend-form">

          <h3>Add New Record</h3>

          <form onSubmit={addData}>

            <input
              type="text"
              placeholder="Enter name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
            />

            <textarea
              placeholder="Enter message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows="4"
              disabled={saving}
            />

            <button
              type="submit"
              className="primary-btn"
              disabled={saving}
            >
              {saving ? "Saving..." : "Add Data"}
            </button>

          </form>
        </div>

        {/* LIVE DATA */}

        <div className="section-heading">

          <span>LIVE BACKEND DATA</span>

          <h2>
            AryanX Digital
            <br />
            <em>Connected to MongoDB.</em>
          </h2>

          <p>
            This data is coming directly from our Express API
            and MongoDB Atlas database.
          </p>

        </div>

        {/* LOADING / EMPTY / DATA */}

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

                {editingId === test._id ? (

                  <>
                    <span>
                      EDIT DATABASE RECORD
                    </span>

                    <input
                      type="text"
                      value={editName}
                      onChange={(e) =>
                        setEditName(e.target.value)
                      }
                      disabled={updatingId === test._id}
                    />

                    <textarea
                      value={editMessage}
                      onChange={(e) =>
                        setEditMessage(e.target.value)
                      }
                      rows="4"
                      disabled={updatingId === test._id}
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
                          updateData(test._id)
                        }
                        disabled={updatingId === test._id}
                      >
                        {updatingId === test._id
                          ? "Updating..."
                          : "Save Changes"}
                      </button>

                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={updatingId === test._id}
                        style={{
                          padding: "12px 20px",
                          borderRadius: "8px",
                          border: "1px solid #ccc",
                          background: "transparent",
                          cursor:
                            updatingId === test._id
                              ? "not-allowed"
                              : "pointer",
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
                          startEdit(test)
                        }
                        disabled={
                          deletingId === test._id ||
                          refreshing
                        }
                        style={{
                          padding: "10px 18px",
                          borderRadius: "8px",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteData(test._id)
                        }
                        disabled={deletingId === test._id}
                        style={{
                          padding: "10px 18px",
                          borderRadius: "8px",
                          border: "none",
                          cursor:
                            deletingId === test._id
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        {deletingId === test._id
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

        {/* REFRESH BUTTON */}

        <div
          style={{
            textAlign: "center",
            marginTop: "30px",
          }}
        >

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            style={{
              padding: "12px 24px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              background: "transparent",
              cursor:
                loading || refreshing
                  ? "not-allowed"
                  : "pointer",
              opacity:
                loading || refreshing
                  ? 0.6
                  : 1,
            }}
          >
            {refreshing
              ? "Refreshing..."
              : "🔄 Refresh Database"}
          </button>

        </div>
                {/* =========================
            CUSTOMER LEADS
        ========================= */}

        <div className="section-heading" style={{ marginTop: "80px" }}>
          <div
  style={{
    textAlign: "center",
    marginBottom: "25px",
  }}
>
  <h3 style={{ marginBottom: "5px" }}>
    Total Leads: {leads.length}
  </h3>

  <p style={{ margin: 0, opacity: 0.7 }}>
    Customer enquiries received
  </p>
</div>

          <span>CUSTOMER ENQUIRIES</span>

          <h2>
            AryanX Digital
            <br />
            <em>Business Leads.</em>
          </h2>

          <p>
            All enquiries submitted through the Free Digital Audit
            form are stored securely in MongoDB.
          </p>

        </div>
{/* LEAD SEARCH */}
<div
  style={{
    maxWidth: "600px",
    margin: "0 auto 30px",
  }}
>
  <input
    type="text"
    placeholder="🔍 Search business, name, phone or email..."
    value={leadSearch}
    onChange={(e) => setLeadSearch(e.target.value)}
    style={{
      width: "100%",
      padding: "14px 18px",
      borderRadius: "10px",
      border: "1px solid #ccc",
      fontSize: "15px",
      boxSizing: "border-box",
      outline: "none",
    }}
  />
</div>
        {leadsLoading ? (

          <p className="backend-loading">
            Loading customer enquiries...
          </p>

        ) : leads.filter((lead) => {
    const search = leadSearch.toLowerCase().trim();

    return (
      lead.business?.toLowerCase().includes(search) ||
      lead.name?.toLowerCase().includes(search) ||
      lead.phone?.toLowerCase().includes(search) ||
      lead.email?.toLowerCase().includes(search) ||
      lead.type?.toLowerCase().includes(search)
    );
  }).length === 0 ? (
  <p className="backend-loading">
    No matching customer enquiry found.
  </p>
) : (

          <div className="backend-data-grid">

            {leads
  .filter((lead) => {
    const search = leadSearch.toLowerCase();

    return (
      lead.business?.toLowerCase().includes(search) ||
      lead.name?.toLowerCase().includes(search) ||
      lead.phone?.toLowerCase().includes(search) ||
      lead.email?.toLowerCase().includes(search) ||
      lead.type?.toLowerCase().includes(search)
    );
  })
  .map((lead) => (

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
                  <strong>Customer:</strong>{" "}
                  {lead.name}
                </p>

                <p>
                  <strong>Phone:</strong>{" "}
                  {lead.phone}
                </p>

                <p>
                  <strong>Email:</strong>{" "}
                  {lead.email}
                </p>

                <p>
                  <strong>Business Type:</strong>{" "}
                  {lead.type}
                </p>

                <small>
                  Created At:{" "}
                  {lead.createdAt
                    ? new Date(
                        lead.createdAt
                      ).toLocaleString()
                    : "N/A"}
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
                      window.open(
                        `https://wa.me/91${lead.phone.replace(
                          /\D/g,
                          ""
                        )}`,
                        "_blank"
                      )
                    }
                    style={{
                      padding: "10px 18px",
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    💬 WhatsApp
                    <button
  type="button"
  onClick={async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this lead?"
    );

    if (!confirmDelete) return;

    try {
      setDeletingLeadId(lead._id);

      const response = await fetch(
        API(`/api/leads/${lead._id}`),
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || "Failed to delete lead");
        return;
      }

      setLeads((prevLeads) =>
        prevLeads.filter(
          (item) => item._id !== lead._id
        )
      );

      alert("Lead deleted successfully! ✅");
    } catch (error) {
      console.error("Delete Lead Error:", error);
      alert("Server error. Please try again.");
    } finally {
      setDeletingLeadId(null);
    }
  }}
  disabled={deletingLeadId === lead._id}
  style={{
    padding: "10px 18px",
    borderRadius: "8px",
    border: "none",
    cursor:
      deletingLeadId === lead._id
        ? "not-allowed"
        : "pointer",
  }}
>
  {deletingLeadId === lead._id
    ? "Deleting..."
    : "🗑️ Delete"}
</button>
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </section>

      {/* =========================
          CONTACT / CTA
      ========================= */}

      <section className="cta" id="contact">

        <div className="cta-content">

          <span>
            START YOUR DIGITAL JOURNEY
          </span>

          <h2>
            Ready to grow your
            <br />
            <strong>business?</strong>
          </h2>

          <p>
            Tell us about your business and discover how
            AryanX Digital can help you build, automate and grow.
          </p>

          <div className="contact-info">
            <p>📱 +91 70708 58521</p>
            <p>📧 aryan7070t@gmail.com</p>
          </div>

        </div>

        <form
          className="audit-form"
          onSubmit={async (e) => {
  e.preventDefault();

  const business = e.target.business.value;
  const customerName = e.target.name.value;
  const phone = e.target.phone.value;
  const email = e.target.email.value;
  const type = e.target.type.value;

  try {
    // Save lead to MongoDB
    const response = await fetch(API("/api/leads"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        business,
        name: customerName,
        phone,
        email,
        type
      })
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.message || "Failed to submit enquiry");
      return;
    }

    // Open WhatsApp after successful database save
    const whatsappMessage =
      `Hello AryanX Digital,%0A%0A` +
      `I want a Free Digital Audit.%0A%0A` +
      `Business Name: ${business}%0A` +
      `Name: ${customerName}%0A` +
      `Phone: ${phone}%0A` +
      `Email: ${email}%0A` +
      `Business Type: ${type}`;

    window.open(
      `https://wa.me/917070858521?text=${whatsappMessage}`,
      "_blank"
    );

    // Clear form
    e.target.reset();

    alert("Enquiry submitted successfully! ✅");
  } catch (error) {
    console.error("Lead submission error:", error);
    alert("Server error. Please try again.");
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
          ARYAN<span>X</span>
          <small>DIGITAL</small>
        </div>

        <p>
          AI-Powered Digital Growth Partner for Businesses.
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

        </div>

        <div className="copyright">
          © 2026 AryanX Digital. All rights reserved.
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

    </div>
  );
}

export default App;