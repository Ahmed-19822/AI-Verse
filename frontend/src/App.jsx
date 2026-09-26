import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AppLayout from './components/AppLayout.jsx'

import Landing from './pages/Landing.jsx'
import Pricing from './pages/Pricing.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import EmailVerified from './pages/EmailVerified.jsx'
import NotFound from './pages/NotFound.jsx'
import CheckoutSuccess from './pages/CheckoutSuccess.jsx'
import CheckoutCancelled from './pages/CheckoutCancelled.jsx'
import Onboarding from './pages/Onboarding.jsx'

import Dashboard from './pages/Dashboard.jsx'
import Chat from './pages/Chat.jsx'
import Friends from './pages/Friends.jsx'
import Groups from './pages/Groups.jsx'
import Status from './pages/Status.jsx'
import Feed from './pages/Feed.jsx'
import Explore from './pages/Explore.jsx'
import AIHub from './pages/AIHub.jsx'
import AICreator from './pages/AICreator.jsx'
import AIGenerator from './pages/AIGenerator.jsx'
import Marketplace from './pages/Marketplace.jsx'
import AIAnalytics from './pages/AIAnalytics.jsx'
import Profile from './pages/Profile.jsx'
import Settings from './pages/Settings.jsx'
import PremiumDashboard from './pages/PremiumDashboard.jsx'
import AdminPanel from './pages/AdminPanel.jsx'

const P = ({ children }) => <ProtectedRoute><AppLayout>{children}</AppLayout></ProtectedRoute>
const A = ({ children }) => <ProtectedRoute adminOnly><AppLayout>{children}</AppLayout></ProtectedRoute>
const PublicLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
)

export default function App() {
  return (
    <Routes>
      {/* Public Routes with Navbar/Footer */}
      <Route path="/" element={<PublicLayout><Landing /></PublicLayout>} />
      <Route path="/pricing" element={<PublicLayout><Pricing /></PublicLayout>} />
      <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
      <Route path="/signup" element={<PublicLayout><Signup /></PublicLayout>} />
      <Route path="/forgot-password" element={<PublicLayout><ForgotPassword /></PublicLayout>} />
      <Route path="/reset-password" element={<PublicLayout><ResetPassword /></PublicLayout>} />
      <Route path="/email-verified" element={<PublicLayout><EmailVerified /></PublicLayout>} />
      <Route path="/checkout/success" element={<PublicLayout><CheckoutSuccess /></PublicLayout>} />
      <Route path="/checkout/cancelled" element={<PublicLayout><CheckoutCancelled /></PublicLayout>} />
      <Route path="/onboarding" element={<PublicLayout><ProtectedRoute><Onboarding /></ProtectedRoute></PublicLayout>} />

      {/* Authenticated Routes with WhatsApp-style Layout */}
      <Route path="/dashboard" element={<P><Dashboard /></P>} />
      <Route path="/chat" element={<P><Chat /></P>} />
      <Route path="/friends" element={<P><Friends /></P>} />
      <Route path="/groups" element={<P><Groups /></P>} />
      <Route path="/status" element={<P><Status /></P>} />
      <Route path="/feed" element={<P><Feed /></P>} />
      <Route path="/explore" element={<P><Explore /></P>} />
      <Route path="/ai-hub" element={<P><AIHub /></P>} />
      <Route path="/ai-creator" element={<P><AICreator /></P>} />
      <Route path="/ai-generator" element={<P><AIGenerator /></P>} />
      <Route path="/marketplace" element={<P><Marketplace /></P>} />
      <Route path="/ai-analytics" element={<P><AIAnalytics /></P>} />
      <Route path="/profile" element={<P><Profile /></P>} />
      <Route path="/profile/:userId" element={<P><Profile /></P>} />
      <Route path="/settings" element={<P><Settings /></P>} />
      <Route path="/premium" element={<P><PremiumDashboard /></P>} />
      <Route path="/admin" element={<A><AdminPanel /></A>} />
      
      <Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />
    </Routes>
  )
}
