import React, { useState } from 'react';

interface HeaderProps {
    sidebarOpen: boolean;
    setSidebarOpen: (arg: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notifying, setNotifying] = useState(true);

    return (
        <header className="sticky top-0 z-40 flex w-full bg-gray-800 border-b border-gray-700 drop-shadow-1">
            <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 md:px-6 2xl:px-11">
                <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
                    {/* Hamburger Toggle BTN */}
                    <button
                        aria-controls="sidebar"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSidebarOpen(!sidebarOpen);
                        }}
                        className="z-50 block rounded-sm border border-gray-600 bg-gray-700 p-1.5 shadow-sm lg:hidden"
                    >
                        <span className="relative block h-5.5 w-5.5 cursor-pointer">
                            <span className="du-block absolute right-0 h-full w-full">
                                <span
                                    className={`relative top-0 left-0 my-1 block h-0.5 w-0 rounded-sm bg-white delay-[0] duration-200 ease-in-out ${!sidebarOpen && '!w-full delay-300'}`}
                                ></span>
                                <span
                                    className={`relative top-0 left-0 my-1 block h-0.5 w-0 rounded-sm bg-white delay-150 duration-200 ease-in-out ${!sidebarOpen && 'delay-400 !w-full'}`}
                                ></span>
                                <span
                                    className={`relative top-0 left-0 my-1 block h-0.5 w-0 rounded-sm bg-white delay-200 duration-200 ease-in-out ${!sidebarOpen && '!w-full delay-500'}`}
                                ></span>
                            </span>
                        </span>
                    </button>
                    {/* Hamburger Toggle BTN */}

                    <a className="block flex-shrink-0 lg:hidden" href="/">
                        <div className="h-8 w-8 bg-cyan-600 rounded-full flex items-center justify-center text-white font-bold">
                            L
                        </div>
                    </a>
                </div>

                <div className="hidden sm:block">
                    <form action="#" method="POST">
                        <div className="relative">
                            <button className="absolute left-0 top-1/2 -translate-y-1/2">
                                <svg
                                    className="fill-gray-400 hover:fill-cyan-500"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 20 20"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        fillRule="evenodd"
                                        clipRule="evenodd"
                                        d="M9.16666 3.33332C5.945 3.33332 3.33332 5.945 3.33332 9.16666C3.33332 12.3883 5.945 15 9.16666 15C12.3883 15 15 12.3883 15 9.16666C15 5.945 12.3883 3.33332 9.16666 3.33332ZM1.66666 9.16666C1.66666 5.02452 5.02452 1.66666 9.16666 1.66666C13.3088 1.66666 16.6667 5.02452 16.6667 9.16666C16.6667 13.3088 13.3088 16.6667 9.16666 16.6667C5.02452 16.6667 1.66666 13.3088 1.66666 9.16666Z"
                                        fill=""
                                    />
                                    <path
                                        fillRule="evenodd"
                                        clipRule="evenodd"
                                        d="M13.2857 13.2857C13.6112 12.9603 14.1388 12.9603 14.4642 13.2857L18.0892 16.9107C18.4147 17.2362 18.4147 17.7638 18.0892 18.0892C17.7638 18.4147 17.2362 18.4147 16.9107 18.0892L13.2857 14.4642C12.9603 14.1388 12.9603 13.6112 13.2857 13.2857Z"
                                        fill=""
                                    />
                                </svg>
                            </button>

                            <input
                                type="text"
                                placeholder="Type to search..."
                                className="w-full bg-transparent pl-9 pr-4 font-medium focus:outline-none xl:w-125 text-white placeholder-gray-500"
                            />
                        </div>
                    </form>
                </div>

                <div className="flex items-center gap-3 2xsm:gap-7">
                    <ul className="flex items-center gap-2 2xsm:gap-4">
                        {/* Notification Menu Area */}
                        <li className="relative">
                            <button
                                className="relative flex h-8.5 w-8.5 items-center justify-center rounded-full border-[0.5px] border-gray-600 bg-gray-700 hover:text-cyan-500 text-gray-400"
                                onClick={() => setNotifying(!notifying)}
                            >
                                <span
                                    className={`absolute -top-0.5 right-0 z-1 h-2 w-2 rounded-full bg-red-600 ${
                                        notifying ? 'inline' : 'hidden'
                                    }`}
                                >
                                    <span className="absolute -z-1 inline-flex h-full w-full animate-ping rounded-full bg-red-600 opacity-75"></span>
                                </span>

                                <svg
                                    className="fill-current duration-300 ease-in-out"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 18 18"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M16.1999 14.9343L15.6374 14.0624C15.5249 13.8937 15.4687 13.7249 15.4687 13.528V7.67803C15.4687 6.01865 14.7655 4.47178 13.4718 3.31865C12.4312 2.39053 11.0812 1.7999 9.64678 1.6874V1.1249C9.64678 0.787402 9.36553 0.478027 8.9999 0.478027C8.6624 0.478027 8.35303 0.759277 8.35303 1.1249V1.65928C5.33428 1.96865 3.02803 4.52803 3.02803 7.67803V13.528C3.02803 13.7249 2.97178 13.8937 2.85928 14.0624L2.29678 14.9343C2.0999 15.2155 2.0999 15.5812 2.29678 15.8624C2.49365 16.1437 2.80303 16.3405 3.16865 16.3405H14.8218C15.1874 16.3405 15.4968 16.1718 15.6937 15.8905C15.8905 15.6093 15.8905 15.2437 16.1999 14.9343ZM9.9999 17.4374C9.9999 17.9999 9.5499 18.4499 8.9999 18.4499C8.4499 18.4499 7.9999 17.9999 7.9999 17.4374H9.9999Z"
                                        fill=""
                                    />
                                </svg>
                            </button>
                        </li>
                    </ul>

                    {/* User Area */}
                    <div className="relative">
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center gap-4"
                        >
                            <span className="hidden text-right lg:block">
                                <span className="block text-sm font-medium text-white">
                                    Compliance Admin
                                </span>
                                <span className="block text-xs text-gray-400">System Administrator</span>
                            </span>

                            <span className="h-12 w-12 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center overflow-hidden">
                                <span className="text-lg font-bold text-cyan-500">CA</span>
                            </span>

                            <svg
                                className={`hidden fill-current sm:block text-gray-400 duration-200 ${
                                    dropdownOpen ? 'rotate-180' : ''
                                }`}
                                width="12"
                                height="8"
                                viewBox="0 0 12 8"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M0.410765 0.910734C0.736202 0.585297 1.26384 0.585297 1.58928 0.910734L6.00002 5.32148L10.4108 0.910734C10.7362 0.585297 11.2638 0.585297 11.5893 0.910734C11.9147 1.23617 11.9147 1.76381 11.5893 2.08924L6.58928 7.08924C6.26384 7.41468 5.7362 7.41468 5.41077 7.08924L0.410765 2.08924C0.0853277 1.76381 0.0853277 1.23617 0.410765 0.910734Z"
                                    fill=""
                                />
                            </svg>
                        </button>

                        {/* Dropdown Start */}
                        {dropdownOpen && (
                            <div className="absolute right-0 mt-4 flex w-62.5 flex-col rounded-sm border border-gray-600 bg-gray-800 shadow-default z-50">
                                <ul className="flex flex-col gap-5 border-b border-gray-600 px-6 py-7.5">
                                    <li>
                                        <button className="flex items-center gap-3.5 text-sm font-medium duration-300 ease-in-out hover:text-cyan-500 lg:text-base text-gray-300">
                                            <svg className="fill-current" width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M11 11C13.7614 11 16 8.76142 16 6C16 3.23858 13.7614 1 11 1C8.23858 1 6 3.23858 6 6C6 8.76142 8.23858 11 11 11Z" fill="" />
                                                <path opacity="0.5" d="M11 13C6.02944 13 2 17.0294 2 22H20C20 17.0294 15.9706 13 11 13Z" fill="" />
                                            </svg>
                                            My Profile
                                        </button>
                                    </li>
                                    <li>
                                        <button className="flex items-center gap-3.5 text-sm font-medium duration-300 ease-in-out hover:text-cyan-500 lg:text-base text-gray-300">
                                            <svg className="fill-current" width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M16.5 7.5C16.5 10.8137 13.8137 13.5 10.5 13.5C7.18629 13.5 4.5 10.8137 4.5 7.5C4.5 4.18629 7.18629 1.5 10.5 1.5C13.8137 1.5 16.5 4.18629 16.5 7.5Z" fill="" />
                                                <path opacity="0.5" d="M10.5 15.5C5.25329 15.5 1 19.7533 1 25H20C20 19.7533 15.7467 15.5 10.5 15.5Z" fill="" />
                                            </svg>
                                            Account Settings
                                        </button>
                                    </li>
                                </ul>
                                <button className="flex items-center gap-3.5 px-6 py-4 text-sm font-medium duration-300 ease-in-out hover:text-cyan-500 lg:text-base text-gray-300">
                                    <svg className="fill-current" width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M15.5 2H9.5C8.11929 2 7 3.11929 7 4.5V17.5C7 18.8807 8.11929 20 9.5 20H15.5C16.8807 20 18 18.8807 18 17.5V4.5C18 3.11929 16.8807 2 15.5 2Z" fill="" />
                                        <path opacity="0.5" d="M5 9H11C11.5523 9 12 9.44772 12 10C12 10.5523 11.5523 11 11 11H5V13L1 10L5 7V9Z" fill="" />
                                    </svg>
                                    Log Out
                                </button>
                            </div>
                        )}
                        {/* Dropdown End */}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;