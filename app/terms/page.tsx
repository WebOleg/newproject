import Link from "next/link"

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <section className="section-padding bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: October 2025</p>

          <div className="prose prose-neutral max-w-none">
            <h2>1. About MeLinux</h2>
            <p>
              MeLinux Ltd. ("MeLinux", "we", "us") provides accounting, tax, payroll, business consulting, company
              registration, and investment-related information services to clients operating in Cyprus. Our principal
              place of business is Cyprus.
            </p>

            <h2>2. Services and Information</h2>
            <p>
              Content on this website is provided for general information. It does not constitute legal, tax, or
              investment advice. For tailored advice, please contact us directly. Any engagement for professional
              services will be governed by a separate written agreement.
            </p>

            <h2>3. Use of the Website</h2>
            <ul>
              <li>Do not misuse the website, attempt unauthorized access, or disrupt its operation.</li>
              <li>You may not copy, redistribute, or commercialize site content without our prior written consent.</li>
              <li>We may change or discontinue parts of the site without prior notice.</li>
            </ul>

            <h2>4. Client Communications</h2>
            <p>
              Submitting inquiries via our contact form does not create a client relationship. We will respond to
              reasonable inquiries, but no services are provided until an engagement is confirmed in writing.
            </p>

            <h2>5. Pricing and Engagement</h2>
            <p>
              Any fees for accounting, tax, payroll, consulting, company registration, or investment-related services
              are quoted individually and detailed in our engagement documentation.
            </p>

            <h2>6. Third-Party Content</h2>
            <p>
              The site may include links or references to third-party resources. We are not responsible for their
              content, accuracy, or availability.
            </p>

            <h2>7. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, MeLinux is not liable for any indirect, incidental, special, or
              consequential damages arising from your use of the website or reliance on its content.
            </p>

            <h2>8. Intellectual Property</h2>
            <p>
              All trademarks, logos, graphics, and site content are the property of MeLinux Ltd. or its licensors and
              are protected by applicable laws.
            </p>

            <h2>9. Privacy</h2>
            <p>
              We process personal data in accordance with applicable laws. Please review our
              <Link className="ml-1 underline" href="/privacy">Privacy Policy</Link> for details.
            </p>

            <h2>10. Regulated Activities and Compliance</h2>
            <p>
              We provide accounting and tax advice and administrative assistance. We do not provide regulated legal
              services or act as a licensed fiduciary. Where an activity requires a license in Cyprus, such services are
              performed by the client or by appropriately licensed partners, and our role is limited to advisory and
              coordination support. Engagements specifying any regulated services will identify the licensed provider.
            </p>

            <h2>11. Governing Law</h2>
            <p>These Terms are governed by the laws of Cyprus. Disputes are subject to the exclusive jurisdiction of the Cypriot courts.</p>

            <h2>12. Contact</h2>
            <p>
              For questions about these Terms or to request a proposal for services, please use our contact page:
              <Link className="ml-1 underline" href="/contact">Contact MeLinux</Link>.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}


