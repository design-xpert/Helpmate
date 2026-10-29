const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface SendSignupOtpPayload {
  mobile: string;
}

export interface SendSignupOtpResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface RegisterPayload {
  fullName: string;
  mobile: string;
  password: string;
  otp: string;
}

/**
 * Send Customer Signup OTP
 * POST /api/customer/auth/send-signup-otp
 */
export async function sendCustomerSignupOtpApi(
  payload: SendSignupOtpPayload
): Promise<SendSignupOtpResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/customer/auth/send-signup-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        message: data.message || "Failed to send signup OTP.",
      };
    }

    return data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Network error. Unable to connect to server.",
    };
  }
}

export interface LoginPayload {
  mobile: string;
  loginType?: "otp" | "password";
  password?: string;
  otp?: string;
}

export interface SendLoginOtpPayload {
  mobile: string;
}

export interface SendLoginOtpResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Send Customer Login OTP
 * POST /api/customer/auth/send-login-otp
 */
export async function sendCustomerLoginOtpApi(
  payload: SendLoginOtpPayload
): Promise<SendLoginOtpResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/customer/auth/send-login-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        message: data.message || "Failed to send login OTP.",
      };
    }

    return data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Network error. Unable to connect to server.",
    };
  }
}

export interface CustomerData {
  id: string;
  customerCode: string;
  fullName: string;
  mobile: string;
  email?: string;
  alternatePhone?: string;
  avatar?: string;
  name?: string;
  [key: string]: any;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    customer: CustomerData;
    token: string;
  };
}

export async function registerCustomerApi(payload: RegisterPayload): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/customer/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        message: data.message || "Registration failed. Please try again.",
      };
    }

    return data;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Network error. Unable to connect to server.",
    };
  }
}

export async function loginCustomerApi(payload: LoginPayload): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/customer/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        message: data.message || "Login failed. Please check credentials.",
      };
    }

    return data;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Network error. Unable to connect to server.",
    };
  }
}

export interface CurrentCustomerResponse {
  success: boolean;
  message: string;
  data?: {
    id?: string;
    _id?: string;
    customerCode?: string;
    fullName?: string;
    name?: string;
    mobile?: string;
    phone?: string;
    email?: string;
    alternatePhone?: string;
    altPhone?: string;
    profileImage?: string;
    avatar?: string;
    image?: string;
    customerCategory?: string;
    propertyHouseholdType?: string;
    status?: boolean;
    isPasswordSet?: boolean;
    [key: string]: any;
  };
}

/**
 * Fetch authenticated customer profile using JWT Bearer token
 * GET /api/customer/auth/me
 */
export async function getCurrentCustomerApi(token: string): Promise<CurrentCustomerResponse> {
  try {
    let res = await fetch(`${API_BASE_URL}/api/customer/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok && typeof window !== "undefined" && API_BASE_URL.startsWith("http")) {
      try {
        const fallbackRes = await fetch("/api/customer/auth/me", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (fallbackRes.ok) {
          res = fallbackRes;
        }
      } catch {}
    }

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        message: data.message || "Failed to fetch customer profile.",
      };
    }

    return data;
  } catch (error: any) {
    if (typeof window !== "undefined") {
      try {
        const fbRes = await fetch("/api/customer/auth/me", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const fbData = await fbRes.json();
        if (fbRes.ok) return fbData;
        return {
          success: false,
          message: fbData.message || "Failed to fetch customer profile.",
        };
      } catch {}
    }
    return {
      success: false,
      message: error?.message || "Network error while fetching profile.",
    };
  }
}

export interface UploadProfileImageResponse {
  success: boolean;
  message: string;
  data?: {
    profileImage?: string;
    avatar?: string;
    image?: string;
    customer?: any;
    [key: string]: any;
  } | any;
}

/**
 * Upload Customer Profile Image
 * PUT /api/customer/auth/profile/image
 * Body: FormData with 'profileImage'
 */
export async function uploadCustomerProfileImageApi(
  token: string,
  imageFile: File | Blob
): Promise<UploadProfileImageResponse> {
  try {
    const formData = new FormData();
    formData.append("profileImage", imageFile);

    let res = await fetch(`${API_BASE_URL}/api/customer/auth/profile/image`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok && typeof window !== "undefined" && API_BASE_URL.startsWith("http")) {
      try {
        const fallbackRes = await fetch("/api/customer/auth/profile/image", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        if (fallbackRes.ok) {
          res = fallbackRes;
        }
      } catch {}
    }

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        message: data.message || "Failed to upload profile image.",
      };
    }

    return data;
  } catch (error: any) {
    if (typeof window !== "undefined") {
      try {
        const formData = new FormData();
        formData.append("profileImage", imageFile);
        const fbRes = await fetch("/api/customer/auth/profile/image", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        const fbData = await fbRes.json();
        if (fbRes.ok) return fbData;
        return {
          success: false,
          message: fbData.message || "Failed to upload profile image.",
        };
      } catch {}
    }
    return {
      success: false,
      message: error?.message || "Network error while uploading profile image.",
    };
  }
}

export interface UpdateCustomerProfilePayload {
  fullName: string;
  email?: string;
  alternatePhone?: string;
}

export interface UpdateCustomerProfileResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Update Customer Profile
 * PATCH /api/customer/auth/profile
 */
export async function updateCustomerProfileApi(
  token: string,
  payload: UpdateCustomerProfilePayload
): Promise<UpdateCustomerProfileResponse> {
  try {
    const cleanBody: { fullName: string; email?: string; alternatePhone?: string } = {
      fullName: payload.fullName,
    };
    if (payload.email) cleanBody.email = payload.email;
    if (payload.alternatePhone) cleanBody.alternatePhone = payload.alternatePhone;

    const res = await fetch(`${API_BASE_URL}/api/customer/auth/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(cleanBody),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        message: data.message || "Failed to update profile details.",
      };
    }

    return data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Network error. Unable to update profile.",
    };
  }
}

export interface ForgotPasswordPayload {
  mobile: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface VerifyForgotPasswordOtpPayload {
  mobile: string;
  otp: string;
}

export interface VerifyForgotPasswordOtpResponse {
  success: boolean;
  message: string;
  data?: {
    resetToken?: string;
    [key: string]: any;
  };
  resetToken?: string;
}

export interface ResetPasswordPayload {
  resetToken: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Initiate Forgot Password - Sends OTP to customer's mobile
 * POST /api/customer/auth/forgot-password
 */
export async function forgotPasswordApi(payload: ForgotPasswordPayload): Promise<ForgotPasswordResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/customer/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        message: data.message || "Failed to send OTP for password reset.",
      };
    }

    return data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Network error. Unable to request password reset.",
    };
  }
}

/**
 * Verify Forgot Password OTP - Validates OTP & receives resetToken
 * POST /api/customer/auth/verify-forgot-password-otp
 */
export async function verifyForgotPasswordOtpApi(
  payload: VerifyForgotPasswordOtpPayload
): Promise<VerifyForgotPasswordOtpResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/customer/auth/verify-forgot-password-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        message: data.message || "Invalid or expired OTP. Please try again.",
      };
    }

    return data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Network error. Unable to verify OTP.",
    };
  }
}

/**
 * Reset Password - Sets new password using resetToken
 * POST /api/customer/auth/reset-password
 */
export async function resetPasswordApi(payload: ResetPasswordPayload): Promise<ResetPasswordResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/customer/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        message: data.message || "Failed to reset password. Please request a new OTP.",
      };
    }

    return data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Network error. Unable to reset password.",
    };
  }
}

