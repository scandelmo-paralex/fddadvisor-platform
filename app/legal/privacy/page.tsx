import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Privacy Policy | FDDHub",
  description: "Privacy Policy for FDDHub and FDDAdvisor platforms - CCPA/CPRA Compliant",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <article className="prose prose-gray max-w-none">
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last Updated: December 17, 2025</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
            <p>
              Paralex Inc. ("Company," "we," "us," or "our") operates FDDHub and FDDAdvisor 
              (collectively, the "Service"). This Privacy Policy explains how we collect, use, 
              disclose, and safeguard your information when you use our Service.
            </p>
            <p>
              We are committed to protecting your privacy and complying with applicable data protection 
              laws, including the California Consumer Privacy Act (CCPA), as amended by the California 
              Privacy Rights Act (CPRA).
            </p>
            <p>
              By using the Service, you consent to the data practices described in this Privacy Policy. 
              If you do not agree with our policies, please do not use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-lg font-medium mt-6 mb-3">2.1 Information You Provide</h3>
            <p>We collect information you voluntarily provide when you:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Create an account:</strong> Name, email address, phone number, password, 
                company name (for franchisors/lenders), city, and state
              </li>
              <li>
                <strong>Complete your profile:</strong> Investment range, industries of interest, 
                buying timeline, business experience, and location preferences
              </li>
              <li>
                <strong>Use the Service:</strong> Questions asked to AI tools, notes saved, 
                documents uploaded, and communications with franchisors
              </li>
              <li>
                <strong>Contact us:</strong> Information in your inquiries, feedback, or support requests
              </li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">2.2 Information Collected Automatically</h3>
            <p>When you use the Service, we automatically collect:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Usage data:</strong> Pages visited, features used, time spent on pages, 
                sections of FDDs viewed, questions asked to AI chat, and interaction patterns
              </li>
              <li>
                <strong>Device information:</strong> Browser type, operating system, device type, 
                screen resolution, and unique device identifiers
              </li>
              <li>
                <strong>Log data:</strong> IP address, access times, referring URLs, and error logs
              </li>
              <li>
                <strong>Cookies and tracking technologies:</strong> Information collected through 
                cookies, pixels, and similar technologies (see Section 7)
              </li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">2.3 Information from Third Parties</h3>
            <p>We may receive information from:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Franchisors:</strong> When a franchisor invites you to view an FDD, they 
                provide us with your name, email, and phone number
              </li>
              <li>
                <strong>Authentication providers:</strong> If you sign in using third-party services
              </li>
              <li>
                <strong>Analytics providers:</strong> Aggregated usage statistics and performance data
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, maintain, and improve the Service</li>
              <li>Create and manage your account</li>
              <li>Deliver FDDs and facilitate communications between buyers and franchisors</li>
              <li>Power AI-assisted features to help you understand FDD content</li>
              <li>Generate engagement analytics and lead intelligence for franchisors</li>
              <li>Send you service-related communications and updates</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Analyze usage patterns to improve user experience</li>
              <li>Detect, prevent, and address fraud, security issues, and technical problems</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. How We Share Your Information</h2>
            
            <h3 className="text-lg font-medium mt-6 mb-3">4.1 With Franchisors (for Buyers)</h3>
            <p>
              When you access an FDD through an invitation from a franchisor, we share certain 
              information with that franchisor, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your name, email, phone number, and location</li>
              <li>Engagement data: time spent viewing the FDD, sections viewed, questions asked</li>
              <li>Profile information you have chosen to share</li>
            </ul>
            <p>
              This information helps franchisors understand your interest level and provide better 
              service. Franchisors cannot see your activity on other franchises' FDDs.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3">4.2 Service Providers</h3>
            <p>We share information with third-party service providers who perform services on our behalf:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Supabase:</strong> Database hosting and authentication</li>
              <li><strong>Vercel:</strong> Website hosting and deployment</li>
              <li><strong>Google Cloud / Gemini:</strong> AI processing and analytics</li>
              <li><strong>Anthropic:</strong> AI-powered chat assistance</li>
              <li><strong>Resend:</strong> Email delivery</li>
              <li><strong>Sentry:</strong> Error monitoring and performance tracking</li>
            </ul>
            <p>
              These providers are contractually obligated to protect your information and use it 
              only for the purposes we specify.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3">4.3 Legal Requirements</h3>
            <p>We may disclose your information if required to do so by law or in response to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Valid legal process (subpoenas, court orders, government requests)</li>
              <li>Protect our rights, privacy, safety, or property</li>
              <li>Enforce our Terms of Service</li>
              <li>Protect against legal liability</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">4.4 Business Transfers</h3>
            <p>
              If we are involved in a merger, acquisition, or sale of assets, your information may 
              be transferred as part of that transaction. We will notify you of any such change 
              and any choices you may have regarding your information.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3">4.5 We Do Not Sell Your Personal Information</h3>
            <p className="font-semibold">
              We do not sell, rent, or trade your personally identifiable information to third parties for their 
              marketing purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Your Privacy Rights (CCPA/CPRA)</h2>
            <p>
              If you are a California resident, you have specific rights under the California Consumer 
              Privacy Act (CCPA) and California Privacy Rights Act (CPRA):
            </p>
            
            <h3 className="text-lg font-medium mt-6 mb-3">5.1 Right to Know</h3>
            <p>
              You have the right to request information about the categories and specific pieces of 
              personal information we have collected about you, the sources of that information, 
              the purposes for collecting it, and the categories of third parties with whom we share it.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3">5.2 Right to Delete</h3>
            <p>
              You have the right to request deletion of your personal information, subject to certain 
              exceptions (such as completing a transaction, complying with legal obligations, or 
              detecting security incidents).
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3">5.3 Right to Correct</h3>
            <p>
              You have the right to request correction of inaccurate personal information we maintain about you.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3">5.4 Right to Opt-Out</h3>
            <p>
              You have the right to opt-out of the sale or sharing of your personal information. 
              As noted above, we do not sell your personal information.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3">5.5 Right to Non-Discrimination</h3>
            <p>
              We will not discriminate against you for exercising any of your privacy rights.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3">5.6 How to Exercise Your Rights</h3>
            <p>To exercise any of these rights, you may:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Email us at privacy@fddhub.com</li>
              <li>Use the account settings in your profile</li>
              <li>Contact us using the information in Section 12</li>
            </ul>
            <p>
              We will verify your identity before processing your request. You may also designate 
              an authorized agent to make a request on your behalf.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide the Service and maintain your account</li>
              <li>Comply with legal obligations (e.g., FTC Franchise Rule recordkeeping requirements)</li>
              <li>Resolve disputes and enforce our agreements</li>
              <li>Improve our Service and develop new features</li>
            </ul>
            <p>
              When you delete your account, we will delete or anonymize your personal information 
              within 90 days, except where retention is required by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Cookies and Tracking Technologies</h2>
            <p>
              We use cookies and similar tracking technologies to collect and store information about 
              your interactions with the Service:
            </p>
            
            <h3 className="text-lg font-medium mt-6 mb-3">7.1 Types of Cookies We Use</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Essential cookies:</strong> Required for the Service to function (authentication, 
                security, session management)
              </li>
              <li>
                <strong>Analytics cookies:</strong> Help us understand how you use the Service 
                (page views, feature usage, performance)
              </li>
              <li>
                <strong>Preference cookies:</strong> Remember your settings and preferences
              </li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">7.2 Your Cookie Choices</h3>
            <p>
              Most browsers allow you to control cookies through settings. However, disabling certain 
              cookies may limit your ability to use some features of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal 
              information, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Encryption of data in transit (TLS/SSL) and at rest</li>
              <li>Secure authentication and access controls</li>
              <li>Regular security assessments and monitoring</li>
              <li>Employee training on data protection</li>
              <li>Incident response procedures</li>
            </ul>
            <p>
              However, no method of transmission over the Internet or electronic storage is 100% secure. 
              While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Children's Privacy</h2>
            <p>
              The Service is not intended for individuals under 18 years of age. We do not knowingly 
              collect personal information from children. If you believe we have collected information 
              from a child, please contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. 
              These countries may have data protection laws different from your country. By using the 
              Service, you consent to the transfer of your information to the United States and other 
              jurisdictions where we or our service providers operate.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">11. Governing Law</h2>
            <p>
              This Privacy Policy shall be governed by and construed in accordance with the laws of 
              the State of Texas, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">12. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material 
              changes by posting the updated policy on this page with a new "Last Updated" date. 
              For significant changes, we may also send you an email notification.
            </p>
            <p>
              We encourage you to review this Privacy Policy periodically. Your continued use of the 
              Service after any changes constitutes your acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">13. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, want to exercise your privacy rights, 
              or have concerns about our data practices, please contact us:
            </p>
            <div className="bg-muted p-4 rounded-lg mt-4">
              <p className="font-semibold">Paralex Inc.</p>
              <p>Privacy Inquiries</p>
              <p>Email: privacy@fddhub.com</p>
              <p>Address: Houston, Texas</p>
            </div>
            <p className="mt-4">
              For CCPA/CPRA requests, please include "Privacy Rights Request" in your subject line 
              and provide sufficient information for us to verify your identity.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">14. Additional Disclosures</h2>
            
            <h3 className="text-lg font-medium mt-6 mb-3">Categories of Personal Information Collected (Last 12 Months)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300 mt-4">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-gray-300 px-4 py-2 text-left">Category</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Examples</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Collected</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Identifiers</td>
                    <td className="border border-gray-300 px-4 py-2">Name, email, phone, IP address</td>
                    <td className="border border-gray-300 px-4 py-2">Yes</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Commercial Information</td>
                    <td className="border border-gray-300 px-4 py-2">Investment preferences, franchise interests</td>
                    <td className="border border-gray-300 px-4 py-2">Yes</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Internet Activity</td>
                    <td className="border border-gray-300 px-4 py-2">Browsing history, interactions with Service</td>
                    <td className="border border-gray-300 px-4 py-2">Yes</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Geolocation Data</td>
                    <td className="border border-gray-300 px-4 py-2">City, state (user-provided)</td>
                    <td className="border border-gray-300 px-4 py-2">Yes</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Professional Information</td>
                    <td className="border border-gray-300 px-4 py-2">Business experience, occupation</td>
                    <td className="border border-gray-300 px-4 py-2">Yes</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Inferences</td>
                    <td className="border border-gray-300 px-4 py-2">Investment intent, engagement level</td>
                    <td className="border border-gray-300 px-4 py-2">Yes</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </article>

        <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Paralex Inc. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link href="/legal/terms" className="hover:text-foreground">Terms of Service</Link>
            <span>•</span>
            <Link href="/legal/privacy" className="hover:text-foreground">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
