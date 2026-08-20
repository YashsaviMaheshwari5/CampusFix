function ComplaintDetails({ complaint, onBack }) {

  // Safety check
  if (!complaint) {
    return (
      <div className="details-page">
        <h2>Complaint not found.</h2>

        <button
          className="submit-btn"
          onClick={onBack}
        >
          ← Back
        </button>
      </div>
    );
  }


  // Timeline based on complaint status
  const timeline = [
    {
      title: "Complaint Submitted",
      description: "Your complaint has been successfully submitted.",
      completed: true
    },
    {
      title: "Complaint Under Review",
      description: "The complaint is being reviewed by the campus team.",
      completed:
        complaint.status === "In Progress" ||
        complaint.status === "Resolved"
    },
    {
      title: "Issue Being Handled",
      description: "The responsible team is working on the issue.",
      completed:
        complaint.status === "In Progress" ||
        complaint.status === "Resolved"
    },
    {
      title: "Issue Resolved",
      description: "The issue has been successfully resolved.",
      completed: complaint.status === "Resolved"
    }
  ];


  return (
    <div className="details-page">

      {/* ==================================
          BACK BUTTON
      ================================== */}

      <button
        className="back-btn"
        onClick={onBack}
      >
        ← Back to Complaints
      </button>


      {/* ==================================
          HEADER
      ================================== */}

      <div className="details-header">

        <div>

          <span className="dashboard-label">
            COMPLAINT DETAILS
          </span>

          <h1>
            {complaint.title}
          </h1>

          <p>
            📍 {complaint.location}
          </p>

        </div>


        {/* Status */}

        <span
          className={
            complaint.status === "Resolved"
              ? "resolved-badge"
              : complaint.status === "Pending"
              ? "pending-badge"
              : "progress-badge"
          }
        >
          {complaint.status}
        </span>

      </div>


      {/* ==================================
          DETAILS GRID
      ================================== */}

      <div className="details-grid">

        {/* Main Information */}

        <div className="details-main">

          {/* Description */}

          <div className="details-card">

            <h2>
              Description
            </h2>

            <p className="description-text">
              {complaint.description}
            </p>

          </div>


          {/* Timeline */}

          <div className="details-card">

            <h2>
              Complaint Timeline
            </h2>

            <div className="timeline">

              {timeline.map((item, index) => (

                <div
                  className="timeline-item"
                  key={index}
                >

                  <div
                    className={
                      item.completed
                        ? "timeline-dot completed"
                        : "timeline-dot"
                    }
                  >
                    {item.completed ? "✓" : ""}
                  </div>


                  <div className="timeline-content">

                    <h3>
                      {item.title}
                    </h3>

                    <p>
                      {item.description}
                    </p>

                  </div>

                </div>

              ))}

            </div>

          </div>

        </div>


        {/* Side Information */}

        <div className="details-side">

          <div className="details-card">

            <h2>
              Complaint Information
            </h2>


            <div className="detail-row">

              <span>
                Category
              </span>

              <strong>
                {complaint.category || "Maintenance"}
              </strong>

            </div>


            <div className="detail-row">

              <span>
                Priority
              </span>

              <strong>
                {complaint.priority}
              </strong>

            </div>


            <div className="detail-row">

              <span>
                Status
              </span>

              <strong>
                {complaint.status}
              </strong>

            </div>


            <div className="detail-row">

              <span>
                Location
              </span>

              <strong>
                {complaint.location}
              </strong>

            </div>

          </div>


          {/* Help card */}

          <div className="details-help">

            <div className="info-icon">
              💡
            </div>

            <h3>
              Need more help?
            </h3>

            <p>
              If the issue has not been resolved,
              please contact the campus administration.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default ComplaintDetails;