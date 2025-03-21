import Link from "next/link";

export default function TrainingPage() {
  // Define training package data
  const trainingPackages = [
    {
      id: "beginner",
      title: "Beginner Experience",
      price: "1,500 THB",
      duration: "Single Session",
      features: [
        "Basic techniques introduction",
        "Light pad work",
        "Fitness conditioning",
        "Cool-down stretching",
        "All equipment provided"
      ],
      recommended: false,
      description: "Perfect for tourists looking to try Muay Thai for the first time. No experience necessary."
    },
    {
      id: "weekly",
      title: "Weekly Training",
      price: "5,000 THB",
      duration: "5 Sessions",
      features: [
        "Daily technique training",
        "Personalized feedback",
        "Authentic training methods",
        "Equipment provided",
        "Video recording of your progress"
      ],
      recommended: true,
      description: "Our most popular package for visitors staying for a week. Train like a real Thai fighter."
    },
    {
      id: "monthly",
      title: "Fighter's Package",
      price: "15,000 THB",
      duration: "Full Month (20 Sessions)",
      features: [
        "Intensive daily training",
        "Sparring opportunities",
        "Strength & conditioning",
        "Personal trainer assigned",
        "Fight opportunity (optional)",
        "Accommodation options available"
      ],
      recommended: false,
      description: "For serious practitioners looking to immerse themselves in Thailand's Muay Thai culture."
    }
  ];

  // Define popular gyms by region
  const gymsByRegion = [
    {
      region: "Bangkok",
      gyms: [
        { name: "Yokkao Training Center", location: "Sukhumvit", specialty: "Technical training" },
        { name: "Elite Fight Club", location: "Thonglor", specialty: "Western-friendly" },
        { name: "Petchyindee Academy", location: "Phra Nakhon", specialty: "Champion fighters" }
      ]
    },
    {
      region: "Phuket",
      gyms: [
        { name: "Tiger Muay Thai", location: "Chalong", specialty: "Large facility with MMA" },
        { name: "Suwit Gym", location: "Patong", specialty: "Small authentic gym" },
        { name: "Singpatong", location: "Kathu", specialty: "Professional fighter training" }
      ]
    },
    {
      region: "Chiang Mai",
      gyms: [
        { name: "Lanna Fighting Club", location: "Old City", specialty: "Traditional northern style" },
        { name: "Team Quest", location: "Santitham", specialty: "Mixed martial arts focus" },
        { name: "Hong Thong Gym", location: "Chang Phueak", specialty: "Small family gym" }
      ]
    }
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero section */}
      <div className="relative bg-purple-900 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900 to-purple-700 opacity-90"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-center sm:text-5xl lg:text-6xl">
            Train Muay Thai in Thailand
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-xl text-purple-100 text-center">
            Experience authentic training from champion fighters and world-class coaches.
            Choose from single sessions to monthly packages at Thailand's top gyms.
          </p>
        </div>
      </div>

      {/* Training packages section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Training Packages
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500">
              Choose the training package that fits your schedule and goals
            </p>
          </div>

          <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:grid-cols-3">
            {trainingPackages.map((pkg) => (
              <div key={pkg.id} className={`relative flex flex-col rounded-2xl border border-gray-200 bg-white ${pkg.recommended ? 'border-purple-600 shadow-md' : ''}`}>
                {pkg.recommended && (
                  <div className="absolute top-0 right-0 -mt-3 mr-6 bg-purple-600 text-white px-4 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">{pkg.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{pkg.description}</p>
                  <p className="mt-4">
                    <span className="text-3xl font-extrabold text-gray-900">{pkg.price}</span>
                    <span className="text-base font-medium text-gray-500">/{pkg.duration}</span>
                  </p>
                </div>
                <div className="flex-1 flex flex-col justify-between p-6">
                  <ul className="space-y-3">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="ml-3 text-sm text-gray-700">{feature}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6">
                    <button
                      type="button"
                      className={`w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${pkg.recommended ? 'bg-purple-600 hover:bg-purple-700' : 'bg-red-600 hover:bg-red-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
                    >
                      Book This Package
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What to expect section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-purple-600 font-semibold tracking-wide uppercase">The Experience</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              What to Expect at a Muay Thai Training Session
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              A typical Muay Thai training session in Thailand follows a structured format aimed at building skill, strength, and endurance.
            </p>
          </div>

          <div className="mt-10">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-purple-500 text-white">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Warm-up (15-20 min)</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Sessions begin with running, skipping rope, shadow boxing, and dynamic stretching to prepare the body for intense training.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-purple-500 text-white">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Technical Training (30-40 min)</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Coaches teach and refine proper Muay Thai techniques including punches, kicks, knees, elbows, and defensive movements.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-purple-500 text-white">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Pad Work (20-30 min)</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Practice techniques with a trainer holding Thai pads, focusing on power, speed, accuracy, and combinations.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-purple-500 text-white">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                    </svg>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Bag Work (15-20 min)</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Heavy bag training to develop power and stamina while practicing techniques learned during technical training.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-purple-500 text-white">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                    </svg>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Clinch Work (10-15 min)</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Practice the Muay Thai clinch, learning to control your opponent while delivering effective knees and elbows.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-purple-500 text-white">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Conditioning (15-20 min)</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Core strengthening, bodyweight exercises, and specific drills to build the physical attributes needed for Muay Thai.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Gyms by region section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Popular Training Gyms by Region
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500">
              Find the best Muay Thai training facilities across Thailand
            </p>
          </div>

          <div className="mt-12 space-y-10">
            {gymsByRegion.map((regionData) => (
              <div key={regionData.region} className="border-b border-gray-200 pb-10 last:border-0 last:pb-0">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">{regionData.region}</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {regionData.gyms.map((gym) => (
                    <div key={gym.name} className="bg-gray-50 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                      <h4 className="text-lg font-semibold text-gray-900">{gym.name}</h4>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        {gym.location}
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Known for: {gym.specialty}
                      </div>
                      <div className="mt-4">
                        <Link
                          href={`/gyms/${gym.name.toLowerCase().replace(/\s+/g, '-')}`}
                          className="text-purple-600 hover:text-purple-800 font-medium"
                        >
                          View details →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Everything you need to know about training Muay Thai in Thailand
            </p>
          </div>
          <div className="mt-12 max-w-3xl mx-auto divide-y-2 divide-gray-200">
            <div className="py-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Do I need previous experience to train Muay Thai in Thailand?
              </h3>
              <div className="mt-2">
                <p className="text-base text-gray-500">
                  No, most gyms in Thailand welcome beginners and have programs specifically designed for newcomers. Trainers will adjust the intensity and complexity of training based on your experience level.
                </p>
              </div>
            </div>
            <div className="py-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                What should I bring to a training session?
              </h3>
              <div className="mt-2">
                <p className="text-base text-gray-500">
                  For your first session, comfortable sports clothing and a water bottle are sufficient. Most gyms provide hand wraps and gloves for beginners. If you plan to train regularly, we recommend purchasing your own gloves, hand wraps, and shorts.
                </p>
              </div>
            </div>
            <div className="py-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                How physically demanding is Muay Thai training?
              </h3>
              <div className="mt-2">
                <p className="text-base text-gray-500">
                  Traditional Muay Thai training in Thailand is quite intensive. However, for tourists and beginners, trainers typically adjust the intensity. You can always communicate your fitness level and any limitations to your trainer.
                </p>
              </div>
            </div>
            <div className="py-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                What's the best time of year to train in Thailand?
              </h3>
              <div className="mt-2">
                <p className="text-base text-gray-500">
                  November to February offers the most pleasant weather with lower humidity and temperatures. However, training is available year-round, with many gyms having covered or air-conditioned facilities for the hottest months (March-May).
                </p>
              </div>
            </div>
            <div className="py-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Can I book accommodation through the gym?
              </h3>
              <div className="mt-2">
                <p className="text-base text-gray-500">
                  Many Muay Thai camps offer on-site accommodation or have partnerships with nearby guesthouses and hotels. When booking your training package, ask about accommodation options for convenience and potential discounts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-purple-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to experience authentic Muay Thai?</span>
            <span className="block text-purple-300">Book your training session today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <a
                href="#"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-purple-600 bg-white hover:bg-purple-50"
              >
                Book Now
              </a>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <a
                href="#"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
} 