import React from 'react';

interface DashboardCardProps {
  /**
   * The title of the card, displayed prominently at the top.
   */
  title: string;
  /**
   * Optional icon to display next to the title. Can be any React node (e.g., an SVG icon component).
   */
  icon?: React.ReactNode;
  /**
   * The main content of the card. This will be rendered within the card's body.
   */
  children: React.ReactNode;
  /**
   * Optional content for the card's footer area, typically used for actions or additional information.
   */
  footer?: React.ReactNode;
  /**
   * Optional additional CSS classes for the main card container.
   */
  className?: string;
  /**
   * Optional additional CSS classes for the card's header section.
   */
  headerClassName?: string;
  /**
   * Optional additional CSS classes for the card's content section.
   */
  contentClassName?: string;
  /**
   * Optional additional CSS classes for the card's footer section.
   */
  footerClassName?: string;
}

/**
 * A standardized card component for displaying information blocks within dashboards,
 * providing consistent styling and layout.
 *
 * @param {DashboardCardProps} props - The props for the DashboardCard component.
 * @returns {JSX.Element} The rendered DashboardCard component.
 */
const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  icon,
  children,
  footer,
  className = '',
  headerClassName = '',
  contentClassName = '',
  footerClassName = '',
}) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-md p-6 flex flex-col ${className}`}
    >
      <div className={`flex items-center justify-between mb-4 ${headerClassName}`}>
        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          {icon && <span className="text-gray-500">{icon}</span>}
          {title}
        </h3>
      </div>

      <div className={`flex-grow text-gray-700 ${contentClassName}`}>
        {children}
      </div>

      {footer && (
        <div className={`mt-6 pt-4 border-t border-gray-200 text-sm text-gray-500 ${footerClassName}`}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default DashboardCard;