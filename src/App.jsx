import { Routes, Route, Navigate } from 'react-router-dom'

// ---- Shared user components ----
import Navbar from './common_component/user/Navbar/Navbar.jsx'
import Footer from './common_component/user/Footer/Footer.jsx'
import OfflineBanner from './common_component/user/OfflineBanner/OfflineBanner.jsx'
import ScrollToTop from './common_component/user/ScrollToTop/ScrollToTop.jsx'
import ProtectedRoute from './common_component/user/ProtectedRoute/ProtectedRoute.jsx'
import GuestRoute from './common_component/user/GuestRoute/GuestRoute.jsx'

// ---- Shared admin components ----
import AdminLayout from './common_component/admin/AdminLayout/AdminLayout.jsx'
import AdminProtectedRoute from './common_component/admin/AdminProtectedRoute/AdminProtectedRoute.jsx'

// ---- Partner organisation portal ----
import OrgLayout from './common_component/org/OrgLayout/OrgLayout.jsx'
import OrgDashboard from './pages/org/dashboardpage/OrgDashboard.jsx'
import OrgStudents from './pages/org/studentspage/OrgStudents.jsx'
import OrgScholarship from './pages/org/scholarshippage/OrgScholarship.jsx'
import OrgProfile from './pages/org/profilepage/OrgProfile.jsx'

// ---- User pages ----
import Home from './pages/user/homepage/Home.jsx'
import About from './pages/user/aboutpage/About.jsx'
import Mentoring from './pages/user/mentoringpage/Mentoring.jsx'
import BookOnline from './pages/user/bookonlinepage/BookOnline.jsx'
import Nirmaan from './pages/user/nirmaanpage/Nirmaan.jsx'
import Scholarship from './pages/user/scholarshippage/Scholarship.jsx'
import ScholarshipTest from './pages/user/scholarshippage/ScholarshipTest.jsx'
import Organisations from './pages/user/organisationspage/Organisations.jsx'
import Resources from './pages/user/resourcespage/Resources.jsx'
import CourseDetail from './pages/user/careerlibrarypage/CourseDetail.jsx'
import LegalPage from './pages/user/legalpage/LegalPage.jsx'
import Blog from './pages/user/blogpage/Blog.jsx'
import BlogPost from './pages/user/blogpage/BlogPost.jsx'
import Contact from './pages/user/contactpage/Contact.jsx'
import Login from './pages/user/loginpage/Login.jsx'
import ResetPassword from './pages/user/loginpage/ResetPassword.jsx'
import VerifyEmail from './pages/user/loginpage/VerifyEmail.jsx'
import Dashboard from './pages/user/dashboardpage/Dashboard.jsx'
import Settings from './pages/user/settingspage/Settings.jsx'
import Checkout from './pages/user/checkoutpage/Checkout.jsx'
import Learn from './pages/user/learnpage/Learn.jsx'
import Downloads from './pages/user/downloadspage/Downloads.jsx'
import NotFound from './pages/user/notfoundpage/NotFound.jsx'

// ---- Admin pages ----
import AdminDashboard from './pages/admin/dashboardpage/AdminDashboard.jsx'
import AdminSkillBuilds from './pages/admin/skillbuildspage/AdminSkillBuilds.jsx'
import AdminContent from './pages/admin/contentpage/AdminContent.jsx'
import AdminBlogs from './pages/admin/blogspage/AdminBlogs.jsx'
import AdminCareerLibrary from './pages/admin/careerlibrarypage/AdminCareerLibrary.jsx'
import AdminUsers from './pages/admin/userspage/AdminUsers.jsx'
import AdminCoupons from './pages/admin/couponspage/AdminCoupons.jsx'
import AdminOrders from './pages/admin/orderspage/AdminOrders.jsx'
import AdminAssessments from './pages/admin/assessmentspage/AdminAssessments.jsx'
import AdminMentoring from './pages/admin/mentoringpage/AdminMentoring.jsx'
import AdminRoles from './pages/admin/rolespage/AdminRoles.jsx'
import AdminScholarship from './pages/admin/scholarshippage/AdminScholarship.jsx'

/**
 * Public-facing site uses Navbar + Footer chrome.
 * The /admin area uses its own AdminLayout (sidebar) and is guarded.
 */
function PublicSite() {
  return (
    <>
      <OfflineBanner />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/mentoring" element={<Mentoring />} />
          <Route path="/book-online" element={<BookOnline />} />
          <Route path="/skill-build/nirmaan" element={<Nirmaan />} />
          <Route path="/nirmaan-scholarship" element={<Scholarship />} />
          <Route path="/nirmaan-scholarship/test" element={<ProtectedRoute><ScholarshipTest /></ProtectedRoute>} />
          {/* Renamed — it's Nirmaan-only. Keep old links working. */}
          <Route path="/scholarship" element={<Navigate to="/nirmaan-scholarship" replace />} />
          {/* Public partner directory — schools, colleges, villages, NGOs, … */}
          <Route path="/organisations" element={<Organisations />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/career-library/:slug" element={<CourseDetail />} />
          <Route path="/legal/:slug" element={<LegalPage />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/contact" element={<Contact />} />

          {/* Auth + unified account */}
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/:slug"
            element={
              <ProtectedRoute>
                <Learn />
              </ProtectedRoute>
            }
          />
          <Route
            path="/downloads"
            element={
              <ProtectedRoute>
                <Downloads />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Admin area — separate chrome, guarded */}
        {/* One login for everyone — the old panel login just redirects to it. */}
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />
        <Route
          path="/admin/*"
          element={
            <AdminProtectedRoute>
              <AdminLayout>
                <Routes>
                  <Route path="/" element={<AdminDashboard />} />
                  <Route path="/skill-builds" element={<AdminSkillBuilds />} />
                  {/* Packages now live inside Skill Builds — keep old links working. */}
                  <Route path="/packages" element={<Navigate to="/admin/skill-builds" replace />} />
                  <Route path="/content" element={<AdminContent />} />
                  <Route path="/blogs" element={<AdminBlogs />} />
                  <Route path="/career-library" element={<AdminCareerLibrary />} />
                  <Route path="/users" element={<AdminUsers />} />
                  <Route path="/coupons" element={<AdminCoupons />} />
                  <Route path="/orders" element={<AdminOrders />} />
                  <Route path="/assessments" element={<AdminAssessments />} />
                  <Route path="/mentoring" element={<AdminMentoring />} />
                  <Route path="/roles" element={<AdminRoles />} />
                  <Route path="/scholarship" element={<AdminScholarship />} />
                  <Route path="/admins" element={<Navigate to="/admin/users" replace />} />
                </Routes>
              </AdminLayout>
            </AdminProtectedRoute>
          }
        />

        {/* Partner organisation portal — its own chrome. The guard IS the data
            load (see OrgLayout): /org/me only answers for an approved, active
            organisation's owner, so there's no separate protected-route wrapper. */}
        <Route
          path="/organisation/*"
          element={
            <OrgLayout>
              <Routes>
                <Route path="/" element={<OrgDashboard />} />
                <Route path="/students" element={<OrgStudents />} />
                <Route path="/scholarship" element={<OrgScholarship />} />
                <Route path="/profile" element={<OrgProfile />} />
                <Route path="*" element={<Navigate to="/organisation" replace />} />
              </Routes>
            </OrgLayout>
          }
        />

        {/* Everything else = public site */}
        <Route path="/*" element={<PublicSite />} />
      </Routes>
    </>
  )
}
