import z from "zod";
const loginUser = z.object({
  body: z.object({
    email: z
      .string({
        required_error: "Email is required!",
      })
      .email({
        message: "Invalid email format!",
      }),
    password: z.string({
      required_error: "Password is required!",
    }),
  }),
});

const forgotPassword = z.object({
  body: z.object({
    email: z
      .string({
        required_error: "Email is required!",
      })
      .email({
        message: "Invalid email format!",
      }),
  }),
});

const verifyOtp = z.object({
  body: z.object({
    email: z
      .string({
        required_error: "Email is required!",
      })
      .email({
        message: "Invalid email format!",
      }),
    otp: z.number({
      required_error: "OTP is required!",
    }),
  }),
});

const changePassword = z.object({
  body: z.object({
    email: z.string({
      required_error: "Email is required!",
    }),
    newPassword: z.string({
      required_error: "New password is required!",
    }),
  }),
});

export const authValidation = { loginUser, forgotPassword, verifyOtp, changePassword };
