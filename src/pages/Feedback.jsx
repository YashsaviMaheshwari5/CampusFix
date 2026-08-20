import { useState } from "react";

function Feedback() {

  // Rating state
  const [rating, setRating] = useState(0);

  // Feedback message state
  const [message, setMessage] = useState("");

  // Submitted feedback
  const [feedbackList, setFeedbackList] = useState(() => {

    const savedFeedback =
      localStorage.getItem("campusFixFeedback");

    return savedFeedback
      ? JSON.parse(savedFeedback)
      : [];

  });


  // Submit feedback
  const handleSubmit = (e) => {

    e.preventDefault();

    // Validation
    if (rating === 0) {
      alert("Please select a rating.");
      return;
    }

    if (message.trim() === "") {
      alert("Please write your feedback.");
      return;
    }


    // Create feedback object
    const newFeedback = {
      id: Date.now(),
      rating: rating,
      message: message,
      date: new Date().toLocaleDateString()
    };


    // Add feedback to list
    const updatedFeedback = [
      ...feedbackList,
      newFeedback
    ];

    setFeedbackList(updatedFeedback);


    // Save to Local Storage
    localStorage.setItem(
      "campusFixFeedback",
      JSON.stringify(updatedFeedback)
    );


    // Clear form
    setRating(0);
    setMessage("");

    alert("Thank you for your feedback! ❤️");

  };


  return (
    <div className="feedback-page">

      {/* Header */}
      <div className="page-header">

        <div>

          <h1>
            Share Your Feedback 💬
          </h1>

          <p>
            Help us make CampusFix better.
          </p>

        </div>

      </div>


      {/* Feedback Form */}
      <div className="feedback-card">

        <form onSubmit={handleSubmit}>

          {/* Rating */}
          <div className="rating-section">

            <h2>
              How was your CampusFix experience?
            </h2>

            <p>
              Select a rating from 1 to 5.
            </p>


            <div className="stars">

              {[1, 2, 3, 4, 5].map((star) => (

                <button
                  type="button"
                  key={star}
                  className={
                    star <= rating
                      ? "star active-star"
                      : "star"
                  }
                  onClick={() => setRating(star)}
                >
                  ★
                </button>

              ))}

            </div>


            {rating > 0 && (

              <p className="rating-text">

                {rating === 1 && "Very Poor 😞"}

                {rating === 2 && "Poor 😕"}

                {rating === 3 && "Average 😐"}

                {rating === 4 && "Good 🙂"}

                {rating === 5 && "Excellent! 🤩"}

              </p>

            )}

          </div>


          {/* Message */}
          <div className="form-group">

            <label>
              Your Feedback
            </label>

            <textarea
              rows="6"
              placeholder="Tell us about your experience..."
              value={message}
              onChange={(e) =>
                setMessage(e.target.value)
              }
            ></textarea>

          </div>


          {/* Submit */}
          <button
            type="submit"
            className="submit-btn"
          >
            Submit Feedback
          </button>

        </form>

      </div>


      {/* Previous Feedback */}
      {feedbackList.length > 0 && (

        <div className="previous-feedback">

          <h2>
            Your Previous Feedback
          </h2>


          {feedbackList.map((feedback) => (

            <div
              className="feedback-item"
              key={feedback.id}
            >

              <div className="feedback-rating">

                {"★".repeat(feedback.rating)}

                {"☆".repeat(5 - feedback.rating)}

              </div>


              <p>
                {feedback.message}
              </p>


              <small>
                Submitted on {feedback.date}
              </small>

            </div>

          ))}

        </div>

      )}

    </div>
  );
}

export default Feedback;