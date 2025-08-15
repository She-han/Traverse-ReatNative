import { FirebaseError } from 'firebase/app';

export interface UserFriendlyError {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
  action?: string;
}

export class ErrorHandler {
  /**
   * Convert Firebase authentication errors to user-friendly messages
   */
  static handleAuthError(error: any): UserFriendlyError {
    const errorCode = error?.code || '';
    const errorMessage = error?.message || error || 'An unexpected error occurred';

    // Firebase Authentication Error Codes
    switch (errorCode) {
      case 'auth/invalid-email':
        return {
          title: 'Invalid Email',
          message: 'Please enter a valid email address.',
          type: 'error',
          action: 'Check your email format'
        };
      
      case 'auth/user-disabled':
        return {
          title: 'Account Disabled',
          message: 'Your account has been temporarily disabled. Please contact support.',
          type: 'error',
          action: 'Contact Support'
        };
      
      case 'auth/user-not-found':
        return {
          title: 'Account Not Found',
          message: 'No account found with this email address.',
          type: 'error',
          action: 'Try creating a new account'
        };
      
      case 'auth/wrong-password':
        return {
          title: 'Incorrect Password',
          message: 'The password you entered is incorrect.',
          type: 'error',
          action: 'Reset password or try again'
        };
      
      case 'auth/email-already-in-use':
        return {
          title: 'Email Already Used',
          message: 'An account with this email address already exists.',
          type: 'error',
          action: 'Try signing in instead'
        };
      
      case 'auth/weak-password':
        return {
          title: 'Weak Password',
          message: 'Password should be at least 6 characters long.',
          type: 'error',
          action: 'Use a stronger password'
        };
      
      case 'auth/operation-not-allowed':
        return {
          title: 'Sign-in Disabled',
          message: 'Email/password sign-in is currently disabled.',
          type: 'error',
          action: 'Contact support'
        };
      
      case 'auth/invalid-credential':
        return {
          title: 'Invalid Credentials',
          message: 'The email or password you entered is incorrect.',
          type: 'error',
          action: 'Double-check your login details'
        };
      
      case 'auth/too-many-requests':
        return {
          title: 'Too Many Attempts',
          message: 'Too many failed login attempts. Please try again later.',
          type: 'error',
          action: 'Wait a few minutes before trying again'
        };
      
      case 'auth/network-request-failed':
        return {
          title: 'Connection Error',
          message: 'Please check your internet connection and try again.',
          type: 'error',
          action: 'Check your internet connection'
        };
      
      case 'auth/requires-recent-login':
        return {
          title: 'Re-authentication Required',
          message: 'Please sign out and sign in again to continue.',
          type: 'warning',
          action: 'Sign in again'
        };
      
      case 'auth/expired-action-code':
        return {
          title: 'Link Expired',
          message: 'This verification link has expired. Please request a new one.',
          type: 'error',
          action: 'Request new verification link'
        };
      
      case 'auth/invalid-action-code':
        return {
          title: 'Invalid Link',
          message: 'This verification link is invalid or has already been used.',
          type: 'error',
          action: 'Request new verification link'
        };
      
      // Firebase general errors
      case 'permission-denied':
        return {
          title: 'Permission Denied',
          message: 'You don\'t have permission to perform this action.',
          type: 'error',
          action: 'Contact support if this seems wrong'
        };
      
      case 'unavailable':
        return {
          title: 'Service Unavailable',
          message: 'Our service is temporarily unavailable. Please try again.',
          type: 'error',
          action: 'Try again in a few minutes'
        };
      
      // Firestore errors
      case 'not-found':
        return {
          title: 'Data Not Found',
          message: 'The requested data could not be found.',
          type: 'error',
          action: 'Refresh the app'
        };
      
      // Network and connection errors
      default:
        // Handle network errors
        if (errorMessage.toLowerCase().includes('network')) {
          return {
            title: 'Connection Problem',
            message: 'Please check your internet connection and try again.',
            type: 'error',
            action: 'Check internet connection'
          };
        }
        
        // Handle timeout errors
        if (errorMessage.toLowerCase().includes('timeout')) {
          return {
            title: 'Request Timeout',
            message: 'The request took too long to complete. Please try again.',
            type: 'error',
            action: 'Try again'
          };
        }
        
        // Generic error fallback
        return {
          title: 'Something went wrong',
          message: 'An unexpected error occurred. Please try again.',
          type: 'error',
          action: 'Try again or contact support'
        };
    }
  }

  /**
   * Handle validation errors
   */
  static handleValidationError(field: string, value: string): UserFriendlyError | null {
    switch (field) {
      case 'email':
        if (!value.trim()) {
          return {
            title: 'Email Required',
            message: 'Please enter your email address.',
            type: 'warning'
          };
        }
        if (!this.isValidEmail(value)) {
          return {
            title: 'Invalid Email',
            message: 'Please enter a valid email address.',
            type: 'warning',
            action: 'Check email format'
          };
        }
        break;
      
      case 'password':
        if (!value.trim()) {
          return {
            title: 'Password Required',
            message: 'Please enter your password.',
            type: 'warning'
          };
        }
        if (value.length < 6) {
          return {
            title: 'Password Too Short',
            message: 'Password must be at least 6 characters long.',
            type: 'warning',
            action: 'Use a longer password'
          };
        }
        break;
      
      case 'name':
        if (!value.trim()) {
          return {
            title: 'Name Required',
            message: 'Please enter your full name.',
            type: 'warning'
          };
        }
        if (value.trim().length < 2) {
          return {
            title: 'Name Too Short',
            message: 'Please enter your full name.',
            type: 'warning'
          };
        }
        break;
    }
    
    return null;
  }

  /**
   * Email validation helper
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Create success message
   */
  static createSuccessMessage(title: string, message: string): UserFriendlyError {
    return {
      title,
      message,
      type: 'success'
    };
  }

  /**
   * Create info message
   */
  static createInfoMessage(title: string, message: string, action?: string): UserFriendlyError {
    return {
      title,
      message,
      type: 'info',
      action
    };
  }
}
