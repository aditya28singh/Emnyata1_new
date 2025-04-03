import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import * as JwtDecode from 'jwt-decode';
import Cookies from 'js-cookie';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthPage() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
  
    setLoading(true);
    setMessage(null);
  
    try {
      // Step 1: Login via GraphQL - removed token field from query
      const loginRes = await fetch("https://experience-api.masaischool.com/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        credentials: "include", // Important for sending/receiving cookies
        body: JSON.stringify({
          query: `
            mutation login($input: LoginInput!) {
              login(input: $input) { id }
            }
          `,
          variables: {
            input: {
              email: formData.email,
              password: formData.password,
              rememberMe: false
            }
          },
          operationName: "login"
        })
      });
  
      const loginResult = await loginRes.json();
      console.log("Login result:", loginResult);
  
      if (loginRes.ok && loginResult.data?.login?.id) {
        // Step 2: Fetch user details
        const userRes = await fetch("https://experience-api.masaischool.com/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          credentials: "include", // The session cookie from login will be sent automatically
          body: JSON.stringify({
            query: `
              query getAuthMe {
                me {
                  id
                  name
                  username
                  role
                  sections_enrolled { id name }
                }
              }
            `,
            operationName: "getAuthMe"
          })
        });
  
        const userResult = await userRes.json();
        console.log("User result:", userResult);
        const user = userResult.data?.me;
  
        if (user) {
          // Store user data
          localStorage.setItem("user", JSON.stringify(user));
          
          // Set user_id cookie
          Cookies.set("user_id", user.id, { 
            expires: 1, 
            path: '/',
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production'
          });
          
          // Set a session identifier cookie for the middleware
          // This allows the middleware to know the user is authenticated
          Cookies.set("auth_session", "authenticated", { 
            expires: 1, 
            path: '/',
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production'
          });
          
          // Also set the role cookie for middleware - make sure it's lowercase
          if (user.role) {
            const normalizedRole = user.role.toLowerCase();
            Cookies.set("selectedRole", normalizedRole, { 
              expires: 1, 
              path: '/',
              sameSite: 'strict',
              secure: process.env.NODE_ENV === 'production'
            });
            
            console.log("Setting role cookie:", normalizedRole);
          }
  
          setMessage({ type: "success", text: "Sign In successful! Redirecting..." });
          console.log("User role:", user.role);
          
          // Step 3: Redirect based on role
          // Convert role to lowercase for consistent comparison
          const role = user.role?.toLowerCase();
          
          switch (role) {
            case "admin":
              console.log("Redirecting to admin dashboard");
              window.location.href = "/admin/manage-users";
              break;
            case "mentor":
              window.location.href = "/mentor/schedule";
              break;
            case "student":
              window.location.href = "/student/slot-booking";
              break;
            default:
              console.log("No recognized role, redirecting to select-role");
              window.location.href = "/select-role";
          }
        } else {
          throw new Error("Failed to fetch user info.");
        }
      } else {
        setMessage({
          type: "error",
          text: loginResult.errors?.[0]?.message || "Invalid credentials or login failed.",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage({
        type: "error",
        text: error.message || "An error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
      >
        <div className="text-center mb-8">
          <img src="/images/masai-logo.svg" alt="Masai Logo" className="h-12 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to continue to your account</p>
        </div>

        <AnimatePresence mode="wait">
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-6 p-4 rounded-lg ${
                message.type === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type={passwordVisible ? 'text' : 'password'}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setPasswordVisible(!passwordVisible)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {passwordVisible ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}