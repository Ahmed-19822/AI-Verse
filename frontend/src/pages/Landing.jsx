import Hero from '../components/Hero.jsx'
import Features from '../components/Features.jsx'
import Characters from '../components/Characters.jsx'
import Testimonials from '../components/Testimonials.jsx'
import PricingTable from '../components/PricingTable.jsx'
import CTA from '../components/CTA.jsx'

export default function Landing() {
  return (
    <>
      <Hero />
      <Features />
      <Characters />
      <Testimonials />
      <section id="pricing-teaser" className="px-6 py-28 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="label-eyebrow mb-3">Plans</p>
          <h2 className="font-display text-4xl md:text-5xl tracking-tight">Simple pricing, real limits</h2>
        </div>
        <PricingTable />
      </section>
      <CTA />
    </>
  )
}
