import { useState, useRef } from "react";
import {
  PlusCircle,
  Trash2,
  Upload,
  Sparkles,
  Loader2,
  Eye,
  RefreshCw,
  Save,
} from "lucide-react";

export default function PageContent({ user_id }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const formRef = useRef(null);

  // List of categories
  const categories = [
    "placement",
    "online_course_certification",
    "skill_training_programme",
    "bit_gurgulam",
    "event",
    "other",
  ];

  // State for the current entry
  const [entry, setEntry] = useState({
    id: Date.now(),
    category: "",
    image: null,
    imageBlob: null,
    title: "",
    content: "",
    formData: {},
  });

  // Field configurations for each category
  const categoryFields = {
    placement: [
      // Company Details
      {
        name: "company_name",
        label: "Company Name",
        type: "text",
        required: true,
      },
      {
        name: "job_role",
        label: "Job Role Offered",
        type: "text",
        required: true,
      },
      { name: "drive_date", label: "Drive Date", type: "date", required: true },
      {
        name: "result_announced",
        label: "Results Announced On",
        type: "date",
        required: true,
      },
      {
        name: "salary_package",
        label: "Salary Package (LPA)",
        type: "number",
        required: true,
      },
      {
        name: "internship_starting_date",
        label: "Internship Start Date",
        type: "date",
        required: false,
      },
      {
        name: "fulltime_joining_date",
        label: "Full-Time Joining Date",
        type: "date",
        required: false,
      },
      {
        name: "organized_by",
        label: "Organized By",
        type: "text",
        required: true,
      },

      // Selection Process
      {
        name: "round_type",
        label: "Round Type",
        type: "checkbox",
        options: [
          "Technical Test",
          "GD",
          "Technical Interview",
          "HR Interview",
        ],
        required: true,
      },
      {
        name: "process_description",
        label: "Selection Process Description",
        type: "textarea",
        required: true,
      },
      {
        name: "skills_assessed",
        label: "Skills Assessed",
        type: "text",
        required: true,
      },

      // Selected Students (Repeater)
      {
        name: "selected_students",
        label: "Selected Students",
        type: "repeater",
        fields: [
          {
            name: "student_name",
            label: "Student Name",
            type: "text",
            required: true,
          },
          { name: "roll_no", label: "Roll No", type: "text", required: true },
          {
            name: "department",
            label: "Department",
            type: "text",
            required: true,
          },
          { name: "year", label: "Year", type: "text", required: true },
          {
            name: "selection_type",
            label: "Internship/FTE",
            type: "dropdown",
            options: ["Intern", "FTE", "Intern → FTE"],
            required: true,
          },
        ],
      },

      // Remarks
      { name: "remarks", label: "Remarks", type: "textarea", required: false },
    ],
    online_course_certification: [
      { name: "staff_name", label: "Staff Name", type: "text", required: true },
      {
        name: "qualified",
        label: "Qualified",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
      {
        name: "completion_status",
        label: "Completion Status",
        type: "radio",
        options: ["Completed", "In Progress"],
        required: true,
      },
      {
        name: "course_name",
        label: "Course Name",
        type: "text",
        required: true,
      },
      { name: "score", label: "Score", type: "text", required: true },
      {
        name: "certification_category",
        label: "Certification Category",
        type: "text",
        required: true,
      },
      {
        name: "month_received",
        label: "Month Received",
        type: "month",
        required: true,
      },
      // Remarks
      { name: "remarks", label: "Remarks", type: "textarea", required: false },
    ],
    skill_training_programme: [
      {
        name: "time_of_day",
        label: "Day or Night",
        type: "radio",
        options: ["Day", "Night"],
        required: true,
      },
      {
        name: "departments",
        label: "Departments",
        type: "text",
        required: true,
      },
      { name: "skill_name", label: "Skill Name", type: "text", required: true },
      {
        name: "no_of_students",
        label: "Number of Students",
        type: "number",
        required: true,
      },
      {
        name: "no_of_venue",
        label: "Number of Venues",
        type: "number",
        required: true,
      },
      // Remarks
      { name: "remarks", label: "Remarks", type: "textarea", required: false },
    ],
    bit_gurgulam: [
      // Core Details
      {
        name: "program_type",
        label: "Program Type",
        type: "dropdown",
        options: [
          "Assembly & Dismantling",
          "Prototype Modeling",
          "PLC",
          "Electronics",
          "IoT",
          "Robotics",
          "Mechanical",
          "Other",
        ],
        required: true,
      },
      { name: "date", label: "Date", type: "date", required: true },
      {
        name: "total_attendees",
        label: "Total Attendees",
        type: "number",
        required: true,
      },
      {
        name: "departments",
        label: "Department(s)",
        type: "checkbox",
        options: ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "AUTO", "Other"],
        required: true,
      },
      {
        name: "academic_year",
        label: "Academic Year",
        type: "dropdown",
        options: ["I-year", "II-year", "III-year", "IV-year", "Mixed"],
        required: true,
      },

      // Organizers & Trainers (Repeater Section)
      {
        name: "organizers",
        label: "Organizers & Trainers",
        type: "repeater",
        fields: [
          {
            name: "role",
            label: "Role",
            type: "dropdown",
            options: ["Trainer", "Coordinator", "HOD"],
            required: true,
          },
          { name: "name", label: "Name", type: "text", required: true },
          {
            name: "designation",
            label: "Designation",
            type: "text",
            required: true,
          },
          {
            name: "department",
            label: "Department",
            type: "dropdown",
            options: [
              "CSE",
              "ECE",
              "EEE",
              "MECH",
              "CIVIL",
              "IT",
              "AUTO",
              "Other",
            ],
            required: true,
          },
        ],
      },

      // Training Content & Activities (Repeater Section)
      {
        name: "training_content",
        label: "Training Content & Activities",
        type: "repeater",
        fields: [
          {
            name: "skill_taught",
            label: "Skill Taught",
            type: "text",
            required: true,
          },
          {
            name: "tools_used",
            label: "Tools Used",
            type: "text",
            required: true,
          },
          {
            name: "key_topics",
            label: "Key Topics Covered",
            type: "textarea",
            required: true,
          },
          {
            name: "safety_measures",
            label: "Safety Measures",
            type: "text",
            required: false,
          },
        ],
      },

      // Output & Outcomes
      {
        name: "prototypes",
        label: "Prototypes/Creations",
        type: "text",
        required: true,
      },
      { name: "remarks", label: "Remarks", type: "textarea", required: false },
    ],
    event: [
      // Core Event Details
      { name: "event_name", label: "Event Name", type: "text", required: true },
      {
        name: "event_type",
        label: "Event Type",
        type: "dropdown",
        options: [
          "Sports Day",
          "Hackathon",
          "Seminar",
          "Workshop",
          "Cultural Fest",
        ],
        required: true,
      },
      { name: "date", label: "Date", type: "date", required: true },
      { name: "venue", label: "Venue", type: "text", required: true },
      {
        name: "organizing_department",
        label: "Organizing Department",
        type: "dropdown",
        options: [
          "CSE",
          "ECE",
          "EEE",
          "CIVIL",
          "MECH",
          "Sports",
          "Cultural",
          "Other",
        ],
        required: true,
      },

      // Dignitaries & Organizers (Repeater Section)
      {
        name: "dignitaries",
        label: "Dignitaries & Organizers",
        type: "repeater",
        fields: [
          {
            name: "role",
            label: "Role",
            type: "dropdown",
            options: [
              "Chief Guest",
              "Guest of Honor",
              "Principal",
              "HOD",
              "Coordinator",
              "Judge",
              "Speaker",
            ],
            required: true,
          },
          { name: "name", label: "Name", type: "text", required: true },
          {
            name: "organization",
            label: "Organization",
            type: "text",
            required: true,
          },
        ],
      },

      // Participant/Award Details (Repeater Section)
      {
        name: "awards",
        label: "Participant/Award Details",
        type: "repeater",
        fields: [
          {
            name: "award_category",
            label: "Award/Category",
            type: "text",
            required: true,
          },
          { name: "winners", label: "Winner(s)", type: "text", required: true },
          {
            name: "year_team",
            label: "Year/Team",
            type: "dropdown",
            options: [
              "I-year",
              "II-year",
              "III-year",
              "IV-year",
              "Team-A",
              "Team-B",
              "Team-C",
              "Other",
            ],
            required: true,
          },
          {
            name: "id_roll_number",
            label: "ID/Roll Number",
            type: "text",
            required: false,
          },
          {
            name: "prize_details",
            label: "Prize Details",
            type: "text",
            required: false,
          },
        ],
      },

      // Program Flow (Repeater Section)
      {
        name: "program_flow",
        label: "Program Flow",
        type: "repeater",
        fields: [
          { name: "activity", label: "Activity", type: "text", required: true },
          {
            name: "speaker_participant",
            label: "Speaker/Participant",
            type: "text",
            required: true,
          },
        ],
      },

      // Additional Fields
      { name: "remarks", label: "Remarks", type: "textarea", required: false },
    ],
    other: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "content", label: "Content", type: "textarea", required: true },
    ],
  };

  // Handle category selection
  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setEntry({
      ...entry,
      category,
      formData: {},
      title: "",
      content: "",
    });
    setShowPreview(false);
  };

  // Handle form field changes
  const handleFieldChange = (field, value) => {
    setEntry({
      ...entry,
      formData: {
        ...entry.formData,
        [field]: value,
      },
    });
  };

  // Handle repeater field changes
  const handleRepeaterFieldChange = (repeaterName, index, fieldName, value) => {
    const currentRepeaterData = entry.formData[repeaterName] || [];
    const updatedRepeaterData = [...currentRepeaterData];

    if (!updatedRepeaterData[index]) {
      updatedRepeaterData[index] = {};
    }

    updatedRepeaterData[index][fieldName] = value;

    handleFieldChange(repeaterName, updatedRepeaterData);
  };

  // Add new item to repeater
  const addRepeaterItem = (repeaterName) => {
    const currentRepeaterData = entry.formData[repeaterName] || [];
    handleFieldChange(repeaterName, [...currentRepeaterData, {}]);
  };

  // Remove item from repeater
  const removeRepeaterItem = (repeaterName, index) => {
    const currentRepeaterData = entry.formData[repeaterName] || [];
    const updatedRepeaterData = currentRepeaterData.filter(
      (_, i) => i !== index
    );
    handleFieldChange(repeaterName, updatedRepeaterData);
  };

  // Handle checkbox changes
  const handleCheckboxChange = (field, option) => {
    const currentOptions = entry.formData[field] || [];
    let newOptions;

    if (currentOptions.includes(option)) {
      newOptions = currentOptions.filter((item) => item !== option);
    } else {
      newOptions = [...currentOptions, option];
    }

    handleFieldChange(field, newOptions);
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }

    const url = URL.createObjectURL(file);
    setEntry({
      ...entry,
      image: {
        name: file.name,
        url,
        path: file.name,
      },
      imageBlob: file,
    });
    setError(null);
  };

  // Generate content via API
  const generateAIContent = async () => {
    if (!entry.category) {
      setError("Please select a category first");
      return;
    }

    setGeneratingContent(true);
    setError(null);

    try {
      // Prepare the payload - send all form data to backend
      const payload = {
        category: entry.category,
        formData: entry.formData,
      };

      // Call the API with all the form data
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: payload,
        }),
      });
      console.log(response);
      if (!response.ok) {
        let errorText = "";
        try {
          const errorData = await response.json();
          errorText = JSON.stringify(errorData);
        } catch (e) {
          errorText = await response.text();
        }
        throw new Error(`Server error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log(data);

      // Backend should return data with title and content fields
      if (data && data.title && data.content) {
        setEntry({
          ...entry,
          title: data.title,
          content: data.content,
        });

        setShowPreview(true);
      } else {
        throw new Error("Invalid response format from AI service");
      }
    } catch (error) {
      console.error("Error generating content:", error);
      setError(`Failed to generate content: ${error.message}`);
    } finally {
      setGeneratingContent(false);
    }
  };

  // Handle save to database
  const handleSaveToDatabase = async () => {
    setSaveStatus({ loading: true });

    try {
      const formData = new FormData();
      formData.append("uploaded_by", user_id);

      // Create the entry data object with all required fields
      const entryData = {
        category: entry.category,
        title: entry.title,
        content: entry.content,
        form_data: entry.formData,
        has_image: !!entry.imageBlob,
        image_index: entry.imageBlob ? 0 : null,
      };

      // Append entries as a JSON string array - using the correct "entries" key (plural)
      formData.append("entries", JSON.stringify([entryData]));

      // If there's an image, append it with the appropriate key (image_0)
      if (entry.imageBlob) {
        formData.append(
          "image_0",
          entry.imageBlob,
          entry.image?.name || "image.jpg"
        );
      }

      // Debug: log FormData entries to help with troubleshooting
      for (let [key, value] of formData.entries()) {
        console.log(
          "FormData:",
          key,
          typeof value === "string" ? value : `[${value.constructor.name}]`
        );
      }

      const response = await fetch("/api/db/mysql/upload", {
        method: "POST",
        body: formData, // Don't set Content-Type header - browser handles this
      });

      // Handle non-OK responses
      if (!response.ok) {
        let errorText = "";
        try {
          const errorData = await response.json();
          errorText = JSON.stringify(errorData);
        } catch (e) {
          errorText = await response.text();
        }
        throw new Error(`Server error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      console.log("Server response:", result);

      setSaveStatus(result);

      // Reset form after successful submission
      if (result.success) {
        setTimeout(() => {
          setEntry({
            id: Date.now(),
            category: "",
            image: null,
            imageBlob: null,
            title: "",
            content: "",
            formData: {},
          });
          setShowPreview(false);
          setSaveStatus(null);
        }, 3000);
      }
    } catch (error) {
      console.error("Error saving to database:", error);
      setSaveStatus({
        success: false,
        message: `Error: ${error.message}`,
      });
    }
  };

  // Render form fields based on selected category
  const renderFormFields = () => {
    if (!entry.category) return null;

    const fields = categoryFields[entry.category];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div
            key={field.name}
            className={`mb-4 ${
              field.type === "textarea" ? "col-span-1 md:col-span-2" : ""
            }`}
          >
            <label className="block text-sm font-medium mb-1 text-gray-700">
              {field.label}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </label>

            {field.type === "checkbox" && (
              <div className="space-y-2">
                {field.options.map((option) => (
                  <div key={option} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`${field.name}-${option}`}
                      checked={(entry.formData[field.name] || []).includes(
                        option
                      )}
                      onChange={() => handleCheckboxChange(field.name, option)}
                      className="mr-2"
                    />
                    <label htmlFor={`${field.name}-${option}`}>{option}</label>
                  </div>
                ))}
              </div>
            )}

            {field.type === "radio" && (
              <div className="flex space-x-4">
                {field.options.map((option) => (
                  <div key={option} className="flex items-center">
                    <input
                      type="radio"
                      id={`${field.name}-${option}`}
                      name={field.name}
                      value={option}
                      checked={entry.formData[field.name] === option}
                      onChange={() => handleFieldChange(field.name, option)}
                      className="mr-2"
                    />
                    <label htmlFor={`${field.name}-${option}`}>{option}</label>
                  </div>
                ))}
              </div>
            )}

            {field.type === "dropdown" && (
              <select
                value={entry.formData[field.name] || ""}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-black"
                required={field.required}
              >
                <option value="" disabled>
                  Select {field.label}
                </option>
                {field.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}

            {field.type === "textarea" && (
              <textarea
                value={entry.formData[field.name] || ""}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-black min-h-[100px]"
                required={field.required}
              />
            )}

            {field.type === "repeater" && (
              <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                {(entry.formData[field.name] || []).map((item, index) => (
                  <div
                    key={index}
                    className="mb-4 pb-4 border-b last:border-b-0 border-gray-200"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">
                        {field.label} #{index + 1}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeRepeaterItem(field.name, index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {field.fields.map((subField) => (
                        <div key={subField.name} className="mb-2">
                          <label className="block text-sm font-medium mb-1 text-gray-700">
                            {subField.label}{" "}
                            {subField.required && (
                              <span className="text-red-500">*</span>
                            )}
                          </label>

                          {subField.type === "dropdown" && (
                            <select
                              value={item[subField.name] || ""}
                              onChange={(e) =>
                                handleRepeaterFieldChange(
                                  field.name,
                                  index,
                                  subField.name,
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-black"
                              required={subField.required}
                            >
                              <option value="" disabled>
                                Select {subField.label}
                              </option>
                              {subField.options.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          )}

                          {subField.type === "textarea" && (
                            <textarea
                              value={item[subField.name] || ""}
                              onChange={(e) =>
                                handleRepeaterFieldChange(
                                  field.name,
                                  index,
                                  subField.name,
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-black min-h-[100px]"
                              required={subField.required}
                            />
                          )}

                          {["text", "date", "time", "url", "number"].includes(
                            subField.type
                          ) && (
                            <input
                              type={subField.type}
                              value={item[subField.name] || ""}
                              onChange={(e) =>
                                handleRepeaterFieldChange(
                                  field.name,
                                  index,
                                  subField.name,
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-black"
                              required={subField.required}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addRepeaterItem(field.name)}
                  className="flex items-center text-blue-600 hover:text-blue-800 mt-2"
                >
                  <PlusCircle size={16} className="mr-1" />
                  Add {field.label}
                </button>
              </div>
            )}

            {![
              "checkbox",
              "radio",
              "textarea",
              "dropdown",
              "repeater",
            ].includes(field.type) && (
              <input
                type={field.type}
                value={entry.formData[field.name] || ""}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-black"
                required={field.required}
              />
            )}
          </div>
        ))}

        {/* Image upload for all categories */}
        <div className="col-span-1 md:col-span-2 mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Image{" "}
            {entry.category === "event" ? "(Max: 2)" : "(Optional, Max: 1)"}
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center h-48 flex flex-col items-center justify-center">
            {entry.image ? (
              <div className="relative w-full h-full">
                <img
                  src={entry.image.url || "/placeholder.svg"}
                  alt={entry.image.name}
                  className="max-w-full max-h-full object-contain mx-auto"
                />
                <button
                  type="button"
                  onClick={() =>
                    setEntry({ ...entry, image: null, imageBlob: null })
                  }
                  className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full"
                  aria-label="Remove image"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center">
                <Upload className="w-10 h-10 text-gray-400 mb-2" />
                <span className="text-gray-500">Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render preview section
  const renderPreview = () => {
    if (!showPreview) return null;

    return (
      <div className="mt-8 border border-gray-300 rounded-lg p-6 bg-gray-50">
        <h3 className="text-xl font-semibold mb-4 text-purple-800 flex items-center">
          <Eye size={20} className="mr-2" />
          Preview
        </h3>

        <div className="space-y-4">
          <div>
            <h4 className="text-lg font-medium mb-1 text-gray-700">Title</h4>
            <p className="p-3 bg-white border border-gray-200 rounded">
              {entry.title}
            </p>
          </div>

          {entry.image && (
            <div>
              <h4 className="text-lg font-medium mb-1 text-gray-700">Image</h4>
              <div className="p-3 bg-white border border-gray-200 rounded flex justify-center">
                <img
                  src={entry.image.url}
                  alt={entry.title}
                  className="max-h-48 object-contain"
                />
              </div>
            </div>
          )}

          <div>
            <h4 className="text-lg font-medium mb-1 text-gray-700">Content</h4>
            <div className="p-3 bg-white border border-gray-200 rounded prose max-w-none">
              {entry.content.split("\n").map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center space-x-4">
          <button
            type="button"
            onClick={generateAIContent}
            className="btn"
            disabled={generatingContent}
          >
            {generatingContent ? (
              <>
                <span className="loading-spinner"></span>
                Generating...
              </>
            ) : (
              <>
                <span className="mr-2">✨</span>
                Generate with AI
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSaveToDatabase}
            className="btn"
            disabled={saveStatus?.loading}
          >
            Submit
          </button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div className="loading-spinner"></div>;
  }

  return (
    <div className="p-6 w-full bg-white text-black min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-purple-800 text-center">
        BitSathy Daily News
      </h1>

      {user_id && (
        <h2 className="text-lg mb-4 text-gray-700 text-center">
          User ID: {user_id}
        </h2>
      )}

      {error && (
        <div className="flex justify-center">
          <p className="text-red-600 mb-4 p-2 bg-red-100 rounded inline-block">
            {error}
          </p>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Category Selection */}
        <div className="mb-6">
          <label className="block text-lg font-medium mb-2 text-gray-700">
            Select Category <span className="text-red-500">*</span>
          </label>
          <select
            value={entry.category}
            onChange={handleCategoryChange}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-black"
            required
          >
            <option value="" disabled>
              Choose a category
            </option>
            <option value="placement">Placement</option>
            <option value="online_course_certification">
              Online Course Certification
            </option>
            <option value="skill_training_programme">
              Skill Training Programme
            </option>
            <option value="bit_gurgulam">BIT Gurgulam</option>
            <option value="event">Event</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Dynamic form fields based on category */}
        {entry.category && (
          <div className="card border border-gray-300 rounded-lg p-6 relative shadow-sm mb-6">
            <h3 className="text-xl font-semibold mb-4 text-purple-800">
              {entry.category
                .replace(/_/g, " ")
                .split(" ")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")}{" "}
              Details
            </h3>

            {renderFormFields()}

            {/* Generate button */}
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={generateAIContent}
                className="btn"
                disabled={generatingContent}
              >
                {generatingContent ? (
                  <>
                    <span className="loading-spinner"></span>
                    Generating...
                  </>
                ) : (
                  <>
                    <span className="mr-2">✨</span>
                    Generate with AI
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Preview section */}
        {renderPreview()}

        {/* Status message */}
        {saveStatus && !saveStatus.loading && (
          <div className="mt-4 p-3 rounded text-center">
            <div
              className={`p-3 rounded ${
                saveStatus.success
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {saveStatus.message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
