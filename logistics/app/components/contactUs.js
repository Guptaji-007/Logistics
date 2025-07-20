import { useState } from 'react';
import { Mail, Phone, MapPin, Send, Building, Facebook, Twitter, Linkedin } from 'lucide-react';
import contactAnimation from "@/public/Contact Us.json";
import Lottie from 'lottie-react';
// You can create a reusable Input component for your forms
const Input = ({ id, type, placeholder, value, onChange, required = true }) => (
  <div>
    <label htmlFor={id} className="sr-only">
      {placeholder}
    </label>
    <input
      id={id}
      name={id}
      type={type}
      value={value}
      onChange={onChange}
      className="w-full rounded-lg border-gray-200 p-4 pe-12 text-sm shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
      placeholder={placeholder}
      required={required}
    />
  </div>
);

// --- FOOTER COMPONENT ---
const Footer = () => {
  return (
    <footer className="bg-black text-white">
      <div className="mx-auto max-w-screen-xl px-4 pb-8 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md">
          <p className="text-center text-xs uppercase tracking-widest text-gray-400">
            Logistique
          </p>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Your Partner in Global Trade
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-32">
          <div className="mx-auto max-w-sm lg:max-w-none">
            <p className="text-center text-lg font-medium tracking-wider text-gray-300 lg:text-left">
              Stay updated with our latest news and offers.
            </p>

            <form className="mt-6 flex flex-col sm:flex-row gap-4">
              <label htmlFor="footer-email" className="sr-only">Email</label>
              <input
                className="w-full rounded-lg border-gray-500 bg-gray-700 p-3 text-sm text-white placeholder-gray-400 focus:ring-green-500"
                placeholder="Enter your email"
                type="email"
                id="footer-email"
              />
              <button className="inline-block rounded-lg bg-green-600 px-5 py-3 font-medium text-white transition hover:bg-green-700 focus:outline-none focus:ring focus:ring-yellow-400">
                Subscribe
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 gap-8 text-center lg:grid-cols-3 lg:text-left">
            <div>
              <p className="text-lg font-medium">Services</p>
              <ul className="mt-8 space-y-4 text-sm">
                <li><a href="#" className="text-gray-300 transition hover:text-white/75">Freight Forwarding</a></li>
                <li><a href="#" className="text-gray-300 transition hover:text-white/75">Warehousing</a></li>
                <li><a href="#" className="text-gray-300 transition hover:text-white/75">Customs Brokerage</a></li>
                <li><a href="#" className="text-gray-300 transition hover:text-white/75">Supply Chain</a></li>
              </ul>
            </div>
            <div>
              <p className="text-lg font-medium">About</p>
              <ul className="mt-8 space-y-4 text-sm">
                <li><a href="#" className="text-gray-300 transition hover:text-white/75">About Us</a></li>
                <li><a href="#" className="text-gray-300 transition hover:text-white/75">Meet the Team</a></li>
                <li><a href="#" className="text-gray-300 transition hover:text-white/75">Careers</a></li>
              </ul>
            </div>
            <div>
              <p className="text-lg font-medium">Helpful Links</p>
              <ul className="mt-8 space-y-4 text-sm">
                <li><a href="#" className="text-gray-300 transition hover:text-white/75">Contact</a></li>
                <li><a href="#" className="text-gray-300 transition hover:text-white/75">FAQs</a></li>
                <li><a href="#" className="text-gray-300 transition hover:text-white/75">Live Chat</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-gray-700 pt-8">
          <div className="sm:flex sm:justify-between">
            {/* <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} GlobalConnect Logistics. All rights reserved.</p> */}
            <ul className="mt-8 flex justify-center gap-6 sm:mt-0 sm:justify-start">
              <li><a href="#" rel="noreferrer" target="_blank" className="text-gray-400 transition hover:text-white/75"><span className="sr-only">Facebook</span><Facebook /></a></li>
              <li><a href="#" rel="noreferrer" target="_blank" className="text-gray-400 transition hover:text-white/75"><span className="sr-only">Twitter</span><Twitter /></a></li>
              <li><a href="#" rel="noreferrer" target="_blank" className="text-gray-400 transition hover:text-white/75"><span className="sr-only">LinkedIn</span><Linkedin /></a></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};


// --- CONTACT PAGE COMPONENT ---
const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback({ type: '', message: '' });

    console.log("Submitting form data:", formData);
    setTimeout(() => {
      setLoading(false);
      setFeedback({ type: 'success', message: 'Thank you! Your message has been sent.' });
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 2000);
  };

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-x-16 gap-y-8 lg:grid-cols-5">
          {/* Left Column: Contact Info & Map */}
          <div className="lg:col-span-2 lg:py-12">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Get in Touch</h1>
            <p className="mt-4 max-w-xl text-lg text-gray-600">
              Have a question or need a quote? Fill out the form or contact us directly. Our team is ready to assist you.
            </p>

            <div className="flex justify-center items-center">
              <Lottie animationData={contactAnimation} loop={true} className="w-full max-w-md" />
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="rounded-lg bg-white p-8 shadow-lg lg:col-span-3 lg:p-12">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input id="name" type="text" placeholder="Full Name" value={formData.name} onChange={handleChange} />
              <Input id="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleChange} />
              <Input id="subject" type="text" placeholder="Subject" value={formData.subject} onChange={handleChange} />
              
              <div>
                <label className="sr-only" htmlFor="message">Message</label>
                <textarea
                  className="w-full rounded-lg border-gray-200 p-4 text-sm shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  placeholder="Your Message"
                  rows="6"
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>

              {/* Feedback Message */}
              {feedback.message && (
                <div className={`rounded-lg p-3 text-sm ${feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {feedback.message}
                </div>
              )}

              <div className="mt-4">
                <button
                  type="submit"
                  className={`inline-flex w-full items-center justify-center rounded-lg px-5 py-3 text-white font-semibold transition-colors
                              ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <span className="font-medium">Send Message</span>
                      <Send className="ml-3 h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      {/* --- RENDER THE FOOTER --- */}
      <Footer />
    </div>
  );
};

export default ContactPage;
