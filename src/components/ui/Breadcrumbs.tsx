import React from 'react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
    label: string;
    href?: string;
    icon?: React.ReactNode;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    className?: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
    return (
        <nav className={`flex ${className}`} aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;
                    const isFirst = index === 0;

                    return (
                        <li key={`${index}-${item.label}`} className="inline-flex items-center">
                            {/* Separator Icon (not for the first item) */}
                            {!isFirst && (
                                <svg 
                                    className="w-6 h-6 text-gray-500" 
                                    fill="currentColor" 
                                    viewBox="0 0 20 20" 
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path 
                                        fillRule="evenodd" 
                                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" 
                                        clipRule="evenodd"
                                    ></path>
                                </svg>
                            )}

                            {/* Breadcrumb Item */}
                            {isLast ? (
                                <span className={`inline-flex items-center text-sm font-medium text-gray-100 ${!isFirst ? 'ml-1 md:ml-2' : ''}`}>
                                    {item.icon && <span className="mr-2">{item.icon}</span>}
                                    {item.label}
                                </span>
                            ) : (
                                <Link
                                    to={item.href || '#'}
                                    className={`inline-flex items-center text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200 ${!isFirst ? 'ml-1 md:ml-2' : ''}`}
                                >
                                    {item.icon ? (
                                        <span className="mr-2">{item.icon}</span>
                                    ) : isFirst ? (
                                        <svg 
                                            className="w-4 h-4 mr-2" 
                                            fill="currentColor" 
                                            viewBox="0 0 20 20" 
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                                        </svg>
                                    ) : null}
                                    {item.label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;