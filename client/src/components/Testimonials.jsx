const testimonials = [
  { name: "Priya", quote: "Transformed my career in 6 months — amazing content!" },
  { name: "Mark", quote: "Practical, hands-on, and the community helped a lot." },
  { name: "Lina", quote: "Clear courses and great instructors — highly recommend." },
]

const Testimonials = () => {
  return (
    <section className="px-10 py-16">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-slate-100 mb-6">What students say</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-slate-800 p-6 rounded-2xl text-slate-300">
              <p className="italic">“{t.quote}”</p>
              <p className="mt-4 font-semibold text-slate-100">— {t.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Testimonials
