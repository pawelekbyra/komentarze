import React from 'react';

interface UserBadgeProps {
  role: string;
}

const UserBadge: React.FC<UserBadgeProps> = ({ role }) => {
  if (role === 'user') return null;
  return (
    <span className="text-[10px] px-1 bg-primary/20 text-primary rounded border border-primary/30 uppercase font-bold">
      {role}
    </span>
  );
};

export default UserBadge;
