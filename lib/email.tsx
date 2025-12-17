import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendInvitationEmail({
  to,
  leadName,
  franchiseName,
  invitationLink,
  franchisorName,
  customMessage,
}: {
  to: string
  leadName: string
  franchiseName: string
  invitationLink: string
  franchisorName: string
  customMessage?: string
}) {
  try {
    console.log("[v0] Sending invitation email to:", to)

    const { data, error } = await resend.emails.send({
      from: "FDD Advisor <noreply@invitations.fddhub.com>",
      to: [to],
      subject: `Your ${franchiseName} FDD Invitation from ${franchisorName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">FDD Invitation</h1>
            </div>
            
            <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hi ${leadName},</p>
              
              ${
                customMessage
                  ? `
                <div style="background: #f9fafb; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; white-space: pre-wrap;">${customMessage}</p>
                </div>
              `
                  : ""
              }
              
              <p style="font-size: 16px; margin: 20px 0;">
                You've been invited to review the Franchise Disclosure Document (FDD) for <strong>${franchiseName}</strong>.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <!--[if mso]>
                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${invitationLink}" style="height:48px;v-text-anchor:middle;width:200px;" arcsize="10%" strokecolor="#667eea" fillcolor="#667eea">
                <w:anchorlock/>
                <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">View Your FDD</center>
                </v:roundrect>
                <![endif]-->
                <!--[if !mso]><!-->
                <a href="${invitationLink}" style="display: inline-block; background-color: #667eea; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; border: 1px solid #667eea;">
                  View Your FDD
                </a>
                <!--<![endif]-->
              </div>
              
              <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #667eea; font-size: 18px;">What's included:</h3>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li style="margin: 8px 0;">Complete FDD document with download capability</li>
                  <li style="margin: 8px 0;">FranchiseScore independent rating and analysis</li>
                  <li style="margin: 8px 0;">Real-time support for your questions</li>
                  <li style="margin: 8px 0;">Personalized white-labeled experience</li>
                </ul>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                This invitation was sent by ${franchisorName}. If you have any questions, please reply to this email.
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p>© ${new Date().getFullYear()} FDD Advisor. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error("[v0] Email send error:", error)
      throw error
    }

    console.log("[v0] Email sent successfully:", data)
    return { success: true, data }
  } catch (error) {
    console.error("[v0] Failed to send invitation email:", error)
    throw error
  }
}

export async function sendFDDEmail({
  to,
  leadName,
  franchiseName,
  fddLink,
  franchisorName,
}: {
  to: string
  leadName: string
  franchiseName: string
  fddLink: string
  franchisorName: string
}) {
  try {
    console.log("[v0] Sending FDD email to:", to)

    const { data, error } = await resend.emails.send({
      from: "FDD Advisor <noreply@invitations.fddhub.com>",
      to: [to],
      subject: `Your ${franchiseName} FDD from ${franchisorName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Your FDD is Ready</h1>
            </div>
            
            <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hi ${leadName},</p>
              
              <p style="font-size: 16px; margin: 20px 0;">
                Your Franchise Disclosure Document (FDD) for <strong>${franchiseName}</strong> is now available for review.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <!--[if mso]>
                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${fddLink}" style="height:48px;v-text-anchor:middle;width:200px;" arcsize="10%" strokecolor="#667eea" fillcolor="#667eea">
                <w:anchorlock/>
                <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">Access Your FDD</center>
                </v:roundrect>
                <![endif]-->
                <!--[if !mso]><!-->
                <a href="${fddLink}" style="display: inline-block; background-color: #667eea; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; border: 1px solid #667eea;">
                  Access Your FDD
                </a>
                <!--<![endif]-->
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                This FDD was sent by ${franchisorName}. If you have any questions, please reply to this email.
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p>© ${new Date().getFullYear()} FDD Advisor. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error("[v0] Email send error:", error)
      throw error
    }

    console.log("[v0] Email sent successfully:", data)
    return { success: true, data }
  } catch (error) {
    console.error("[v0] Failed to send FDD email:", error)
    throw error
  }
}

/**
 * Send team member invitation email
 */
export async function sendTeamInvitationEmail({
  to,
  memberName,
  companyName,
  role,
  invitationLink,
  invitedByName,
}: {
  to: string
  memberName: string
  companyName: string
  role: string
  invitationLink: string
  invitedByName?: string
}) {
  try {
    console.log("[v0] Sending team invitation email to:", to)

    const roleDescriptions: Record<string, string> = {
      admin: "manage your team and view all leads",
      recruiter: "send FDD invitations and manage your leads",
    }

    const roleDescription = roleDescriptions[role] || "access the platform"

    const { data, error } = await resend.emails.send({
      from: "FDDHub <noreply@invitations.fddhub.com>",
      to: [to],
      subject: `You're invited to join ${companyName} on FDDHub`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Team Invitation</h1>
            </div>
            
            <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hi ${memberName},</p>
              
              <p style="font-size: 16px; margin: 20px 0;">
                ${invitedByName ? `${invitedByName} has` : "You've been"} invited you to join <strong>${companyName}</strong> on FDDHub as a <strong>${role.charAt(0).toUpperCase() + role.slice(1)}</strong>.
              </p>

              <p style="font-size: 16px; margin: 20px 0;">
                As a ${role}, you'll be able to ${roleDescription}.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <!--[if mso]>
                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${invitationLink}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="10%" strokecolor="#3b82f6" fillcolor="#3b82f6">
                <w:anchorlock/>
                <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">Accept Invitation</center>
                </v:roundrect>
                <![endif]-->
                <!--[if !mso]><!-->
                <a href="${invitationLink}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; border: 1px solid #3b82f6;">
                  Accept Invitation
                </a>
                <!--<![endif]-->
              </div>
              
              <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #3b82f6; font-size: 16px;">What is FDDHub?</h3>
                <p style="margin: 10px 0; font-size: 14px; color: #6b7280;">
                  FDDHub is a franchise intelligence platform that helps franchisors manage leads and distribute Franchise Disclosure Documents with powerful engagement analytics.
                </p>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p>© ${new Date().getFullYear()} FDDHub. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error("[v0] Team invitation email error:", error)
      throw error
    }

    console.log("[v0] Team invitation email sent successfully:", data)
    return { success: true, data }
  } catch (error) {
    console.error("[v0] Failed to send team invitation email:", error)
    throw error
  }
}
