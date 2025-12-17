import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Terms of Service | FDDHub",
  description: "Terms of Service for FDDHub and FDDAdvisor platforms",
}

export default function TermsOfServicePage() {
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
          <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last Updated: December 17, 2025</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using FDDHub, FDDAdvisor, or any related services (collectively, the "Service") 
              operated by Paralex Inc. ("Company," "we," "us," or "our"), you agree to be bound by these 
              Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Service.
            </p>
            <p>
              These Terms apply to all visitors, users, and others who access or use the Service, including 
              but not limited to franchise buyers ("Buyers"), franchisors ("Franchisors"), and lenders ("Lenders").
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Description of Service</h2>
            <p>
              FDDHub is a franchise intelligence platform that facilitates the distribution and analysis of 
              Franchise Disclosure Documents ("FDDs"). FDDAdvisor is a complementary research tool that provides 
              independent analysis of franchise opportunities, including our proprietary FranchiseScore™ rating system.
            </p>
            <p>The Service includes, but is not limited to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Secure delivery and viewing of Franchise Disclosure Documents</li>
              <li>FranchiseScore™ independent ratings and analysis</li>
              <li>AI-powered educational tools to help understand FDD content</li>
              <li>Lead management and engagement analytics for franchisors</li>
              <li>Communication tools between franchisors and prospective franchisees</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. User Accounts</h2>
            <p>
              To access certain features of the Service, you must create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and promptly update your account information</li>
              <li>Maintain the security of your password and accept all risks of unauthorized access</li>
              <li>Immediately notify us of any unauthorized use of your account</li>
              <li>Not share your account credentials with any third party</li>
            </ul>
            <p>
              You are responsible for all activities that occur under your account. We reserve the right to 
              suspend or terminate accounts that violate these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Intellectual Property Rights</h2>
            
            <h3 className="text-lg font-medium mt-6 mb-3">4.1 Company Intellectual Property</h3>
            <p>
              The Service and its original content, features, functionality, and all related intellectual 
              property rights are and will remain the exclusive property of Paralex Inc. and its licensors. 
              This includes, without limitation:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The FranchiseScore™ rating system, methodology, algorithms, and all associated data</li>
              <li>The FDDHub and FDDAdvisor platforms, including all software, code, and architecture</li>
              <li>All trademarks, service marks, logos, and trade names</li>
              <li>All analytical models, scoring rubrics, and proprietary methodologies</li>
              <li>User interface designs, layouts, and visual elements</li>
              <li>Documentation, guides, and educational content</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">4.2 Prohibition on Reverse Engineering</h3>
            <p className="font-semibold text-destructive">
              YOU EXPRESSLY AGREE THAT YOU WILL NOT, AND WILL NOT PERMIT ANY THIRD PARTY TO:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Reverse engineer, decompile, disassemble, or otherwise attempt to derive the source code, 
                algorithms, data structures, or underlying ideas of any part of the Service
              </li>
              <li>
                Attempt to reconstruct, replicate, or reverse engineer the FranchiseScore™ methodology, 
                scoring algorithms, or rating system
              </li>
              <li>
                Use any automated means, including bots, scrapers, or crawlers, to access, extract, or 
                collect data from the Service
              </li>
              <li>
                Attempt to probe, scan, or test the vulnerability of the Service or circumvent any 
                security measures
              </li>
              <li>
                Access or attempt to access any systems, data, or information not intentionally made 
                available through the Service
              </li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">4.3 Prohibition on Derivative and Competitive Works</h3>
            <p className="font-semibold text-destructive">
              YOU EXPRESSLY AGREE THAT YOU WILL NOT, DIRECTLY OR INDIRECTLY:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Create, develop, or distribute any product, service, or system that competes with or is 
                substantially similar to the Service, FranchiseScore™, FDDHub, or FDDAdvisor
              </li>
              <li>
                Use information, insights, methodologies, or knowledge gained from the Service to create 
                any competing franchise intelligence, rating, or analysis platform
              </li>
              <li>
                Create derivative works based on the Service, including but not limited to franchise 
                scoring systems, FDD analysis tools, or franchise buyer platforms
              </li>
              <li>
                License, sublicense, sell, resell, transfer, assign, or otherwise commercially exploit 
                or make available to any third party the Service or any content obtained through the Service
              </li>
              <li>
                Aggregate, republish, redistribute, or create databases from FranchiseScore™ ratings, 
                analyses, or any other proprietary data from the Service
              </li>
              <li>
                Use the Service to develop or train any artificial intelligence, machine learning model, 
                or similar technology that could be used to compete with the Service
              </li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">4.4 FranchiseScore™ Specific Restrictions</h3>
            <p>
              FranchiseScore™ is a proprietary rating methodology protected by trade secret and other 
              intellectual property laws. You acknowledge and agree that:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                FranchiseScore™ ratings are provided for informational purposes only and remain the 
                exclusive property of Paralex Inc.
              </li>
              <li>
                You may not reproduce, copy, modify, or distribute FranchiseScore™ ratings without 
                express written permission
              </li>
              <li>
                You may not use FranchiseScore™ ratings in any marketing, advertising, or promotional 
                materials without our prior written consent
              </li>
              <li>
                Any unauthorized use of FranchiseScore™ may result in immediate termination of your 
                account and legal action
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. User Conduct</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violate any applicable laws, regulations, or third-party rights</li>
              <li>Upload or transmit viruses, malware, or other malicious code</li>
              <li>Interfere with or disrupt the Service or servers connected to the Service</li>
              <li>Impersonate any person or entity or misrepresent your affiliation</li>
              <li>Harvest, collect, or store personal data about other users</li>
              <li>Send unsolicited communications, promotions, or spam</li>
              <li>Engage in any activity that could damage, disable, or impair the Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Franchise Disclosure Documents and FDD Integrity</h2>
            
            <h3 className="text-lg font-medium mt-6 mb-3">6.1 FDD Delivery</h3>
            <p>
              FDDHub facilitates the electronic delivery of FDDs in compliance with the FTC Franchise Rule, 
              16 C.F.R. Part 436. Franchisors are solely responsible for ensuring their FDDs are accurate, 
              current, and properly registered in applicable states.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3">6.2 FDD Integrity and Non-Modification</h3>
            <p className="font-semibold">
              YOU ACKNOWLEDGE AND AGREE THAT:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                The Franchise Disclosure Document provided through the Service is the official disclosure 
                document prepared and filed by the applicable franchisor in compliance with the FTC Franchise 
                Rule and applicable state franchise laws
              </li>
              <li>
                FranchiseScore™ ratings, analyses, and all other content provided by the Service are 
                separate and distinct from the FDD and do not modify, amend, supplement, or otherwise 
                alter the FDD in any way
              </li>
              <li>
                The Service displays the FDD in its complete, unmodified form as provided by the franchisor, 
                and no content generated by the Service, including but not limited to FranchiseScore™ ratings, 
                AI-generated summaries, or analytical commentary, shall be construed as part of the FDD
              </li>
              <li>
                Any discrepancy between the FDD and content provided by the Service shall be resolved in 
                favor of the information contained in the FDD
              </li>
              <li>
                The FDD remains the sole authoritative source of disclosure information required by federal 
                and state law, and you should rely exclusively on the FDD for purposes of franchise disclosure 
                compliance
              </li>
            </ul>
          </section>

          <section className="mb-8 bg-amber-50 border border-amber-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-amber-900">7. FranchiseScore™ Disclaimers</h2>
            
            <h3 className="text-lg font-medium mt-4 mb-3 text-amber-800">7.1 Independence from Franchisors</h3>
            <p className="font-semibold text-amber-900 uppercase mb-3">
              FRANCHISESCORE™ IS INDEPENDENT THIRD-PARTY ANALYSIS. IT IS NOT PREPARED, REVIEWED, APPROVED, 
              ENDORSED, OR SPONSORED BY ANY FRANCHISOR.
            </p>
            <p className="text-amber-800">
              FranchiseScore™ ratings and all associated analyses are prepared solely by Paralex Inc. 
              based on publicly available information contained in Franchise Disclosure Documents. No 
              franchisor has any editorial control, approval rights, or influence over FranchiseScore™ 
              ratings or methodologies. FranchiseScore™ ratings represent the independent analytical 
              conclusions of Paralex Inc. and do not represent the views, opinions, or endorsement of 
              any franchisor.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3 text-amber-800">7.2 Not Legal, Financial, or Investment Advice</h3>
            <p className="font-semibold text-amber-900 uppercase mb-3">
              FRANCHISESCORE™ DOES NOT CONSTITUTE AND SHALL NOT BE CONSTRUED AS LEGAL ADVICE, FINANCIAL 
              ADVICE, INVESTMENT ADVICE, TAX ADVICE, OR ANY OTHER FORM OF PROFESSIONAL ADVICE.
            </p>
            <p className="text-amber-800">
              FranchiseScore™ ratings are provided for general informational and educational purposes only. 
              The ratings are analytical tools designed to help you organize and evaluate information 
              disclosed in FDDs, but they are not a substitute for professional guidance. A FranchiseScore™ 
              rating does not constitute a recommendation to purchase, not purchase, invest in, or avoid 
              any particular franchise opportunity. You should not make any franchise investment decision 
              based solely or primarily on a FranchiseScore™ rating.
            </p>
            <p className="text-amber-800 mt-3 font-semibold">
              YOU ARE STRONGLY ADVISED TO CONSULT WITH A QUALIFIED FRANCHISE ATTORNEY, CERTIFIED PUBLIC 
              ACCOUNTANT, AND/OR LICENSED FINANCIAL ADVISOR BEFORE MAKING ANY FRANCHISE INVESTMENT DECISION.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3 text-amber-800">7.3 Not a Financial Performance Representation</h3>
            <p className="font-semibold text-amber-900 uppercase mb-3">
              FRANCHISESCORE™ IS NOT A FINANCIAL PERFORMANCE REPRESENTATION AS DEFINED BY THE FTC FRANCHISE 
              RULE, 16 C.F.R. § 436.1(e).
            </p>
            <p className="text-amber-800">
              FranchiseScore™ does not state, expressly or by implication, a specific level or range of 
              actual or potential sales, income, gross profits, or net profits that you may achieve as a 
              franchisee. FranchiseScore™ evaluates disclosure quality, franchisor stability, franchisee 
              support systems, and business fundamentals based on information disclosed in the FDD, but 
              it does not predict, project, or estimate your individual financial performance or return 
              on investment. Past performance of existing franchisees, as disclosed in Item 19 of the FDD 
              or otherwise, is not indicative of your future results.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3 text-amber-800">7.4 Limitations of Analysis</h3>
            <p className="text-amber-800">
              FranchiseScore™ ratings are based on information available in FDDs at the time of analysis 
              and may not reflect current conditions, recent developments, or information not disclosed 
              in the FDD. Paralex Inc. does not independently verify the accuracy of information disclosed 
              in FDDs and relies on the franchisor's representations. FranchiseScore™ ratings may change 
              over time as new information becomes available. A high FranchiseScore™ rating does not 
              guarantee franchise success, and a low rating does not necessarily indicate franchise failure.
            </p>

            <h3 className="text-lg font-medium mt-6 mb-3 text-amber-800">7.5 No Warranty of Accuracy</h3>
            <p className="font-semibold text-amber-900 uppercase mb-3">
              PARALEX INC. MAKES NO WARRANTY, EXPRESS OR IMPLIED, REGARDING THE ACCURACY, COMPLETENESS, 
              RELIABILITY, OR SUITABILITY OF FRANCHISESCORE™ RATINGS FOR ANY PARTICULAR PURPOSE.
            </p>
            <p className="text-amber-800">
              FranchiseScore™ ratings are provided "as is" without any guarantees. Paralex Inc. disclaims 
              all liability for any errors, omissions, or inaccuracies in FranchiseScore™ ratings. Your 
              use of and reliance on FranchiseScore™ ratings is entirely at your own risk.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. AI-Powered Features</h2>
            <p>
              The Service includes artificial intelligence-powered features, including but not limited to 
              AI chat assistants and automated analysis tools. You acknowledge and agree that:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                AI-generated content is provided for informational and educational purposes only and does 
                not constitute professional advice
              </li>
              <li>
                AI responses are based on information in the FDD and may not be complete or accurate
              </li>
              <li>
                AI-generated content does not modify or supplement the FDD
              </li>
              <li>
                You should verify any AI-generated information against the original FDD and consult with 
                qualified professionals
              </li>
              <li>
                AI features are tools to assist your research, not replacements for professional due diligence
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Fees and Payment</h2>
            <p>
              Certain features of the Service may require payment of fees. All fees are stated in U.S. dollars 
              and are non-refundable unless otherwise specified. We reserve the right to modify our pricing 
              at any time with reasonable notice.
            </p>
            <p>
              For subscription services, your subscription will automatically renew unless you cancel before 
              the renewal date. You are responsible for all applicable taxes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Privacy</h2>
            <p>
              Your use of the Service is also governed by our{" "}
              <Link href="/legal/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              , which is incorporated into these Terms by reference. Please review our Privacy Policy to 
              understand our practices regarding your personal information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">11. Disclaimer of Warranties</h2>
            <p className="uppercase font-semibold">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER 
              EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, 
              FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
            </p>
            <p>
              We do not warrant that the Service will be uninterrupted, secure, or error-free, that defects 
              will be corrected, or that the Service is free of viruses or other harmful components.
            </p>
            <p>
              FranchiseScore™ ratings and analyses are based on publicly available information in FDDs and 
              may not reflect current conditions. We make no representations or warranties regarding the 
              accuracy, completeness, or reliability of any FranchiseScore™ rating or analysis.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">12. Limitation of Liability</h2>
            <p className="uppercase font-semibold">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, PARALEX INC. AND ITS OFFICERS, DIRECTORS, EMPLOYEES, 
              AGENTS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, 
              OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR GOODWILL, 
              ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE, INCLUDING BUT NOT LIMITED TO 
              ANY RELIANCE ON FRANCHISESCORE™ RATINGS OR OTHER CONTENT PROVIDED THROUGH THE SERVICE.
            </p>
            <p>
              IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING TO 
              THE SERVICE EXCEED THE AMOUNT YOU PAID US, IF ANY, IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
            </p>
            <p className="mt-4">
              YOU SPECIFICALLY ACKNOWLEDGE THAT PARALEX INC. SHALL NOT BE LIABLE FOR ANY LOSSES OR DAMAGES 
              ARISING FROM YOUR DECISION TO INVEST OR NOT INVEST IN ANY FRANCHISE OPPORTUNITY, REGARDLESS 
              OF WHETHER SUCH DECISION WAS INFLUENCED BY FRANCHISESCORE™ RATINGS OR OTHER CONTENT PROVIDED 
              THROUGH THE SERVICE.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">13. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Paralex Inc. and its officers, directors, 
              employees, agents, and affiliates from and against any claims, liabilities, damages, losses, 
              costs, or expenses (including reasonable attorneys' fees) arising out of or in connection with:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of a third party</li>
              <li>Any content you submit or transmit through the Service</li>
              <li>Any franchise investment decision you make based in whole or in part on the Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">14. Termination</h2>
            <p>
              We may terminate or suspend your account and access to the Service immediately, without prior 
              notice or liability, for any reason, including if you breach these Terms.
            </p>
            <p>
              Upon termination, your right to use the Service will immediately cease. All provisions of 
              these Terms that by their nature should survive termination shall survive, including but not 
              limited to intellectual property provisions, warranty disclaimers, indemnification, and 
              limitations of liability.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">15. Governing Law and Dispute Resolution</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of 
              Texas, without regard to its conflict of law provisions.
            </p>
            <p>
              Any dispute arising out of or relating to these Terms or the Service shall be resolved 
              exclusively in the state or federal courts located in Austin, Travis County, Texas, and you consent 
              to the personal jurisdiction of such courts.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">16. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will provide notice of material 
              changes by posting the updated Terms on this page with a new "Last Updated" date. Your 
              continued use of the Service after any changes constitutes your acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">17. Miscellaneous</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you 
                and Paralex Inc. regarding the Service.
              </li>
              <li>
                <strong>Severability:</strong> If any provision of these Terms is found to be unenforceable, 
                the remaining provisions will remain in full force and effect.
              </li>
              <li>
                <strong>Waiver:</strong> Our failure to enforce any right or provision of these Terms will 
                not be considered a waiver of such right or provision.
              </li>
              <li>
                <strong>Assignment:</strong> You may not assign or transfer these Terms without our prior 
                written consent. We may assign these Terms without restriction.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">18. Contact Information</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="bg-muted p-4 rounded-lg mt-4">
              <p className="font-semibold">Paralex Inc.</p>
              <p>Email: legal@fddhub.com</p>
              <p>Address: Houston, Texas</p>
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
