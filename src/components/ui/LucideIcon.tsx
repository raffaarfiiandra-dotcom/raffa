import React from 'react';
import * as Icons from 'lucide-react';

interface LucideIconProps {
  name: string;
  className?: string;
  size?: number;
  onClick?: () => void;
}

export const LucideIcon: React.FC<LucideIconProps> = ({ 
  name, 
  className = '', 
  size = 20,
  onClick
}) => {
  // Safe lookup of icon
  const IconComponent = (Icons as any)[name];

  if (!IconComponent) {
    // Return a default icon if not found
    const DefaultIcon = Icons.HelpCircle;
    return <DefaultIcon className={className} size={size} onClick={onClick} />;
  }

  return <IconComponent className={className} size={size} onClick={onClick} />;
};

export default LucideIcon;
