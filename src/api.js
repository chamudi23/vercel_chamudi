const BACKEND_URL = "http://localhost:8000";

export async function analyseBone(measurementData) {
  try {
    const response = await fetch(`${BACKEND_URL}/analyse-bone`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(measurementData),
    });
    return response.json();
  } catch (error) {
    console.error("Backend error:", error);
    return null;
  }
}

export async function getQualityReport(specimenId) {
  try {
    const response = await fetch(`${BACKEND_URL}/quality-report/${specimenId}`);
    return response.json();
  } catch (error) {
    console.error("Backend error:", error);
    return null;
  }
}

export async function getAnomalyReport() {
  try {
    const response = await fetch(`${BACKEND_URL}/anomaly-report`);
    return response.json();
  } catch (error) {
    console.error("Backend error:", error);
    return null;
  }
}