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
    id: string;
    customerCode: string;
    fullName: string;
    mobile: string;
    email?: string;
    customerCategory?: string;
    propertyHouseholdType?: string;
  };
}

/**
 * Fetch authenticated customer profile using JWT Bearer token
 * GET /api/customer/auth/me
 */
export async function getCurrentCustomerApi(token: string): Promise<CurrentCustomerResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/customer/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        message: data.message || "Failed to fetch customer profile.",
      };
    }

    return data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Network error while fetching profile.",
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

