import { Hero } from "../sections/Hero";
import { Features } from "../sections/Features";
import { Choose } from "../sections/Choose";
import { Steps } from "../sections/Steps";
import { Testimonials } from "../sections/Testimonials";
import { Pricing } from "../sections/Pricing";
import { Integrations } from "../sections/Integrations";
import { Faq } from "../sections/Faq";
import { Cta } from "../sections/Cta";

export function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <Choose />
      <Steps />
      <Testimonials />
      <Pricing />
      <Integrations />
      <Faq />
      <Cta />
    </>
  );
}
