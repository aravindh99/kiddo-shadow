import api from "./axios";

// Enhanced login API with better error handling
export async function loginApi(credentials) {
  try {
    const identifier = credentials?.username?.trim();
    const payload = {
      username: identifier,
      password: credentials?.password,
    };

    const res = await api.post("/auth/login", payload);
    
    if (!res.data || !res.data.token) {
      throw new Error("Invalid response from server: missing token");
    }
    
    return res.data; // expected: { token }
  } catch (error) {
    // Enhanced error handling for different scenarios
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.message || "Login failed";
      
      switch (status) {
        case 401:
          throw new Error("Invalid username or password");
        case 403:
          throw new Error(message || "Account is disabled or school is inactive");
        case 429:
          throw new Error("Too many login attempts. Please try again later");
        case 500:
          throw new Error("Server error. Please try again later");
        default:
          throw new Error(message);
      }
    } else if (error.request) {
      // Network error
      throw new Error("Network error. Please check your connection and try again");
    } else {
      // Other error
      throw new Error(error.message || "Login failed");
    }
  }
}

// Enhanced change password API with better error handling
export async function changePasswordApi(payload) {
  try {
    const res = await api.post("/auth/change-password", payload);
    return res.data;
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || "Password change failed";
      
      switch (status) {
        case 400:
          throw new Error("Current password is incorrect");
        case 401:
          throw new Error("You must be logged in to change password");
        case 404:
          throw new Error("User not found");
        case 500:
          throw new Error("Server error. Please try again later");
        default:
          throw new Error(message);
      }
    } else if (error.request) {
      throw new Error("Network error. Please check your connection and try again");
    } else {
      throw new Error(error.message || "Password change failed");
    }
  }
}

// Profile completion APIs for different user roles
export async function completeStudentProfileApi(profileData) {
  try {
    const res = await api.post("/students/complete-profile", profileData);
    return res.data; // expected: { message, token, user }
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || "Profile completion failed";
      
      switch (status) {
        case 400:
          throw new Error("Invalid profile data provided");
        case 401:
          throw new Error("You must be logged in to complete profile");
        case 404:
          throw new Error("Student profile not found");
        case 409:
          throw new Error("Profile already completed");
        case 500:
          throw new Error("Server error. Please try again later");
        default:
          throw new Error(message);
      }
    } else if (error.request) {
      throw new Error("Network error. Please check your connection and try again");
    } else {
      throw new Error(error.message || "Profile completion failed");
    }
  }
}

export async function completeTeacherProfileApi(profileData) {
  try {
    const res = await api.post("/teachers/complete-profile", profileData);
    return res.data; // expected: { message, token, user }
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || "Profile completion failed";
      
      switch (status) {
        case 400:
          throw new Error("Invalid profile data provided");
        case 401:
          throw new Error("You must be logged in to complete profile");
        case 404:
          throw new Error("Teacher profile not found");
        case 409:
          throw new Error("Profile already completed");
        case 500:
          throw new Error("Server error. Please try again later");
        default:
          throw new Error(message);
      }
    } else if (error.request) {
      throw new Error("Network error. Please check your connection and try again");
    } else {
      throw new Error(error.message || "Profile completion failed");
    }
  }
}

export async function updateParentProfileApi(profileData) {
  try {
    const res = await api.patch("/parents/parents/profile", profileData);
    return res.data; // expected: { message, token, user }
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || "Profile update failed";
      
      switch (status) {
        case 400:
          throw new Error("Invalid profile data provided");
        case 401:
          throw new Error("You must be logged in to update profile");
        case 403:
          throw new Error("Access denied");
        case 404:
          throw new Error("Parent profile not found");
        case 500:
          throw new Error("Server error. Please try again later");
        default:
          throw new Error(message);
      }
    } else if (error.request) {
      throw new Error("Network error. Please check your connection and try again");
    } else {
      throw new Error(error.message || "Profile update failed");
    }
  }
}

// Get user profile APIs
export async function getTeacherProfileApi() {
  try {
    const res = await api.get("/teachers/me");
    return res.data;
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || "Failed to fetch profile";
      
      switch (status) {
        case 401:
          throw new Error("You must be logged in to view profile");
        case 403:
          throw new Error("Profile completion required");
        case 404:
          throw new Error("Teacher profile not found");
        case 500:
          throw new Error("Server error. Please try again later");
        default:
          throw new Error(message);
      }
    } else if (error.request) {
      throw new Error("Network error. Please check your connection and try again");
    } else {
      throw new Error(error.message || "Failed to fetch profile");
    }
  }
}

// Token validation utility
export function validateToken(token) {
  try {
    if (!token) return false;
    
    let base64Url = token.split('.')[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let pad = base64.length % 4;
    if (pad) {
      if (pad === 1) {
        throw new Error('InvalidLengthError: Input base64url string is the wrong length to determine padding');
      }
      base64 += new Array(5 - pad).join('=');
    }
    
    const payload = JSON.parse(atob(base64));
    const currentTime = Date.now() / 1000;
    
    return payload.exp > currentTime;
  } catch {
    return false;
  }
}

// Check if user needs profile completion
export function needsProfileCompletion(user) {
  return user && user.role !== "parent" && user.first_login === true;
}

// Get profile completion endpoint based on user role
export function getProfileCompletionEndpoint(role) {
  switch (role) {
    case 'student':
      return '/students/complete-profile';
    case 'teacher':
      return '/teachers/complete-profile';
    case 'parent':
      return '/parents/parents/profile';
    default:
      return null;
  }
}

// Logout API (for future use if backend implements it)
export async function logoutApi() {
  try {
    // Currently backend doesn't have logout endpoint
    // This is a placeholder for future implementation
    return { success: true };
  } catch (error) {
    console.warn("Logout API call failed:", error);
    return { success: true }; // Still return success for local logout
  }
}
