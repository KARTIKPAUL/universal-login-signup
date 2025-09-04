"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Card, CardHeader, CardContent } from "../ui/Card";

export function SetPasswordForm() {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { data: session, update } = useSession();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Client-side validation
    const newErrors = {};
    if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Password must contain uppercase, lowercase, and number";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          setErrors(data.details);
        } else {
          setErrors({ submit: data.error || "Failed to set password" });
        }
        return;
      }

      console.log("Password set successfully, updating session...");

      // Force session update to reflect the change
      await update({
        ...session,
        user: {
          ...session.user,
          needsPasswordSetup: false,
        },
      });

      // Small delay to ensure session is updated
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } catch (error) {
      console.error("Set password error:", error);
      setErrors({ submit: "An error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
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
          Set Your Password
        </h1>
        <p className="text-sm text-gray-600 text-center mt-2">
          Complete your account setup by creating a password for future logins
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password?.[0] || errors.password}
              placeholder="Enter your password"
              required
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

          <Button type="submit" loading={loading} className="w-full">
            {loading ? "Setting Password..." : "Set Password & Continue"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            This password will allow you to login using email/password in the
            future
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
