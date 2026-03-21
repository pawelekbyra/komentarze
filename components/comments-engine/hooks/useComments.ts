import { useCommentsContext } from '../context/CommentsContext';

export const useComments = () => {
  const { adapter, slideId, userProfile, onAuthRequired, addToast } = useCommentsContext();

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
    adapter,
    slideId,
    userProfile,
    checkAuth,
  };
};
