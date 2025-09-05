"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "../../stores/authStore";
import useUIStore from "../../stores/uiStore";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Card, CardHeader, CardContent } from "../ui/Card";

export function SignupForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  const router = useRouter();

  // Zustand stores
  const {
    isLoading,
    error: authError,
    isAuthenticated,
    needsPasswordSetup,
    registerUser,
    loginWithGoogle,
    clearError,
  } = useAuthStore();

  const { addToast } = useUIStore();

  useEffect(() => {
    if (isAuthenticated) {
      if (needsPasswordSetup) {
        router.push("/set-password");
      } else {
        router.push("/dashboard");
      }
    }
  }, [isAuthenticated, needsPasswordSetup, router]);

  useEffect(() => {
    if (authError) {
      setErrors({ submit: authError });
      addToast({
        type: "error",
        message: authError,
      });
    }
  }, [authError, addToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setErrors({});

    // Client-side validation
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Password must contain uppercase, lowercase, and number";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const result = await registerUser({
      name: formData.name.trim(),
      email: formData.email.toLowerCase().trim(),
      password: formData.password,
    });

    if (result.success) {
      addToast({
        type: "success",
        message: "Registration successful!",
      });
    }
  };

  const handleGoogleSignIn = async () => {
    clearError();
    const result = await loginWithGoogle();

    if (result.success) {
      addToast({
        type: "success",
        message: "Google login successful!",
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }

    // Clear auth error when any field changes
    if (authError) {
      clearError();
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: "", color: "" };

    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    score = Object.values(checks).filter(Boolean).length;

    if (score < 2) return { strength: 1, text: "Weak", color: "text-red-500" };
    if (score < 4)
      return { strength: 2, text: "Medium", color: "text-yellow-500" };
    return { strength: 3, text: "Strong", color: "text-green-500" };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <h1 className="text-2xl font-bold text-center text-gray-900">
          Create Account
        </h1>
        <p className="text-sm text-gray-600 text-center mt-2">
          Sign up to get started with your account
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="Enter your full name"
            required
            autoComplete="name"
            className="text-black"
          />

          <Input
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="Enter your email address"
            required
            autoComplete="email"
            className="text-black"
          />

          <div>
            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="Create a strong password"
              required
              autoComplete="new-password"
              className="text-black"
            />
            {formData.password && (
              <div className="mt-1 text-xs">
                <span className="text-gray-500">Strength: </span>
                <span className={passwordStrength.color}>
                  {passwordStrength.text}
                </span>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
                  <div
                    className={`h-1 rounded-full transition-all duration-300 ${
                      passwordStrength.strength === 1
                        ? "bg-red-500 w-1/3"
                        : passwordStrength.strength === 2
                        ? "bg-yellow-500 w-2/3"
                        : "bg-green-500 w-full"
                    }`}
                  />
                </div>
              </div>
            )}
          </div>

          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            placeholder="Confirm your password"
            required
            autoComplete="new-password"
            className="text-black"
          />

          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <p className="font-medium mb-1">Password requirements:</p>
            <ul className="space-y-1">
              <li
                className={`flex items-center ${
                  formData.password.length >= 8
                    ? "text-green-600"
                    : "text-gray-500"
                }`}
              >
                <span className="mr-2">
                  {formData.password.length >= 8 ? "✓" : "○"}
                </span>
                At least 8 characters
              </li>
              <li
                className={`flex items-center ${
                  /[a-z]/.test(formData.password)
                    ? "text-green-600"
                    : "text-gray-500"
                }`}
              >
                <span className="mr-2">
                  {/[a-z]/.test(formData.password) ? "✓" : "○"}
                </span>
                One lowercase letter
              </li>
              <li
                className={`flex items-center ${
                  /[A-Z]/.test(formData.password)
                    ? "text-green-600"
                    : "text-gray-500"
                }`}
              >
                <span className="mr-2">
                  {/[A-Z]/.test(formData.password) ? "✓" : "○"}
                </span>
                One uppercase letter
              </li>
              <li
                className={`flex items-center ${
                  /\d/.test(formData.password)
                    ? "text-green-600"
                    : "text-gray-500"
                }`}
              >
                <span className="mr-2">
                  {/\d/.test(formData.password) ? "✓" : "○"}
                </span>
                One number
              </li>
            </ul>
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {errors.submit}
            </div>
          )}

          <Button
            type="submit"
            loading={isLoading}
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            variant="google"
            onClick={handleGoogleSignIn}
            loading={isLoading}
            disabled={isLoading}
            className="w-full mt-3"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>
        </div>

        <div className="mt-6 text-center">
          <span className="text-sm text-gray-600">
            Already have an account?{" "}
          </span>
          <a
            href="/login"
            className="text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors"
          >
            Sign in
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
