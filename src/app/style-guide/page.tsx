import { Navbar } from "@/components/sites/taskgo-oly-webflow-io/Navbar";
import { Footer } from "@/components/sites/taskgo-oly-webflow-io/Footer";
import { StyleGuidePage } from "@/components/sites/taskgo-oly-webflow-io/pages/StyleGuidePage";

export default function Page() {
  return (
    <div className="page-wraper">
      <Navbar />
      <StyleGuidePage />
      <Footer />
    </div>
  );
}
