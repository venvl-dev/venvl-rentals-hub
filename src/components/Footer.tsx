import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ArrowRight, Crown, Sparkles } from 'lucide-react';

const Footer = () => {
  return (
    <footer className='relative bg-gradient-to-b from-white to-gray-50 border-t border-gray-100 mt-auto overflow-hidden'>
      {/* Background Elements */}
      <div className='absolute inset-0 bg-gradient-to-br from-transparent via-gray-50/50 to-transparent' />
      <div className='absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200/50 to-transparent' />

      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16'>
        {/* Main Grid - Responsive columns */}
        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-8 lg:gap-12 xl:gap-16'>
          {/* Brand Column - Full width on mobile, 2 spans on desktop */}
          <div className='space-y-6 xl:col-span-2'>
            <div className='space-y-4'>
              <Link to='/' className='inline-block group relative'>
                <img
                  src='/logo/1.svg'
                  alt='VENVL'
                  className='h-8 sm:h-10 w-auto group-hover:scale-105 transition-transform duration-500'
                />
                <div className='absolute -top-1 -right-1 sm:-top-2 sm:-right-2'>
                  <Sparkles className='h-3 w-3 sm:h-4 sm:w-4 text-amber-500 fill-current' />
                </div>
              </Link>

              <p className='text-base sm:text-lg text-gray-700 leading-relaxed font-light max-w-md'>
                Discover{' '}
                <span className='font-semibold text-gray-900'>
                  premium rental properties
                </span>{' '}
                across Egypt's most sought-after destinations.
              </p>
            </div>

            <div className='flex items-center gap-3 pt-2 sm:pt-4'>
              <div className='w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center'>
                <Crown className='h-3 w-3 sm:h-4 sm:w-4 text-white' />
              </div>
              <p className='text-xs sm:text-sm text-gray-500 font-medium'>
                Powered by Dlleni Real Estate
              </p>
            </div>
          </div>

          {/* Links Column - Full width on mobile, 1 span on desktop */}
          <div className='space-y-8 sm:space-y-10'>
            {/* Navigation Links */}
            <div className='space-y-4 sm:space-y-6'>
              <h3 className='text-sm font-bold text-gray-900 uppercase tracking-widest relative inline-block'>
                Navigation
                <span className='absolute -bottom-1 sm:-bottom-2 left-0 w-6 sm:w-8 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full' />
              </h3>
              <ul className='space-y-3 sm:space-y-4 grid grid-cols-1 sm:grid-cols-1 gap-2 sm:gap-0'>
                {[
                  { to: '/', label: 'Home' },
                  { to: '/host/signup', label: 'List Property' },
                  { to: '/guest/signup', label: 'Become Guest' },
                ].map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className='group flex items-center gap-2 sm:gap-3 text-gray-600 hover:text-gray-900 transition-all duration-300 text-sm sm:text-sm'
                    >
                      <div className='w-1.5 h-1.5 rounded-full bg-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0' />
                      <span className='font-medium group-hover:translate-x-1 transition-transform duration-300 truncate'>
                        {link.label}
                      </span>
                      <ArrowRight className='h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 flex-shrink-0' />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div className='space-y-4 sm:space-y-6'>
              <h3 className='text-sm font-bold text-gray-900 uppercase tracking-widest relative inline-block'>
                Policies
                <span className='absolute -bottom-1 sm:-bottom-2 left-0 w-6 sm:w-8 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full' />
              </h3>
              <ul className='space-y-3 sm:space-y-4'>
                {[
                  { to: '/privacy-policy', label: 'Privacy' },
                  { to: '/terms-and-conditions', label: 'Terms' },
                  { to: '/cancellation-refund-policy', label: 'Cancellation' },
                ].map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className='group flex items-center gap-2 sm:gap-3 text-gray-600 hover:text-gray-900 transition-all duration-300 text-sm sm:text-sm'
                    >
                      <div className='w-1.5 h-1.5 rounded-full bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0' />
                      <span className='font-medium group-hover:translate-x-1 transition-transform duration-300'>
                        {link.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact Column - Full width on mobile, 2 spans on desktop */}
          <div className='xl:col-span-2 space-y-6 sm:space-y-8'>
            <div className='space-y-2'>
              <h3 className='text-xl sm:text-2xl font-bold text-gray-900 tracking-tight'>
                Let's Connect
              </h3>
              <p className='text-gray-600 text-sm font-medium'>
                Ready to find your perfect stay? We're here to help.
              </p>
            </div>

            <div className='space-y-4 sm:space-y-6'>
              {/* Email */}
              <a
                href='mailto:support@venvl.com'
                className='group flex items-start gap-3 sm:gap-5 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer'
              >
                <div className='flex-shrink-0 w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-gray-900 transition-all duration-300'>
                  <Mail className='h-4 w-4 sm:h-6 sm:w-6 text-gray-600 group-hover:text-white transition-colors duration-300' />
                </div>
                <div className='flex-1 min-w-0 space-y-1'>
                  <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>
                    Email Us
                  </p>
                  <p className='text-sm sm:text-lg font-bold text-gray-900 group-hover:text-gray-700 transition-colors duration-300 break-all sm:break-normal'>
                    support@venvl.com
                  </p>
                </div>
                <div className='opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0'>
                  <ArrowRight className='h-4 w-4 sm:h-5 sm:w-5 text-gray-400' />
                </div>
              </a>

              {/* Phone */}
              <a
                href='tel:+201005400050'
                className='group flex items-start gap-3 sm:gap-5 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer'
              >
                <div className='flex-shrink-0 w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-gray-900 transition-all duration-300'>
                  <Phone className='h-4 w-4 sm:h-6 sm:w-6 text-gray-600 group-hover:text-white transition-colors duration-300' />
                </div>
                <div className='flex-1 min-w-0 space-y-1'>
                  <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>
                    Call Us
                  </p>
                  <p className='text-sm sm:text-lg font-bold text-gray-900 group-hover:text-gray-700 transition-colors duration-300'>
                    +20 100 540 0050
                  </p>
                </div>
                <div className='opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0'>
                  <ArrowRight className='h-4 w-4 sm:h-5 sm:w-5 text-gray-400' />
                </div>
              </a>

              {/* Location */}
              <a
                href='https://maps.google.com/?q=30.029364,31.460701'
                target='_blank'
                rel='noopener noreferrer'
                className='group flex items-start gap-3 sm:gap-5 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer'
              >
                <div className='flex-shrink-0 w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-gray-900 transition-all duration-300'>
                  <MapPin className='h-4 w-4 sm:h-6 sm:w-6 text-gray-600 group-hover:text-white transition-colors duration-300' />
                </div>
                <div className='flex-1 min-w-0 space-y-1'>
                  <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>
                    Visit Us
                  </p>
                  <p className='text-sm sm:text-base font-semibold text-gray-900 group-hover:text-gray-700 leading-relaxed transition-colors duration-300'>
                    Building 238, Second Sector
                    <br />
                    Fifth Settlement, New Cairo
                  </p>
                </div>
                <div className='opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0'>
                  <ArrowRight className='h-4 w-4 sm:h-5 sm:w-5 text-gray-400' />
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className='mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-gray-200/60'>
          <div className='flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 text-center sm:text-left'>
            <p className='text-xs sm:text-sm text-gray-600 font-medium'>
              © {new Date().getFullYear()}{' '}
              <span className='font-bold text-gray-900'>VENVL</span>. Crafting
              exceptional stays.
            </p>
            <p className='text-xs sm:text-sm text-gray-500 font-medium'>
              Excellence in hospitality
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
