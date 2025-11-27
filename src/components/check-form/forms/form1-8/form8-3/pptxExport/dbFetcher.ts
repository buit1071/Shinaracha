import type { Form8_1Data } from "../types";

/**
 * Fetch saved Form8_1 data from database with timeout
 * @param jobId Job ID
 * @param equipmentId Equipment ID
 * @returns Form8_1Data from database or null if not found
 */
export async function fetchForm8_1FromDb(
  jobId: string,
  equipmentId: string
): Promise<Form8_1Data | null> {
  console.log(
    `[dbFetcher] Fetching form data for jobId=${jobId}, equipmentId=${equipmentId}`
  );

  try {
    const startTime = performance.now();
    
    // Create abort controller with 10 second timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      console.error("[dbFetcher] Request timeout (10s)");
      controller.abort();
    }, 10000);

    const response = await fetch("/api/auth/forms/get", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        function: "form8_1",
        job_id: jobId,
        equipment_id: equipmentId,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    console.log(
      `[dbFetcher] API response received: status=${response.status}, time=${(performance.now() - startTime).toFixed(0)}ms`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = (await response.json()) as {
      success: boolean;
      data?: any;
      message?: string;
    };

    console.log(
      `[dbFetcher] API response parsed: success=${result.success}, has data=${!!result.data}`
    );

    if (!result.success || !result.data) {
      console.warn(
        "[dbFetcher] No form data found in database",
        result.message
      );
      return null;
    }

    // Parse form_data JSON
    let formData: Form8_1Data | null = null;
    try {
      console.log(
        `[dbFetcher] Parsing form_data JSON (length=${result.data.form_data?.length || 0})`
      );
      formData = JSON.parse(result.data.form_data || "null");
      console.log(`[dbFetcher] Successfully parsed form data`);
    } catch (err) {
      console.error("[dbFetcher] Failed to parse form_data JSON:", err);
      return null;
    }

    console.log("[dbFetcher] Returning form data");
    return formData;
  } catch (error: any) {
    console.error("[dbFetcher] Error fetching form data:", error);
    if (error.name === "AbortError") {
      throw new Error("API request timeout - database may be slow");
    }
    throw error;
  }
}


