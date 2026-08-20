import { useState } from "react";

function ReportIssue({ setComplaints }) {

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("");

  const [loading, setLoading] = useState(false);


  const handleSubmit = async (e) => {

    e.preventDefault();

    if (
      title.trim() === "" ||
      category === "" ||
      location.trim() === "" ||
      description.trim() === "" ||
      priority === ""
    ) {
      alert("Please fill all the fields.");
      return;
    }

    try {

      setLoading(true);

      const complaintData = {
        title: title.trim(),
        category,
        location: location.trim(),
        description: description.trim(),
        priority,
        status: "Pending"
      };


      const response = await fetch(
        "https://jsonplaceholder.typicode.com/posts",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify(complaintData)
        }
      );


      if (!response.ok) {
        throw new Error("Failed to submit complaint.");
      }


      const data = await response.json();

      console.log("Complaint API Response:", data);


      const newComplaint = {
        ...complaintData,
        id: data.id
      };


      setComplaints((previousComplaints) => [
        ...previousComplaints,
        newComplaint
      ]);


      alert("Complaint submitted successfully! 🎉");


      // Clear form

      setTitle("");
      setCategory("");
      setLocation("");
      setDescription("");
      setPriority("");

    } catch (error) {

      console.error(error);

      alert(
        "Unable to submit complaint. Please try again."
      );

    } finally {

      setLoading(false);

    }

  };


  return (
    <div className="report-page">

      {/* ==================================
          HEADER
      ================================== */}

      <div className="report-header">

        <div>

          <span className="dashboard-label">
            CAMPUSFIX
          </span>

          <h1>
            Report an Issue 📝
          </h1>

          <p>
            Tell us what's wrong and we'll help
            get it resolved.
          </p>

        </div>

      </div>


      {/* ==================================
          FORM
      ================================== */}

      <div className="report-layout">

        <div className="report-card">

          <div className="report-card-header">

            <div>

              <h2>
                Issue Details
              </h2>

              <p>
                Please provide accurate information
                about the problem.
              </p>

            </div>

            <span className="required-text">
              * Required
            </span>

          </div>


          <form onSubmit={handleSubmit}>

            {/* Title */}

            <div className="form-group">

              <label>
                Issue Title <span>*</span>
              </label>

              <input
                type="text"
                placeholder="Example: AC not working in Room 204"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
              />

            </div>


            {/* Category */}

            <div className="form-row">

              <div className="form-group">

                <label>
                  Category <span>*</span>
                </label>

                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value)
                  }
                >

                  <option value="">
                    Select category
                  </option>

                  <option value="Maintenance">
                    🔧 Maintenance
                  </option>

                  <option value="Cleanliness">
                    🧹 Cleanliness
                  </option>

                  <option value="Electricity">
                    ⚡ Electricity
                  </option>

                  <option value="Internet">
                    📶 Internet / Wi-Fi
                  </option>

                  <option value="Water">
                    💧 Water Supply
                  </option>

                  <option value="Other">
                    📋 Other
                  </option>

                </select>

              </div>


              {/* Priority */}

              <div className="form-group">

                <label>
                  Priority <span>*</span>
                </label>

                <select
                  value={priority}
                  onChange={(e) =>
                    setPriority(e.target.value)
                  }
                >

                  <option value="">
                    Select priority
                  </option>

                  <option value="Low">
                    🟢 Low
                  </option>

                  <option value="Medium">
                    🟡 Medium
                  </option>

                  <option value="High">
                    🔴 High
                  </option>

                </select>

              </div>

            </div>


            {/* Location */}

            <div className="form-group">

              <label>
                Location <span>*</span>
              </label>

              <input
                type="text"
                placeholder="Example: Hostel Block A, Room 204"
                value={location}
                onChange={(e) =>
                  setLocation(e.target.value)
                }
              />

            </div>


            {/* Description */}

            <div className="form-group">

              <label>
                Description <span>*</span>
              </label>

              <textarea
                rows="6"
                placeholder="Describe the issue in detail. Include anything that might help us understand the problem..."
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
              ></textarea>

              <small className="input-help">
                Please provide as much detail as possible.
              </small>

            </div>


            {/* Submit */}

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


        {/* ==================================
            SIDE INFORMATION
        ================================== */}

        <div className="report-info">

          <div className="info-card">

            <div className="info-icon">
              💡
            </div>

            <h3>
              Before you submit
            </h3>

            <ul>

              <li>
                Make sure the location is correct.
              </li>

              <li>
                Give a clear description.
              </li>

              <li>
                Select the correct category.
              </li>

              <li>
                Use High priority only for urgent issues.
              </li>

            </ul>

          </div>


          <div className="info-card">

            <div className="info-icon">
              🔒
            </div>

            <h3>
              Your complaint is safe
            </h3>

            <p>
              Your complaint information is securely
              handled by CampusFix.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default ReportIssue;