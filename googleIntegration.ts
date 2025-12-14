
// This file now handles only admin notifications
// Client confirmation emails are handled by EmailJS

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx4t9M4Igf2c8R_xwFCeuSoBRKmn2p_5wLWlWhmc8bv02ABT1cFZ9rV24t7Sulq_8OAzA/exec'


interface EmailData {
  [key: string]: any
}

// Enhanced Google Apps Script with better HTML generation
export async function sendViaGoogleScript(templateType: 'client_confirmation' | 'admin_notification', data: EmailData): Promise<boolean> {
  try {
    // Only try if URL is configured
    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes('https://script.google.com/macros/s/AKfycbx4t9M4Igf2c8R_xwFCeuSoBRKmn2p_5wLWlWhmc8bv02ABT1cFZ9rV24t7Sulq_8OAzA/exec'))
    {
      console.warn('Google Script URL not configured')
      return false
    }

    let htmlBody = ''
    let subject = ''
    let toEmail = ''

    // Determine content based on template type
    if (templateType === 'client_confirmation') {
      if (data.type === 'client') {
        toEmail = data.to_email
        subject = data.notification_type === 'appointment' 
          ? `Appointment Request Received - ${data.company_name}`
          : `We received your message - ${data.company_name}`
        
        htmlBody = generateClientEmailHTML(data)
      } else {
        toEmail = data.admin_email || data.company_email
        subject = data.notification_type === 'appointment'
          ? `📅 New Appointment: ${data.client_name} - ${data.service_type}`
          : `📧 New Contact: ${data.client_name} - ${data.client_subject}`
        
        htmlBody = generateAdminEmailHTML(data)
      }
    } else {
      toEmail = data.admin_email || data.company_email
      subject = data.notification_title || 'New Notification'
      htmlBody = generateAdminEmailHTML(data)
    }

    // CRITICAL: Payload MUST match what the Google Apps Script expects (e.g. data.email, data.emailBody)
    const payload = {
      // Direct fields for email sending in Google Script
      email: toEmail,
      emailSubject: subject,
      emailBody: htmlBody,
      
      // Fields for Google Sheet Logging (flattened)
      fullName: data.client_name || data.name,
      phone: data.client_phone || data.phone,
      serviceType: data.service_type || data.service,
      date: data.appointment_date || new Date().toLocaleDateString(),
      time: data.appointment_time || new Date().toLocaleTimeString(),
      message: data.client_message || data.message,
      type: templateType,
      
      // Pass full data object just in case
      ...data
    };

    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // Opaque response, we assume success if no network error
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify(payload)
    })

    console.log(`✅ Google Script fallback email request sent to ${toEmail}`)
    return true

  } catch (error) {
    console.error('Google Script fallback error:', error)
    return false
  }
}

function generateClientEmailHTML(data: any): string {
  // Use generic image if logo not present
  const logo = data.company_logo || 'https://zdxtnofilszrsmwwdoes.supabase.co/storage/v1/object/public/portfolio-bucket/6fo30g.png';
  const tagline = data.company_tagline || 'Excellence in Architecture';
  const address = data.company_address || 'Kathmandu, Nepal';
  const website = data.company_website || '#';
  const phone = data.company_phone || '';
  const email = data.company_email || 'skystupaarchitect@gmail.com';
  const pageTitle = data.notification_type === 'appointment' ? 'Appointment Confirmation' : 'Message Received';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${pageTitle}</title>
        <style>
            body {
                font-family: 'Arial', 'Helvetica Neue', Helvetica, sans-serif;
                line-height: 1.6;
                color: #333333;
                margin: 0;
                padding: 0;
                background-color: #f5f7fa;
            }
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px 20px;
                text-align: center;
            }
            .logo {
                max-width: 80px;
                margin-bottom: 15px;
            }
            .content {
                padding: 40px 30px;
            }
            .appointment-details {
                background-color: #f8f9fa;
                border-left: 4px solid #667eea;
                padding: 20px;
                margin: 25px 0;
                border-radius: 0 8px 8px 0;
            }
            .detail-item {
                margin-bottom: 12px;
            }
            .detail-label {
                font-weight: 600;
                color: #495057;
                min-width: 100px;
                display: inline-block;
            }
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-decoration: none;
                padding: 12px 30px;
                border-radius: 6px;
                font-weight: 600;
                margin: 20px 0;
            }
            .footer {
                background-color: #f8f9fa;
                padding: 25px 30px;
                text-align: center;
                border-top: 1px solid #e9ecef;
                color: #6c757d;
                font-size: 14px;
            }
            .contact-info {
                margin-top: 15px;
                line-height: 1.8;
            }
            @media only screen and (max-width: 600px) {
                .content {
                    padding: 25px 20px;
                }
                .detail-label {
                    min-width: 80px;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <!-- Header -->
            <div class="header">
                <div style="font-size: 0;">
                    <!-- Logo -->
                    <img src="${logo}" alt="${data.company_name}" class="logo" style="border-radius: 50%; max-width: 80px;">
                </div>
                <h1 style="margin: 10px 0 5px 0; font-size: 24px;">Request Received</h1>
                <p style="margin: 0; opacity: 0.9;">${data.company_name}</p>
            </div>

            <!-- Main Content -->
            <div class="content">
                <p style="margin-top: 0;">Dear <strong>${data.client_name}</strong>,</p>
                
                <p>Thank you for contacting <strong>${data.company_name}</strong>. We have received your ${data.notification_type === 'appointment' ? 'consultation request' : 'message'} and appreciate your interest in our services.</p>
                
                <div class="appointment-details">
                    <h3 style="margin-top: 0; color: #495057;">${data.notification_type === 'appointment' ? 'Appointment Details:' : 'Message Details:'}</h3>
                    
                    ${data.notification_type === 'appointment' ? `
                    <div class="detail-item">
                        <span class="detail-label">Service:</span>
                        <span>${data.service_type}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Date:</span>
                        <span>${data.appointment_date}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Time:</span>
                        <span>${data.appointment_time}</span>
                    </div>
                    ` : `
                    <div class="detail-item">
                        <span class="detail-label">Subject:</span>
                        <span>${data.client_subject || 'General Inquiry'}</span>
                    </div>
                    `}
                    
                    ${data.client_message && data.client_message !== 'No details.' ? `
                    <div class="detail-item">
                        <span class="detail-label">Your Message:</span>
                        <span style="font-style: italic;">"${data.client_message}"</span>
                    </div>
                    ` : ''}
                </div>

                <p><strong>Next Steps:</strong></p>
                <ol style="color: #495057; padding-left: 20px;">
                    <li>Our team will review your request within <strong>24 hours</strong></li>
                    ${data.notification_type === 'appointment' ? `
                    <li>We'll contact you at <strong>${data.client_phone}</strong> to confirm availability</li>
                    <li>You'll receive a calendar invitation with meeting details</li>
                    ` : `
                    <li>We'll respond to your email address <strong>${data.client_email}</strong></li>
                    <li>If urgent, please call us directly</li>
                    `}
                </ol>

                <p style="margin-bottom: 30px;">If you need to make any changes or have urgent inquiries, please reply to this email or call us directly at <strong>${phone}</strong>.</p>

                <div style="text-align: center;">
                    <a href="${website}" class="cta-button">Visit Our Website</a>
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p style="margin: 0 0 10px 0;">
                    <strong>${data.company_name}</strong><br>
                    ${tagline}
                </p>
                
                <div class="contact-info">
                    <div>${address}</div>
                    <div>Phone: ${phone} | Email: ${email}</div>
                    <div>Website: ${website}</div>
                </div>

                <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #adb5bd; font-size: 13px;">
                    This is an automated message. Please do not reply directly to this email.<br>
                    © ${data.current_year} ${data.company_name}. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    </html>
  `
}

function generateAdminEmailHTML(data: any): string {
  const isAppointment = data.notification_type === 'appointment';
  const headerColor = isAppointment ? '#3b82f6' : '#10b981';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Notification</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                line-height: 1.5;
                color: #374151;
                margin: 0;
                padding: 20px;
                background-color: #f9fafb;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                border: 1px solid #e5e7eb;
            }
            .header {
                padding: 24px;
                text-align: center;
                background: ${headerColor};
                color: white;
            }
            .badge {
                display: inline-block;
                background: rgba(255,255,255,0.2);
                padding: 6px 16px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 12px;
            }
            .content {
                padding: 32px;
            }
            .info-card {
                background: #f8fafc;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 20px;
                border: 1px solid #e2e8f0;
            }
            .info-row {
                display: flex;
                margin-bottom: 12px;
                align-items: flex-start;
            }
            .info-label {
                font-weight: 600;
                color: #64748b;
                width: 100px;
                flex-shrink: 0;
                font-size: 14px;
            }
            .info-value {
                flex: 1;
                color: #1e293b;
                font-weight: 500;
            }
            .message-box {
                background: white;
                padding: 16px;
                border-radius: 6px;
                border: 1px solid #e2e8f0;
                margin-top: 8px;
                font-size: 14px;
                color: #475569;
            }
            .action-row {
                display: flex;
                gap: 12px;
                margin: 24px 0;
                flex-wrap: wrap;
            }
            .action-btn {
                flex: 1;
                min-width: 120px;
                text-align: center;
                padding: 12px 16px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                font-size: 14px;
                transition: all 0.2s;
            }
            .email-btn {
                background: #3b82f6;
                color: white;
            }
            .email-btn:hover {
                background: #2563eb;
            }
            .call-btn {
                background: #10b981;
                color: white;
            }
            .call-btn:hover {
                background: #059669;
            }
            .urgent-banner {
                background: #fef3c7;
                border: 1px solid #fbbf24;
                padding: 16px;
                border-radius: 8px;
                text-align: center;
                margin: 20px 0;
                color: #92400e;
            }
            .footer {
                padding: 20px;
                text-align: center;
                color: #6b7280;
                font-size: 12px;
                border-top: 1px solid #e5e7eb;
                background: #f9fafb;
            }
            @media (max-width: 600px) {
                .action-row {
                    flex-direction: column;
                }
                .info-label {
                    width: 80px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <div class="badge">
                    ${isAppointment ? '📅 APPOINTMENT' : '📧 CONTACT FORM'}
                </div>
                <h1 style="margin: 0; font-size: 20px; font-weight: 700;">
                    New ${data.notification_type}
                </h1>
            </div>

            <!-- Content -->
            <div class="content">
                <!-- Urgent Banner -->
                <div class="urgent-banner">
                    <strong>⏰ Response Required:</strong> 
                    ${isAppointment ? 'Contact client within 24 hours' : 'Respond within 24 hours'}
                </div>

                <!-- Client Information -->
                <div class="info-card">
                    <h3 style="margin-top: 0; margin-bottom: 16px; color: #1e293b; font-size: 16px;">Client Information</h3>
                    
                    <div class="info-row">
                        <span class="info-label">Name:</span>
                        <span class="info-value">${data.client_name}</span>
                    </div>
                    
                    <div class="info-row">
                        <span class="info-label">Email:</span>
                        <span class="info-value">${data.client_email}</span>
                    </div>
                    
                    <div class="info-row">
                        <span class="info-label">Phone:</span>
                        <span class="info-value">
                            ${data.client_phone || '<span style="color: #94a3b8;">Not provided</span>'}
                        </span>
                    </div>
                </div>

                <!-- Details -->
                <div class="info-card">
                    ${isAppointment ? `
                    <h3 style="margin-top: 0; margin-bottom: 16px; color: #1e293b; font-size: 16px;">Appointment Details</h3>
                    
                    <div class="info-row">
                        <span class="info-label">Service:</span>
                        <span class="info-value">${data.service_type}</span>
                    </div>
                   
                    <div class="info-row">
                        <span class="info-label">Appointment:</span>
                        <span class="info-value">${data.mode || 'Physical'}</span>
                    </div>
                  
                    <div class="info-row">
                        <span class="info-label">Date:</span>
                        <span class="info-value">${data.appointment_date}</span>
                    </div>
                    
                    <div class="info-row">
                        <span class="info-label">Time:</span>
                        <span class="info-value">${data.appointment_time}</span>
                    </div>
                    ` : `
                    <h3 style="margin-top: 0; margin-bottom: 16px; color: #1e293b; font-size: 16px;">Message Details</h3>
                    
                    <div class="info-row">
                        <span class="info-label">Subject:</span>
                        <span class="info-value">${data.client_subject}</span>
                    </div>
                    `}
                    
                    ${data.client_message ? `
                    <div class="info-row" style="align-items: flex-start;">
                        <span class="info-label">Message:</span>
                        <div class="message-box">${data.client_message}</div>
                    </div>
                    ` : ''}
                </div>

                <!-- Action Buttons -->
                <div class="action-row">
                    <a href="mailto:${data.client_email}" class="action-btn email-btn">
                        📧 Reply via Email
                    </a>
                    
                    ${data.client_phone && data.client_phone !== 'Not provided' ? `
                    <a href="tel:${data.client_phone}" class="action-btn call-btn">
                        📞 Call Client
                    </a>
                    ` : ''}
                </div>

                <!-- Quick Actions -->
                <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin-top: 20px;">
                    <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #475569;">Quick Actions</h4>
                    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                        <button style="
                            background: white;
                            border: 1px solid #d1d5db;
                            padding: 8px 16px;
                            border-radius: 6px;
                            font-size: 12px;
                            color: #4b5563;
                            cursor: pointer;
                            font-family: inherit;
                        " onclick="window.open('https://calendar.google.com/calendar/render?action=TEMPLATE&text=Meeting with ${data.client_name}&details=${data.service_type || 'Consultation'}', '_blank')">
                            📅 Add to Calendar
                        </button>
                        
                        <button style="
                            background: white;
                            border: 1px solid #d1d5db;
                            padding: 8px 16px;
                            border-radius: 6px;
                            font-size: 12px;
                            color: #4b5563;
                            cursor: pointer;
                            font-family: inherit;
                        " onclick="window.open('mailto:${data.client_email}?subject=Re: ${data.client_subject || 'Your Appointment'}&body=Hi ${data.client_name},%0D%0A%0D%0AThank you for your inquiry.%0D%0A%0D%0ABest regards,%0D%0A${data.company_name}', '_blank')">
                            📝 Quick Reply
                        </button>
                    </div>
                </div>

                <!-- Timestamp -->
                <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                        Received: ${data.timestamp || new Date().toLocaleString()}<br>
                        ID: ${Math.random().toString(36).substr(2, 9)}
                    </p>
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p style="margin: 0 0 8px 0;">
                    <strong>${data.company_name}</strong>
                </p>
                <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                    Automated notification • Do not reply to this email<br>
                    © ${data.current_year}
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
}
