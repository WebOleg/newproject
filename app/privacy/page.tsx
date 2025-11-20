import Link from "next/link"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="section-padding bg-gradient-to-br from-primary/5 to-primary/10 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/abstract-professional-water-waves-pattern.jpg"
            alt=""
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="container-custom relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">Privacy Policy</h1>
            <p className="text-lg text-muted-foreground text-pretty">Effective date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="prose prose-neutral dark:prose-invert max-w-4xl mx-auto">
            <p>
              This Privacy Policy explains how MeLinux Ltd. ("we", "us", "our") collects, uses, and protects your
              personal data when you use our website and services.
            </p>

            <h2>Who We Are</h2>
            <p>
              MeLinux Ltd., Protara Leoforos No.259M, Kykladon B Block M, Flat 3, Paralimni 5291, Cyprus.
              Contact: mail@melinux.net, +357 99 746668.
            </p>

            <h2>Data We Collect</h2>
            <ul>
              <li>
                Contact form: name, email, and message content you submit. This is sent to us via email using our
                secure mail transport and is used solely to respond to your inquiry.
              </li>
              <li>
                Service communications: if you contact us directly, we may process the data needed to handle your
                request.
              </li>
              <li>
                Usage data: standard web logs (e.g., IP address, browser type) for security and troubleshooting.
              </li>
            </ul>

            <h2>Purpose and Legal Basis</h2>
            <ul>
              <li>Responding to inquiries (legitimate interests and/or performance of a contract).</li>
              <li>Operating and securing our website (legitimate interests).</li>
              <li>Complying with legal obligations (e.g., accounting, regulatory requirements).</li>
            </ul>

            <h2>How We Process Contact Form Data</h2>
            <p>
              When you submit the contact form, your data is validated and emailed to our team. We may reply using the
              email provided. The data is not stored in a public database; it is routed via our email system for
              handling your request.
            </p>

            <h2>Sharing Your Data</h2>
            <p>
              We do not sell your personal data. We may share data with service providers strictly necessary to operate
              our services (e.g., email infrastructure). In the context of factoring and related services, we may share
              data with financial partners as required and only with appropriate safeguards and legal bases.
            </p>

            <h2>Regulated Activities and Roles</h2>
            <p>
              We provide accounting and tax advice and administrative assistance. We do not provide regulated legal
              services or act as a licensed fiduciary. Where a service requires licensing in Cyprus, such activities are
              performed by the client or by appropriately licensed partners. In those cases, we may share only the
              minimum necessary personal data with such partners under suitable legal bases and safeguards.
            </p>

            <h2>International Transfers</h2>
            <p>
              Where data is transferred outside the EEA, we implement appropriate safeguards (e.g., Standard
              Contractual Clauses) as required by law.
            </p>

            <h2>Data Retention</h2>
            <p>
              We keep personal data only as long as necessary for the purposes described above or as required by law. For
              example, platform transaction data related to services may be subject to retention schedules required by
              financial regulations.
            </p>

            <h2>Your Rights</h2>
            <ul>
              <li>Access, rectify, or erase your personal data.</li>
              <li>Restrict or object to processing, and data portability where applicable.</li>
              <li>Withdraw consent where processing is based on consent.</li>
              <li>Complain to your local data protection authority.</li>
            </ul>

            <h2>Security</h2>
            <p>
              We apply technical and organizational measures to protect your data, including transport encryption and
              access controls. No method is 100% secure, but we continuously improve our safeguards.
            </p>

            <h2>Children</h2>
            <p>Our services are not directed to children under 16, and we do not knowingly collect their data.</p>

            <h2>Third‑Party Links</h2>
            <p>
              Our website may contain links to third‑party sites. We are not responsible for their privacy practices.
            </p>

            <h2>Contact</h2>
            <p>
              For privacy matters, contact us at <Link href="mailto:mail@melinux.net">mail@melinux.net</Link> or by
              post at the address above.
            </p>

            <h2>Changes</h2>
            <p>
              We may update this Privacy Policy from time to time. The updated version will be posted on this page with
              the effective date.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}


