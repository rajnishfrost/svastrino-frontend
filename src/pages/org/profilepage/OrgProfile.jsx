import { useOrg } from '../../../common_component/org/OrgContext/OrgContext.jsx'
import '../../admin/adminShared.css'

/**
 * The institute's own details, read-only. Everything here is kept by the
 * Svastrino team (Admin → Users / Institutions); the institute asks us to
 * change anything, and the server has no route for it to edit itself.
 */
function Row({ label, children }) {
  return (
    <div className="adm-field">
      <label>{label}</label>
      <div style={{ fontSize: 15, padding: '4px 0', overflowWrap: 'anywhere' }}>{children || '—'}</div>
    </div>
  )
}

export default function OrgProfile() {
  const { organisation: o, typeLabel, sponsoredCourses = [] } = useOrg()
  if (!o) return null

  return (
    <div>
      <h1 className="adm-title">Institute</h1>
      <p className="adm-sub">
        Your institute’s details as Svastrino holds them. To change anything, contact the Svastrino team.
      </p>

      <section className="adm-panel" style={{ maxWidth: 720 }}>
        <div className="adm-row2">
          <Row label="Institute name">{o.name}</Row>
          <Row label="Type">{typeLabel}</Row>
        </div>
        <Row label="About">{o.description && <span style={{ whiteSpace: 'pre-line' }}>{o.description}</span>}</Row>
        <div className="adm-row2">
          <Row label="Branch / campus">{o.branch}</Row>
          <Row label="Website">{o.website && <a href={o.website} target="_blank" rel="noreferrer">{o.website}</a>}</Row>
        </div>
        <Row label="Address">{o.address}</Row>
        <div className="adm-row2">
          <Row label="City">{o.city}</Row>
          <Row label="State">{o.state}</Row>
        </div>
        <div className="adm-row2">
          <Row label="Pincode">{o.pincode}</Row>
          <Row label="Contact person">{o.contactPerson}</Row>
        </div>
        <div className="adm-row2">
          <Row label="Phone">{o.phone}</Row>
          <Row label="Login email">{o.email}</Row>
        </div>
        <Row label="Public partner directory">
          {o.publicListed ? 'Listed on /organisations' : 'Not listed'}
        </Row>
      </section>

      <section className="adm-panel" style={{ maxWidth: 720 }}>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>Course allotted to your students</h2>
        {sponsoredCourses.length ? (
          <p className="adm-sub" style={{ margin: 0 }}>
            <strong style={{ fontSize: 18, color: 'var(--navy)' }}>{sponsoredCourses.map((c) => c.name).join(', ')}</strong>
            <br />Every student you add receives it the moment they set their password. Contact us to change it.
          </p>
        ) : (
          <p className="adm-sub" style={{ margin: 0 }}>No course is allotted yet — contact us to sponsor one for your students.</p>
        )}
      </section>

      <section className="adm-panel" style={{ maxWidth: 720 }}>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>Your institute code</h2>
        <p className="adm-sub" style={{ margin: 0 }}>
          <strong style={{ fontSize: 18, color: 'var(--navy)' }}>{o.code || '—'}</strong>
          <br />Share this with students so they can find you when enrolling themselves.
        </p>
      </section>
    </div>
  )
}
