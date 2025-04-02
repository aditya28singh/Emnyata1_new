import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FiUser, FiMenu } from 'react-icons/fi';

const roleBasedDashboards = {
    MENTOR: '/mentor/dashboard',
    STUDENT: '/student/dashboard',
    IA: '/ia/dashboard',
    LEADERSHIP: '/leadership/dashboard',
    EC: '/ec/dashboard',
};

export default function Header({ onSearch }) {
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showAccountMenu, setShowAccountMenu] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        router.push('/');
    };

    const toggleAccountMenu = () => {
        setShowAccountMenu(!showAccountMenu);
    };

    return (
        <header className="bg-white shadow px-6 py-4 flex items-center">
            {/* Menu Button (Left) */}
            <div className="flex-1">
                <button
                    aria-label="Toggle menu"
                    className="lg:hidden text-gray-600 hover:text-blue-600 focus:outline-none"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    <FiMenu className="text-2xl" />
                </button>
            </div>

            {/* Right Section: User Actions and Logo */}
            <div className="flex items-center space-x-6">
                {/* User Actions */}
                <div className="flex items-center space-x-6">
                    {/* User Account Button */}
                    <div className="relative">
                        <button
                            aria-label="User account"
                            className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 focus:outline-none"
                            onClick={toggleAccountMenu}
                        >
                            <FiUser className="text-2xl" />
                        </button>

                        {/* Account Dropdown */}
                        {showAccountMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg py-2 z-50">
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Logo (Right) */}
                <img src="/images/masai-logo.svg" alt="Logo" className="h-10 hidden lg:block ml-8" />
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="lg:hidden absolute top-16 left-0 right-0 bg-white shadow-lg z-10">
                    <nav className="flex flex-col space-y-4 p-4">
                        <button onClick={handleLogout} className="text-red-600 hover:text-red-800 text-lg">
                            Logout
                        </button>
                    </nav>
                </div>
            )}
        </header>
    );
}