import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

function Feedback() {
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    apiRequest("/feedback", { signal: controller.signal })
      .then((data) => setFeedbackList(data.feedback))
      .catch((err) => { if (err.name !== "AbortError") setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    if (!rating || !message.trim()) { setError("Select a rating and enter your feedback."); return; }
    setSubmitting(true); setError(""); setSuccess("");
    try {
      const { feedback } = await apiRequest("/feedback", { method: "POST", body: { rating, message: message.trim() } });
      setFeedbackList((previous) => [feedback, ...previous]);
      setRating(0); setMessage(""); setSuccess("Thank you! Your feedback was saved.");
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  return <div className="feedback-page">
    <div className="page-header"><div><h1>Share Your Feedback 💬</h1><p>Help us make CampusFix better.</p></div></div>
    <div className="feedback-card"><form onSubmit={handleSubmit}>
      {error && <div role="alert" className="login-error">{error}</div>}{success && <div role="status">{success}</div>}
      <div className="rating-section"><h2>How was your CampusFix experience?</h2><p>Select a rating from 1 to 5.</p><div className="stars">{[1,2,3,4,5].map((star) => <button type="button" key={star} aria-label={`${star} stars`} aria-pressed={star === rating} className={star <= rating ? "star active-star" : "star"} onClick={() => setRating(star)}>★</button>)}</div></div>
      <div className="form-group"><label>Your Feedback</label><textarea rows="6" required minLength={3} maxLength={2000} placeholder="Tell us about your experience..." value={message} onChange={(event) => setMessage(event.target.value)} /></div>
      <button type="submit" className="submit-btn" disabled={submitting}>{submitting ? "Submitting…" : "Submit Feedback"}</button>
    </form></div>
    <div className="previous-feedback"><h2>Your Previous Feedback</h2>
      {loading ? <p role="status">Loading feedback…</p> : feedbackList.length === 0 ? <p>No feedback submitted yet.</p> : feedbackList.map((item) => <div className="feedback-item" key={item._id}><div className="feedback-rating">{"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}</div><p>{item.message}</p><small>Submitted on {new Date(item.createdAt).toLocaleDateString()}</small></div>)}
    </div>
  </div>;
}
export default Feedback;
