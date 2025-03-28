/**
 * Email template for test emails
 * @param {string} subject - The subject line to use in the test email
 * @param {string} content - The main content to include in the test email
 * @returns {string} HTML content for the email
 */
const getTestEmailTemplate = (subject = 'Test Email', content = 'This is a test email from the API.') => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
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
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${subject}</h1>
    </div>
    <div class="content">
      <p>${content}</p>
      
      <p>This email was sent from the test email endpoint to verify that the email system is working correctly.</p>
      
      <p>
        <a href="#" class="button">Test Button</a>
      </p>
    </div>
    <div class="footer">
      <p>This is an automated message sent for testing purposes. Please ignore if received by mistake.</p>
      <p>&copy; ${new Date().getFullYear()} Your Organization. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
};

// Export a function that returns the HTML template with custom subject and content
module.exports = getTestEmailTemplate; 