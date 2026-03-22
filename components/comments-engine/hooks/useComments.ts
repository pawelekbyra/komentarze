import { useCommentsContext } from '../context/CommentsContext';

export const useComments = () => {
  const { slideId, userProfile, onAuthRequired, addToast } = useCommentsContext();

  const checkAuth = () => {
    if (!userProfile) {
      if (onAuthRequired) {
        onAuthRequired();
      } else {
        addToast?.('Zaloguj się, aby kontynuować', 'locked');
      }
      return false;
    }
    return true;
  };

  return {
    slideId,
    userProfile,
    checkAuth,
  };
};
