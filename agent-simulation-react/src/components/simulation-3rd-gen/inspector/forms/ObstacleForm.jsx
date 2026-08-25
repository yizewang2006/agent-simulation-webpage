import { useEffect, useRef, useState } from "react";
import { Check, CirclePlus, CopyPlus, Trash2, X } from "lucide-react";
import { FORM_MODES } from "../modeConstants.js";
import styles from "../../../../styles/3rd-gen/simulation.module.css";

// Start Polygon mode with a simple rectangle.
const DEFAULT_POLYGON_VERTICES = [
  { x: "180", y: "220" },
  { x: "320", y: "220" },
  { x: "320", y: "280" },
  { x: "180", y: "280" },
];

export default function ObstacleForm({
  mode = FORM_MODES.CREATE,
  initialValues,
  onUpdatePreview,
  onClearPreview,
  onSubmit,
  onCancel,
}) {
  const [shape, setShape] = useState(initialValues?.shape ?? "circle");
  const [name, setName] = useState(initialValues?.name ?? "");
  const [color, setColor] = useState(initialValues?.color ?? "#999999");
  const [centerX, setCenterX] = useState(initialValues?.centerX ?? "250");
  const [centerY, setCenterY] = useState(initialValues?.centerY ?? "250");
  const [radius, setRadius] = useState(initialValues?.radius ?? "50");
  const [vertices, setVertices] = useState(
    initialValues?.vertices ?? DEFAULT_POLYGON_VERTICES
  );
  const [formError, setFormError] = useState("");
  const updatePreviewFunctionRef = useRef(onUpdatePreview);
  const clearPreviewFunctionRef = useRef(onClearPreview);
  const liveVerticesKey = initialValues?.vertices
    ? JSON.stringify(initialValues.vertices)
    : "";

  // Keep callback changes separate from field changes.
  useEffect(() => {
    updatePreviewFunctionRef.current = onUpdatePreview;
  }, [onUpdatePreview]);

  useEffect(() => {
    clearPreviewFunctionRef.current = onClearPreview;
  }, [onClearPreview]);

  // Keep position controls connected to live Canvas dragging without replacing
  // unrelated unsaved edits such as the obstacle name, color, or radius.
  useEffect(() => {
    if (mode !== FORM_MODES.EDIT || shape !== "circle") return;

    setCenterX((currentCenterX) => initialValues?.centerX ?? currentCenterX);
    setCenterY((currentCenterY) => initialValues?.centerY ?? currentCenterY);
  }, [mode, shape, initialValues?.centerX, initialValues?.centerY]);

  useEffect(() => {
    if (mode !== FORM_MODES.EDIT || shape !== "polygon" || !liveVerticesKey) return;

    setVertices(JSON.parse(liveVerticesKey));
  }, [mode, shape, liveVerticesKey]);

  // Remove the draft when this form closes.
  useEffect(() => {
    return () => clearPreviewFunctionRef.current?.();
  }, []);

  // Send the current fields to the canvas preview.
  useEffect(() => {
    if (mode !== FORM_MODES.CREATE) return;

    updatePreviewFunctionRef.current?.({
      shape,
      name,
      color,
      centerX,
      centerY,
      radius,
      vertices,
    });
  }, [mode, shape, color, centerX, centerY, radius, vertices]);

  // Change one coordinate without rebuilding the other vertices.
  function updateVertex(index, field, value) {
    setVertices((currentVertices) =>
      currentVertices.map((vertex, vertexIndex) =>
        vertexIndex === index ? { ...vertex, [field]: value } : vertex
      )
    );
  }

  // Continue from the last point so the new vertex is easy to find.
  function addVertex() {
    const lastVertex = vertices.at(-1) ?? { x: "250", y: "250" };
    setVertices((currentVertices) => [
      ...currentVertices,
      {
        x: String(Math.min(500, Number(lastVertex.x) + 20 || 250)),
        y: String(Math.min(500, Number(lastVertex.y) + 20 || 250)),
      },
    ]);
  }

  function deleteVertex(index) {
    if (vertices.length <= 3) return;
    setVertices((currentVertices) =>
      currentVertices.filter((_, vertexIndex) => vertexIndex !== index)
    );
  }

  const shapeLabel = shape === "circle" ? "Circle" : "Polygon";
  const isEditing = mode === FORM_MODES.EDIT;

  function getCurrentValues() {
    return {
      shape,
      name,
      color,
      centerX,
      centerY,
      radius,
      vertices,
    };
  }

  function submitForm(event) {
    event.preventDefault();

    // Submit directly; refs are only needed by the automatic preview effects.
    const result = onSubmit?.(getCurrentValues());
    if (result && !result.ok) {
      setFormError(result.error);
    }
  }

  return (
    <div className={styles.inspectorFormViewport}>
      <form
        className={styles.inspectorForm}
        onSubmit={submitForm}
      >
        <div className={styles.formIntroduction}>
          <h3 className={styles.formTitle}>
            {isEditing ? "Edit" : "Add"} {shapeLabel} Obstacle
          </h3>
          <p className={styles.formDescription}>
            {isEditing
              ? "Update this obstacle without changing its shape."
              : shape === "circle"
              ? "Place and configure a circular obstacle."
              : "Define the vertices of a polygon obstacle."}
          </p>
        </div>

        <fieldset className={styles.formSection}>
          <legend className={styles.formSectionTitle}>Shape</legend>
          <div
            className={styles.formRadioGroup}
            role="radiogroup"
            aria-label="Obstacle shape"
          >
            {["circle", "polygon"].map((shapeOption) => (
              <label className={styles.formRadioOption} key={shapeOption}>
                <input
                  type="radio"
                  name="obstacle-shape"
                  value={shapeOption}
                  checked={shape === shapeOption}
                  disabled={isEditing}
                  onChange={(event) => setShape(event.target.value)}
                />
                {shapeOption === "circle" ? "Circle" : "Polygon"}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.formSection}>
          <legend className={styles.formSectionTitle}>General</legend>
          <div className={styles.inputGroup}>
            <label className={styles.formLabel} htmlFor="obstacle-name">
              Obstacle Name
            </label>
            <input
              id="obstacle-name"
              className={styles.formInput}
              type="text"
              value={name}
              placeholder={`e.g. ${shapeLabel}_Obstacle_1`}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.formLabel} htmlFor="obstacle-color">
              Color
            </label>
            <div className={styles.formColorControl}>
              <input
                id="obstacle-color"
                className={styles.formColorInput}
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
              />
              <span className={styles.formColorValue}>
                {color.toUpperCase()}
              </span>
            </div>
          </div>
        </fieldset>

        {/* Each shape keeps its own fields while the user switches between them. */}
        {shape === "circle" ? (
          <>
            <fieldset className={styles.formSection}>
              <legend className={styles.formSectionTitle}>Position</legend>
              <div className={styles.formFieldRow}>
                <div className={styles.inputGroup}>
                  <label className={styles.formLabel} htmlFor="circle-center-x">
                    Center X
                  </label>
                  <input
                    id="circle-center-x"
                    className={styles.formInput}
                    type="number"
                    min="0"
                    max="500"
                    step="0.01"
                    value={centerX}
                    onChange={(event) => setCenterX(event.target.value)}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.formLabel} htmlFor="circle-center-y">
                    Center Y
                  </label>
                  <input
                    id="circle-center-y"
                    className={styles.formInput}
                    type="number"
                    min="0"
                    max="500"
                    step="0.01"
                    value={centerY}
                    onChange={(event) => setCenterY(event.target.value)}
                  />
                </div>
              </div>
              <p className={styles.formHelperText}>
                Coordinates are measured within the 500 × 500 canvas.
              </p>
            </fieldset>

            <fieldset className={styles.formSection}>
              <legend className={styles.formSectionTitle}>Size</legend>
              <div className={styles.inputGroup}>
                <label className={styles.formLabel} htmlFor="circle-radius">
                  Radius
                </label>
                <input
                  id="circle-radius"
                  className={styles.formInput}
                  type="number"
                  min="1"
                  max="250"
                  value={radius}
                  onChange={(event) => setRadius(event.target.value)}
                />
              </div>
              <p className={styles.formHelperText}>
                The circle must remain completely inside the canvas.
              </p>
            </fieldset>
          </>
        ) : (
          <fieldset className={styles.formSection}>
            <legend className={styles.formSectionTitle}>Vertices</legend>
            <p className={styles.formHelperText}>
              Add at least three points within the 500 × 500 canvas.
            </p>

            <div className={styles.obstacleVertexList}>
              {vertices.map((vertex, index) => (
                <div className={styles.obstacleVertexRow} key={index}>
                  <span className={styles.obstacleVertexLabel}>
                    Vertex {index + 1}
                  </span>
                  {["x", "y"].map((axis) => (
                    <div className={styles.inputGroup} key={axis}>
                      <label
                        className={styles.formLabel}
                        htmlFor={`obstacle-vertex-${index}-${axis}`}
                      >
                        {axis.toUpperCase()}
                      </label>
                      <input
                        id={`obstacle-vertex-${index}-${axis}`}
                        className={styles.formInput}
                        type="number"
                        min="0"
                        max="500"
                        step="0.01"
                        value={vertex[axis]}
                        onChange={(event) =>
                          updateVertex(index, axis, event.target.value)
                        }
                      />
                    </div>
                  ))}
                  <button
                    className={`${styles.secondaryAction} ${styles.obstacleVertexDelete}`}
                    type="button"
                    disabled={vertices.length <= 3}
                    aria-label={`Delete vertex ${index + 1}`}
                    title={
                      vertices.length <= 3
                        ? "A polygon needs at least three vertices"
                        : `Delete vertex ${index + 1}`
                    }
                    onClick={() => deleteVertex(index)}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>

            <button
              className={`${styles.secondaryAction} ${styles.formActionButton}`}
              type="button"
              onClick={addVertex}
            >
              <CirclePlus size={16} aria-hidden="true" />
              Add Vertex
            </button>
          </fieldset>
        )}

        {formError && (
          <p className={styles.formError} role="alert">
            {formError}
          </p>
        )}

        <div className={styles.formActions}>
          <button
            className={`${styles.primaryAction} ${styles.formActionButton}`}
            type="submit"
          >
            {isEditing ? (
              <Check size={16} aria-hidden="true" />
            ) : (
              <CopyPlus size={16} aria-hidden="true" />
            )}
            {isEditing ? "Apply Changes" : `Add ${shapeLabel} Obstacle`}
          </button>
          <button
            className={`${styles.secondaryAction} ${styles.formActionButton}`}
            type="button"
            onClick={onCancel}
          >
            <X size={16} aria-hidden="true" />
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
