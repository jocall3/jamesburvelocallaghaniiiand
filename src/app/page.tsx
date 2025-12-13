import Head from 'next/head';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-gray-100 flex flex-col">
      <Head>
        <title>527 Protocol - Homepage</title>
        <meta name="description" content="The official homepage for the 527 Protocol, an innovative framework for decentralized applications." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="w-full p-6 bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            527 Protocol
          </h1>
          <nav>
            <ul className="flex space-x-6">
              <li><a href="#" className="text-lg font-medium text-gray-300 hover:text-purple-400 transition-colors duration-300">Home</a></li>
              <li><a href="#" className="text-lg font-medium text-gray-300 hover:text-purple-400 transition-colors duration-300">About</a></li>
              <li><a href="#" className="text-lg font-medium text-gray-300 hover:text-purple-400 transition-colors duration-300">Documentation</a></li>
              <li><a href="#" className="text-lg font-medium text-gray-300 hover:text-purple-400 transition-colors duration-300">Community</a></li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-6 py-16 flex flex-col items-center justify-center text-center">
        <section className="max-w-4xl bg-gray-800 bg-opacity-70 backdrop-filter backdrop-blur-sm p-10 rounded-xl shadow-2xl border border-gray-700">
          <h2 className="text-6xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 leading-tight">
            Welcome to the Future of Decentralization
          </h2>
          <p className="text-2xl text-gray-300 mb-10 leading-relaxed">
            The <span className="font-bold text-purple-300">527 Protocol</span> is an innovative, open-source framework designed to empower developers and users with a robust, secure, and scalable foundation for the next generation of decentralized applications.
          </p>
          <p className="text-xl text-gray-400 mb-12 leading-relaxed">
            Built on cutting-edge blockchain technology, the 527 Protocol aims to simplify complex interactions, enhance interoperability, and foster a truly decentralized ecosystem where innovation thrives.
          </p>
          <div className="flex justify-center space-x-6">
            <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xl font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out">
              Get Started
            </button>
            <button className="px-8 py-4 bg-gray-700 text-gray-200 text-xl font-semibold rounded-full shadow-lg hover:bg-gray-600 hover:text-white transform hover:scale-105 transition-all duration-300 ease-in-out">
              Learn More
            </button>
          </div>
        </section>
      </main>

      <footer className="w-full p-6 bg-gray-800 shadow-inner border-t border-gray-700 mt-auto">
        <div className="container mx-auto text-center text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} 527 Protocol. All rights reserved.
        </div>
      </footer>
    </div>
  );
}