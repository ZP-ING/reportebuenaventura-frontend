/**
 * Email Service for Password Reset
 * 
 * This service simulates sending password reset emails.
 * 
 * PRODUCTION IMPLEMENTATION:
 * To implement real email sending, you can use:
 * 
 * 1. EmailJS (https://www.emailjs.com/):
 *    - Free tier available
 *    - No backend required
 *    - Easy setup with React
 * 
 * 2. Resend (https://resend.com/):
 *    - Modern email API
 *    - Requires backend API route
 * 
 * 3. SendGrid (https://sendgrid.com/):
 *    - Robust email service
 *    - Requires backend API route
 * 
 * Email credentials provided:
 * - Email: reportebuenaventura@gmail.com
 * - Password: reportebuenaventura123
 * 
 * IMPORTANT: Never expose email credentials in frontend code!
 * Always use backend API routes or services like EmailJS for security.
 */

// For EmailJS implementation (recommended for frontend):
// npm install @emailjs/browser

interface EmailParams {
  toEmail: string;
  userName: string;
  resetLink: string;
}

export const sendPasswordResetEmail = async (params: EmailParams): Promise<boolean> => {
  const { toEmail, userName, resetLink } = params;
  
  try {
    // SIMULATION MODE
    // In development, we simulate the email sending
    // Email would be sent to: toEmail with resetLink
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // TODO: PRODUCTION IMPLEMENTATION WITH EMAILJS
    // Uncomment and configure when ready for production:
    /*
    import emailjs from '@emailjs/browser';
    
    const response = await emailjs.send(
      'YOUR_SERVICE_ID',    // Get from EmailJS dashboard
      'YOUR_TEMPLATE_ID',   // Create template in EmailJS
      {
        to_email: toEmail,
        to_name: userName,
        reset_link: resetLink,
        from_name: 'ReporteBuenaventura',
        reply_to: 'reportebuenaventura@gmail.com'
      },
      'YOUR_PUBLIC_KEY'     // Get from EmailJS dashboard
    );
    
    return response.status === 200;
    */
    
    // TODO: PRODUCTION IMPLEMENTATION WITH BACKEND API
    // Alternative: Use your own backend API
    /*
    const response = await fetch('/api/send-password-reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        toEmail,
        userName,
        resetLink
      })
    });
    
    return response.ok;
    */
    
    // Simulate successful email send
    return true;
    
  } catch {
    return false;
  }
};

export const generateResetToken = (): string => {
  // Generate a secure random token
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

export const createPasswordResetLink = (email: string, token: string): string => {
  // In production, this would be your actual domain
  const baseUrl = window.location.origin;
  return `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
};

/**
 * Store reset token in localStorage (for demo purposes)
 * In production, store this in your backend database with expiration
 */
export const storeResetToken = (email: string, token: string): void => {
  const resetTokens = JSON.parse(localStorage.getItem('resetTokens') || '{}');
  resetTokens[email] = {
    token,
    expiresAt: Date.now() + (60 * 60 * 1000), // 1 hour expiration
    createdAt: Date.now()
  };
  localStorage.setItem('resetTokens', JSON.stringify(resetTokens));
};

export const validateResetToken = (email: string, token: string): boolean => {
  const resetTokens = JSON.parse(localStorage.getItem('resetTokens') || '{}');
  const storedToken = resetTokens[email];
  
  if (!storedToken) {
    return false;
  }
  
  // Check if token matches and hasn't expired
  if (storedToken.token === token && Date.now() < storedToken.expiresAt) {
    return true;
  }
  
  return false;
};

export const clearResetToken = (email: string): void => {
  const resetTokens = JSON.parse(localStorage.getItem('resetTokens') || '{}');
  delete resetTokens[email];
  localStorage.setItem('resetTokens', JSON.stringify(resetTokens));
};
