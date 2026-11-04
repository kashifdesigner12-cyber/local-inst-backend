
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://apinstitue.localpro1.net/api";
export const apiCall = async (
  endpoint,
  method = "GET",
  data = null
) => {
  const token =
    localStorage.getItem("teacherToken") ||
    localStorage.getItem("adminToken");

  const headers = {
    Accept: "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (data instanceof FormData) {
    config.body = data;
  } else if (data !== null && data !== undefined) {
    headers["Content-Type"] = "application/json";
    config.body = JSON.stringify(data);
  }

  try {
    console.log(`${method} ${API_BASE_URL}${endpoint}`);

    const response = await fetch(
      `${API_BASE_URL}${endpoint}`,
      config
    );

    let result;

    try {
      result = await response.json();
    } catch {
      result = {
        success: false,
        message: "Server returned an invalid response.",
      };
    }

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        message:
          result?.message ||
          `Request failed with status ${response.status}`,
        data: result,
      };
    }

    return {
      success: true,
      status: response.status,
      data: result,
    };
  } catch (error) {
    console.error("API connection error:", error);

    return {
      success: false,
      status: 0,
      message: "Unable to connect to server.",
      error,
    };
  }
};
