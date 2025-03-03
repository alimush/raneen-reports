import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, Menu, X, Home, Settings, HelpCircle, ChevronDown } from 'lucide-react';
import { Pacifico } from 'next/font/google';

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

const Layout = ({ children }) => {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        setUserName(decodedToken.name || 'User');
        setUserPhone(decodedToken.phone || '');
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('apiUrl');
    router.push('/');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-4 shadow-lg">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className={`text-4xl tracking-wide ${pacifico.className}`}>
            SPC
          </h1>
          <nav className="hidden md:flex flex-1 justify-center">
            <div className="flex space-x-6 rtl:space-x-reverse">
              <NavLink href="/settings" icon={<Settings size={25} />} text="الاعدادات" />
              <NavLink href="/help" icon={<HelpCircle size={25} />} text="عنا" />
              <NavLink href="/Home" icon={<Home size={25} />} text="الرئيسية" />
            </div>
          </nav>
          <div className="flex items-center space-x-4">
            <UserDropdown userName={userName} userPhone={userPhone} onSignOut={handleSignOut} />
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-300 ease-in-out"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        {isMenuOpen && (
          <MobileMenu onSignOut={handleSignOut} />
        )}
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

const NavLink = ({ href, icon, text }) => (
  <a
    href={href}
    className="flex items-center text-white hover:text-blue-200 transition duration-300 ease-in-out"
  >
    <span className="mr-2">{text}</span>
    {icon}
  </a>
);

const UserDropdown = ({ userName, userPhone, onSignOut }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center bg-blue-700 rounded-lg px-3 py-2 hover:bg-blue-600 transition duration-300 ease-in-out"
      >
        <User size={20} className="ml-2" />
        <div className="text-left ml-2 font-sans flex flex-col items-start">
          <p className="font-semibold truncate max-w-[100px] sm:max-w-[150px]">{userName}</p>
          {userPhone && <p className="text-xs font-sans truncate max-w-[100px] sm:max-w-[150px]">{userPhone}</p>}
        </div>
        <ChevronDown size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            <button
              onClick={onSignOut}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 text-center"
              role="menuitem"
            >
              تسجيل خروج
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


const MobileMenu = ({ onSignOut }) => (
  <nav className="mt-4 pb-4 space-y-2 md:hidden flex flex-col items-center">
    <NavLink2 href="/Home" icon={<Home size={18} />} text="الرئيسية" />
    <NavLink2 href="/settings" icon={<Settings size={18} />} text="الاعدادات" />
    <NavLink2 href="/help" icon={<HelpCircle size={18} />} text="عنا" />
    <button
      onClick={onSignOut}
      className="flex items-center w-full max-w-xs px-4 py-2 text-center text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition duration-300 ease-in-out"
    >
      <LogOut size={18} />
      <span className="mx-auto">تسجيل خروج</span>

    </button>
  </nav>
);

const NavLink2 = ({ href, icon, text }) => (
  <a
    href={href}
    className="flex items-center w-full max-w-xs px-4 py-2 text-center text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition duration-300 ease-in-out"
  >
    {icon}
    <span className="mx-auto">{text}</span>
  </a>
);


export default Layout;
