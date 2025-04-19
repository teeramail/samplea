export default function AboutPage() {
  return (
    <main className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-3xl font-bold">About Us</h1>

        <div className="prose max-w-none">
          <p className="mb-4 text-lg">
            Welcome to ThaiBoxingHub, the premier destination for authentic Muay
            Thai experiences in Thailand.
          </p>

          <p className="mb-4">
            Founded with a passion for the ancient art of eight limbs, we are
            dedicated to promoting and preserving the rich cultural heritage of
            Muay Thai while making it accessible to enthusiasts from around the
            world.
          </p>

          <h2 className="mb-4 mt-8 text-2xl font-semibold">Our Mission</h2>
          <p className="mb-4">
            Our mission is to connect Muay Thai fans with authentic training,
            exciting events, and unforgettable experiences across Thailand. We
            believe in the transformative power of Muay Thai, not just as a
            sport but as a way of life that builds discipline, respect, and
            personal growth.
          </p>

          <h2 className="mb-4 mt-8 text-2xl font-semibold">What We Offer</h2>
          <ul className="mb-4 list-disc space-y-2 pl-6">
            <li>Access to premium Muay Thai events across Thailand</li>
            <li>
              Connections with authentic training camps and experienced
              instructors
            </li>
            <li>Customized Muay Thai experiences for all skill levels</li>
            <li>
              Cultural immersion through the lens of Thailand&apos;s national
              sport
            </li>
          </ul>

          <p className="mt-8">
            Thank you for being part of our journey. Whether you&apos;re a
            seasoned fighter or a curious beginner, we welcome you to the world
            of ThaiBoxingHub.
          </p>
        </div>
      </div>
    </main>
  );
}
