/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { getTeamById } from '../data/nrlTeams';

interface TeamBadgeProps {
  teamId: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  shortNameOnly?: boolean;
  className?: string;
  showDisclaimer?: boolean;
}

export const TeamBadge: React.FC<TeamBadgeProps> = ({
  teamId,
  size = 'md',
  showName = false,
  shortNameOnly = false,
  className = '',
  showDisclaimer = false,
}) => {
  const team = getTeamById(teamId);

  if (!team) {
    return <span className="text-gray-400 font-mono text-xs">{teamId}</span>;
  }

  const dimensions = {
    sm: { container: 'w-7 h-8 text-[10px]', svg: 'w-7 h-8' },
    md: { container: 'w-10 h-11 text-xs', svg: 'w-10 h-11' },
    lg: { container: 'w-14 h-16 text-sm', svg: 'w-14 h-16' },
    xl: { container: 'w-20 h-22 text-base', svg: 'w-20 h-22' },
  }[size];

  // Derive contrasting text color
  const textColor = team.secondaryColor === '#FFFFFF' || team.secondaryColor === '#FFC72C'
    ? team.secondaryColor
    : '#FFFFFF';

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div
        className={`${dimensions.container} relative flex items-center justify-center font-black shrink-0 group transition-transform hover:scale-105`}
        title={`${team.name} (Unofficial The Margin Shield)`}
      >
        {/* Custom Unofficial SVG Shield Badge */}
        <svg
          viewBox="0 0 40 46"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 w-full h-full drop-shadow-md"
        >
          {/* Shield Outer Path */}
          <path
            d="M20 2L37 7V22C37 33.5 28.5 41.5 20 44C11.5 41.5 3 33.5 3 22V7L20 2Z"
            fill={team.primaryColor}
            stroke={team.secondaryColor}
            strokeWidth="2.5"
          />
          {/* Shield Inner Stripe Accent */}
          <path
            d="M20 5L34 9V21C34 30.5 27 38 20 40.5C13 38 6 30.5 6 21V9L20 5Z"
            fill={team.primaryColor}
            opacity="0.9"
          />
          <path
            d="M20 5V40.5"
            stroke={team.secondaryColor}
            strokeWidth="1.5"
            strokeDasharray="2 2"
            opacity="0.6"
          />
        </svg>

        {/* Team Code / Initials Overlay */}
        <span
          className="relative z-10 font-black tracking-tighter uppercase font-sans drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
          style={{ color: textColor }}
        >
          {team.code}
        </span>
      </div>

      {showName && (
        <div className="flex flex-col">
          <span className="font-extrabold text-[#111D31] text-xs sm:text-sm tracking-tight leading-tight">
            {shortNameOnly ? team.shortName : team.name}
          </span>
          {showDisclaimer && (
            <span className="text-[9px] text-gray-400 font-mono italic">
              Badges are unofficial The Margin artwork.
            </span>
          )}
        </div>
      )}
    </div>
  );
};
