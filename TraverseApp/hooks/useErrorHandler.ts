import { useToast } from '../contexts/ToastContext';
import { ErrorHandler, UserFriendlyError } from '../utils/errorHandler';

export const useErrorHandler = () => {
  const { showToast } = useToast();

  const handleError = (error: any) => {
    const userFriendlyError = ErrorHandler.handleAuthError(error);
    showToast(userFriendlyError);
  };

  const handleValidationError = (field: string, value: string) => {
    const validationError = ErrorHandler.handleValidationError(field, value);
    if (validationError) {
      showToast(validationError);
      return true;
    }
    return false;
  };

  const showSuccess = (title: string, message: string) => {
    const successMessage = ErrorHandler.createSuccessMessage(title, message);
    showToast(successMessage);
  };

  const showInfo = (title: string, message: string, action?: string) => {
    const infoMessage = ErrorHandler.createInfoMessage(title, message, action);
    showToast(infoMessage);
  };

  const showCustomError = (error: UserFriendlyError) => {
    showToast(error);
  };

  return {
    handleError,
    handleValidationError,
    showSuccess,
    showInfo,
    showCustomError,
  };
};
