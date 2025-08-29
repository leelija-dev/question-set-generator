import React, { useState } from 'react';

function SidebarLinkGroup({
  children,
  activecondition,
  open: controlledOpen,
  onToggle,
}) {

  const [internalOpen, setInternalOpen] = useState(activecondition);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const handleClick = () => {
    if (isControlled) {
      onToggle && onToggle();
    } else {
      setInternalOpen(!open);
    }
  }

  return (
    <li className={`pl-4 pr-3 py-2 rounded-lg mb-0.5 last:mb-0 bg-linear-to-r ${activecondition && 'from-violet-500/[0.12] dark:from-violet-500/[0.24] to-violet-500/[0.04]'}`}>
      {children(handleClick, open)}
    </li>
  );
}

export default SidebarLinkGroup;