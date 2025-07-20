import "./globals.css";
import SessionWrapper from "./components/SessionWrapper";
// import {ReactLenis} from "@/utils/lenis"
import ClientOnly from "./components/ClientOnly";
import ThemeRegistry from './ThemeRegistry'; 

export const metadata = {
  title: "Logistics App",
  description: "Seamless logistics and vehicle booking.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-black text-black">
        <SessionWrapper>
          <main className="relative min-h-screen w-full overflow-hidden">
            <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
            <div className="absolute -z-20 top-[-20%] left-1/2 -translate-x-1/2 h-[120vh] w-[120vw] max-w-[1200px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(251,251,251,0.1),rgba(0,0,0,0))]"></div>
            
            <ClientOnly>
              {/* <ThemeRegistry> */}
                {children}
              {/* </ThemeRegistry> */}
            </ClientOnly>
          </main>
          <footer className="fixed bottom-0 text-center text-gray-500 text-sm p-4 w-full z-50">
            © {new Date().getFullYear()} Logistics. All rights reserved.
          </footer>
        </SessionWrapper>
      </body>
    </html>
  );
}
