import { Navbar } from "@/components/sites/taskgo-oly-webflow-io/Navbar";
import { Footer } from "@/components/sites/taskgo-oly-webflow-io/Footer";
import { ChangelogPage } from "@/components/sites/taskgo-oly-webflow-io/pages/ChangelogPage";

export default function Page() {
  return (
    <div className="page-wraper">
      <Navbar />
      <ChangelogPage />
      <Footer />
    </div>
  );
}
