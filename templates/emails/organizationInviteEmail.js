/**
 * Email template for organization invitations
 * @param {object} data - The invitation data
 * @param {string} data.inviteeName - Name of the person being invited
 * @param {string} data.inviterName - Name of the person sending the invitation
 * @param {string} data.organizationName - Name of the organization
 * @param {string} data.inviteCode - Unique invitation code
 * @param {string} data.inviteUrl - Complete URL for accepting the invitation
 * @returns {string} HTML content for the email
 */
const getOrganizationInviteTemplate = ({ 
  inviteeName, 
  inviterName, 
  organizationName, 
  inviteCode, 
  inviteUrl 
}) => {
  // If no specific URL is provided, construct a generic one
  const acceptUrl = inviteUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/join?code=${inviteCode}`;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to join ${organizationName}</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #f9f9f9;
      border-radius: 5px;
      padding: 20px;
      border: 1px solid #eee;
    }
    .header {
      background-color: #2466ff;
      color: white;
      padding: 15px;
      border-radius: 5px 5px 0 0;
      margin-bottom: 20px;
      text-align: center;
    }
    .content {
      padding: 20px;
      background-color: white;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    .footer {
      font-size: 12px;
      text-align: center;
      color: #666;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
    .button {
      display: inline-block;
      background-color: #2466ff;
      color: white;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 3px;
      margin-top: 15px;
      font-weight: bold;
    }
    .code-box {
      background-color: #f0f0f0;
      padding: 10px;
      border-radius: 3px;
      font-family: monospace;
      text-align: center;
      margin: 15px 0;
      border: 1px dashed #ccc;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>You've Been Invited!</h1>
    </div>
    <div class="content">
      <p>Hello${inviteeName ? ' ' + inviteeName : ''},</p>
      
      <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on TaskShift.</p>
      
      <p>TaskShift is a platform that helps teams collaborate effectively on tasks and projects.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${acceptUrl}" class="button">Accept Invitation</a>
      </div>
      
      <p>Alternatively, you can use the following invitation code when signing up or joining an organization:</p>
      
      <div class="code-box">
        ${inviteCode}
      </div>
      
      <p>This invitation will expire in 7 days.</p>
      
      <p>If you have any questions, please contact the person who invited you or reach out to our support team.</p>
    </div>
    <div class="footer">
      <p>If you received this invitation by mistake, you can safely ignore it.</p>
      <p>&copy; ${new Date().getFullYear()} TaskShift. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
};

// Export the function that returns the HTML template
module.exports = getOrganizationInviteTemplate; 