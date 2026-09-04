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
import Ideology from './pages/user/ideologypage/Ideology.jsx'
import Services from './pages/user/servicespage/Services.jsx'
import ServiceProgram from './pages/user/servicespage/ServiceProgram.jsx'
import CompareServices from './pages/user/servicespage/CompareServices.jsx'
import BookOnline from './pages/user/bookonlinepage/BookOnline.jsx'
import Nirmaan from './pages/user/nirmaanpage/Nirmaan.jsx'
import Psychometric from './pages/user/psychometricpage/Psychometric.jsx'
// Scholarship (user-facing) temporarily hidden — see routes below.
// import Scholarship from './pages/user/scholarshippage/Scholarship.jsx'
// import ScholarshipTest from './pages/user/scholarshippage/ScholarshipTest.jsx'
// import Organisations from './pages/user/organisationspage/Organisations.jsx'
import Resources from './pages/user/resourcespage/Resources.jsx'
import CourseDetail from './pages/user/careerlibrarypage/CourseDetail.jsx'
import LegalPage from './pages/user/legalpage/LegalPage.jsx'
import Blog from './pages/user/blogpage/Blog.jsx'
import BlogPost from './pages/user/blogpage/BlogPost.jsx'
import Contact from './pages/user/contactpage/Contact.jsx'
import Offers from './pages/user/offerspage/Offers.jsx'
import Login from './pages/user/loginpage/Login.jsx'
import ResetPassword from './pages/user/loginpage/ResetPassword.jsx'
import VerifyEmail from './pages/user/loginpage/VerifyEmail.jsx'
import Dashboard from './pages/user/dashboardpage/Dashboard.jsx'
import { LegacySettingsRedirect } from './pages/user/settingspage/Settings.jsx'
import Checkout from './pages/user/checkoutpage/Checkout.jsx'
import Learn from './pages/user/learnpage/Learn.jsx'
import Support from './pages/user/supportpage/Support.jsx'
import NewTicket from './pages/user/supportpage/NewTicket.jsx'
import TicketThread from './pages/user/supportpage/TicketThread.jsx'
import NotFound from './pages/user/notfoundpage/NotFound.jsx'
import RootSlug, { ToRootSlug } from './pages/user/RootSlug.jsx'

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
import AdminEnquiries from './pages/admin/enquiriespage/AdminEnquiries.jsx'
import AdminTickets from './pages/admin/ticketspage/AdminTickets.jsx'
import AdminSettings from './pages/admin/settingspage/AdminSettings.jsx'
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
          <Route path="/our-ideology" element={<Ideology />} />
          {/* Services (was Mentoring) — landing + per-program pages */}
          <Route path="/services" element={<Services />} />
          <Route path="/services/compare" element={<CompareServices />} />
          <Route path="/services/:slug" element={<ServiceProgram />} />
          <Route path="/mentoring" element={<Navigate to="/services" replace />} />
          <Route path="/book-online" element={<BookOnline />} />
          <Route path="/skill-build/nirmaan" element={<Nirmaan />} />
          <Route path="/skill-build/psychometric-testing" element={<Psychometric />} />
          {/* Scholarship (user-facing) hidden for now — admin side stays active.
          <Route path="/nirmaan-scholarship" element={<Scholarship />} />
          <Route path="/nirmaan-scholarship/test" element={<ProtectedRoute><ScholarshipTest /></ProtectedRoute>} />
          <Route path="/scholarship" element={<Navigate to="/nirmaan-scholarship" replace />} />
          <Route path="/organisations" element={<Organisations />} />
          */}
          <Route path="/resources" element={<Resources view="all" />} />
          <Route path="/resources/career-library" element={<Resources view="career-library" />} />
          <Route path="/resources/faqs" element={<Resources view="faqs" />} />
          <Route path="/resources/success-stories" element={<Resources view="success-stories" />} />
          <Route path="/career-library/:slug" element={<ToRootSlug />} />
          <Route path="/legal/:slug" element={<LegalPage />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<ToRootSlug />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/offers" element={<Offers />} />

          {/* Auth + unified account */}
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          {/* The dashboard holds its sidebar tab in the path - services,
              skill-build, downloads, settings - and Settings keeps its own
              ?section=orders&order=ID inside that. */}
          <Route
            path="/dashboard/:tab?"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          {/* Old addresses, kept so bookmarks and links still land somewhere. */}
          <Route path="/settings" element={<LegacySettingsRedirect />} />
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
          <Route path="/downloads" element={<Navigate to="/dashboard/downloads" replace />} />
          {/* Help & support. "/support/new" is declared before "/support/:id"
              so the word "new" is never read as a ticket id. */}
          <Route
            path="/support"
            element={
              <ProtectedRoute>
                <Support />
              </ProtectedRoute>
            }
          />
          <Route
            path="/support/new"
            element={
              <ProtectedRoute>
                <NewTicket />
              </ProtectedRoute>
            }
          />
          <Route
            path="/support/:id"
            element={
              <ProtectedRoute>
                <TicketThread />
              </ProtectedRoute>
            }
          />

          {/* The legacy WordPress site served every article and career page from
              the root — svastrino.com/law/ — and those addresses carry the
              site's search ranking, so they still answer here. Declared last so
              every real route above wins first; an unknown slug falls through
              to Not Found exactly as before. */}
          <Route path="/:slug" element={<RootSlug />} />

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
                  <Route path="/enquiries" element={<AdminEnquiries />} />
                  <Route path="/tickets" element={<AdminTickets />} />
                  <Route path="/coupons" element={<AdminCoupons />} />
                  <Route path="/orders" element={<AdminOrders />} />
                  <Route path="/assessments" element={<AdminAssessments />} />
                  <Route path="/mentoring" element={<AdminMentoring />} />
                  <Route path="/roles" element={<AdminRoles />} />
                  <Route path="/settings" element={<AdminSettings />} />
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
