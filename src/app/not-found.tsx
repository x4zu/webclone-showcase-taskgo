import { Navbar } from "@/components/sites/taskgo-oly-webflow-io/Navbar";
import { Footer } from "@/components/sites/taskgo-oly-webflow-io/Footer";
import { NotFoundPage } from "@/components/sites/taskgo-oly-webflow-io/pages/NotFoundPage";

export default function NotFound() {
  return (
    <div className="page-wraper">
      <Navbar />
      <NotFoundPage />
      <Footer />
    </div>
  );
}
