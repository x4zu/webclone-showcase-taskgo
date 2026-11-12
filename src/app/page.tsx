import { Navbar } from "@/components/sites/taskgo-oly-webflow-io/Navbar";
import { Footer } from "@/components/sites/taskgo-oly-webflow-io/Footer";
import { HomePage } from "@/components/sites/taskgo-oly-webflow-io/pages/HomePage";

export default function Home() {
  return (
    <div className="page-wraper">
      <Navbar />
      <HomePage />
      <Footer />
    </div>
  );
}
