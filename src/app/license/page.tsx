import { Navbar } from "@/components/sites/taskgo-oly-webflow-io/Navbar";
import { Footer } from "@/components/sites/taskgo-oly-webflow-io/Footer";
import { LicensePage } from "@/components/sites/taskgo-oly-webflow-io/pages/LicensePage";

export default function Page() {
  return (
    <div className="page-wraper">
      <Navbar />
      <LicensePage />
      <Footer />
    </div>
  );
}
