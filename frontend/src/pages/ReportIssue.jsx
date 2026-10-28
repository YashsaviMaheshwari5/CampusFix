import { useState } from "react";
import { complaintService } from "../services/complaintService";

function ReportIssue({ onCreated }) {
  const [form, setForm] = useState({
    title: "",
    category: "",
    location: "",
    description: "",
    priority: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [files, setFiles] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const { title, category, location, description, priority } = form;

    if (
      !title.trim() ||
      !category ||
      !location.trim() ||
      !description.trim() ||
      !priority
    ) {
      setError("Please fill all the required fields.");
      return;
    }
    if (files.length > 3 || files.some((file) => file.size > 5 * 1024 * 1024)) {
      setError("Attach no more than three images, each 5 MB or smaller.");
      return;
    }

    try {
      setLoading(true);
      setError(""); setSuccess("");
      const payload = new FormData();
      payload.append("title", title.trim()); payload.append("category", category);
      payload.append("location", location.trim()); payload.append("description", description.trim());
      payload.append("priority", priority);
      files.forEach((file) => payload.append("attachments", file));
      const { complaint } = await complaintService.create(payload);
      onCreated(complaint);
      setSuccess("Complaint submitted successfully.");
      setFiles([]);

      setForm({
        title: "",
        category: "",
        location: "",
        description: "",
        priority: "",
      });
    } catch (submissionError) {
      setError(submissionError.message || "Unable to submit complaint. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-page">
      <div className="report-header">
        <div>
          <span className="dashboard-label">CAMPUSFIX</span>

          <h1>Report an Issue 📝</h1>

          <p>
            Tell us what's wrong and we'll help get it resolved.
          </p>
        </div>
      </div>

      <div className="report-layout">
        <div className="report-card">
          <div className="report-card-header">
            <div>
              <h2>Issue Details</h2>

              <p>
                Please provide accurate information about the problem.
              </p>
            </div>

            <span className="required-text">* Required</span>
          </div>

          <form onSubmit={handleSubmit}>
            {error && <div className="login-error" role="alert">{error}</div>}
            {success && <div className="success-message" role="status">{success}</div>}
            <div className="form-group">
              <label>
                Issue Title <span>*</span>
              </label>

              <input
                type="text"
                name="title"
                required
                minLength={5}
                maxLength={150}
                placeholder="Example: AC not working in Room 204"
                value={form.title}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Photos (optional, up to 3)</label>
              <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple onChange={(event) => setFiles(Array.from(event.target.files || []))} />
              <small className="input-help">Each image must be 5 MB or smaller.</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  Category <span>*</span>
                </label>

                <select
                  name="category"
                  required
                  value={form.category}
                  onChange={handleChange}
                >
                  <option value="">Select category</option>
                  <option value="Maintenance">🔧 Maintenance</option>
                  <option value="Cleanliness">🧹 Cleanliness</option>
                  <option value="Electricity">⚡ Electricity</option>
                  <option value="Internet">📶 Internet / Wi-Fi</option>
                  <option value="Water">💧 Water Supply</option>
                  <option value="Other">📋 Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  Priority <span>*</span>
                </label>

                <select
                  name="priority"
                  required
                  value={form.priority}
                  onChange={handleChange}
                >
                  <option value="">Select priority</option>
                  <option value="Low">🟢 Low</option>
                  <option value="Medium">🟡 Medium</option>
                  <option value="High">🔴 High</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>
                Location <span>*</span>
              </label>

              <input
                type="text"
                name="location"
                required
                maxLength={200}
                placeholder="Example: Hostel Block A, Room 204"
                value={form.location}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>
                Description <span>*</span>
              </label>

              <textarea
                name="description"
                rows="6"
                required
                minLength={10}
                maxLength={5000}
                placeholder="Describe the issue in detail. Include anything that might help us understand the problem..."
                value={form.description}
                onChange={handleChange}
              />

              <small className="input-help">
                Please provide as much detail as possible.
              </small>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading
                  ? "Submitting... ⏳"
                  : "Submit Complaint 🚀"}
              </button>
            </div>
          </form>
        </div>

        <div className="report-info">
          <div className="info-card">
            <div className="info-icon">💡</div>

            <h3>Before you submit</h3>

            <ul>
              <li>Make sure the location is correct.</li>
              <li>Give a clear description.</li>
              <li>Select the correct category.</li>
              <li>Use High priority only for urgent issues.</li>
            </ul>
          </div>

          <div className="info-card">
            <div className="info-icon">🔒</div>

            <h3>Your complaint is safe</h3>

            <p>
              Your complaint information is securely handled by
              CampusFix.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportIssue;
